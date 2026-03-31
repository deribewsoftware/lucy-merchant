import {
  findUserById,
  listUsers,
  markAccessRequestEmailSent,
} from "@/lib/db/users";
import { createNotification } from "@/lib/db/notifications";
import { effectiveStaffPermissions } from "@/lib/server/admin-permissions";
import { escapeHtml, isNodemailerConfigured, sendEmail } from "@/lib/email/nodemailer";
import type { UserRecord } from "@/lib/domain/types";

const THROTTLE_MS = 24 * 60 * 60 * 1000;

/**
 * Notify all system administrators when an administrator account has no effective permissions
 * (in-app always; email when SMTP is configured). Throttled per requesting admin via
 * `lastAccessRequestEmailAt`.
 */
export async function notifySuperAdminsAdminNeedsAccess(
  actor: UserRecord,
): Promise<void> {
  const row = findUserById(actor.id) ?? actor;
  if (row.role !== "admin") return;
  const perms = effectiveStaffPermissions(row.id);
  if (perms.length > 0) return;

  const last = row.lastAccessRequestEmailAt;
  if (last) {
    if (Date.now() - new Date(last).getTime() < THROTTLE_MS) return;
  }

  const supers = listUsers().filter((u) => u.role === "system_admin");
  if (supers.length === 0) return;

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Lucy Merchant";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const teamUrl = `${appUrl}/admin/admins`;

  for (const s of supers) {
    createNotification({
      userId: s.id,
      kind: "admin_staff",
      title: `Access request: ${row.name}`,
      body: `${row.email} signed in with no permissions yet. Open Team & roles to grant access.`,
      href: "/admin/admins",
    });
  }

  if (!isNodemailerConfigured()) {
    console.warn(
      "[access-request] SMTP not configured — super admins notified in-app only for",
      row.email,
    );
    markAccessRequestEmailSent(row.id);
    return;
  }

  const subject = `[${appName}] An administrator needs access — ${row.email}`;
  const text = [
    `${row.name} (${row.email}) has no admin permissions yet.`,
    "",
    "Open Team & roles as a system administrator and grant the capabilities they need:",
    teamUrl,
    "",
    "They are waiting for access to the admin workspace.",
  ].join("\n");

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;font-family:system-ui,-apple-system,sans-serif">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%);padding:28px 28px 24px">
            <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#bae6fd">${escapeHtml(appName)} · Staff</p>
            <h1 style="margin:12px 0 0;font-size:20px;font-weight:700;color:#f0f9ff;line-height:1.3">Someone needs admin access</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px">
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#334155">
              <strong style="color:#0f172a">${escapeHtml(row.name)}</strong>
              <span style="color:#64748b"> (${escapeHtml(row.email)})</span>
            </p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155">This account has <strong>no permissions</strong> yet. Grant the right capabilities under <strong>Team &amp; roles</strong>.</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:10px;background:#0284c7">
                  <a href="${escapeHtml(teamUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Open Team &amp; roles</a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:12px;word-break:break-all;color:#64748b">${escapeHtml(teamUrl)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8">You received this because you are a system administrator.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  for (const s of supers) {
    await sendEmail({ to: s.email, subject, text, html });
  }
  markAccessRequestEmailSent(row.id);
}
