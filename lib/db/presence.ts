import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "presence.json";

/** userId → ISO last activity time */
type PresenceMap = Record<string, string>;

function load(): PresenceMap {
  return readJsonFile<PresenceMap>(FILE, {});
}

export function touchPresence(userId: string): void {
  const map = load();
  map[userId] = new Date().toISOString();
  writeJsonFile(FILE, map);
}

export function getPresenceForUsers(userIds: string[]): Record<string, string> {
  const map = load();
  const out: Record<string, string> = {};
  for (const id of userIds) {
    const v = map[id];
    if (v) out[id] = v;
  }
  return out;
}
