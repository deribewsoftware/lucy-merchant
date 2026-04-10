import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "presence.json";

/** userId → ISO last activity time */
type PresenceMap = Record<string, string>;

function load(): PresenceMap {
  return readJsonFile<PresenceMap>(FILE, {});
}

/** Writes last activity ISO time for `userId` and returns the stored value. */
export function touchPresence(userId: string): string {
  const map = load();
  const at = new Date().toISOString();
  map[userId] = at;
  writeJsonFile(FILE, map);
  return at;
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
