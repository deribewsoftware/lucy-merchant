/**
 * Single source of truth for minimum JWT signing secret length (trimmed).
 * Used by `next.config.ts` and `lib/auth/auth-secret-requirements.ts`.
 */
export const AUTH_SECRET_MIN_LENGTH = 32;
