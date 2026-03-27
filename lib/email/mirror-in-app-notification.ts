import { findUserById } from "@/lib/db/users";
import {
  escapeHtml,
  isSendGridConfigured,
  sendNotificationEmail,
} from "@/lib/email/sendgrid";

/** Order/review/admin mirrors: on. Chat mirrors: only if `SENDGRID_MIRROR_CHAT=1`. */
export function isSendGridMirrorChatEnabled(): boolean {
  const v = process.env.SENDGRID_MIRROR_CHAT?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * When SendGrid is configured, sends the same headline + body as an in-app notification
 * to the user's email (fire-and-forget).
 */
export function queueInAppNotificationEmail(
  userId: string,
  title: string,
  body: string,
  href?: string,
): void {
  if (!isSendGridConfigured()) return;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  void (async () => {
    try {
      const user = findUserById(userId);
      if (!user?.email) return;
      const path = href?.startsWith("/") ? href : href ? `/${href}` : "";
      const link = path ? `${appUrl}${path}` : appUrl;
      const text = `${body}\n\nOpen: ${link}`;
      const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;line-height:1.5">
  <p style="font-weight:600">${escapeHtml(title)}</p>
  <p>${escapeHtml(body)}</p>
  <p><a href="${escapeHtml(link)}">Open in Lucy Merchant</a></p>
</div>`;
      await sendNotificationEmail({
        to: user.email,
        subject: title,
        text,
        html,
      });
    } catch (e) {
      console.error("[queueInAppNotificationEmail]", e);
    }
  })();
}
