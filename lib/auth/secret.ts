export function getJwtSecretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) {
    return new TextEncoder().encode(s);
  }
  if (process.env.NODE_ENV === "development") {
    return new TextEncoder().encode("dev-secret-must-be-at-least-32-chars");
  }
  throw new Error("AUTH_SECRET must be set (min 32 characters) in production");
}
