# Open Beacon

**An offline-first app for supporting people through a journey — a coordinator
overseeing the whole group, guides walking with the people assigned to them, and
members working through their own next steps.**

It is a complete, working application. Every feature runs today: people,
journeys, private notes, messages, community requests, a searchable learning
shelf, a focus timer and local ambience. Clone it, start it, and you are looking
at a working group.

**Bring your own backend, or bring none at all.**

| | |
|---|---|
| **Run it as it ships** | Everything lives in your browser. No sign-up, no database, no configuration, nothing to breach. Ideal for one person, for training, or for deciding whether this fits. |
| **Run it for real** | Connect your own database and it becomes a multi-user app on shared data. Which backend, and where it runs, is entirely your choice — this project deliberately does not pick one. |

> **Making it real: [docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md).** Eleven
> steps with a worked example at each one — the tables, accounts, the permission
> rules, the adapter, and the write pattern that keeps it working offline. No
> backend experience assumed.
>
> **Understanding it: [docs/GUIDE.md](docs/GUIDE.md).** The long version of this
> README, with a glossary that assumes no prior knowledge.

## What you get

- One shared data model serving three role-specific views.
- A coordinator who can see the full journey and reassign people.
- Guides supporting an assigned group with plans, private notes and messages.
- A member's personal room: next steps, a focus timer, optional ambient sound.
- Community requests that stay private or are shared **anonymously** by choice.
- A searchable learning shelf you can adapt without adding a remote service.
- Real offline support: a service worker that never caches private or unrelated
  requests.
- Untrusted browser storage validated before the app ever uses it.

## Honest boundaries

**As it ships, this is not an authentication or authorisation system.** Choosing
a role changes the interface; it does not prove identity. Anybody can pick any
role. That is correct for a single-device app with fictional people, and it is
why it is safe to hand to anyone.

**Use only fictional or non-confidential data until you have connected a
backend.** The moment real people are involved you need server-side
authentication, authorisation, secure storage and a security review — all of
which are your responsibility, and all of which
[docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md) walks you through.

Two things to delete before real users, listed here so they are not missed: the
role picker on the sign-in screen, and the sample people.

## Reusable pieces

These are the parts most worth stealing. Each is dependency-free, unit tested,
and carries its reasoning in the file — including what it deliberately does not
promise.

| Module | What it solves | The non-obvious part |
|---|---|---|
| `lib/normalize.ts` | A saved state written by an older version of your app must still open in a newer one. | Derive the schema from the seed, never from a hand-written list. The list is a second place that has to be kept in step from memory, and it will be forgotten. |
| `lib/rate-limit.mjs` | Bound a public write endpoint, and bound the email or webhooks it triggers. | Key it on something the caller cannot rotate for free, and never count refused attempts — that turns a cooling-off period into a lockout the attacker controls. |
| `lib/trend.ts` | Show whether there is more happening than there was, rather than a total that only goes up. | The bucket in progress is marked, empty buckets are kept, and growth from zero returns `null` instead of claiming "up 100%". |
| `components/TrendChart.tsx` | A readable bar chart in about eighty lines of SVG. | No charting library. Eight rectangles do not need sixty kilobytes of JavaScript, and the reader learns more from the rectangles. |
| `lib/url.ts` | Stop a URL somebody typed becoming executable when it is rendered as a link. | An anchored allowlist of two schemes. A denylist of bad schemes never hears about the next one. |

Run `npm test` to see them checked. The tests are as much of the documentation as
the code is: each assertion names the failure it exists to prevent.

### What is deliberately not here

**No database schema, access-control policies, credentials or real user data**,
and none of those will be accepted as contributions.

That is not the same as leaving you stranded. The
[build guide](docs/BUILD-YOUR-OWN.md) gives you a complete worked schema and a
complete set of rules to adapt. The difference is that they are **yours**, in your own
deployment, rather than one organisation's real configuration published for
everybody. A published schema is a map of that system for an attacker, and a
copied one gives another team a false sense that their authorisation is solved.

See [SECURITY.md](SECURITY.md) for the reasoning. A test enforces it, so the
boundary is a promise rather than an intention.

---

## The three roles

Saved data is bounded, validated, and normalized before use. Invalid data is
discarded and replaced with the included sample.

Messages, notes, requests, progress, preferences, and saved resources are
simulations stored only in the current browser. Mini Orbit creates its ambient
sound inside the browser and does not fetch, record, or upload audio.

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

## Run locally

```text
npm ci
npm run dev
```

The development server accepts connections from this device only. Follow the
terminal prompt to open it.

## Verify

```text
npm test
npm run build
npm audit
```

The production build creates an `out` directory containing static files. Those
files can be served locally or by any platform that supports static web assets.
No platform-specific adapter is required.

## Project map

```text
app/
  layout.tsx             Application shell and metadata
  page.tsx               Role selection and journey introduction
  dashboard/page.tsx     Coordinator, guide, and member workspaces
  globals.css            Visual system and responsive layout
components/
  Brand.tsx              Open Beacon mark and name
  FeatureViews.tsx       People, community, library, messages, and settings
  JourneyBar.tsx         Accessible journey progress
  MiniOrbit.tsx          Local ambient sound and focus timer
  RoleOverview.tsx       Role-specific overview panels
  ServiceWorker.tsx      Offline worker registration
  WorkspaceShell.tsx     Shared navigation and workspace layout
lib/
  content.ts             Learning resources, tasks, and announcements
  journey.ts             Journey stages
  seed.ts                Fictional sample data
  store-data.mjs         Browser-storage validation
  store.tsx              Local state and persistence
  types.ts               Shared data types
public/
  icon.svg               Application icon
  manifest.webmanifest   Installable-app metadata
  sw.js                  Same-origin public asset cache
tests/
  store-data.test.mjs    Storage-boundary regression tests
```

## Adapt the sample

Journey stages, resources, tasks, and announcements live in small content files.
Fictional people live in the seed file. Change those inputs first, then adjust a
role view only when your model genuinely needs different behaviour.

## Connect your own backend

One property makes this app adoptable rather than only readable: **no screen
touches storage.** Every screen calls `useStore()`, so there is exactly one
place data comes from, and replacing it replaces everything.

Three exports are the whole seam:

```tsx
import { StoreContext, type StoreApi } from '@/lib/store';

function BackendProvider({ children }: { children: React.ReactNode }) {
  const value: StoreApi = useMyBackend();   // TypeScript lists what is missing
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
```

Swap `<StoreProvider>` for that in `app/layout.tsx` and every screen keeps
working, because no screen knows the difference. `tests/backend-seam.mjs`
fails the build if that property is ever lost.

**Full instructions, with a worked example at every step:
[docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md).**

Keep confidential data out of browser storage until that server-side trust
boundary exists — not after.

## License

Open Beacon is available under the MIT License.
