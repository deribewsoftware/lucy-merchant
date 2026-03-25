import fs from "fs";
import path from "path";
import { isEphemeralServerHost } from "@/lib/server/ephemeral-host";

const DATA_DIR = path.join(process.cwd(), "data");
/** Read-only snapshot shipped with the app so serverless (Vercel) cold starts are not empty. */
const DEPLOY_SEED_DIR = path.join(process.cwd(), "lib", "data", "deploy-seed");

/** Serverless hosts: no writable `/var/task/data` — keep JSON in process memory. */
function shouldUseMemoryJsonStore(): boolean {
  if (process.env.LUCY_DATA_STORE === "memory") return true;
  if (process.env.LUCY_DATA_STORE === "filesystem") return false;
  return isEphemeralServerHost();
}

const memory = new Map<string, unknown>();

function resolvePath(file: string): string {
  return path.join(DATA_DIR, file);
}

/** Vercel/serverless often cannot create `/var/task/data` (read-only or missing parent). */
function isExpectedServerlessFsError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return (
    code === "ENOENT" ||
    code === "EROFS" ||
    code === "EACCES" ||
    code === "EPERM" ||
    code === "ENOTSUP"
  );
}

function readBundledDeploySeed<T>(file: string): T | null {
  try {
    const p = path.join(DEPLOY_SEED_DIR, file);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readJsonFile<T>(file: string, fallback: T): T {
  if (shouldUseMemoryJsonStore()) {
    if (memory.has(file)) {
      return structuredClone(memory.get(file)) as T;
    }
    const seeded = readBundledDeploySeed<T>(file);
    const initial =
      seeded !== null ? structuredClone(seeded) : structuredClone(fallback);
    memory.set(file, structuredClone(initial));
    return structuredClone(initial) as T;
  }

  const p = resolvePath(file);
  if (!fs.existsSync(p)) {
    try {
      writeJsonFile(file, fallback);
    } catch (err) {
      if (!isExpectedServerlessFsError(err)) throw err;
    }
    return structuredClone(fallback) as T;
  }
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as T;
}

export function writeJsonFile<T>(file: string, data: T): void {
  if (shouldUseMemoryJsonStore()) {
    memory.set(file, structuredClone(data));
    return;
  }

  const p = resolvePath(file);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    if (isExpectedServerlessFsError(err)) {
      console.warn(
        `[json-file] skipped write (no persistent data dir on this host): ${file}`,
      );
      return;
    }
    throw err;
  }
}
