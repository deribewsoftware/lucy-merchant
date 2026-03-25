/**
 * After `npm run seed:demo`, copy ./data/*.json into lib/data/deploy-seed/
 * so Vercel/serverless loads the same demo catalog from disk on cold start.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "data");
const DST = path.join(ROOT, "lib", "data", "deploy-seed");

if (!fs.existsSync(SRC)) {
  console.error("Missing ./data — run npm run seed:demo first.");
  process.exit(1);
}

fs.mkdirSync(DST, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith(".json")) continue;
  fs.copyFileSync(path.join(SRC, f), path.join(DST, f));
  n += 1;
}
console.log(`sync-deploy-seed: copied ${n} file(s) to lib/data/deploy-seed/`);
