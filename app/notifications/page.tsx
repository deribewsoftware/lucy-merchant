import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Bell,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Inbox,
  Shield,
} from "lucide-react"
import {
  MarkAllNotificationsRead,
  NotificationMarkReadButton,
} from "@/components/notifications-mark-actions"
import { PaginationBar, PaginationSummary } from "@/components/ui/pagination-bar"
import {
  allNotificationsForUser,
  unreadCountForUser,
} from "@/lib/db/notifications"
import { getSessionUser } from "@/lib/server/session"
import { clampPage, pageStartIndex } from "@/lib/utils/pagination"

type Props = {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 15

export default async function NotificationsPage({ searchParams }: Props) {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login?next=/notifications")
  }

  const sp = await searchParams
  const pageRaw = parseInt(sp.page ?? "1", 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1

  const all = allNotificationsForUser(user.id)
  const total = all.length
  const safePage = clampPage(page, total, PAGE_SIZE)
  const start = pageStartIndex(safePage, total, PAGE_SIZE)
  const items = all.slice(start, start + PAGE_SIZE)

  const unread = unreadCountForUser(user.id)
  const readTotal = Math.max(0, total - unread)

  const href = (p: number) =>
    p > 1 ? `/notifications?page=${p}` : "/notifications"

  return (
    <div className="lm-page-narrow animate-in fade-in duration-500">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Notifications</span>
      </nav>

      {/* Header */}
      <header className="relative mt-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/5 to-accent/5 p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/20">
              <Bell className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                Stay Updated
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Your Alerts
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Order events, chat, reviews, and staff alerts appear here. Open a row to jump into the workspace.
              </p>
            </div>
          </div>
          
          {unread > 0 && (
            <div className="shrink-0">
              <MarkAllNotificationsRead />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="mt-1 text-xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Unread</p>
            <p className="mt-1 text-xl font-bold text-primary">{unread}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm sm:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Read</p>
            <p className="mt-1 text-xl font-bold text-accent">{readTotal}</p>
          </div>
        </div>
      </header>

      {total > 0 && (
        <PaginationSummary
          page={safePage}
          pageSize={PAGE_SIZE}
          total={total}
          className="mt-8"
        />
      )}

      {/* Notifications List */}
      <ul className="mt-4 space-y-3">
        {items.map((n, index) => (
          <li
            key={n.id}
            className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
              n.read
                ? "border-border/50 bg-card/50"
                : "border-primary/30 bg-primary/5"
            }`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Unread indicator */}
            {!n.read && (
              <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
            )}
            
            <div className="flex flex-wrap items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                n.read ? "bg-muted/50" : "bg-primary/10"
              }`}>
                {n.read ? (
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                ) : n.kind === "admin_staff" ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <Bell className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{n.title}</p>
                  {n.kind === "admin_staff" ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Staff
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {n.href && (
                    <Link
                      href={n.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              </div>
              
              <NotificationMarkReadButton id={n.id} read={n.read} />
            </div>
          </li>
        ))}
      </ul>

      <PaginationBar
        page={safePage}
        pageSize={PAGE_SIZE}
        total={total}
        buildHref={href}
        className="mt-8"
      />

      {total === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Inbox className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">No notifications yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            New orders, chat messages, reviews, and staff notifications will appear here when they happen.
          </p>
        </div>
      )}
    </div>
  )
}
