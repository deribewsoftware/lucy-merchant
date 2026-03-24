import { randomUUID } from "crypto";
import type { UserRecord, UserRole } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";
import { hashPassword } from "@/lib/auth/password";

const FILE = "users.json";

function load(): UserRecord[] {
  return readJsonFile<UserRecord[]>(FILE, []);
}

function save(users: UserRecord[]) {
  writeJsonFile(FILE, users);
}

export function listUsers(): UserRecord[] {
  return load();
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const e = email.trim().toLowerCase();
  return load().find((u) => u.email.toLowerCase() === e);
}

export function findUserById(id: string): UserRecord | undefined {
  return load().find((u) => u.id === id);
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): Promise<UserRecord> {
  const users = load();
  if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
    throw new Error("Email already registered");
  }
  const record: UserRecord = {
    id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
    name: input.name.trim(),
    points: input.role === "supplier" ? 100 : undefined,
    createdAt: new Date().toISOString(),
  };
  users.push(record);
  save(users);
  return record;
}

export function updateUserPoints(userId: string, next: number): void {
  const users = load();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return;
  users[i] = { ...users[i], points: next };
  save(users);
}
