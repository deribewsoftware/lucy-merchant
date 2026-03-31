import { randomUUID } from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "admin-audit.json";

export type AdminAuditEntry = {
  id: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  action: string;
  resource?: string;
  detail?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

function load(): AdminAuditEntry[] {
  return readJsonFile<AdminAuditEntry[]>(FILE, []);
}

function save(rows: AdminAuditEntry[]) {
  writeJsonFile(FILE, rows);
}

export function appendAdminAudit(entry: Omit<AdminAuditEntry, "id" | "createdAt">): AdminAuditEntry {
  const rows = load();
  const row: AdminAuditEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  rows.push(row);
  /** Cap size so JSON store stays bounded (keep most recent). */
  const max = 5000;
  if (rows.length > max) {
    rows.splice(0, rows.length - max);
  }
  save(rows);
  return row;
}

function auditEntryMatchesSearch(row: AdminAuditEntry, q: string): boolean {
  const needle = q.toLowerCase();
  const hay = [
    row.action,
    row.actorEmail,
    row.actorName,
    row.resource ?? "",
    row.ip ?? "",
    row.userAgent ?? "",
    JSON.stringify(row.detail ?? {}),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function listAdminAudit(options?: {
  limit?: number;
  offset?: number;
  /** Case-insensitive substring match across action, actor, resource, IP, detail JSON. */
  search?: string;
}): { entries: AdminAuditEntry[]; total: number } {
  const rows = load();
  const sorted = [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const q = options?.search?.trim();
  const filtered =
    q && q.length > 0 ? sorted.filter((r) => auditEntryMatchesSearch(r, q)) : sorted;
  const total = filtered.length;
  const offset = Math.max(0, options?.offset ?? 0);
  const limit = Math.min(200, Math.max(1, options?.limit ?? 50));
  return {
    entries: filtered.slice(offset, offset + limit),
    total,
  };
}
