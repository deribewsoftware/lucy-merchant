import { isValidEmail } from "./register-validation";

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export function loginFieldErrors(input: { email: string; password: string }): LoginFieldErrors {
  const out: LoginFieldErrors = {};
  if (!input.email.trim()) {
    out.email = "Required";
  } else if (!isValidEmail(input.email)) {
    out.email = "Enter a valid email address";
  }
  if (!input.password) {
    out.password = "Required";
  }
  return out;
}

/** First blocking error (field order: email, password). */
export function validateLoginPayload(input: { email: string; password: string }): string | null {
  const fe = loginFieldErrors(input);
  if (fe.email) return fe.email;
  if (fe.password) return fe.password;
  return null;
}
