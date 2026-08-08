# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Open a private
report through GitHub's [Security Advisories](https://github.com/Klydo131/Open-Beacon/security/advisories/new)
tab on this repository, which is visible only to the maintainers until a fix is
published.

Please include:

- what an attacker can do, stated as an outcome ("any visitor can read X"),
- the smallest set of steps that reproduces it,
- the commit or version you tested.

You will get an acknowledgement within **7 days**. There is no bounty programme;
this is a small open project maintained in spare time, and we would rather be
honest about that than imply a response time nobody can hold to.

## What is in this repository, and what is deliberately not

Open Beacon is a **teaching project**. It is the reusable, non-sensitive part of
a larger private application, extracted on purpose so other developers can use
the parts that generalise.

**What is here.** Client-side building blocks with no server component: an
offline-first store, a rate limiter, trend maths, a URL guard, and the UI that
sits on top of them. All of it runs in the browser or in a stateless route.

**What is deliberately not here, and will not be accepted as a contribution:**

| Not here | Why |
|---|---|
| Database schema, migrations, Row Level Security policies | These encode one organisation's data model and access rules. Published, they are a map of that system for an attacker, and copied, they give another team a false sense that their authorisation is solved. |
| Any credential, key, token or connection string | Including in examples. `.env.example` names settings and fills none of them in, and a test enforces that. |
| Real user data of any kind | The sample data is fiction and must stay fiction. Names and addresses use the reserved `.example` and `.test` domains, which can never resolve to a real inbox. |
| Operational detail of the private deployment | Hostnames, project identifiers, inbox addresses, webhook URLs, monitoring endpoints. |

If you are extracting something from a private codebase into this one, the test
to apply is not "does this contain a secret" but **"does this describe how one
particular organisation's system is defended"**. The first is obvious and rare;
the second is subtle and common.

## Security model of the application

- No backend, account service, analytics, or remote data store is included.
- Role selection is a demonstration interface, not identity verification.
- Browser-stored data is bounded and validated before use.
- Imported local backups pass through the same validation boundary.
- Notes, messages, and support requests remain on the current device.
- Community sharing is optional and removes the sample person's name.
- Mini Orbit synthesizes audio locally without network or microphone access.
- The offline worker handles only same-origin navigation and public assets.
- Production output is static and does not require server-side secrets.
- The included development command binds to the current device only.

Do not place confidential, personal, pastoral, financial, health, or credential
data in this application.

## Security model of the shared modules

Be clear about what these modules do and do not promise, because using one
against the wrong threat is worse than not using it.

### `lib/rate-limit.mjs`

- **Does:** bound how often a single caller can reach an endpoint, and bound how
  much outbound work (email, webhooks) any one instance can generate. Keyed on
  the address the proxy reports, not on something the caller supplies.
- **Does not:** survive a cold start or coordinate between serverless instances.
  Memory is per instance. For a hard guarantee, move the same logic to your
  database or to Redis, where the state is shared.
- **Fails closed:** a request with no trustworthy address is put in one shared,
  stricter bucket rather than waved through, so suppressing a header is not a
  bypass.

### `lib/url.ts`

- **Does:** stop a stored `javascript:` or `data:` URL becoming a clickable link.
- **Does not:** validate that a link is safe to *visit*. An `https://` URL to a
  hostile site passes, because it is a legitimate URL. Use `rel="noopener
  noreferrer"` and `target="_blank"` on rendered links, as this project does.

### `lib/normalize.ts`

- **Does:** stop a saved state written by an older version from crashing a newer
  one, which is an availability property rather than a confidentiality one.
- **Does not:** validate content. Data from `localStorage` is user-controlled and
  should be treated as untrusted before it is rendered or sent anywhere.

### The app itself

There is **no backend, no accounts and no network calls**. Everything is in the
browser. That is the main reason this demo is safe to run: there is nothing to
breach. If you add a server, the guarantees above stop being the whole picture
and you own the rest.

## Deployment responsibility

Static hosting configuration, transport security, browser security headers, and
domain controls belong to the deployer. A multi-user adaptation requires
server-side authentication and authorization before it can protect real data.

## Supported versions

The `main` branch is the only supported version. Fixes land there; there are no
backports.
