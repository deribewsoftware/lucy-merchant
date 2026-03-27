import type { UserRecord } from "@/lib/domain/types";

/** Legacy users without `emailVerified` are treated as verified. */
export function isEmailVerified(user: UserRecord): boolean {
  return user.emailVerified !== false;
}

export const EMAIL_VERIFICATION_OTP_MS = 15 * 60 * 1000;

/** Password reset link validity */
export const PASSWORD_RESET_TOKEN_MS = 60 * 60 * 1000;
