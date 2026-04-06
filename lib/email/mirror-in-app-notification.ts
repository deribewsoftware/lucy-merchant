import { getPublicAppUrl } from "@/lib/app-url";
import { findUserById } from "@/lib/db/users";
import {
  escapeHtml,
  isNodemailerConfigured,
  sendNotificationEmail,
} from "@/lib/email/nodemailer";
import {
  type EmailMirrorCategory,
  userAllowsEmailMirror,
} from "@/lib/user/email-preferences";

/** Order/review/admin mirrors: on. Chat mirrors: only if `NODEMAILER_MIRROR_CHAT=1`. */
export function isNodemailerMirrorChatEnabled(): boolean {
  const v = process.env.NODEMAILER_MIRROR_CHAT?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type QueueInAppEmailOptions = {
  /** Which preference toggle applies (default: orders). */
  emailCategory?: EmailMirrorCategory;
};

/**
 * When SMTP (Nodemailer) is configured, sends the same headline + body as an in-app notification
 * to the user's email (fire-and-forget).
 */
export function queueInAppNotificationEmail(
  userId: string,
  title: string,
  body: string,
  href?: string,
  options?: QueueInAppEmailOptions,
): void {
  if (!isNodemailerConfigured()) return;
  const category = options?.emailCategory ?? "orders";
  const appUrl = getPublicAppUrl();
  void (async () => {
    try {
      const user = findUserById(userId);
      if (!user?.email) return;
      if (category === "chat" && !isNodemailerMirrorChatEnabled()) return;
      if (!userAllowsEmailMirror(user, category)) return;
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
