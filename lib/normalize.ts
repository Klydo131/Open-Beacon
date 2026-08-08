// Loading a saved store that an older version of your app wrote.
//
// This module exists because of a real outage, and the shape of the fix is the
// lesson worth sharing.
//
// THE BUG. An offline-first app keeps its state in localStorage. Ship a version
// that adds a new collection, and every returning user loads a saved object that
// predates it. `state.newThing` is `undefined`, the first `.filter()` on it
// throws during render, and the whole app falls over — for existing users only.
// A first run is always fine, which is why no test catches it: every test starts
// in a clean browser, so every test is testing a FIRST run. Nobody's second run
// is ever tested, and the second run is the one where the data on the device and
// the code in the bundle can disagree.
//
// WORSE, THE OBVIOUS RECOVERY CANNOT HELP. The usual "something broke, get a
// fresh copy" button unregisters service workers and clears caches. It does not
// touch localStorage — deliberately, because that is the user's own data. So a
// user in this state can refresh as hard as they like, forever, and nothing will
// change. That is not a hypothetical: it is what a reload loop looks like from
// the inside.
//
// THE FIX PEOPLE REACH FOR, AND WHY IT FAILS. A hand-written list:
//
//     if (!parsed.messages) parsed.messages = [];
//     if (!parsed.meetings) parsed.meetings = [];
//
// It works until somebody adds a collection and forgets the second edit, which
// is a matter of when. The list is a separate place that has to be kept in step
// from memory, and memory is not a mechanism.
//
// THE FIX THAT HOLDS. Derive the shape from the seed. Adding a field to the seed
// is then the only edit, and old saves pick it up on the next load.

/**
 * Bring a saved object up to the shape the current code expects.
 *
 * @param parsed  Whatever came out of JSON.parse — assume nothing about it.
 * @param seed    A freshly built default state. Its keys ARE the schema.
 *
 * Rules, and the reasoning for each:
 *
 *  - A key missing from the save takes the seed's value. A key can only be
 *    missing if the save predates it, so there is no user data to protect; using
 *    the seed's value means a new feature is actually THERE for returning users
 *    rather than present but mysteriously empty.
 *  - A key present in the save is the user's, and is left alone — even when it
 *    is an empty array, because an empty array is a thing they did.
 *  - A key whose type disagrees with the seed is treated as missing. `null`
 *    where an array belongs throws at the first `.filter()` exactly the way
 *    `undefined` does, and a half-written save is a real thing.
 *  - A key in the save that the seed does not have is KEPT, so an older build
 *    reading a newer save does not silently delete the newer build's data.
 */
export function normalize<T extends object>(parsed: unknown, seed: T): T {
  // Copy anything taken from the seed, never reference it.
  //
  // Found by the test below rather than by reading the code. Handing back the
  // seed's own array means the returned state and the caller's defaults are the
  // SAME object: the first `state.items.push(...)` quietly appends to the seed,
  // and every later load starts from a default that has been accumulating other
  // people's data. It looks like the app is remembering things it was told to
  // forget, and it is very hard to see from the outside.
  const copy = <V>(value: V): V =>
    typeof structuredClone === 'function'
      ? structuredClone(value)
      : (JSON.parse(JSON.stringify(value)) as V);

  const shape = seed as unknown as Record<string, unknown>;
  const saved = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(shape)) {
    const want = shape[key];
    const have = saved[key];

    if (Array.isArray(want)) {
      out[key] = Array.isArray(have) ? have : copy(want);
    } else if (want !== null && typeof want === 'object') {
      // One level of nesting, which covers settings-style objects. Deliberately
      // not recursive-by-default: a deep merge that guesses at arrays-of-objects
      // does more damage than the problem it solves.
      out[key] =
        have !== null && typeof have === 'object' && !Array.isArray(have)
          ? { ...(copy(want) as object), ...(have as object) }
          : copy(want);
    } else {
      out[key] = have === undefined || have === null ? copy(want) : have;
    }
  }

  for (const key of Object.keys(saved)) {
    if (!(key in out)) out[key] = saved[key];
  }

  return out as unknown as T;
}

/**
 * Read, parse and normalise in one step, surviving anything in storage.
 *
 * Corrupt JSON, a storage API that throws (private browsing, a full quota, a
 * locked-down webview) and an absent key all end the same way: you get the seed
 * and the app starts. An app that refuses to open because a preference could not
 * be read has chosen the wrong failure.
 */
export function loadState<T extends object>(key: string, seed: T): T {
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    if (!raw) return seed;
    return normalize<T>(JSON.parse(raw), seed);
  } catch {
    return seed;
  }
}
