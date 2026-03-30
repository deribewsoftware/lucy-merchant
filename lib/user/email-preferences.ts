import type { UserRecord } from "@/lib/domain/types";

export type EmailMirrorCategory = "orders" | "reviews" | "chat" | "account";

export type ResolvedEmailPreferences = {
  emailOrderUpdates: boolean;
  emailReviewsAndComments: boolean;
  emailChatMirrors: boolean;
  emailAccountAlerts: boolean;
};

export function resolveEmailPreferences(
  user: UserRecord | undefined,
): ResolvedEmailPreferences {
  const p = user?.preferences;
  return {
    emailOrderUpdates: p?.emailOrderUpdates !== false,
    emailReviewsAndComments: p?.emailReviewsAndComments !== false,
    emailChatMirrors: p?.emailChatMirrors === true,
    emailAccountAlerts: p?.emailAccountAlerts !== false,
  };
}

export function userAllowsEmailMirror(
  user: UserRecord | undefined,
  category: EmailMirrorCategory,
): boolean {
  const r = resolveEmailPreferences(user);
  switch (category) {
    case "orders":
      return r.emailOrderUpdates;
    case "reviews":
      return r.emailReviewsAndComments;
    case "chat":
      return r.emailChatMirrors;
    case "account":
      return r.emailAccountAlerts;
    default:
      return true;
  }
}
