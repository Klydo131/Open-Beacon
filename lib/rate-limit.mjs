// A small fixed-window rate limiter for a public write endpoint.
//
// WHY THIS SHAPE. Most tutorial limiters key on something the caller supplies —
// a client id from localStorage, a session cookie, a header. That is free for an
// attacker to rotate, so the limit only ever applies to honest users. If you take
// one idea from this file, take that one: a limiter is only as good as the
// difficulty of changing its key.
//
// The second idea is that a limiter protecting an endpoint which SENDS something
// (an email, a webhook, a push) needs two budgets, not one. Limiting submissions
// bounds the database; it does not bound the mailbox, because a distributed
// flood can stay under a per-sender limit and still add up. Give the outbound
// side its own ceiling and check it AFTER the work is durably stored, so a flood
// costs you notifications and never costs a real user their message.
//
// WHAT THIS IS NOT. Serverless instances do not share memory, and a cold start
// begins with an empty map, so this is not a distributed limiter and should not
// be described as one. It raises the cost of abuse by a large factor and bounds
// what any single instance can emit. If you need a hard guarantee, put the same
// logic in your database or in Redis, where the state is shared.
//
// No dependencies. Pure functions over a Map, so it can be unit tested without a
// server — see tests/rate-limit.mjs.

/**
 * @param {{ limit: number, windowMs: number, maxKeys?: number }} opts
 */
export function createLimiter({ limit, windowMs, maxKeys = 4096 }) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');
  if (!Number.isInteger(windowMs) || windowMs < 1) throw new Error('windowMs must be positive');

  /** @type {Map<string, number[]>} key → timestamps of accepted hits */
  const hits = new Map();

  // Pruning is not housekeeping, it is the point.
  //
  // A map keyed by something the caller controls is itself a way to exhaust
  // memory: an attacker sending a million distinct keys would otherwise grow it
  // without bound, and the limiter meant to stop a denial of service becomes
  // one. Both the per-key list and the number of keys are capped.
  /** @param {number} now */
  function prune(now) {
    const cutoff = now - windowMs;
    for (const [key, stamps] of hits) {
      const live = stamps.filter((/** @type {number} */ t) => t > cutoff);
      if (live.length === 0) hits.delete(key);
      else hits.set(key, live);
    }
    if (hits.size > maxKeys) {
      // Oldest first. Map preserves insertion order, and a key that has not been
      // touched recently is the safest one to forget.
      const excess = hits.size - maxKeys;
      let i = 0;
      for (const key of hits.keys()) {
        if (i++ >= excess) break;
        hits.delete(key);
      }
    }
  }

  return {
    /**
     * Record an attempt and say whether it is allowed.
     * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
     */
    /**
     * @param {string} key
     * @param {number} [now]
     */
    take(key, now = Date.now()) {
      prune(now);
      const cutoff = now - windowMs;
      const stamps = (hits.get(key) ?? []).filter((/** @type {number} */ t) => t > cutoff);

      if (stamps.length >= limit) {
        // Retry when the OLDEST hit in the window falls out of it.
        const retryAfterMs = Math.max(1, stamps[0] + windowMs - now);
        // Deliberately NOT recorded. Counting refused attempts would let a
        // flooder hold their own key permanently over the line, which turns a
        // cooling-off period into a lockout they control. This is the single
        // most common bug in hand-rolled limiters.
        hits.set(key, stamps);
        return { allowed: false, remaining: 0, retryAfterMs };
      }

      stamps.push(now);
      hits.set(key, stamps);
      return { allowed: true, remaining: limit - stamps.length, retryAfterMs: 0 };
    },

    /** Current number of tracked keys. For tests and health output — never the keys themselves. */
    size() {
      return hits.size;
    },

    /** Test seam only. */
    reset() {
      hits.clear();
    },
  };
}

/**
 * The address a request came from, as reported by the proxy in front of you.
 *
 * The order matters and is not arbitrary. `x-forwarded-for` is a list a client
 * can PREPEND to — sending `X-Forwarded-For: 1.2.3.4` makes the leftmost entry
 * attacker-chosen, so a limiter that trusts the left of that header is defeated
 * by typing a different number each time. Your proxy APPENDS the address it
 * actually saw, so the RIGHTMOST entry is the trustworthy one, and `x-real-ip`
 * (set by the proxy, never forwarded from the client) is better still.
 *
 * Returns null when there is nothing trustworthy, so the caller decides what to
 * do with that rather than being handed a fake key that lumps every unknown
 * request together. Fail closed: treat null as one shared, stricter bucket
 * rather than as an exemption, or suppressing a header becomes the bypass.
 *
 * @param {Headers | Record<string, string>} headers
 */
export function clientAddress(headers) {
  // Duck-typed on purpose, and this is not a style preference.
  //
  // `headers instanceof Headers` reads tidier and is wrong twice over. It fails
  // for a plain object, which every test and several frameworks pass. And it
  // fails ACROSS REALMS: a genuine Headers object created in another JavaScript
  // context is not an instance of this context's Headers constructor. Both
  // failures are silent — the lookup returns undefined, every caller lands in
  // one bucket, and the rate limiter quietly stops telling anybody apart while
  // still looking like it works.
  /** @param {string} name @returns {string | null | undefined} */
  const get = (name) => {
    const maybe = /** @type {Headers} */ (headers);
    return typeof maybe.get === 'function'
      ? maybe.get(name)
      : /** @type {Record<string, string>} */ (headers)[name];
  };

  const real = (get('x-real-ip') || '').trim();
  if (real) return real;

  const chain = (get('x-forwarded-for') || '').split(',').map((/** @type {string} */ s) => s.trim()).filter(Boolean);
  if (chain.length > 0) return chain[chain.length - 1];

  return null;
}
