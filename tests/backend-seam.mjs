// The seam a real backend plugs into must stay open.
//
// This app is usable for real, not only readable, and that rests on one
// property: every screen goes through `useStore()`, so replacing what is behind
// it replaces the entire data layer without touching a single screen.
//
// That property is easy to lose by accident and impossible to notice. Nothing
// breaks when somebody un-exports the context, or has one component reach into
// storage directly "just for this one case" — the app keeps working perfectly.
// It stops being adoptable, quietly, and the person who finds out is a church
// three months into building on it.
//
//   node tests/backend-seam.mjs
//
// Plain Node, no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let bad = 0;
const ok = (c, m) => {
  if (!c) bad++;
  console.log(`${c ? 'OK ' : 'BAD'} ${m}`);
};

const store = read('lib/store.tsx');

// ---------------------------------------------------------------------------
// 1. The three things a replacement needs are exported.
//
// Without all three you cannot type an implementation, cannot provide it, and
// cannot read it from a screen. Any one missing closes the seam.
// ---------------------------------------------------------------------------
ok(
  /export interface StoreApi\b/.test(store),
  'StoreApi is exported, so a real backend can be typed against the contract',
);
ok(
  /export const StoreContext\s*=\s*createContext/.test(store),
  'StoreContext is exported, so a real backend can be provided in its place',
);
ok(
  /export function useStore\(\)\s*:\s*StoreApi/.test(store),
  'useStore returns StoreApi, so screens depend on the contract not the demo',
);
ok(
  /export function StoreProvider\b/.test(store),
  'StoreProvider is exported and is only ONE implementation of the contract',
);

// ---------------------------------------------------------------------------
// 2. The contract is worth implementing — it must not be empty or trivial.
// ---------------------------------------------------------------------------
const body = store.slice(
  store.indexOf('export interface StoreApi'),
  store.indexOf('export const StoreContext'),
);
const members = (body.match(/^\s{2}\w+[?]?:/gm) || []).length;
ok(members >= 15, `the contract has ${members} members for an implementation to satisfy`);

// ---------------------------------------------------------------------------
// 3. Only the store touches persistence.
//
// THE ONE THAT ACTUALLY MATTERS. A screen that reaches into localStorage
// directly is a screen that keeps working on the demo and silently breaks on a
// real backend, because its data no longer comes from the same place as
// everything else. That is the failure this whole file exists to prevent, and
// it is invisible until somebody has already built on top of it.
// ---------------------------------------------------------------------------
function walk(dir, out = []) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return out;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const appFiles = [...walk('app'), ...walk('components'), ...walk('lib')];

// The store owns persistence. Two exemptions, each with a reason:
//
//   lib/store.tsx              — is the data layer.
//   components/ServiceWorker   — talks to the browser about the browser, which
//                                is not application data.
const ALLOWED = new Set(['lib/store.tsx', 'components/ServiceWorker.tsx']);

// And one conditional exemption. lib/normalize.ts is published for other
// projects to copy, and reading storage is the whole job of its `loadState`.
// It is exempt ONLY while this app does not use it — the moment it is wired
// into a screen it becomes a second data path, which is exactly what this
// check exists to catch. So the exemption verifies itself rather than being a
// standing pass.
const STANDALONE = 'lib/normalize.ts';
const importsStandalone = appFiles
  .filter((f) => f !== STANDALONE)
  .some((f) => /from\s+['"][^'"]*\/normalize['"]|from\s+['"]\.\/normalize['"]/.test(read(f)));

ok(
  !importsStandalone,
  importsStandalone
    ? `${STANDALONE} is now imported by the app, so it is a second data path — route it through the store or fold it in`
    : `${STANDALONE} is a standalone published module the app does not import, so its storage access is not a second data path`,
);
if (!importsStandalone) ALLOWED.add(STANDALONE);

const offenders = appFiles.filter(
  (f) => !ALLOWED.has(f) && /localStorage|sessionStorage|indexedDB/.test(read(f)),
);

ok(
  offenders.length === 0,
  offenders.length === 0
    ? 'no screen touches storage directly — the store is the only data layer'
    : `these reach past the store into storage: ${offenders.join(', ')}`,
);

console.log(bad === 0 ? '\nRESULT: ALL OK' : `\nRESULT: ${bad} FAILURE(S)`);
process.exit(bad === 0 ? 0 : 1);
