import { randomInt, randomUUID } from "crypto";
import type {
  Permission,
  UserPreferences,
  UserRecord,
  UserRole,
} from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";
import { hashPassword } from "@/lib/auth/password";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/auth/admin-invite";
import {
  EMAIL_VERIFICATION_OTP_MS,
  PASSWORD_RESET_TOKEN_MS,
} from "@/lib/auth/email-verification";

const FILE = "users.json";

function load(): UserRecord[] {
  return readJsonFile<UserRecord[]>(FILE, []);
}

function save(users: UserRecord[]) {
  writeJsonFile(FILE, users);
}

export function listUsers(): UserRecord[] {
  return load();
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const e = email.trim().toLowerCase();
  return load().find((u) => u.email.toLowerCase() === e);
}

export function findUserById(id: string): UserRecord | undefined {
  return load().find((u) => u.id === id);
}

function generateOtpDigits(): string {
  return String(randomInt(100000, 1000000));
}

export type CreateUserResult = {
  user: UserRecord;
  /** Plain OTP for email — only for merchant/supplier when verification is required */
  verificationOtp?: string;
};

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  /** Set for admin bootstrap so no OTP email is required */
  skipEmailVerification?: boolean;
  /** Super-admin invite: admin account with no permissions until granted (email verified at creation unless skipped). */
  inviteAdmin?: boolean;
  adminPermissionAllow?: Permission[];
}): Promise<CreateUserResult> {
  const users = load();
  if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
    throw new Error("Email already registered");
  }

  /** Invited admins must verify email; bootstrap uses skipEmailVerification: true */
  const needsVerification =
    !input.skipEmailVerification &&
    (input.role !== "admin" && input.role !== "system_admin" ||
      Boolean(input.inviteAdmin));

  let verificationOtp: string | undefined;
  const record: UserRecord = {
    id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
    name: input.name.trim(),
    points: input.role === "supplier" ? 100 : undefined,
    createdAt: new Date().toISOString(),
  };

  if (needsVerification) {
    verificationOtp = generateOtpDigits();
    record.emailVerified = false;
    record.emailVerificationOtpHash = await hashPassword(verificationOtp);
    record.emailVerificationOtpExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_OTP_MS,
    ).toISOString();
  } else {
    record.emailVerified = true;
  }

  if (input.role === "admin") {
    if (input.adminPermissionAllow !== undefined) {
      record.adminPermissionAllow = input.adminPermissionAllow;
    } else if (input.inviteAdmin) {
      record.adminPermissionAllow = [];
    }
  }

  if (
    input.inviteAdmin &&
    input.password === ADMIN_INVITE_DEFAULT_PASSWORD
  ) {
    record.mustChangePassword = true;
  }

  users.push(record);
  save(users);
  return { user: record, verificationOtp };
}

export function updateUserPoints(userId: string, next: number): void {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  users[i] = { ...users[i], points: next };
  save(users);
}

export async function setEmailVerificationOtp(
  userId: string,
  plainOtp: string,
): Promise<void> {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  users[i] = {
    ...users[i],
    emailVerificationOtpHash: await hashPassword(plainOtp),
    emailVerificationOtpExpiresAt: new Date(
      Date.now() + EMAIL_VERIFICATION_OTP_MS,
    ).toISOString(),
  };
  save(users);
}

/** Generates a new code, stores the hash, returns the plain digits for emailing. */
export async function issueNewVerificationOtp(userId: string): Promise<string> {
  const plain = generateOtpDigits();
  await setEmailVerificationOtp(userId, plain);
  return plain;
}

export function markUserEmailVerified(userId: string): void {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  const next = { ...users[i], emailVerified: true };
  delete next.emailVerificationOtpHash;
  delete next.emailVerificationOtpExpiresAt;
  users[i] = next;
  save(users);
}

export async function setPasswordResetToken(
  userId: string,
  plainToken: string,
): Promise<void> {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  users[i] = {
    ...users[i],
    passwordResetTokenHash: await hashPassword(plainToken),
    passwordResetExpiresAt: new Date(
      Date.now() + PASSWORD_RESET_TOKEN_MS,
    ).toISOString(),
  };
  save(users);
}

export async function updateUserPassword(
  userId: string,
  newPlainPassword: string,
  options?: { mustChangePassword?: boolean },
): Promise<void> {
  const passwordHash = await hashPassword(newPlainPassword);
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  const mustChange =
    options?.mustChangePassword === true
      ? true
      : false;
  const next = { ...users[i], passwordHash, mustChangePassword: mustChange };
  delete next.passwordResetTokenHash;
  delete next.passwordResetExpiresAt;
  users[i] = next;
  save(users);
}

/* ──────────────── National ID Verification ──────────────── */

export function submitNationalIdVerification(
  userId: string,
  data: {
    nationalIdFan: string;
    nationalIdName: string;
    nationalIdFrontImage: string;
    nationalIdBackImage: string;
    nationalIdCity: string;
    nationalIdSubcity?: string;
    nationalIdWoreda?: string;
    nationalIdPhoneOnId?: string;
    nationalIdAddressLine?: string;
  },
): UserRecord | undefined {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return undefined;
  const prev = users[i] as UserRecord & { nationalIdNumber?: string };
  const { nationalIdNumber, ...base } = prev;
  void nationalIdNumber;
  users[i] = {
    ...base,
    nationalIdStatus: "pending",
    nationalIdFan: data.nationalIdFan.trim(),
    nationalIdName: data.nationalIdName.trim(),
    nationalIdFrontImage: data.nationalIdFrontImage.trim(),
    nationalIdBackImage: data.nationalIdBackImage.trim(),
    nationalIdCity: data.nationalIdCity.trim(),
    nationalIdSubcity: data.nationalIdSubcity?.trim() || undefined,
    nationalIdWoreda: data.nationalIdWoreda?.trim() || undefined,
    nationalIdPhoneOnId: data.nationalIdPhoneOnId?.trim() || undefined,
    nationalIdAddressLine: data.nationalIdAddressLine?.trim() || undefined,
    nationalIdSubmittedAt: new Date().toISOString(),
    nationalIdRejectionReason: undefined,
    nationalIdReviewedAt: undefined,
    nationalIdReviewedBy: undefined,
  };
  save(users);
  return users[i];
}

/** Another user already has this FAN with pending or approved verification. */
export function findActiveUserWithSameFaydaFan(
  fan: string,
  excludeUserId: string,
): UserRecord | undefined {
  return load().find(
    (u) =>
      u.id !== excludeUserId &&
      u.nationalIdFan === fan &&
      (u.nationalIdStatus === "pending" || u.nationalIdStatus === "approved"),
  );
}

export function reviewNationalId(
  userId: string,
  approved: boolean,
  adminId: string,
  reason?: string,
): UserRecord | undefined {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return undefined;
  users[i] = {
    ...users[i],
    nationalIdStatus: approved ? "approved" : "rejected",
    nationalIdReviewedAt: new Date().toISOString(),
    nationalIdReviewedBy: adminId,
    nationalIdRejectionReason: approved ? undefined : (reason?.trim() || "No reason provided"),
  };
  save(users);
  return users[i];
}

export function listPendingNationalIdUsers(): UserRecord[] {
  return load().filter((u) => u.nationalIdStatus === "pending");
}

export function setAdminTeamMember(
  targetUserId: string,
  input: {
    role: UserRole;
    adminPermissionDeny?: Permission[];
    /** When set (including `[]`), whitelist mode; use `null` to clear and go back to deny-only. */
    adminPermissionAllow?: Permission[] | null;
  },
): UserRecord | undefined {
  const users = load();
  const i = users.findIndex((u) => u.id === targetUserId);
  if (i === -1) return undefined;
  const cur = users[i];
  const next: UserRecord = {
    ...cur,
    role: input.role,
  };
  if (input.role !== "admin") {
    delete next.adminPermissionDeny;
    delete next.adminPermissionAllow;
  } else {
    if (input.adminPermissionAllow !== undefined) {
      if (input.adminPermissionAllow === null) {
        delete next.adminPermissionAllow;
        if (input.adminPermissionDeny !== undefined) {
          next.adminPermissionDeny =
            input.adminPermissionDeny.length > 0 ? input.adminPermissionDeny : undefined;
        }
      } else {
        next.adminPermissionAllow = input.adminPermissionAllow;
        delete next.adminPermissionDeny;
      }
    } else if (input.adminPermissionDeny !== undefined) {
      next.adminPermissionDeny =
        input.adminPermissionDeny.length > 0 ? input.adminPermissionDeny : undefined;
      delete next.adminPermissionAllow;
    }
  }
  users[i] = next;
  save(users);
  return next;
}

/**
 * Remove staff access: demote to merchant and clear admin-only fields.
 * Caller must enforce authorization (e.g. system administrator only).
 */
export function revokeStaffUser(userId: string): UserRecord | undefined {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return undefined;
  const cur = users[i];
  if (cur.role !== "admin" && cur.role !== "system_admin") return undefined;
  const next: UserRecord = { ...cur, role: "merchant" };
  delete next.adminPermissionDeny;
  delete next.adminPermissionAllow;
  delete next.lastAccessRequestEmailAt;
  if (next.mustChangePassword) delete next.mustChangePassword;
  users[i] = next;
  save(users);
  return next;
}

/** @deprecated Use setAdminTeamMember */
export const setUserRoleAndAdminDeny = setAdminTeamMember;

export function markAccessRequestEmailSent(userId: string): void {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  users[i] = {
    ...users[i],
    lastAccessRequestEmailAt: new Date().toISOString(),
  };
  save(users);
}

export function updateUserProfile(
  userId: string,
  input: {
    name?: string;
    preferences?: Partial<UserPreferences>;
  },
): UserRecord | undefined {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return undefined;
  const cur = users[i];
  let next: UserRecord = { ...cur };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return undefined;
    next = { ...next, name };
  }
  if (input.preferences !== undefined) {
    next = {
      ...next,
      preferences: {
        ...cur.preferences,
        ...input.preferences,
      },
    };
  }
  users[i] = next;
  save(users);
  return next;
}
