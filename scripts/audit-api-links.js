/**
 * Audit frontend <-> backend API links.
 *
 * Scans every NestJS controller for `@Controller(prefix)` + HTTP method
 * decorators, and every `front/src/api/*.ts` file for `apiClient.<verb>(path)`
 * calls, then reports frontend calls that have NO matching backend route.
 *
 * Usage: node scripts/audit-api-links.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BE_DIR = path.join(ROOT, 'src');
const FE_DIR = path.join(ROOT, 'front', 'src', 'api');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ---------- Backend routes ----------
const beRoutes = new Map(); // "GET /public/blogs" -> file
const beFiles = walk(BE_DIR).filter((f) => f.endsWith('.controller.ts'));
for (const file of beFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const ctrlMatch = src.match(/@Controller(?:<[^>]*>)?\(\s*['"`]([^'"`]*)['"`]\s*\)/);
  if (!ctrlMatch) continue;
  const prefix = ctrlMatch[1].replace(/^\/+|\/+$/g, '');
  const methodRe = /@(Get|Post|Put|Patch|Delete)(?:<[^>]*>)?\(\s*(['"`])([^'"`]*)\2\s*\)?/g;
  let m;
  while ((m = methodRe.exec(src))) {
    const verb = m[1].toUpperCase();
    const sub = m[3].replace(/^\/+|\/+$/g, '');
    const full = [prefix, sub].filter(Boolean).join('/');
    const key = `${verb} /${full}`;
    if (!beRoutes.has(key)) beRoutes.set(key, path.relative(ROOT, file));
  }
  // controller-level route with no sub-path: `@Get()` etc.
  const bareRe = /@(Get|Post|Put|Patch|Delete)(?:<[^>]*>)?\(\s*\)/g;
  while ((m = bareRe.exec(src))) {
    const verb = m[1].toUpperCase();
    const key = `${verb} /${prefix}`;
    if (!beRoutes.has(key)) beRoutes.set(key, path.relative(ROOT, file));
  }
}

// ---------- Frontend calls ----------
const feCalls = new Map(); // "GET /public/blogs" -> file:line
const feFiles = walk(FE_DIR).filter((f) => f.endsWith('.ts'));
for (const file of feFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const re = /apiClient\.(get|post|put|patch|delete)(?:<[^>]*>)?\(\s*(['"`])([^'"`]*)\2/g;
    let m;
    while ((m = re.exec(line))) {
      const verb = m[1].toUpperCase();
      let p = m[3];
      // strip query strings — they are params, not path segments
      p = p.split('?')[0];
      // strip :param segments for matching, keep raw for display
      const normalized = p
        .replace(/\$\{[^}]*\}/g, '*')
        .replace(/:[A-Za-z0-9_]+/g, '*')
        .replace(/^\/+|\/+$/g, '');
      const key = `${verb} /${normalized}`;
      const loc = `${path.relative(ROOT, file)}:${i + 1}`;
      if (!feCalls.has(key)) feCalls.set(key, { loc, raw: p });
    }
  });
}

// also scan apiFetch-style calls in the whole front/src tree (raw fetch wrappers)
const feRaw = new Map();
const allFe = walk(path.join(ROOT, 'front', 'src')).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
for (const file of allFe) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const re = /apiFetch(?:<[^>]*>)?\(\s*(`|['"])([^'"`]*)\1/g;
    let m;
    while ((m = re.exec(line))) {
      let p = m[2];
      const mm = p.match(/\$\{apiBase\}(.*)$/);
      if (mm) p = mm[1];
      if (!p.startsWith('/')) continue;
      p = p.split('?')[0];
      const normalized = p
        .replace(/\$\{[^}]*\}/g, '*')
        .replace(/\$\{[^}]*\}/g, '*')
        .replace(/:[A-Za-z0-9_]+/g, '*')
        .replace(/^\/+|\/+$/g, '');
      // method unknown from apiFetch alone; record under 'ANY'
      const key = `ANY /${normalized}`;
      const loc = `${path.relative(ROOT, file)}:${i + 1}`;
      if (!feRaw.has(key)) feRaw.set(key, { loc, raw: p });
    }
  });
}
for (const [k, v] of feRaw) if (!feCalls.has(k)) feCalls.set(k, v);

// ---------- Match ----------
function segsMatch(feSegs, beSegs) {
  if (feSegs.length !== beSegs.length) return false;
  return beSegs.every(
    (s, i) =>
      s === '*' ||
      s.startsWith(':') ||
      feSegs[i] === '*' ||
      s === feSegs[i],
  );
}

function backendHas(feKey) {
  const [verb, p] = feKey.split(' ');
  const feSegs = p.split('/');
  for (const k of beRoutes.keys()) {
    const [bv, bp] = k.split(' ');
    if (verb !== 'ANY' && bv !== verb) continue;
    if (segsMatch(feSegs, bp.split('/'))) return true;
  }
  return false;
}

const missing = [];
for (const [key, info] of feCalls) {
  if (!backendHas(key)) missing.push({ key, ...info });
}

console.log(`Backend routes: ${beRoutes.size}`);
console.log(`Frontend calls: ${feCalls.size}`);
console.log(`\n=== Frontend calls WITHOUT a matching backend route (${missing.length}) ===`);
for (const m of missing.sort((a, b) => a.key.localeCompare(b.key))) {
  console.log(`  ${m.key}   <- ${m.loc}   (raw: ${m.raw})`);
}

// reverse: backend routes never called from frontend (informational)
const unused = [];
for (const key of beRoutes.keys()) {
  const [verb, p] = key.split(' ');
  let hit = false;
  for (const feKey of feCalls.keys()) {
    const [fv, fp] = feKey.split(' ');
    if (fv !== verb && fv !== 'ANY') continue;
    if (segsMatch(fp.split('/'), p.split('/'))) {
      hit = true;
      break;
    }
  }
  if (!hit) unused.push(key);
}
console.log(`\n=== Backend routes NOT called from frontend api layer (${unused.length}) ===`);
for (const k of unused.sort()) console.log(`  ${k}   (${beRoutes.get(k)})`);
