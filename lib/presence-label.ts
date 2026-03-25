/** Considered actively online if last activity within this window */
export const PRESENCE_ONLINE_MS = 2 * 60 * 1000;

export function isPresenceOnline(lastSeenIso: string | undefined): boolean {
  if (!lastSeenIso) return false;
  const t = new Date(lastSeenIso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < PRESENCE_ONLINE_MS;
}

/**
 * Short label for tight UI (avatars, chips).
 * Uses "Online" inside the online window; otherwise relative last seen.
 */
export function presenceShortLabel(lastSeenIso: string | undefined): string {
  if (!lastSeenIso) return "Unknown";
  if (isPresenceOnline(lastSeenIso)) return "Online";
  return `Last seen ${relativeLastSeen(lastSeenIso)}`;
}

/**
 * Accessible / tooltip-friendly full phrase.
 */
export function presenceFullLabel(lastSeenIso: string | undefined): string {
  if (!lastSeenIso) return "Last seen unknown";
  if (isPresenceOnline(lastSeenIso)) return "Online — active in the last 2 minutes";
  return `Last seen ${relativeLastSeen(lastSeenIso)}`;
}

function relativeLastSeen(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "unknown";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "just now";
  if (sec < 120) return "about a minute ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return min === 1 ? "1 minute ago" : `${min} minutes ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
