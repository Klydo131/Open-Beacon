// The boundary between this public repository and the private application it
// was extracted from.
//
// An audit is a photograph; a test is a promise. Every check here corresponds to
// a way that a well-meaning future commit could publish something that should
// have stayed private, or weaken a guard that other people are now relying on.
//
//   node tests/security-invariants.mjs
//
// Plain Node, no dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let bad = 0;
const ok = (c, m) => {
  if (!c) bad++;
  console.log(`${c ? 'OK ' : 'BAD'} ${m}`);
};

let tracked = [];
try {
  tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  console.log('BAD not a git repository');
  process.exit(1);
}
ok(tracked.length > 10, `${tracked.length} tracked files to check`);

const textFiles = tracked.filter(
  (f) => !/package-lock\.json|\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/.test(f),
);

// ---------------------------------------------------------------------------
// 1. No credential, in any shape.
//
// This repository is public. A private repo leaks to whoever has access; a
// public one leaks to a crawler within minutes, and the first thing an automated
// scanner does with a found key is use it.
// ---------------------------------------------------------------------------
const SHAPES = [
  [/eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}/, 'a JWT'],
  [/\bre_[A-Za-z0-9]{20,}\b/, 'a Resend API key'],
  [/\bsb_secret_[A-Za-z0-9_-]{10,}/, 'a Supabase secret key'],
  [/\bghp_[A-Za-z0-9]{30,}\b/, 'a GitHub token'],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'a private key'],
  [/\b[0-9a-f]{64}\b/, 'a 64-hex token'],
];
let creds = 0;
for (const f of textFiles) {
  if (f === 'tests/security-invariants.mjs') continue;
  read(f)
    .split('\n')
    .forEach((line, i) => {
      for (const [shape, what] of SHAPES) {
        if (shape.test(line)) {
          ok(false, `${f}:${i + 1} looks like ${what}`);
          creds++;
        }
      }
    });
}
if (creds === 0) ok('no credential-shaped literal anywhere');

// ---------------------------------------------------------------------------
// 2. No env file but the example, and the example fills nothing in.
// ---------------------------------------------------------------------------
const envs = tracked.filter((f) => /(^|\/)\.env($|\.)/.test(f));
const realEnv = envs.filter((f) => !/example/i.test(f));
ok(realEnv.length === 0, realEnv.length ? `a real env file is committed: ${realEnv}` : 'no real env file is committed');

// ---------------------------------------------------------------------------
// 3. The private application's shape stays private.
//
// The subtle half of the boundary. A secret is obvious and rare; a description
// of how one organisation's system is defended is neither, and it is far more
// useful to somebody attacking that organisation.
// ---------------------------------------------------------------------------
const FORBIDDEN_PATHS = [/^supabase\//, /^lib\/supabase\//, /database\.types\.ts$/, /migrations?\//];
const leaked = tracked.filter((f) => FORBIDDEN_PATHS.some((re) => re.test(f)));
ok(
  leaked.length === 0,
  leaked.length === 0
    ? 'no migrations, RLS policies, generated database types or server clients'
    : `these describe the private backend: ${leaked.join(', ')}`,
);

// Terms that would identify the private deployment or its operator.
const FORBIDDEN_TERMS = [
  [/\bservice[_-]?role\b/i, 'a service-role key reference'],
  [/\bsupabase\.co\b/i, 'a live project hostname'],
  [/\bvercel\.app\b/i, 'a live deployment hostname'],
  [/FEEDBACK_INGRESS_TOKEN|FEEDBACK_RESEND_API_KEY/, 'a private deployment setting'],
];
let terms = 0;
for (const f of textFiles) {
  if (f === 'tests/security-invariants.mjs') continue;
  read(f)
    .split('\n')
    .forEach((line, i) => {
      for (const [re, what] of FORBIDDEN_TERMS) {
        if (re.test(line)) {
          ok(false, `${f}:${i + 1} names ${what}`);
          terms++;
        }
      }
    });
}
if (terms === 0) ok('nothing names the private deployment, its host or its settings');

// ---------------------------------------------------------------------------
// 4. Sample data stays fiction.
//
// Reserved by RFC 2606 and RFC 6761: .example, .test, .invalid and .localhost
// can never be registered, so an address there can never reach a real inbox.
// ---------------------------------------------------------------------------
for (const f of tracked.filter((f) => /seed|sample|fixture/i.test(f) && /\.tsx?$/.test(f))) {
  const body = read(f);
  const emails = body.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
  const RESERVED = /@([\w-]+\.)*(example|test|invalid|localhost)$|@example\.(com|net|org)$/i;
  const real = emails.filter((e) => !RESERVED.test(e));
  ok(real.length === 0, real.length === 0
    ? `${f}: sample addresses are all at reserved domains (${emails.length})`
    : `${f}: these could reach a real inbox: ${[...new Set(real)].join(', ')}`);
  const phones = body.match(/\+?\d[\d\s().-]{9,}\d/g) || [];
  ok(phones.length === 0, phones.length === 0 ? `${f}: no phone numbers` : `${f}: phone-shaped: ${phones[0]}`);
}

// ---------------------------------------------------------------------------
// 5. The guards other people now depend on keep working.
//
// These modules are published as safe-to-copy. If one is weakened here, it is
// weakened in every project that took it.
// ---------------------------------------------------------------------------
const url = read('lib/url.ts');
const m = url.match(/return (\/[^\n]+\/i)\.test\(trimmed\)/);
ok(!!m, 'safeExternalUrl tests the trimmed value against one anchored pattern');
if (m) {
  const re = eval(m[1]); // eslint-disable-line no-eval
  for (const payload of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//evil.example.com',
  ]) {
    ok(!re.test(payload), `safeExternalUrl blocks ${JSON.stringify(payload)}`);
  }
  ok(re.test('https://example.com/a'), 'safeExternalUrl allows a real https URL');
}

const limiter = read('lib/rate-limit.mjs');
ok(
  /chain\[chain\.length - 1\]/.test(limiter),
  'clientAddress reads the RIGHTMOST forwarded address, which the client cannot choose',
);
ok(
  /maxKeys/.test(limiter),
  'the limiter caps how many keys it will track, so it cannot itself exhaust memory',
);

console.log(bad === 0 ? '\nRESULT: ALL OK' : `\nRESULT: ${bad} FAILURE(S)`);
process.exit(bad === 0 ? 0 : 1);
