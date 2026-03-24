/** Shared rules for registration (client hints + server enforcement). */

export const REGISTER = {
  nameMin: 2,
  nameMax: 120,
  passwordMin: 8,
  passwordMax: 128,
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < REGISTER.passwordMin) {
    return `Password must be at least ${REGISTER.passwordMin} characters`;
  }
  if (password.length > REGISTER.passwordMax) {
    return `Password must be at most ${REGISTER.passwordMax} characters`;
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include at least one letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  return null;
}

export type RegisterFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function registerFieldErrors(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): RegisterFieldErrors {
  const out: RegisterFieldErrors = {};
  const nameT = input.name.trim();
  if (nameT.length < REGISTER.nameMin) {
    out.name = `At least ${REGISTER.nameMin} characters`;
  } else if (nameT.length > REGISTER.nameMax) {
    out.name = `At most ${REGISTER.nameMax} characters`;
  }
  if (!input.email.trim()) {
    out.email = "Required";
  } else if (!isValidEmail(input.email)) {
    out.email = "Enter a valid email address";
  }
  const pwErr = validatePasswordStrength(input.password);
  if (pwErr) {
    out.password = pwErr;
  }
  if (input.password !== input.confirmPassword) {
    out.confirmPassword = "Must match password";
  }
  return out;
}

/** First blocking error message (same order as field checks). */
export function validateRegisterPayload(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  const fe = registerFieldErrors(input);
  if (fe.name) return fe.name;
  if (fe.email) return fe.email;
  if (fe.password) return fe.password;
  if (fe.confirmPassword) return fe.confirmPassword;
  return null;
}
