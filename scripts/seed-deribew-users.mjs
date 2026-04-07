/**
 * Merges Deribew team accounts into ./data/users.json (bcrypt, same as app).
 *
 * Roles & emails (override passwords with env — see below):
 *   system_admin  deribewsoftware@gmail.com
 *   admin         deribew.tech@gmail.com
 *   admin         deri.software@gmail.com
 *   supplier      deribewshimels4@gmail.com
 *   merchant      deribew.et@gmail.com
 *
 * Password env overrides (optional):
 *   SEED_PW_SUPER_ADMIN  SEED_PW_ADMIN_TECH  SEED_PW_ADMIN_SOFT
 *   SEED_PW_SUPPLIER     SEED_PW_MERCHANT
 *
 * Run:  node scripts/seed-deribew-users.mjs
 * Or:   npm run seed:deribew-users
 * Then: npm run seed:deribew-profiles   (Ethiopian supplier companies + catalog)
 * Then: npm run sync:deploy-seed   (if you ship lib/data/deploy-seed)
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const USERS = path.join(DATA, "users.json");

/** Full admin panel access (aligned with demo admin in seed-demo-data.mjs). */
const ADMIN_ALLOW = [
  "admin:dashboard",
  "companies:verify",
  "categories:manage",
  "system:configure",
  "orders:complete",
  "moderation:manage",
  "orders:admin",
];

/**
 * Defaults: long, mixed character classes, unique per account.
 * Override via env for production — do not commit real production secrets.
 */
const DEFAULT_PW = {
  super: "D3r!b3w#Sup3r_9mK2$vLq8ZpN4wHx7",
  adminTech: "D3r!b3w#Adm1n_Tch7$nR5wY2mQp8",
  adminSoft: "D3r!b3w#Adm1n_Sft4$pL9kX1vRt6",
  supplier: "D3r!b3w#Suppl1r_6hJ8$qN3mZb2",
  merchant: "D3r!b3w#Merc1nt_2wT5#vR8kYc9",
};

const ROWS = [
  {
    email: "deribewsoftware@gmail.com",
    role: "system_admin",
    name: "Deribew (Super Administrator)",
    password:
      process.env.SEED_PW_SUPER_ADMIN?.trim() || DEFAULT_PW.super,
  },
  {
    email: "deribew.tech@gmail.com",
    role: "admin",
    name: "Deribew Tech — Admin",
    password:
      process.env.SEED_PW_ADMIN_TECH?.trim() || DEFAULT_PW.adminTech,
    adminPermissionAllow: ADMIN_ALLOW,
  },
  {
    email: "deri.software@gmail.com",
    role: "admin",
    name: "Deribew Software — Admin",
    password:
      process.env.SEED_PW_ADMIN_SOFT?.trim() || DEFAULT_PW.adminSoft,
    adminPermissionAllow: ADMIN_ALLOW,
  },
  {
    email: "deribewshimels4@gmail.com",
    role: "supplier",
    name: "Deribew Shimels — Supplier",
    password:
      process.env.SEED_PW_SUPPLIER?.trim() || DEFAULT_PW.supplier,
    points: 1200,
  },
  {
    email: "deribew.et@gmail.com",
    role: "merchant",
    name: "Deribew ET — Merchant",
    password:
      process.env.SEED_PW_MERCHANT?.trim() || DEFAULT_PW.merchant,
  },
];

function mergeUser(existing, incoming) {
  const hash = bcrypt.hashSync(incoming.password, 10);
  const base = {
    id: existing?.id ?? crypto.randomUUID(),
    email: incoming.email.trim().toLowerCase(),
    passwordHash: hash,
    role: incoming.role,
    name: incoming.name,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    emailVerified: true,
  };

  if (incoming.role === "system_admin") {
    const row = { ...existing, ...base };
    delete row.adminPermissionAllow;
    delete row.adminPermissionDeny;
    return row;
  }

  if (incoming.role === "admin") {
    return {
      ...existing,
      ...base,
      adminPermissionAllow: incoming.adminPermissionAllow,
    };
  }

  if (incoming.role === "supplier") {
    return {
      ...existing,
      ...base,
      points: incoming.points ?? existing?.points ?? 0,
    };
  }

  return { ...existing, ...base };
}

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

let users = [];
if (fs.existsSync(USERS)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS, "utf-8"));
    if (!Array.isArray(users)) users = [];
  } catch {
    users = [];
  }
}

console.log("Deribew team seed — passwords (defaults; set env to override):\n");
for (const row of ROWS) {
  const email = row.email.trim().toLowerCase();
  const i = users.findIndex((u) => String(u.email).toLowerCase() === email);
  const incoming = { ...row, email };
  const merged = mergeUser(i >= 0 ? users[i] : undefined, incoming);
  if (i >= 0) users[i] = merged;
  else users.push(merged);
  console.log(`  ${row.role.padEnd(14)} ${email}`);
  console.log(`  ${"".padEnd(14)} password: ${row.password}\n`);
}

fs.writeFileSync(USERS, JSON.stringify(users, null, 2), "utf-8");
console.log("wrote", path.relative(ROOT, USERS));
