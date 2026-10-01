import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  "apps/api/src",
  "apps/web/app",
  "apps/mobile/app",
  "packages/types/src",
  "packages/domain/src",
  "packages/database/src",
  "packages/maps/src",
  "packages/payments/src",
  "packages/validation/src",
  "infra",
  "docker-compose.yml",
  ".github/workflows/ci.yml",
];

const forbidden = [
  /setTimeout\s*\([^\n]*success/i,
  /setInterval\s*\([^\n]*success/i,
  /if\s*\(\s*user\s*\.\s*isAdmin\s*\)/i,
];

const sourceRoots = [
  "apps/api/src",
  "apps/web/app",
  "apps/web/src",
  "apps/mobile/app",
  "packages/auth/src",
  "packages/domain/src",
  "packages/maps/src",
  "packages/payments/src",
  "packages/validation/src",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "build", ".expo"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
if (missing.length) {
  console.error("Missing required repository surfaces:");
  for (const item of missing) console.error(" -", item);
  process.exit(1);
}

const violations = [];
for (const rel of sourceRoots) {
  for (const file of walk(path.join(root, rel))) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(text)) violations.push({ file: path.relative(root, file), pattern: String(pattern) });
    }
  }
}

if (violations.length) {
  console.error("Production contract violations:");
  for (const item of violations) console.error(` - ${item.file}: ${item.pattern}`);
  process.exit(1);
}

console.log(`Production contract OK: ${required.length} required surfaces checked; ${sourceRoots.length} source roots scanned.`);
