import { escapeHtml, isNodemailerConfigured, sendEmail } from "@/lib/email/nodemailer";
import { STAFF_PERMISSION_LABELS } from "@/lib/admin-permission-labels";
import type { Permission, UserRecord } from "@/lib/domain/types";

function permissionTitles(perms: Permission[]): string {
  return perms
    .map((p) => STAFF_PERMISSION_LABELS[p]?.title ?? p)
    .join(", ");
}

/**
 * Email an administrator when a system administrator changes their role or permission whitelist.
 */
export async function notifyAdminPermissionsUpdated(input: {
  target: UserRecord;
  actorName: string;
  previousPermissions: Permission[];
  nextPermissions: Permission[];
  roleChanged: boolean;
  previousRole: UserRecord["role"];
  nextRole: UserRecord["role"];
}): Promise<void> {
  if (!isNodemailerConfigured()) return;

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const dashUrl = `${appUrl}/admin/dashboard`;

  const { target, actorName, previousPermissions, nextPermissions } = input;

  const subject =
    input.nextRole === "system_admin"
      ? `[${appName}] You are now a system administrator`
      : `[${appName}] Your admin permissions were updated`;

  const nextLine = permissionTitles(nextPermissions);
  const prevLine = permissionTitles(previousPermissions);

  const text = [
    `Hi ${target.name},`,
    "",
    `${actorName} updated your staff access.`,
    input.roleChanged
      ? `Role: ${input.previousRole} → ${input.nextRole}.`
      : "",
    "",
    `Current permissions: ${nextLine || "(none — contact a system administrator)"}`,
    previousPermissions.length > 0 || nextPermissions.length > 0
      ? `Previous: ${prevLine || "(none)"}`
      : "",
    "",
    `Open the admin area: ${dashUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const roleNote =
    input.roleChanged && input.nextRole === "system_admin"
      ? `<p style="margin:16px 0;padding:12px 16px;background:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0;color:#065f46;font-size:14px"><strong>Role change:</strong> you now have full system administrator access.</p>`
      : input.roleChanged
        ? `<p style="margin:12px 0;color:#334155;font-size:14px"><strong>Role:</strong> ${escapeHtml(input.previousRole)} → <strong>${escapeHtml(input.nextRole)}</strong></p>`
        : "";

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;font-family:system-ui,-apple-system,sans-serif">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 28px 24px">
            <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8">${escapeHtml(appName)}</p>
            <h1 style="margin:12px 0 0;font-size:20px;font-weight:700;color:#f8fafc;line-height:1.3">Access update</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">Hi <strong>${escapeHtml(target.name)}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155"><strong>${escapeHtml(actorName)}</strong> updated your staff access.</p>
            ${roleNote}
            <div style="margin:20px 0;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#64748b">Current permissions</p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:#0f172a">${escapeHtml(nextLine || "None — ask a system administrator to grant access.")}</p>
            </div>
            ${
              previousPermissions.length > 0 || nextPermissions.length > 0
                ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b">Previously: ${escapeHtml(prevLine || "none")}</p>`
                : ""
            }
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0">
              <tr>
                <td style="border-radius:10px;background:#2563eb">
                  <a href="${escapeHtml(dashUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Open admin dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8">If you did not expect this change, contact your organization&apos;s system administrator.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  await sendEmail({ to: target.email, subject, text, html });
}
