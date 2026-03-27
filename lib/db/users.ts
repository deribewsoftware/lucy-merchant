import { randomInt, randomUUID } from "crypto";
import type { UserRecord, UserRole } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";
import { hashPassword } from "@/lib/auth/password";
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
}): Promise<CreateUserResult> {
  const users = load();
  if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
    throw new Error("Email already registered");
  }

  const needsVerification =
    input.role !== "admin" && !input.skipEmailVerification;

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

export async function updateUserPassword(userId: string, newPlainPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPlainPassword);
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  const next = { ...users[i], passwordHash };
  delete next.passwordResetTokenHash;
  delete next.passwordResetExpiresAt;
  users[i] = next;
  save(users);
}

/* ──────────────── National ID Verification ──────────────── */

export function submitNationalIdVerification(
  userId: string,
  data: {
    nationalIdNumber: string;
    nationalIdName: string;
    nationalIdFrontImage: string;
    nationalIdBackImage: string;
  },
): UserRecord | undefined {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return undefined;
  users[i] = {
    ...users[i],
    nationalIdStatus: "pending",
    nationalIdNumber: data.nationalIdNumber.trim(),
    nationalIdName: data.nationalIdName.trim(),
    nationalIdFrontImage: data.nationalIdFrontImage.trim(),
    nationalIdBackImage: data.nationalIdBackImage.trim(),
    nationalIdSubmittedAt: new Date().toISOString(),
    nationalIdRejectionReason: undefined,
    nationalIdReviewedAt: undefined,
    nationalIdReviewedBy: undefined,
  };
  save(users);
  return users[i];
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
