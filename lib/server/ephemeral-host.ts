/**
 * Detect common serverless / read-only filesystem hosts so we can use in-memory JSON
 * and `/tmp` uploads without touching `/var/task` or `public/`.
 *
 * Override: `LUCY_FORCE_EPHEMERAL_HOST=1` | `0`
 */
export function isEphemeralServerHost(): boolean {
  if (process.env.LUCY_FORCE_EPHEMERAL_HOST === "1") return true;
  if (process.env.LUCY_FORCE_EPHEMERAL_HOST === "0") return false;
  return (
    typeof process.env.VERCEL !== "undefined" ||
    typeof process.env.AWS_LAMBDA_FUNCTION_NAME !== "undefined" ||
    process.env.NETLIFY === "true" ||
    process.env.CF_PAGES === "1" ||
    process.env.RENDER === "true"
  );
}
