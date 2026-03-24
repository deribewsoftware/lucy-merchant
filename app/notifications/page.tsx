import Link from "next/link";
import { redirect } from "next/navigation";
import { HiOutlineBell } from "react-icons/hi2";
import {
  MarkAllNotificationsRead,
  NotificationMarkReadButton,
} from "@/components/notifications-mark-actions";
import { SectionHeader } from "@/components/ui/section-header";
import {
  listNotificationsForUser,
  unreadCountForUser,
} from "@/lib/db/notifications";
import { getSessionUser } from "@/lib/server/session";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const items = listNotificationsForUser(user.id, 80);
  const unread = unreadCountForUser(user.id);

  return (
    <div className="container mx-auto max-w-3xl flex-1 px-4 py-8 sm:py-10">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Notifications</li>
        </ul>
      </div>

      <div className="mt-4">
        <SectionHeader
          eyebrow="Stay on top of orders & messages"
          title="Your alerts"
          description="Order events, chat, and reviews surface here. Open a row to jump into the workspace."
          icon={<HiOutlineBell className="h-5 w-5" />}
          action={unread > 0 ? <MarkAllNotificationsRead /> : undefined}
        />
      </div>

      <ul className="mt-8 space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex flex-wrap items-start gap-3 rounded-xl border p-4 shadow-sm transition ${
              n.read
                ? "border-base-300/80 bg-base-100/50"
                : "border-primary/25 bg-primary/5"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base-content">{n.title}</p>
              <p className="mt-1 text-sm text-base-content/70">{n.body}</p>
              <p className="mt-2 text-xs text-base-content/45">
                {new Date(n.createdAt).toLocaleString()}
              </p>
              {n.href ? (
                <Link
                  href={n.href}
                  className="link link-primary mt-2 inline-block text-sm font-medium"
                >
                  Open
                </Link>
              ) : null}
            </div>
            <NotificationMarkReadButton id={n.id} read={n.read} />
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p className="mt-10 text-center text-sm text-base-content/60">
          No notifications yet — new orders, chat, and reviews will appear here.
        </p>
      )}
    </div>
  );
}
