# Open Beacon

Open Beacon is an offline-first learning application for exploring a
role-based support journey. It uses fictional sample people and runs entirely
in the browser.

There is no backend, account system, analytics, or remote data store. Progress
is kept in browser storage and can be reset at any time.

## What it teaches

- One shared data model can support several role-specific views.
- A coordinator can see the full journey.
- A guide can support an assigned group with plans, notes, and local messages.
- A member can use a personal room with next steps, a focus timer, and optional
  ambient sound.
- Community requests can stay private or be shared anonymously by choice.
- A searchable learning shelf can be adapted without adding a remote service.
- Untrusted browser storage should be validated before an application uses it.
- A service worker can provide limited offline support without caching private
  or unrelated requests.

## Privacy and security boundaries

Open Beacon is a local educational application, not an authentication or
authorization system. Role selection changes the interface but does not prove
identity.

Use only fictional or non-confidential data. A real multi-user deployment needs
server-side authentication, authorization, secure storage, audit controls, and
a separate security review.

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

This project is the reusable part of a larger private application. Database
schema, access-control policies, credentials and real user data are not in this
repository and will not be accepted as contributions — see
[SECURITY.md](SECURITY.md) for the boundary and the reasoning. A test enforces
it, so the boundary is a promise rather than an intention.

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

Journey stages, resources, tasks, and announcements live in small content
files. Fictional people live in the seed file. Change those inputs first, then
adjust a role view only when the learning model requires different behavior.

Keep confidential data out of browser storage. If the project grows beyond a
single-device sample, establish a server-side trust boundary before adding real
people or permissions.

## License

Open Beacon is available under the MIT License.
