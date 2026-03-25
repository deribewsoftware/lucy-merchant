import fs from "fs";
import path from "path";
import { isEphemeralServerHost } from "@/lib/server/ephemeral-host";

const DATA_DIR = path.join(process.cwd(), "data");

/** Serverless hosts: no writable `/var/task/data` — keep JSON in process memory. */
function useMemoryStore(): boolean {
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

export function readJsonFile<T>(file: string, fallback: T): T {
  if (useMemoryStore()) {
    if (memory.has(file)) {
      return structuredClone(memory.get(file)) as T;
    }
    const initial = structuredClone(fallback) as T;
    memory.set(file, structuredClone(initial));
    return initial;
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
  if (useMemoryStore()) {
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
