/**
 * Merges a local admin account into ./data/users.json (bcrypt, same as app).
 * data/*.json is gitignored — safe for local machines.
 *
 * Defaults match project owner; override with env:
 *   SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD SEED_ADMIN_NAME SEED_ADMIN_ROLE
 *   SEED_ADMIN_ROLE: "admin" (default) or "system_admin"
 *
 * Run: node scripts/seed-deribew-admin.mjs
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const USERS = path.join(DATA, "users.json");

const email = (process.env.SEED_ADMIN_EMAIL ?? "deri.software@gmail.com").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";
const name = (process.env.SEED_ADMIN_NAME ?? "Deribew Admin").trim();
const roleRaw = (process.env.SEED_ADMIN_ROLE ?? "admin").trim().toLowerCase();
const role = roleRaw === "system_admin" ? "system_admin" : "admin";

if (!email || !password || !name) {
  console.error("email, password, and name are required (env or defaults).");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

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

const i = users.findIndex((u) => String(u.email).toLowerCase() === email);
const row = {
  id: i >= 0 ? users[i].id : crypto.randomUUID(),
  email,
  passwordHash: hash,
  role,
  name,
  createdAt: i >= 0 ? users[i].createdAt : new Date().toISOString(),
  emailVerified: true,
};

if (i >= 0) {
  users[i] = { ...users[i], ...row };
  if (role === "system_admin") delete users[i].adminPermissionDeny;
  console.log("updated staff:", email, role);
} else {
  users.push(row);
  console.log("added staff:", email, role);
}

fs.writeFileSync(USERS, JSON.stringify(users, null, 2), "utf-8");
console.log("wrote", path.relative(ROOT, USERS));
