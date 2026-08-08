// The rate limiter, checked without a server.
//
// This guards the one endpoint the public can write to, so the failure modes
// matter more than the happy path. Three of the assertions below are about ways
// a limiter can be worse than none at all:
//
//   - trusting the left of x-forwarded-for, which a client can prepend to, so
//     the "limit" is defeated by typing a different number each request;
//   - counting refused attempts, which lets a flooder hold their own key over
//     the line forever and turns a cooling-off into a lockout they control;
//   - keying an unbounded map on caller-controlled input, which makes the
//     limiter meant to stop a denial of service into one.
import { createLimiter, clientAddress } from '../lib/rate-limit.mjs';

let bad = 0;
const ok = (c, m) => {
  if (!c) bad++;
  console.log(`${c ? 'OK ' : 'BAD'} ${m}`);
};

const T0 = 1_000_000;

// ------------------------------------------------------------- the window ---
{
  const lim = createLimiter({ limit: 3, windowMs: 60_000 });
  ok(lim.take('a', T0).allowed, 'the first request is allowed');
  ok(lim.take('a', T0 + 1).allowed, 'the second is allowed');
  const third = lim.take('a', T0 + 2);
  ok(third.allowed && third.remaining === 0, 'the third is allowed and is the last');
  ok(!lim.take('a', T0 + 3).allowed, 'the fourth is refused');

  // Independence. One noisy sender must not silence everybody else — that is
  // the denial of service the limiter is supposed to prevent, not cause.
  ok(lim.take('b', T0 + 3).allowed, 'a different sender is unaffected');

  ok(!lim.take('a', T0 + 59_999).allowed, 'still refused just inside the window');
  ok(lim.take('a', T0 + 60_003).allowed, 'allowed again once the window has passed');
}

// -------------------------------------------- refusals must not extend it ---
{
  const lim = createLimiter({ limit: 2, windowMs: 10_000 });
  lim.take('a', T0);
  lim.take('a', T0 + 1);
  // Hammer it throughout the window. If refusals were recorded, the window
  // would keep sliding forward and the sender would never be let back in.
  for (let t = T0 + 2; t < T0 + 10_000; t += 100) lim.take('a', t);
  ok(
    lim.take('a', T0 + 10_002).allowed,
    'hammering while refused does not extend the ban — a cooling-off, not a lockout',
  );
}

// ------------------------------------------------------ retry-after is real --
{
  const lim = createLimiter({ limit: 1, windowMs: 30_000 });
  lim.take('a', T0);
  const refused = lim.take('a', T0 + 5_000);
  ok(!refused.allowed, 'refused over the limit');
  ok(
    refused.retryAfterMs === 25_000,
    `Retry-After counts from the oldest hit, not from now (${refused.retryAfterMs})`,
  );
  ok(lim.take('a', T0 + refused.retryAfterMs + 5_001).allowed, 'and it is accurate');
}

// ------------------------------------------------ the map cannot grow forever --
{
  const lim = createLimiter({ limit: 5, windowMs: 60_000, maxKeys: 50 });
  for (let i = 0; i < 5_000; i++) lim.take(`sender-${i}`, T0 + i);
  ok(
    lim.size() <= 51,
    `five thousand distinct senders do not grow the map without bound (${lim.size()})`,
  );
  // The limiter must still work after eviction rather than falling over.
  ok(lim.take('fresh', T0 + 6_000).allowed, 'and it still limits after evicting');
}

// -------------------------------------------------------- expiry frees memory --
{
  const lim = createLimiter({ limit: 5, windowMs: 1_000 });
  for (let i = 0; i < 100; i++) lim.take(`s${i}`, T0);
  ok(lim.size() === 100, 'keys are held while their window is live');
  lim.take('trigger', T0 + 5_000);
  ok(lim.size() === 1, `expired keys are dropped entirely (${lim.size()})`);
}

// ------------------------------------------------------------ the address ---
{
  const h = (obj) => ({ get: (k) => obj[k] ?? null });

  ok(
    clientAddress(h({ 'x-real-ip': '203.0.113.7' })) === '203.0.113.7',
    'x-real-ip is preferred, because the proxy sets it and the client cannot',
  );

  // The one that matters. A client sending its own X-Forwarded-For prepends to
  // the list; the platform appends what it actually saw. Reading the left of
  // that header means an attacker picks their own rate-limit key.
  ok(
    clientAddress(h({ 'x-forwarded-for': '1.2.3.4, 198.51.100.9' })) === '198.51.100.9',
    'the RIGHTMOST forwarded address wins, not the client-supplied left',
  );
  ok(
    clientAddress(h({ 'x-forwarded-for': '  10.0.0.1 ,  198.51.100.9  ' })) === '198.51.100.9',
    'and whitespace around the entries does not change that',
  );
  ok(
    clientAddress(h({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.2.3.4' })) ===
      '203.0.113.7',
    'x-real-ip still wins when both are present',
  );
  ok(clientAddress(h({})) === null, 'nothing trustworthy returns null rather than a fake key');
  ok(
    clientAddress(h({ 'x-forwarded-for': ' , , ' })) === null,
    'a header of only separators is nothing, not an empty key',
  );
}

// ----------------------------------------------------------- bad configuration --
{
  let threw = false;
  try {
    createLimiter({ limit: 0, windowMs: 1000 });
  } catch {
    threw = true;
  }
  ok(threw, 'a limit of zero is a configuration error, not a silent block-everything');
}

console.log(bad === 0 ? '\nRESULT: ALL OK' : `\nRESULT: ${bad} FAILURE(S)`);
process.exit(bad === 0 ? 0 : 1);
