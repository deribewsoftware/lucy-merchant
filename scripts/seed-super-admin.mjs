/**
 * Seeds or updates the primary system administrator in ./data/users.json.
 *
 * Defaults:
 *   deribewsoftware@gmail.com / Super@123 / system_admin
 *
 * Override: SEED_SUPER_ADMIN_EMAIL SEED_SUPER_ADMIN_PASSWORD SEED_SUPER_ADMIN_NAME
 *
 * Run: node scripts/seed-super-admin.mjs
 * Or:  npm run seed:super-admin
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const USERS = path.join(DATA, "users.json");

const email = (
  process.env.SEED_SUPER_ADMIN_EMAIL ?? "deribewsoftware@gmail.com"
).trim().toLowerCase();
const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Super@123";
const name = (process.env.SEED_SUPER_ADMIN_NAME ?? "Super Admin").trim();

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
  role: "system_admin",
  name,
  createdAt: i >= 0 ? users[i].createdAt : new Date().toISOString(),
  emailVerified: true,
};

if (i >= 0) {
  users[i] = { ...users[i], ...row };
  delete users[i].adminPermissionDeny;
  delete users[i].adminPermissionAllow;
  console.log("updated system admin:", email);
} else {
  users.push(row);
  console.log("added system admin:", email);
}

fs.writeFileSync(USERS, JSON.stringify(users, null, 2), "utf-8");
console.log("wrote", path.relative(ROOT, USERS));
