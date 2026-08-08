// Loading a save written by an older version of the app.
//
// Every one of these assertions corresponds to a way an offline-first app breaks
// for RETURNING users only — the class of bug that no test starting in a clean
// browser can ever see, because a clean browser has no old save to be wrong.
import { normalize } from '../lib/normalize.ts';

let bad = 0;
const ok = (c, m) => {
  if (!c) bad++;
  console.log(`${c ? 'OK ' : 'BAD'} ${m}`);
};

const seed = () => ({
  people: [{ id: 'p1' }],
  notes: [],
  meetings: [{ id: 'm1' }],
  settings: { theme: 'light', sound: true },
  title: 'Untitled',
  version: 3,
});

// -------------------------------------------------- the outage, exactly ------
{
  // A save written before `meetings` existed.
  const old = { people: [{ id: 'mine' }], notes: [], settings: { theme: 'dark' }, title: 'Mine', version: 3 };
  const out = normalize(old, seed());
  ok(Array.isArray(out.meetings), 'a collection the save never had comes back as an array, not undefined');
  ok(out.meetings.length === 1, 'and takes the seed value, so the new feature is actually there');
  ok(out.people[0].id === 'mine', "the user's own data is untouched");
}

// --------------------------------------- an empty array is a thing they did --
{
  const out = normalize({ ...seed(), meetings: [] }, seed());
  ok(
    Array.isArray(out.meetings) && out.meetings.length === 0,
    'an empty array in the save is kept empty — deleting everything is a choice',
  );
}

// ------------------------------------------- wrong type is the same crash ----
{
  for (const broken of [null, undefined, 'nope', 42, { not: 'an array' }]) {
    const out = normalize({ ...seed(), notes: broken }, seed());
    ok(Array.isArray(out.notes), `${JSON.stringify(broken)} where an array belongs is repaired`);
  }
}

// ------------------------------------------------------- scalars and nesting --
{
  const out = normalize({ title: 'Kept', settings: { theme: 'dark' } }, seed());
  ok(out.title === 'Kept', 'a scalar the user set is kept');
  ok(out.version === 3, 'a scalar the save lacks takes the seed value');
  ok(out.settings.theme === 'dark', 'a nested value the user set is kept');
  ok(out.settings.sound === true, 'and a nested key they never had is filled in');
}

// ----------------------------------------- an older build reading a newer save --
{
  const out = normalize({ ...seed(), futureThing: [1, 2, 3] }, seed());
  ok(
    Array.isArray(out.futureThing) && out.futureThing.length === 3,
    'data the seed does not know about is KEPT, not silently deleted',
  );
}

// ------------------------------------------------------------- junk input ----
{
  for (const junk of [null, undefined, 'a string', 7, []]) {
    const out = normalize(junk, seed());
    ok(
      Array.isArray(out.people) && out.title === 'Untitled',
      `${JSON.stringify(junk)} parses to the seed rather than throwing`,
    );
  }
}

// ------------------------------------------------- the seed is not mutated ---
{
  const s = seed();
  const out = normalize({ notes: ['mine'] }, s);
  out.people.push({ id: 'added' });
  ok(s.people.length === 1, 'the caller’s seed object is not modified by later writes');
}

console.log(bad === 0 ? '\nRESULT: ALL OK' : `\nRESULT: ${bad} FAILURE(S)`);
process.exit(bad === 0 ? 0 : 1);
