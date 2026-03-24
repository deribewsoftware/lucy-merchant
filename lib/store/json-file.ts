import fs from "fs";
import path from "path";

function resolvePath(file: string): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, file);
}

export function readJsonFile<T>(file: string, fallback: T): T {
  const p = resolvePath(file);
  if (!fs.existsSync(p)) {
    writeJsonFile(file, fallback);
    return structuredClone(fallback) as T;
  }
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as T;
}

export function writeJsonFile<T>(file: string, data: T): void {
  const p = resolvePath(file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}
