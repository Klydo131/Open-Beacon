# Open Beacon

A tiny, open-source demo of an **offline-first, role-based journey tracker** —
built to be read, run, and learned from.

There is **no backend, no accounts, and no tracking**. The whole app runs in the
browser: sample data lives in `localStorage`, so you can open it, click around
as three different roles, and watch state persist across refreshes — with
nothing to install on a server.

> This is a **teaching project**, not a product. It's meant to show one clean way
> to structure a small role-based app. Fork it, rename it, and make it yours.

---

## What it demonstrates

- **Next.js (App Router) + React + TypeScript** with no UI framework — just
  plain CSS, so nothing hides how it works.
- **An offline-first store** (`lib/store.tsx`): a React context backed by
  `localStorage`, including the small-but-important trick of *gating render until
  hydration* to avoid server/client mismatch.
- **Role-based UI**: the same app shows a different view to a **Coordinator**, a
  **Guide**, and a **Member** — all from one data model.
- **A simple journey model** (`lib/journey.ts`): a linear set of stages a member
  moves through, easy to swap for your own steps.
- **PWA basics**: a web manifest and a minimal service worker so the app is
  installable and works offline.

## The three roles

| Role | Sees | Can do |
|------|------|--------|
| **Coordinator** | The whole program — how many people are at each stage | Get the big picture |
| **Guide** | Only the members assigned to them | Move a member to the next stage |
| **Member** | Their own journey | Follow their progress |

## The journey

Five neutral, configurable stages — **Start → Connect → Grow → Apply →
Complete**. Change the labels, colors, or number of stages in one place
(`lib/journey.ts`) and the whole app follows.

---

## Run it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and pick a role.

To build for production:

```bash
npm run build
npm start
```

Because it's just a static-ish Next.js app with no backend, it deploys to any
Node or static host.

---

## How it's organized

```
app/
  layout.tsx        # app shell + PWA registration
  page.tsx          # landing: pick a role to explore
  dashboard/page.tsx# role-aware dashboard (coordinator / guide / member)
  globals.css       # all styling (plain CSS)
lib/
  store.tsx         # offline-first localStorage store (the core idea)
  types.ts          # the data model (three roles, one list of people)
  seed.ts           # fictional sample data
  journey.ts        # the configurable stages
components/
  JourneyBar.tsx    # the progress bar
  ServiceWorker.tsx # registers the service worker
public/
  manifest.webmanifest, sw.js, icon.svg
```

## Make it your own

- **Change the stages** → edit `lib/journey.ts`.
- **Change the roles or data** → edit `lib/types.ts` and `lib/seed.ts`.
- **Add persistence to a real backend** → the store is the only place that
  touches storage; swap `localStorage` for your API of choice and the rest of
  the app is unaffected.

## License

[MIT](./LICENSE) — do anything you like with it.
