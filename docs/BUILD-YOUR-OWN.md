# Build your own Beacon: front end *and* backend

Open Beacon is a complete application. Every feature works right now — people,
journeys, messages, notes, community requests, the learning shelf, the focus
timer. It is missing exactly one thing: **a place to keep the data that is not
your own browser.**

This guide adds that. It takes you from what you have to something two people
can sign into on two different devices and see the same thing.

**Which backend you use, and where you run it, is entirely your choice.** This
guide does not pick one for you. It shows you what the app needs, gives you a
working example of each step, and points out the places where the obvious
approach fails.

**No prior backend experience is assumed.**

---

## Contents

| Step | What you do | Example given |
|---|---|---|
| [0](#step-0--what-you-have-and-what-you-are-adding) | Understand what you have | A diagram of the change |
| [1](#step-1--the-first-decision-static-or-server) | **Decide: static, or with a server** | The one-line config change |
| [2](#step-2--the-five-words-you-need) | Learn the five words | Plain definitions |
| [3](#step-3--pick-your-stack) | Pick your stack | A comparison table |
| [4](#step-4--the-tables-this-app-needs) | Build the tables | Complete SQL for every feature |
| [5](#step-5--three-fields-that-need-to-change-shape) | **Fix three single-user fields** | Before and after |
| [6](#step-6--accounts) | Add accounts | Sign-in and profile creation |
| [7](#step-7--the-permission-rules) | **Write the rules** | SQL for all six promises |
| [8](#step-8--write-the-adapter) | Write the adapter | Three functions, in full |
| [9](#step-9--the-write-pattern-that-keeps-it-offline-first) | **The write pattern** | Optimistic write with rollback |
| [10](#step-10--deploy) | Deploy | Config and headers |
| [11](#step-11--before-real-people) | The checklist | Sixteen boxes |

The **bold** steps are the ones people get wrong.

---

## Step 0 — What you have, and what you are adding

```
  NOW                                   AFTER

  ┌──────────────────┐                  ┌──────────────────┐
  │   Your browser   │                  │   Your browser   │
  │                  │                  │                  │
  │  Every screen    │                  │  Every screen    │  ← unchanged
  │       ↓          │                  │       ↓          │
  │   useStore()     │                  │   useStore()     │  ← unchanged
  │       ↓          │                  │       ↓          │
  │  StoreProvider   │                  │  YOUR provider   │  ← you write this
  │       ↓          │                  │       ↓          │
  │ browser storage  │                  └───────┼──────────┘
  └──────────────────┘                          ↓
                                        ┌──────────────────┐
   One device. Nothing shared.          │  Your database   │
   Clear the browser, it is gone.       └──────────────────┘

                                         Many devices, one group.
```

**You are not rebuilding the app.** You are replacing one thing underneath it.

That works because of a property the code already has and a test already
enforces (`tests/backend-seam.mjs`): **no screen touches storage.** Every screen
calls `useStore()`, so there is exactly one place data comes from, and swapping
it swaps everything.

---

## Step 1 — The first decision: static, or server?

Do this before anything else, because it changes the other steps.

Open Beacon currently builds to **static files**:

```js
// next.config.mjs
const nextConfig = {
  output: 'export',     // ← plain HTML/JS/CSS, no server at all
  trailingSlash: true,
};
```

That means there is nowhere on your side to run code or hide a key. You have two
routes.

### Option A — Stay static, talk to a managed backend

The browser talks directly to your backend. Your backend enforces the rules.

- **Keep** `output: 'export'`.
- Use a backend with **row-level rules** (Supabase, Firebase, Appwrite,
  Pocketbase). The rules must live with the data, because there is no server of
  yours in between.
- The only key in the app is the **publishable** one, designed to be public.
- Hosting stays free or nearly free — any static host works.

**Choose this unless you have a specific reason not to.** It is simpler, cheaper,
and the security model is easier to reason about because there is only one place
rules can be.

### Option B — Add a server

Delete one line and you have somewhere to run your own code:

```js
// next.config.mjs
const nextConfig = {
  // output: 'export',   ← remove this to enable API routes
  trailingSlash: true,
};
```

Now `app/api/*/route.ts` works, you can hold powerful keys server-side, and you
can talk to any database at all — Postgres, MySQL, SQLite, whatever you already
run. In exchange you need a host that runs Node, and you own more.

Take this if you already have a server, or your backend has no row-level rules.

> **Whichever you choose, write it down in your README.** The next person needs
> to know which shape they are in before they can safely change anything.

---

## Step 2 — The five words you need

Skip this if they are familiar.

**Backend.** A computer somewhere else that stores your data and answers
requests for it.

**Database.** The filing system on that computer. It holds *tables*.

**Table.** A grid, like one sheet of a spreadsheet. A `people` table has one row
per person and columns for name, role, and so on.

**Authentication.** Proving who somebody is. The sign-in step. *"Are you really
Sam?"*

**Authorisation.** Deciding what that person may see. *"Sam is Sam, but may Sam
read **this** note?"*

> Those last two get confused constantly, and confusing them is the most common
> way an app like this leaks. Authentication is the front door. Authorisation is
> which rooms you may enter once you are inside.

---

## Step 3 — Pick your stack

| Option | Good for | The cost |
|---|---|---|
| **Managed backend with row-level rules** — Supabase, Firebase, Appwrite, Pocketbase | Almost everyone, and the only sane choice if you stayed static | You learn one product's way of writing rules |
| **Your own API** — Node, Python, Go, PHP + any database | You already run a server, or you need Option B anyway | You write and maintain everything, including auth |
| **A spreadsheet or low-code tool** — Airtable, NocoDB | Very small groups, non-sensitive data only | Weak permissions. Not suitable for private notes about people |

The examples below use **Postgres with row-level rules**, because it is the most
common shape and the SQL reads clearly enough to translate. Nothing in the app
depends on that choice.

---

## Step 4 — The tables this app needs

The app already tells you exactly what it needs: `lib/types.ts` is every shape
in one file, and `StoreApi` in `lib/store.tsx` is every operation.

> **These examples are illustrative and have not been run against a live
> database.** Adapt them; do not paste them blind. Create the tables in the
> order shown, because each one references the tables above it.

```sql
-- Everybody. One row per person, exactly like lib/types.ts Person.
create table people (
  id           uuid primary key,                -- same id as their account
  name         text not null check (length(name) between 1 and 80),
  role         text not null check (role in ('coordinator','guide','member')),
  guide_id     uuid references people(id),      -- members only; who supports them
  stage_index  int  not null default 0 check (stage_index >= 0),
  created_at   timestamptz not null default now()
);

-- A guide's private notes about a member. Nobody else ever reads these.
create table notes (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references people(id),
  subject_id   uuid not null references people(id),
  body         text not null check (length(body) between 1 and 500),
  created_at   timestamptz not null default now()
);

-- A conversation between two people.
create table messages (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references people(id),
  participant_id uuid not null references people(id),
  body           text not null check (length(body) between 1 and 500),
  created_at     timestamptz not null default now()
);

-- A request for support. May be shared with the group without the name.
create table support_requests (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references people(id),
  body              text not null check (length(body) between 1 and 500),
  share_anonymously boolean not null default false,
  created_at        timestamptz not null default now()
);
```

Notice the `check` constraints. They are the same limits `lib/store-data.mjs`
already enforces in the browser — 80 characters for a name, 500 for a body.
**Put them in the database too.** Browser limits are a courtesy to honest users;
database limits are the actual rule.

---

## Step 5 — Three fields that need to change shape

This one catches everybody, so it gets its own step.

Three fields on the demo store are **implicitly "the current person's"**,
because the demo only ever has one person signed in:

```ts
// lib/types.ts — today
export interface Store {
  people: Person[];
  completed_task_ids: string[];   // ← whose?
  saved_resource_ids: string[];   // ← whose?
  notes: Note[];
  messages: Message[];
  support_requests: SupportRequest[];
  preferences: Preferences;       // ← whose?
}
```

With one user that is fine. With two it is a bug: everybody would share one set
of completed tasks, one shelf of saved resources, and one text-size setting.

In the database they become **per person**:

```sql
create table completed_tasks (
  person_id  uuid not null references people(id),
  task_id    text not null,
  done_at    timestamptz not null default now(),
  primary key (person_id, task_id)
);

create table saved_resources (
  person_id    uuid not null references people(id),
  resource_id  text not null,
  primary key (person_id, resource_id)
);

create table preferences (
  person_id        uuid primary key references people(id),
  text_size        text not null default 'normal',
  motion           text not null default 'full',
  workspace_theme  text not null default 'desk'
);
```

Your adapter then loads only the signed-in person's rows into those three
fields, and the shape the screens see is unchanged. **The interface does not
change; only what fills it does.**

---

## Step 6 — Accounts

Use your backend's built-in authentication. Do not write your own — password
hashing, sessions and reset flows are solved problems where a subtle mistake is
expensive.

The app has no accounts today: `signInAs(id)` picks a sample person. You are
replacing that with a real sign-in.

```ts
// Before — lib/store.tsx
signInAs: (id) => setCurrentId(id),

// After — your adapter
signInAs: async (email, password) => {
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) return;
  await loadEverythingFor(data.user.id);
},
```

**Every account needs a matching `people` row**, with the same id. Create it
when the account is created, using a database trigger so it cannot be forgotten:

```sql
create or replace function handle_new_account()
returns trigger language plpgsql security definer as $$
begin
  insert into public.people (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New member'), 'member');
  return new;
end $$;

create trigger on_account_created
  after insert on auth.users
  for each row execute function handle_new_account();
```

Note `role` is hard-coded to `'member'`. **A new account must never be able to
choose its own role.** A coordinator promotes people afterwards.

---

## Step 7 — The permission rules

This is where the group's trust is kept or lost, so read it twice.

Every screen already hides things properly. **That is not protection.** Hiding a
button stops somebody clicking it; it does not stop them asking your database
directly, and asking your database directly is about as hard as opening the
developer tools.

So the rules live **with the data**, where every route into it meets them —
including a screen somebody adds next year without reading this file.

### Open Beacon's six promises

| Promise | Rule |
|---|---|
| A guide sees only their own members | `people` readable when `guide_id` is you, or it is you |
| A coordinator sees everyone | plus a role check |
| Private notes are private to their author | `notes` readable only when `author_id` is you |
| A conversation belongs to its two people | `messages` readable only when you are one of them |
| An anonymous request shows no name | the name is never sent, not merely hidden |
| Nobody changes their own role | `role` is never accepted from the client |

### The SQL

```sql
alter table people           enable row level security;
alter table notes            enable row level security;
alter table messages         enable row level security;
alter table support_requests enable row level security;

-- Yourself, the people you support, and your own guide.
create policy "people i may see" on people
for select using (
  id = auth.uid()
  or guide_id = auth.uid()
  or exists (select 1 from people me
             where me.id = auth.uid() and me.role = 'coordinator')
);

-- Private notes: the author, and nobody else. No coordinator exception.
create policy "own notes" on notes
for all using (author_id = auth.uid())
with check (author_id = auth.uid());

-- A conversation is visible to exactly the two people in it.
create policy "own conversation" on messages
for select using (
  author_id = auth.uid() or participant_id = auth.uid()
);

-- And you may only ever send as yourself.
create policy "send as self" on messages
for insert with check (author_id = auth.uid());
```

### Anonymous means anonymous

"Shared anonymously" must not be a display decision. If the name is in the row
and the screen hides it, anybody reading the data sees it.

```sql
-- The group reads this view, never the table.
create view community_requests as
select
  id,
  case when share_anonymously then null else person_id end as person_id,
  body,
  created_at
from support_requests;
```

Now the name is **absent**, not hidden.

### Pin the role

```sql
create policy "update own profile" on people
for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function pin_role()
returns trigger language plpgsql as $$
begin
  new.role     := old.role;      -- whatever was sent, ignore it
  new.guide_id := old.guide_id;
  return new;
end $$;

create trigger people_pin_role
  before update on people
  for each row execute function pin_role();
```

A request setting `role = 'coordinator'` now succeeds and changes nothing —
which is what you want, because an error tells an attacker they found the lever.

### Prove the rules

Write a script that signs in as a **second guide** and tries to read the first
one's notes. It must return zero rows.

Reading a policy and believing it is not the same as watching it refuse. Do this
once per promise and keep the script; it is what you re-run after any change.

---

## Step 8 — Write the adapter

Now the part that is smaller than people expect.

`StoreApi` in `lib/store.tsx` is the complete contract — **17 members**. Satisfy
it and every screen works untouched.

```tsx
// lib/backend/provider.tsx
'use client';

import { StoreContext, type StoreApi } from '@/lib/store';

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const value: StoreApi = useMyBackend();          // ← you write this
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
```

Then in `app/layout.tsx`, swap `<StoreProvider>` for `<BackendProvider>`. That
is the whole integration.

**Type your object as `StoreApi` and the compiler becomes your checklist.** It
names every function you have not written yet — far better than finding them one
broken screen at a time.

### A sensible order

1. **`store` and `current`** — load the data, set the signed-in person. Every
   screen renders read-only and you can look at all of them.
2. **`signInAs` / `signOut`.**
3. **The core writes** — `sendMessage`, `addNote`, `advance`.
4. **Everything else**, as each screen needs it.

**Keep `StoreProvider` while you do this.** Being able to switch back to the
built-in store is how you tell "my backend is wrong" from "the app is wrong",
and you will want that distinction.

---

## Step 9 — The write pattern that keeps it offline-first

**This is the step that decides whether your version still feels like this app.**

Look closely at the contract:

```ts
addNote: (subjectId: string, body: string) => boolean;
```

It returns `boolean`, not `Promise<boolean>`. That is deliberate. `true` means
*accepted and shown*, not *stored on a server*. The screens call it and update
immediately.

If you make people wait for a network round trip before their note appears, you
have thrown away the thing that made this app worth adopting — it works on a bad
connection, and it works on no connection.

So: **validate now, show now, send in the background, reconcile after.**

```tsx
const addNote: StoreApi['addNote'] = (subjectId, body) => {
  const clean = body.trim();

  // 1. Validate synchronously. Same rules as lib/store-data.mjs.
  if (!clean || clean.length > 500 || !isSafeId(subjectId)) return false;

  const note = {
    id: crypto.randomUUID(),
    author_id: current.id,
    subject_id: subjectId,
    body: clean,
  };

  // 2. Show it immediately. This is what makes the app feel instant.
  setStore((s) => ({ ...s, notes: [...s.notes, note] }));

  // 3. Send it. Deliberately not awaited — the caller already has its answer.
  db.from('notes')
    .insert(note)
    .then(({ error }) => {
      if (!error) return;
      // 4. It failed. Put it in the outbox and tell the person quietly.
      //    Do NOT silently drop it: somebody took the trouble to write it.
      queue.add(note);
      setStore((s) => ({
        ...s,
        notes: s.notes.map((n) => (n.id === note.id ? { ...n, pending: true } : n)),
      }));
    });

  return true;   // accepted, and on screen
};
```

The four rules that make this safe:

1. **Generate the id on the client.** Then a retry is the same note, not a
   second one, and your database can reject the duplicate by primary key.
2. **Never lose the write.** A failure goes to an outbox and is retried when the
   connection returns. Dropping it silently is the one unforgivable outcome.
3. **Show pending state honestly.** A small mark on an unsent item is better
   than pretending everything is saved.
4. **Reconcile on reload.** When you next load from the server, the server wins
   — except for anything still in the outbox.

Same shape for `sendMessage`, `addSupportRequest`, and `advance`.

---

## Step 10 — Deploy

**If you stayed static (Option A).** `npm run build` produces `out/`. Put those
files on any static host. The only key in the bundle must be the publishable
one.

**If you added a server (Option B).** Deploy anywhere that runs Node. Keep
powerful keys in server environment variables — never in code that reaches the
browser.

**Both:** serve it over HTTPS, and if you set a Content-Security-Policy, add
your backend's origin to `connect-src` and nowhere else. Widening `default-src`
instead is the usual shortcut and gives away every other protection at once.

One repository check to know about: `tests/security-invariants.mjs` refuses a
`migrations/` directory, because this public repository deliberately does not
carry one organisation's schema. **Keep your schema in your own deployment
repository**, not in a fork of this one that you intend to share.

---

## Step 11 — Before real people

Every line here is here because skipping it has hurt somebody.

- [ ] A second guide, properly signed in, reads **zero** of the first guide's
      notes. Proven with a script, not by reading the policy.
- [ ] A member cannot read another member's messages.
- [ ] An anonymous community request contains **no** person id — checked in the
      raw data, not on the screen.
- [ ] An update containing `role: "coordinator"` changes nothing.
- [ ] The powerful key appears nowhere in the built output. Search `out/` for it.
- [ ] Length limits exist in the database, not only in the browser.
- [ ] A write that fails while offline is retried, not lost. Test with the
      network off.
- [ ] A retried write does not create a duplicate.
- [ ] You have a backup, and you have restored from it once. An untested backup
      is a rumour.
- [ ] Somebody other than you can reach the database in an emergency.
- [ ] Sign-out actually clears the local copy of other people's data.
- [ ] You have told the group, in plain words, what is stored and who can see it.
- [ ] `npm test` still passes, including `tests/backend-seam.mjs`.
- [ ] Your README says whether you are Option A or Option B.
- [ ] The sample people are gone, or clearly separated from real ones.
- [ ] You have read [SECURITY.md](../SECURITY.md).

---

## Common mistakes

**Putting the rules in the screens.** The screens decide what to *show*. The
database decides what somebody is *allowed to have*.

**Awaiting the network before showing the change.** You lose offline-first, and
with it the reason to use this app.

**Server-generated ids.** Retries become duplicates. Generate on the client.

**Hiding a name instead of not sending it.** Anonymous means absent.

**Testing only as a coordinator.** Coordinators see everything, so everything
looks right. Test as an ordinary member.

**Leaving the three single-user fields shared.** Step 5. Everyone ends up with
one text size and one set of completed tasks.

**Deleting people.** Mark them inactive. Other rows point at them, and the group
needs its history.

---

## Where to look when stuck

| You want | Look at |
|---|---|
| Every shape the app uses | `lib/types.ts` |
| Every operation the app can do | `StoreApi` in `lib/store.tsx` |
| The limits to mirror in your database | `lib/store-data.mjs` |
| How the pieces fit together | [GUIDE.md](./GUIDE.md) |
| What you become responsible for | [SECURITY.md](../SECURITY.md) |
| Proof the seam is still open | `tests/backend-seam.mjs` |

If you build an adapter for a backend not covered here, consider contributing
it. A working Firebase or Pocketbase example would save the next group weeks.
