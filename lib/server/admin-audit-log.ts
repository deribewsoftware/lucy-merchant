import { findUserById } from "@/lib/db/users";
import { appendAdminAudit } from "@/lib/db/admin-audit";
import { isStaffAdminRole } from "@/lib/admin-staff";
import type { UserRole } from "@/lib/domain/types";

function clientIp(request: Request | null): string | undefined {
  if (!request) return undefined;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return undefined;
}

export function logStaffAction(
  request: Request | null,
  input: {
    actorId: string;
    action: string;
    resource?: string;
    detail?: Record<string, unknown>;
  },
): void {
  const user = findUserById(input.actorId);
  if (!user || !isStaffAdminRole(user.role)) return;
  appendAdminAudit({
    actorId: user.id,
    actorEmail: user.email,
    actorName: user.name,
    action: input.action,
    resource: input.resource,
    detail: input.detail,
    ip: clientIp(request),
    userAgent: request?.headers.get("user-agent") ?? undefined,
  });
}

export function logStaffLogin(
  request: Request,
  input: { userId: string; role: UserRole },
): void {
  if (!isStaffAdminRole(input.role)) return;
  const user = findUserById(input.userId);
  if (!user) return;
  appendAdminAudit({
    actorId: user.id,
    actorEmail: user.email,
    actorName: user.name,
    action: "auth.login",
    detail: { role: input.role },
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
}
