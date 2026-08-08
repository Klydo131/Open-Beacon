# Contributing to Open Beacon

Thank you for looking. This is a small, deliberately readable project, and the
bar for a change is not "does it work" but **"will the next person understand why
it is like that"**.

## Before you start

Open Beacon is a teaching project extracted from a larger private application.
That shapes what belongs here:

- **In scope:** things that generalise. A store that survives its own schema
  changing, a rate limiter with honest limits, trend maths that refuses to lie,
  UI patterns that work on a cheap phone.
- **Out of scope:** anything specific to one organisation's deployment — schemas,
  access policies, hostnames, credentials, real data. See [SECURITY.md](SECURITY.md)
  for the boundary and the reasoning behind it.

If you are unsure whether an idea is in scope, open an issue and ask before
writing the code. It is a cheaper conversation than a closed pull request.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # the whole check suite, no browser needed
```

Requires **Node 22 or newer**. The tests import TypeScript directly, relying on
Node's native type stripping, so there is no build step between the code that
ships and the code that is checked.

## The house style

These are not arbitrary preferences. Each one exists because its absence cost
somebody a day.

**Comments explain *why*, never *what*.** The code already says what it does. A
comment earns its place by recording the thing that is not in the code: the bug
that made this necessary, the obvious alternative and why it failed, the
constraint that looks like a style choice. If a comment would be obsolete after a
rename, delete it.

**Every non-obvious decision gets its reason written down.** "Fail closed here"
is a note. "Fail closed here, because treating a missing header as an exemption
means suppressing the header is the bypass" is documentation.

**No new dependencies without a strong reason.** This project ships React, Next
and nothing else on purpose. A chart is eight rectangles and some arithmetic; it
does not need sixty kilobytes of library, and a reader learns more from the
rectangles. If you genuinely need a dependency, say in the pull request what you
tried without it.

**Tests assert behaviour, not shape.** A test that passes because it found the
string it was looking for somewhere on the page is worse than no test: it reports
green and covers nothing. Prefer an explicit hook (`data-*`) over "the last
element containing these words".

**Make your test fail first.** Before you trust a new test, break the code it
covers and watch it go red. A surprising amount of test code has never once
failed, and a test that cannot fail is a comment with a run time.

## Pull requests

1. Branch from `main`.
2. `npm test` must pass. CI runs the same command on Node 22.
3. Keep the change to one idea. Two ideas are two pull requests.
4. In the description, say what problem this solves and what you rejected. If you
   found a bug while writing it, say so — that is the most useful sentence in the
   whole PR.

Commit messages: a short subject line in the imperative, then a body explaining
the reasoning. Long bodies are welcome. `fix bug` is not.

## Reporting a bug

Open an issue with what you expected, what happened, and the smallest way to
reproduce it. Say which browser and whether the app had been used before on that
device — that last detail matters more than it sounds, because a whole class of
offline-first bug only ever affects returning users.

**Security problems do not go in issues.** See [SECURITY.md](SECURITY.md).

## Licence

By contributing you agree that your contribution is licensed under the
[MIT Licence](LICENSE), the same as the rest of the project.
