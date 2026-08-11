# Open Beacon — A Technical Guide

Written for anyone who has to work on Open Beacon, decide whether to use a piece
of it, or explain it to somebody else. No prior knowledge of this project is
assumed, and **every technical term is explained in ordinary words the first
time it appears.**

---

## Contents

| Part | What it covers |
|---|---|
| [One — What this is](#part-one--what-this-is) | The one-paragraph version, the problem it solves, what it deliberately is not, and how to run it |
| [Two — Plain words first](#part-two--plain-words-first) | Every difficult term in this guide, explained with no jargon, before it is used |
| [Three — The five modules](#part-three--the-five-modules) | The reusable pieces, one chapter each: the bug, the wrong fix, the right fix, and what each does not promise |
| [Four — How the app fits together](#part-four--how-the-app-fits-together) | The map, where data comes from and goes, the three role views, offline behaviour |
| [Five — Security](#part-five--security) | The model, the boundary, what is refused as a contribution, and the honest limits |
| [Six — Testing](#part-six--testing) | What each suite proves, what CI does, and the exit-code trap that made CI necessary |
| [Seven — Using it in your own project](#part-seven--using-it-in-your-own-project) | Taking one module, changing the sample, adapting the roles |
| [Eight — Running and deploying](#part-eight--running-and-deploying) | Requirements, commands, static output, what the deployer owns |
| [Appendix A — Glossary](#appendix-a--glossary) | Every complex term in one alphabetical list |
| [Appendix B — Module reference](#appendix-b--module-reference) | Signatures, guarantees, and non-guarantees at a glance |
| [Appendix C — How this guide was checked](#appendix-c--how-this-guide-was-checked) | What was run, what was read, and what is unverified |

### How to read this

**If you have ten minutes**, read Part One. It is the whole idea.

**If a word stops you**, Part Two and Appendix A both explain it. Part Two
explains terms in the order you will meet them, with an everyday comparison for
each. Appendix A is the same terms alphabetically, for looking one up in a hurry.
Nothing here assumes you already know what a service worker is, or what
"offline-first" means, or why anyone would care about a schema.

**If you came for one module**, go straight to its chapter in Part Three. Each is
self-contained and ends with a section headed *What this does not promise*, which
is the part worth reading twice.

**If you are deciding whether to trust this in a real product**, read Part Five
and Part Three's non-guarantee sections. They are written to be useful rather
than reassuring.

A note on honesty. This guide says plainly what has not been tested and what each
piece refuses to do. Those parts are not fine print at the back; they are in the
same type as everything else, because a module used against the wrong problem is
worse than no module at all.

---

## Part One — What this is

### The one-paragraph version

Open Beacon is a small web application that shows how one shared set of data can
serve three different kinds of user, each seeing a different screen built from
the same information. It runs entirely inside a web browser. There is no server,
no sign-up, no database and no tracking of any kind, and the people in it are
invented. Its real purpose is to be read: it is the reusable part of a larger
private application, published so that other developers can take the pieces that
generalise and see the reasoning behind them.

### The problem it exists to solve

Most example projects teach you the shape of a thing and none of the trouble.
They show a working screen and leave out the four hours somebody lost to the
reason it is written that way. So the pattern gets copied without the reasoning,
and the same bug is rediscovered in the next project, and the one after that.

Open Beacon is an attempt at the opposite. Every module in it carries, in the
file itself, the failure that produced its current shape. Not "this function
normalises saved data", but "an app once shipped an update that crashed for every
returning user, no test caught it because every test starts in a clean browser,
and here is why the obvious fix does not hold either."

That is the product. The application around it is a way of making the modules run,
and a way of showing that they work together.

### What it is, concretely

- A web app with three roles: **Coordinator**, **Guide**, and **Member**.
- Seven invented people, moving through a five-stage journey.
- Five modules worth copying into other projects, each dependency-free and unit
  tested.
- Around 4,700 lines of code in total, of which a large fraction is explanatory
  comment, on purpose.
- No backend of any kind. Nothing leaves the browser.

### What it deliberately is not

This matters more than the feature list, because using it as something it is not
is the way it could actually hurt somebody.

| It is not | Because |
|---|---|
| A login or permissions system | Choosing a role changes what the screen shows. It does not prove who you are. Anyone can pick any role. There is no password, and nothing to check one against. |
| A product | It is a teaching project. No support, no roadmap, no promise of stability beyond the `main` branch. |
| A place for real data | The sample people are fiction and must stay fiction. Do not put anybody's real name, health, financial, pastoral or personal details into it. |
| A distributed rate limiter | The rate limiter bounds one running copy of a server. It does not coordinate between several. Part Three explains exactly where that line falls. |
| A complete security story | There is nothing to breach because there is no server. Add a server and every guarantee in this document stops being the whole picture. |

### The three roles

The roles are deliberately generic. They are not church roles, or medical roles,
or school roles; they are the shape those all share, so the code can be lifted
into any of them.

| Role | Sees | The point of it |
|---|---|---|
| **Coordinator** | Everyone, and the whole journey | The overview: who is where, who is supporting whom, and where the group as a whole has got to. |
| **Guide** | Only the members assigned to them | The working view: conversations, plans, private notes about the people they support, and nobody else's. |
| **Member** | Their own room | Their next steps, their own progress, a focus timer, optional ambient sound, and a way to ask for help. |

The important property is that all three are built from **one** set of data. There
is no separate "coordinator database". Each view is a different question asked of
the same records, which is the thing the project is demonstrating.

### The journey

A member moves through five stages, in order. The labels are placeholders and are
meant to be replaced.

| Stage | Meaning |
|---|---|
| **Start** | Set a clear direction |
| **Connect** | Build a trusted connection |
| **Grow** | Learn through steady practice |
| **Apply** | Put learning into action |
| **Complete** | Reflect and help another |

The last stage turns the shape around: it ends with the person who was being
supported beginning to support somebody else. If you are adapting this project,
these five labels live in one small file, `lib/journey.ts`, and changing them is
the first thing most people will want to do.

### Running it

You need **Node.js 20.9 or newer** and **npm 10 or newer**. Node.js is the program
that runs JavaScript outside a browser; npm comes with it and installs the
libraries a project depends on.

```bash
npm ci      # install exactly the versions this was tested with
npm run dev # start it, then open the address the terminal prints
npm test    # run every check
```

The development server binds to `127.0.0.1`, which means it accepts connections
from your own computer only, and not from anything else on your network. That is
a deliberate default rather than an oversight.

---

## Part Two — Plain words first

This part exists because the rest of the guide would otherwise assume things. Each
entry gives the everyday meaning, then why it matters in Open Beacon specifically.
Appendix A repeats these alphabetically for quick lookup.

### Terms about where things run

#### Client and server

A **server** is a computer somewhere else that holds data and answers requests. A
**client** is the program in front of you asking the questions — here, your web
browser.

Most web apps are both: the browser draws the screen, the server keeps the data.
**Open Beacon has no server at all.** Everything happens in your browser, on your
device. That single fact explains most of the design decisions in this document,
including why it is safe to hand to a stranger.

#### The browser's storage, and `localStorage`

Your browser can keep small amounts of information on your own device, so that
closing the tab does not lose it. The simplest form of this is called
**`localStorage`**: a list of named values, saved as text, that survives closing
the browser.

Think of it as a notepad kept in the browser, one per website. It is not shared
with anybody, it is not sent anywhere by itself, and the person using the browser
can read and edit it freely with the developer tools. That last point is important
and comes back in Part Three: **anything in `localStorage` is data the user
controls**, so a careful application treats it as untrusted even though the
application wrote it.

#### Offline-first

An ordinary web app stops working when the connection drops, because it needs to
ask a server for everything. An **offline-first** app is built the other way
round: it works from what is already on the device, and treats the network as a
bonus rather than a requirement.

Open Beacon is offline-first in the strongest possible sense — there is no network
step to lose.

#### Service worker

A **service worker** is a small script the browser keeps running in the background
for a website, separate from any open tab. Its main job is to sit between the page
and the network so it can answer requests from a local copy when the network is
unavailable.

The everyday comparison: a receptionist who keeps photocopies of the documents
people ask for most. When the filing room is locked, they can still hand you the
copy.

Service workers are powerful and therefore easy to get wrong. Part Four describes
the three rules Open Beacon's worker follows and why each one is there.

#### Static build, or static export

**Building** an app means turning the source code developers write into the files a
browser actually downloads. A **static build** produces nothing but plain files —
HTML, JavaScript, images — with no program that has to keep running to serve them.

That is what `npm run build` produces here: a folder called `out` that can be
hosted anywhere that can serve files. No special platform support is needed, which
is why this project is not tied to any particular host.

### Terms about data

#### State, and a store

**State** is simply "what is true right now" — who is signed in, what has been
typed, which stages people have reached.

A **store** is the one place that state lives. Open Beacon keeps all of its state
in a single store (`lib/store.tsx`), and no screen fetches or saves data on its
own. Everything goes through the store.

That sounds like bookkeeping and is actually the central design decision: because
there is exactly one place data comes from, replacing that one place is enough to
swap in a real database later, without touching a single screen.

#### Schema

A **schema** is the expected shape of some data: which fields exist, and what type
each one is. "A person has an id, a name, a role, and a stage number" is a schema.

Schemas matter here because the shape stored on somebody's device last month may
not match the shape this month's code expects. Part Three, Chapter One is entirely
about that problem.

#### Seed data

**Seed data** is the starting content an app ships with, so that a brand-new user
sees something rather than an empty screen. Open Beacon's seed is seven invented
people with some notes and messages between them.

In this project the seed does a second job that is easy to miss: **it defines the
schema.** The list of keys in the seed is the list of things the app expects to
find. Chapter One explains why that is the load-bearing idea rather than a
convenience.

#### Validation, and untrusted input

**Validation** is checking that data is what you expected before you use it.
**Untrusted input** is any data that did not come from your own code — typed by a
person, sent over a network, or read back out of storage.

The rule that runs through this whole project: data coming *out* of storage is
untrusted, even though your own app is what put it there. Somebody can open the
developer tools and change it. Part Three, Chapter Two is the boundary that
enforces this.

### Terms about safety

#### XSS, or cross-site scripting

**XSS** is what happens when text somebody typed gets treated as instructions
instead of words. If a person types something into a field, and the app later puts
that text into the page in a way the browser executes, then that person has just
run their own code inside your application, for everybody who views it.

The specific case Open Beacon guards against: a web address field. If somebody
saves the address `javascript:` followed by some code, and the app renders it as a
clickable link, then clicking that link runs the code. Part Three, Chapter Five is
one short function that prevents exactly this.

#### Allowlist and denylist

A **denylist** names the things that are forbidden. An **allowlist** names the
things that are permitted, and forbids everything else.

Allowlists are safer for one blunt reason: **a denylist can only block dangers
somebody has already thought of.** New ones get invented, and the list never hears
about them. Open Beacon's URL guard permits exactly two things, `http` and `https`,
and refuses everything else without needing to know what it is.

#### Rate limiting

**Rate limiting** means capping how often somebody can do something — at most so
many attempts in so many minutes. It is what stops one person, or one script, from
flooding a public form with a million submissions.

The idea is simple. Doing it correctly is not, and Part Three, Chapter Three is
about the three ways it usually goes wrong.

#### Fail closed

To **fail closed** is to choose the restrictive answer when you are unsure. A door
that locks in a power cut fails closed; one that unlocks fails open.

Open Beacon's rate limiter fails closed: a request it cannot identify goes into one
shared, stricter bucket rather than being waved through. If unknown requests were
exempt, then becoming unknown would be the way around the limit.

#### Threat model

A **threat model** is a plain statement of who you are protecting against and what
you are protecting. Without one, "is it secure?" has no answer, because secure
against whom.

Open Beacon's is unusually short: there is no server and no real data, so the main
thing being protected is the person running it from their own browser doing
something unexpected, and the main promise is that nothing leaves the device.

### Terms about the code

#### Dependency

A **dependency** is somebody else's code that your project needs in order to work.
Every dependency is also somebody else's bugs, somebody else's security updates,
and somebody else's decisions about the future.

Open Beacon has three: React, React DOM, and Next.js. The five reusable modules
have **none at all**, which is the reason they can be copied into a project without
dragging anything with them.

#### Pure function

A **pure function** is one that does nothing but turn its inputs into a return
value: no saving, no network, no clock, no surprises. Given the same inputs it
always gives the same answer.

Pure functions are trivial to test, which is why the trend maths and the rate
limiter are written as pure functions over plain values. You can check them without
starting a server or opening a browser.

#### Unit test

A **unit test** is a small program that checks one piece of code behaves as
claimed, and fails loudly when it does not.

In this project the tests are also documentation: each assertion is written as a
sentence naming the failure it exists to prevent, so reading the test output tells
you what the module promises. Part Six goes through them.

#### CI, or continuous integration

**CI** is a service that runs your checks automatically every time code changes, on
a clean machine that nobody has been tinkering with.

The clean machine is the point. "It works on my computer" is not evidence, and Part
Six describes the specific incident in this repository's history that made CI
necessary rather than nice to have.

---

## Part Three — The five modules

These are the parts worth taking. Each is dependency-free, unit tested, and carries
its reasoning in the file. Each chapter below follows the same shape: the problem in
plain words, the fix people reach for and why it fails, the fix that holds, and then
the section that matters most — what the module does **not** promise.

| Module | Solves | Lines |
|---|---|---|
| `lib/normalize.ts` | A save written by an old version must still open in a new one | 114 |
| `lib/store-data.mjs` | Data out of browser storage is untrusted and must be checked | 347 |
| `lib/rate-limit.mjs` | Bounding a public endpoint, and bounding what it sends | 145 |
| `lib/trend.ts` | Showing whether activity is rising, without lying | 133 |
| `lib/url.ts` | Stopping a typed address becoming executable code | 27 |

### Chapter One — `normalize.ts`, and the bug nobody's tests catch

#### The problem

An app keeps its state on the device. You ship a new version that adds a feature,
and that feature has its own collection of data — say, messages.

Somebody who has used the app before opens it. Their device holds a saved state
written by the *old* version, and that state has no messages in it. The new code
asks for the list of messages, gets nothing, and tries to filter it. The app
crashes while drawing the screen.

It crashes **only for people who used it before**. A brand-new user is fine.

#### Why no test catches it

This is the part worth internalising, because it generalises far beyond this
module.

Every automated test starts in a clean browser. A clean browser has no saved state.
So **every test is testing a first run**. The second run — the one where the data
already on the device and the code in the new bundle can disagree — is the one
nobody tests, and it is the only run where this bug exists.

#### And the usual recovery cannot help

Most apps have some form of "something is broken, get a fresh copy" button. It
clears the cached files and re-downloads the app.

It does not clear `localStorage`, and that is correct: that is the user's own data,
and throwing it away without asking would be worse. But it means a user stuck in
this state can reload as hard and as often as they like, forever, and nothing will
change. From the outside it looks like the app is simply broken. From the inside it
is a loop with no exit.

#### The fix people reach for

A list of repairs, one line per collection:

```js
if (!parsed.messages) parsed.messages = [];
if (!parsed.meetings) parsed.meetings = [];
// …and so on, forever
```

This works. It works right up until somebody adds a seventh collection and forgets
to add the seventh line, which is a question of when rather than whether. The list
is a second place that has to be kept in step with the first, by memory, and
**memory is not a mechanism**.

#### The fix that holds

Derive the shape from the seed data.

The seed is a freshly built default state, and it already contains one of everything
the current code expects. So its keys *are* the schema. Compare a saved object
against it, key by key, and fill in whatever is missing.

Adding a feature then means adding it to the seed — one edit, which you cannot
forget, because without it the feature does not exist at all.

#### The four rules, and why each one

| Situation | What happens | Reasoning |
|---|---|---|
| Key missing from the save | Take the seed's value | It can only be missing if the save predates the feature, so there is no user data to protect. Using the seed's value means the new feature is actually *there* for returning users, not present but mysteriously empty. |
| Key present in the save | Leave it completely alone | It is the user's. Even an empty list is left as it is, because an empty list is a thing they did. |
| Key present but the wrong type | Treat it as missing | `null` where a list belongs crashes at the first filter exactly the way missing does. Half-written saves are real. |
| Key in the save the seed does not have | Keep it | An older build reading a newer save must not silently delete the newer build's data. |

#### The bug the test found

Worth telling because it is invisible by inspection.

The first version handed back the seed's own arrays rather than copies. That means
the returned state and the caller's defaults are the *same objects in memory*. The
first time the app adds an item, it quietly appends to the seed itself — and every
later load starts from a "default" that has been accumulating other people's data.

From the outside it looks like the app is remembering things it was told to forget.
It is extremely hard to see. A test caught it; reading the code did not. The fix is
one line: copy anything taken from the seed, never reference it.

#### What this does not promise

**It does not validate content.** It fixes *shape*, so the app does not crash. It
has no opinion about whether the values are sensible or safe. Data from storage is
user-controlled and still has to be checked before it is rendered or sent anywhere —
which is exactly what the next chapter is for.

This is an availability property, not a confidentiality one. It stops a crash. It
stops nothing else.

### Chapter Two — `store-data.mjs`, the boundary

#### The problem

Everything in `localStorage` can be edited by the person using the browser. Open the
developer tools, change the text, reload. So although the app wrote that data, the
app cannot trust what comes back.

What could somebody do? Set a stage number to 900 and break the display. Set a name
to fifty thousand characters and make the app crawl. Point a note at a person who
does not exist. Put control characters in a message body. None of these is a dramatic
breach in an app with no server — but each is a crash, a freeze, or a nonsense
screen, and the same code with a server behind it would be a real problem.

#### The fix that holds

One function, `parseStoredStore`, is the only way saved data can enter the app. It
takes the raw text and returns either a clean, bounded store or `null`. There is no
third answer and no partial success: **if anything is wrong, the whole thing is
rejected** and the app starts from the sample data instead.

That strictness is deliberate. A validator that repairs what it can and passes the
rest along is a validator whose output nobody can reason about.

#### What it enforces

| Limit | Value | Why |
|---|---|---|
| Whole document | 100,000 characters | Beyond this, parsing itself is the attack. |
| People | 50 | A bound the interface can actually draw. |
| Items per collection | 100 | Same reasoning, per list. |
| Name length | 80 characters | Long enough for real names, short enough not to break layout. |
| Message and note length | 500 characters | The app is not a document store. |
| Identifiers | Letters, digits, `_` and `-`, starting alphanumeric, at most 64 characters | Predictable, safe to put in a key, impossible to smuggle anything through. |
| Control characters | Rejected anywhere in text | Invisible characters cause visible chaos. |
| Text fields | Must already be trimmed | Leading and trailing spaces are almost always a sign of tampering or a bug. |

#### The checks that are not about single fields

These are the interesting ones, because they are about the data as a whole rather
than one value at a time.

- **Every identifier must be unique.** Two people with the same id is a state the
  rest of the app has no sensible behaviour for.
- **Every reference must point at somebody who exists.** A note whose author is not
  in the list of people is rejected, as is a message to a nonexistent participant.
- **Every member's guide must actually be a guide.** Not merely a person who exists —
  a person whose role is `guide`. This is the check that stops a hand-edited save
  from producing a support relationship with somebody who is not a supporter.

That last group is what separates real validation from type-checking. Each field can
be individually valid while the document as a whole is nonsense.

#### What this does not promise

It does not make the data *true*, only well-formed and bounded. It is a structural
boundary, not an authorisation system: it will happily accept a perfectly well-formed
store in which a member has been moved to the final stage by somebody editing their
own storage. In an app with no server, that is a person cheating at a demonstration,
which is nobody's problem. **With a server, it would be, and the check would have to
live on the server instead** — because anything enforced in the browser can be
skipped by not using the browser.

### Chapter Three — `rate-limit.mjs`, and three ways to get it wrong

This module is not used by the demo application, which has no server. It is here
because it is the piece most worth stealing, and because hand-rolled limiters get
the same three things wrong.

#### Mistake one: keying on something the caller can change

Most tutorial limiters count attempts per client id, or per session cookie, or per
header the caller supplies.

Every one of those is free for an attacker to change. Clear the value, send a new
one, and you have a fresh budget. So the limit applies to honest users exclusively,
which is worse than having no limit, because it costs real people something and
costs the attacker nothing.

> A limiter is only as good as the difficulty of changing its key.

If you take one idea from this chapter, take that one.

#### The header problem, in detail

The usual answer is to key on the caller's network address. Getting *that* right has
a trap of its own.

When a request passes through a proxy, the proxy records the address it saw in a
header called `x-forwarded-for`. If there are several proxies, that header becomes a
list.

Here is the trap: **a client can send that header itself.** Anything the client sends
arrives at the *left* of the list, and each proxy *appends* what it actually observed
to the right. So the leftmost entry is attacker-chosen, and a limiter that reads the
left of the header is defeated by typing a different number each time.

The rightmost entry is the one your own proxy wrote. Better still is `x-real-ip`,
which proxies set and do not forward from clients.

`clientAddress` reads `x-real-ip` first, then the rightmost entry of
`x-forwarded-for`, and returns `null` when there is nothing trustworthy — so the
caller decides what to do rather than being handed a fake key that lumps every
unidentifiable request together.

#### Mistake two: counting refused attempts

This is the most common bug in hand-written limiters, and it is invisible until
somebody abuses it.

The natural way to write `take` is to record every attempt and then check whether the
count is over the limit. That means a refused attempt is also recorded. So somebody
who keeps hammering the endpoint keeps refreshing their own timestamps, and their
window never empties.

The cooling-off period becomes a **permanent lockout that the flooder controls** — and
if they can guess or share a key with a real user, they can lock that user out
indefinitely.

Open Beacon's limiter records accepted attempts only. A refused caller is told when to
come back, and that time actually arrives.

#### Mistake three: one budget where two are needed

If an endpoint *sends* something — an email, a webhook, a push notification — then
limiting submissions bounds your database and does nothing at all for the mailbox. A
distributed flood can stay comfortably under a per-sender limit and still add up to
twelve hundred emails an hour.

So the outbound side needs its own separate ceiling. And the order matters: check the
outbound ceiling **after** the work is durably stored. Then a flood costs you
notifications, and never costs a real person their message.

#### The limiter must not become the attack

A map keyed on something the caller influences is itself a way to exhaust memory. Send
a million distinct keys and the structure meant to prevent a denial of service becomes
one.

So both dimensions are capped: old timestamps are pruned on every call, and the number
of tracked keys is bounded, oldest forgotten first.

#### What this does not promise

**It is not distributed.** The state is a plain map in the memory of one process.
Serverless instances do not share memory, and a cold start begins with an empty map. It
raises the cost of abuse substantially and bounds what any single instance can emit; it
is not a hard guarantee.

If you need a hard guarantee, put the same logic where the state is shared — in your
database, or in Redis. The reasoning in this file transfers unchanged; only the storage
moves.

### Chapter Four — `trend.ts`, or how to show numbers without lying

#### The problem

Most dashboards show a total since the beginning. A total can only ever go up, so it
cannot answer the question anybody is actually asking. Nobody wants to know how many
things have ever happened. They want to know whether there is more happening than there
was.

Counting per week is easy. Doing it honestly turns out to have three traps, and each one
misleads the person reading the screen in a way that looks like data.

#### Trap one: the week in progress

Today's week is always lower than last week, for the sole reason that it has not
finished yet. A chart that draws Tuesday's partial total the same as a completed week
invites everybody looking at it to read a Tuesday as a decline.

So the bucket containing "now" is marked `partial`, and every consumer — the chart, the
spoken description, the summary sentence — says so.

#### Trap two: the empty week

It is tempting to drop buckets with nothing in them. Doing so silently closes the gap up,
and draws a busy fortnight where there was a quiet one.

**A gap is a reading.** Empty buckets are kept, and the chart draws them with a visible
floor so that nothing is still something you can see.

#### Trap three: growth from zero

Last week nothing happened. This week two things happened. What is the percentage
increase?

There is not one. Dividing by zero is not a number, and "up 100%" is a lie dressed as
arithmetic. The function returns `null`, and the caller is expected to say something
truthful in words instead.

#### The daylight-saving detail

A small thing that quietly corrupts data, worth naming because it is easy to get wrong
and hard to notice.

Stepping back one week by subtracting seven times twenty-four hours is not a week across
a daylight-saving change: it is an hour out. Do it for eight buckets and the drift moves
events into neighbouring weeks.

So the code steps back by a fixed size and then **re-normalises** to the start of that
day or week. The boundary is recomputed, never accumulated.

#### What comes out

Four small pure functions:

- `trend(events, options)` — the buckets, oldest first, each with a start, a short label,
  a total, and whether it is partial.
- `momentum(points)` — the latest bucket, the last complete one, the percentage change or
  `null`, and a direction.
- `peak(points)` — the tallest bar for scaling, never zero, so an empty chart divides by
  one instead of crashing.
- `quietCount(points)` — how many finished buckets were empty. Quiet stretches are worth
  naming out loud.

Anything unparseable in an event's timestamp is ignored rather than counted as "now",
which is the other way this kind of code usually goes wrong.

#### The chart

`components/TrendChart.tsx` draws the result in about eighty lines of plain SVG, with no
charting library. Eight rectangles do not need sixty kilobytes of JavaScript, the app has
to stay usable on an old phone, and a library would need theming to match anyway.

It does three things a row of numbers cannot: it draws the partial bar differently, it
gives an empty bucket a visible floor, and it reads out as a sentence to a screen reader —
because a picture of a trend is no use to somebody who cannot see it.

#### What this does not promise

It counts events you hand it. It has no opinion about whether those events are the right
ones, whether they are complete, or whether the thing they measure is the thing you care
about. Honest arithmetic on the wrong events is still the wrong answer.

### Chapter Five — `url.ts`, twenty-seven lines that matter

#### The problem

Any field where a person types a web address, which the app later renders as a clickable
link, is a stored cross-site-scripting hole unless the value is checked.

If somebody saves `javascript:` followed by some code as their "website", and the app
renders it as a link, then clicking that link runs their code — with the full privileges
of your site, for every user who sees that record, surviving every page reload, because
it is in your data.

The person who typed it does not have to be an attacker. They only have to be one account
an attacker got hold of.

#### The fix that holds

One anchored allowlist. Every part of it is load-bearing:

| Part | Prevents |
|---|---|
| Anchored at the start | `data:text/html,...#https://x` passing a test that only looks for "https://" *somewhere* in the string. |
| Exactly two schemes permitted | A denylist of dangerous schemes never hears about the next dangerous scheme. |
| Requires the two slashes | `//evil.example.com` is not an absolute address; it silently inherits the current page's scheme. |
| Requires something to follow | A bare `https://` is not a link. |
| Case-insensitive | `JaVaScRiPt:` is the same scheme as `javascript:`. |

It returns `null` rather than throwing, and the caller renders the raw text unlinked. **A
value that cannot be trusted as a link is still worth showing the user** — silently
deleting what somebody typed is its own kind of bug.

#### What this does not promise

It does not tell you whether a link is safe to *visit*. An `https://` address pointing at
a hostile site passes, because it is a perfectly legitimate address and no pattern can
know otherwise.

That is a different problem with a different answer: render external links with
`rel="noopener noreferrer"` and `target="_blank"`, as this project does, so the
destination cannot reach back into the page that opened it.

---

## Part Four — How the app fits together

### The map

Forty tracked files. This is all of them that matter.

| Path | What lives there |
|---|---|
| `app/layout.tsx` | The shell every page sits inside, and the page metadata |
| `app/page.tsx` | The front door: choose a role, and an introduction to the journey |
| `app/dashboard/page.tsx` | The workspace, which becomes one of three views |
| `app/globals.css` | The whole visual system and the responsive layout |
| `components/WorkspaceShell.tsx` | Shared navigation and workspace frame |
| `components/RoleOverview.tsx` | The overview panel, different per role |
| `components/FeatureViews.tsx` | People, community, library, messages, settings |
| `components/JourneyBar.tsx` | The progress bar, described to screen readers |
| `components/MiniOrbit.tsx` | Local ambient sound and the focus timer |
| `components/TrendChart.tsx` | Activity over time, in plain SVG |
| `components/Brand.tsx` | The mark and the name |
| `components/ServiceWorker.tsx` | Registers the offline worker |
| `lib/store.tsx` | The store: all state, and every action |
| `lib/store-data.mjs` | The validation boundary for saved data |
| `lib/normalize.ts` | Bringing an old save up to the current shape |
| `lib/seed.ts` | The seven invented people |
| `lib/content.ts` | Learning resources, tasks, events, announcements |
| `lib/journey.ts` | The five stages |
| `lib/types.ts` | Every shape in the app, in one file |
| `lib/trend.ts` | Activity-over-time maths |
| `lib/rate-limit.mjs` | The rate limiter, for use elsewhere |
| `lib/url.ts` | The link guard |
| `public/sw.js` | The service worker |
| `public/manifest.webmanifest` | What makes it installable |
| `tests/` | Five suites, described in Part Six |

### Where data comes from, and where it goes

The whole cycle, in order:

1. **On first run**, `makeSeed()` builds the sample store: seven people, some notes, some
   messages.
2. **On every later run**, the app reads the saved text out of `localStorage` and hands it
   to `parseStoredStore`. If anything is wrong, the answer is `null` and the app falls back
   to the seed.
3. **The store** holds that state in memory and hands it to every screen through one React
   context. No screen reads or writes storage itself.
4. **Every action** — sending a message, advancing a stage, saving a resource — goes through
   a function on the store, which updates the state and writes the whole thing back to
   `localStorage`.
5. **If writing fails** — private browsing, a full quota, a locked-down webview — the failure
   is swallowed and the app keeps working from memory. An app that refuses to open because a
   preference could not be saved has chosen the wrong failure.

The single most useful fact for anyone changing this project: **`lib/store.tsx` is the only
file that touches persistence.** Its context interface is the complete list of what the
application can do. If you wanted to put a real database behind this, that interface is the
thing you would implement, and no screen would need to change.

### The seven sample people

| Role | Count | Names |
|---|---|---|
| Coordinator | 1 | Alex Rivera |
| Guide | 2 | Sam Okafor, Priya Nair |
| Member | 4 | Jordan Lee, Taylor Brooks, Chris Diaz, Robin Adeyemi |

Two members are assigned to each guide, and they start at different stages so that every
screen has something to show. Alongside them the content files hold six learning resources,
five journey tasks, three workspace events and three announcements.

All of these names are invented and must stay invented. A test checks that no sample address
uses a domain that could reach a real inbox, and that nothing that looks like a phone number
appears.

### The three views

All three are the same page, `app/dashboard/page.tsx`, asking different questions of the
same store.

**Coordinator** sees every person and the whole journey. The overview answers: who is at
which stage, who supports whom, and where the group as a whole has got to. A coordinator can
move somebody between guides.

**Guide** sees only the members assigned to them. Conversations, plans, and private notes
about the people they support. Another guide's members are simply not in the data this view
asks for — the filtering is in the question, not in a hidden button.

That distinction matters if you adapt this: hiding a control is not a boundary. Here it
happens to be both, because there is no server to ask a different question of. In a real
deployment the boundary must live where the data does.

**Member** gets their own room: next steps, their progress along the journey, a focus timer,
optional ambient sound, and a way to ask for support. A support request can be kept private
or shared with the group anonymously, and choosing to share removes the person's name.

### Mini Orbit

A focus timer and an ambient sound generator, and worth a note because of what it does not
do.

The sound is **synthesised in the browser** using the Web Audio API — filtered noise shaped
into rain, room tone, or wind. Nothing is downloaded, nothing is recorded, no microphone is
touched, and no audio file exists anywhere in the project. Three scenes, a volume control,
and a countdown timer, all local.

It is in the project as a small demonstration that a pleasant feature does not have to mean a
network request.

### Offline behaviour, and the three rules of the worker

The service worker in `public/sw.js` follows three rules, and each exists to stop a specific
kind of harm.

**Rule one: same origin only.** Any request to another site is ignored entirely. A worker
that caches third-party responses is a worker that can serve somebody stale or wrong content
from a domain you do not control.

**Rule two: `GET` only, and only public asset types.** Fonts, images, scripts and styles are
cached. Anything else is left alone. A worker that caches a request which *changes* something
can replay it, or answer it from a copy, and both are worse than a network error.

**Rule three: no query strings.** A cached response for an address carrying a query string is
a cached response for one particular set of parameters, and those parameters are frequently
the private part.

Navigation is handled separately: try the network first, and fall back to the cached shell
only when the network fails. That ordering means a new version is picked up as soon as it
exists rather than after the cache expires.

Old caches are deleted on activation by matching the project's own prefix — never by clearing
everything, which would take other applications' caches with it on the same origin.

### Accessibility, briefly

Three deliberate choices, all visible in the code:

- The journey bar is described to screen readers rather than being a purely visual row of
  colours.
- The trend chart carries a spoken sentence naming every bucket and its total, so the
  information is available without seeing the picture.
- Preferences include text size and a reduced-motion setting, because motion is a genuine
  accessibility problem for some people rather than a style preference.

---

## Part Five — Security

### The model, stated plainly

**There is no server, no account system, no analytics, and no remote data store.**
Everything runs in the browser, and the people are fiction. That is the whole reason this is
safe to hand to anybody: there is nothing to breach.

Role selection is a demonstration interface. It changes what the screen shows. It does not
prove who anybody is, and it is not trying to.

### What is protected, and how

| Property | How it is held |
|---|---|
| Nothing leaves the device | There is no network call in the application. Not a reduced one — none. |
| Saved data cannot crash the app | `normalize.ts` fixes shape; `parseStoredStore` rejects anything malformed. |
| Saved data cannot grow without bound | Explicit caps on document size, people, items per collection, and field lengths. |
| An imported backup is not a way in | Restoring a backup goes through exactly the same validation boundary as ordinary loading. |
| A typed address cannot become code | `safeExternalUrl`, with an anchored allowlist of two schemes. |
| The offline worker cannot leak | Same-origin, `GET`, public asset types, no query strings. |
| Sample data stays fiction | A test checks for real-looking addresses and phone numbers on every run. |
| The development server is not exposed | It binds to `127.0.0.1`, so only your own machine can reach it. |

### The boundary: what will never be in this repository

Open Beacon is the reusable part of a larger private application. Some things were
deliberately left behind, and would be refused as contributions.

| Not here | Why |
|---|---|
| Database schema, migrations, access-control policies | These encode one organisation's data model and rules. Published, they are a map of that system for an attacker. Copied, they give another team a false sense that their authorisation is solved. |
| Any credential, key, token or connection string | Including in examples. A test enforces this on every run. |
| Real user data of any kind | The sample is fiction and stays fiction. |
| Operational detail of the private deployment | Hostnames, project identifiers, inbox addresses, webhook URLs, monitoring endpoints. |

The test to apply when moving something from a private codebase into a public one is **not**
"does this contain a secret". That is the obvious question, and it is rarely the one that
catches anything. The useful question is:

> Does this describe how one particular organisation's system is defended?

The first is obvious and rare. The second is subtle and common.

### The honest limits

Said plainly, because a module used against the wrong threat is worse than no module.

- **The rate limiter does not survive a cold start** and does not coordinate between server
  instances. It is per process, in memory.
- **The URL guard does not tell you a link is safe to visit.** It only stops the address
  itself being executable.
- **`normalize.ts` does not validate content.** It prevents a crash and nothing more.
- **Browser-side validation is not authorisation.** Everything in `store-data.mjs` can be
  bypassed by anybody willing to not use the browser. In an app with no server that costs
  nobody anything. With a server it would be the whole problem, and the check would have to
  move.
- **Nothing here has been through an external security review.**

### If you add a server

The moment there is a backend, every guarantee above stops being the whole picture and you
own the rest: authentication, authorisation, secure storage, audit, transport security, and a
review that is not this document.

The specific things to move server-side first: the limits in `store-data.mjs`, any rule about
who may see whose records, and the rate limiter's state.

---

## Part Six — Testing

### What runs

`npm test` runs five suites. Between them they make 86 named assertions plus three
storage-boundary tests, and every one is written as a sentence describing the failure it
prevents. Reading the output is a fair way to learn what the modules promise.

| Suite | Assertions | What it proves |
|---|---|---|
| `tests/store-data.test.mjs` | 3 tests | Malformed, oversized and internally inconsistent saves are rejected rather than half-accepted. |
| `tests/normalize.mjs` | 20 | Old saves open, user data is preserved, wrong types are treated as missing, and the seed is never handed out by reference. |
| `tests/rate-limit.mjs` | 22 | The window works, refused attempts are not counted, the key map is bounded, and the rightmost forwarded address is the one used. |
| `tests/trend.mjs` | 27 | Partial buckets are marked, empty buckets are kept, growth from zero returns nothing, and an empty chart does not divide by zero. |
| `tests/security-invariants.mjs` | 17 | No credential-shaped text anywhere, no database or deployment detail, sample data is fiction, and the URL guard still blocks every payload that matters. |

The URL guard's tests are the clearest example of testing behaviour rather than shape. Rather
than checking that the file contains a regular expression, the suite extracts the pattern the
file actually contains and runs it against the payloads that matter: `javascript:alert(1)`,
the same with mixed capitals, a `data:` URL, `vbscript:`, `file:///etc/passwd`, and a
scheme-relative `//evil.example.com`. Then it checks a genuine `https://` address still
passes, because a guard that blocks everything is not a guard, it is a bug.

### A defect found while writing this guide

Two assertions in `tests/security-invariants.mjs` were being called with one argument instead
of two. The helper takes a condition and a message; passing only the message put it in the
condition slot, where a non-empty string is always truthy.

The visible symptom was two lines of output reading `OK  undefined`. The real problem was that
those two assertions **could never fail**.

They were the "all clear" lines rather than the checks themselves — the actual detection
happens in a loop above each one, and that loop was working correctly — so no security check
was broken. But an assertion that cannot fail is exactly what the rest of this suite exists to
prevent, and it was sitting in the file that enforces the project's boundary. Fixed, and the
fix is a one-line comment away from being re-broken, which is why the comment is there.

### Continuous integration, and the reason for it

`.github/workflows/verify.yml` runs typecheck, tests and a production build on every push and
every pull request, on a clean machine, with read-only permissions and no repository secrets.

It uses `pull_request`, never `pull_request_target`. The second one runs with repository
secrets and a writable token while checking out a fork's code, and is the most common way a
public repository is taken over through a pull request.

#### The incident that made it necessary

A broken module was once pushed to this repository because the verification command was, in
effect:

```bash
npm test | grep something && git commit && git push
```

**A pipeline's exit status is the last command's.** So the push chained on `grep` finding
lines, not on the tests passing. The tests had failed. The output still contained the text
being searched for. Everything looked fine and the broken code went to a public repository.

CI cannot make that mistake, because it runs `npm test` on its own and reads its own exit
code. The general lesson is narrow enough to be usable: **when the exit code matters, redirect
to a file, never pipe.**

### What is not tested

Stated because a list of green checks invites the wrong conclusion.

- **No browser tests.** Nothing drives a real browser through the screens. The modules are
  covered; the interface is covered by reading it.
- **No accessibility audit.** The accessibility work described in Part Four is deliberate but
  unaudited.
- **The service worker is not exercised by a test.** Its rules are enforced by reading, not by
  an automated check.
- **No performance measurement.** The claims about staying usable on an old phone are design
  intent, not benchmark results.

---

## Part Seven — Using it in your own project

### Taking one module

All five are dependency-free. Copy the file, copy its test, and run the test. If it passes in
your project, the module works in your project.

Keep the comments. They are most of the value, and they are what stops the next person
"simplifying" the module back into the bug it was written to prevent.

| Module | Copy when |
|---|---|
| `normalize.ts` | Your app keeps state on the device and you intend to ship more than one version of it. |
| `store-data.mjs` | You read structured data back out of browser storage and act on it. Adapt the field rules; keep the shape of the boundary. |
| `rate-limit.mjs` | You have a public endpoint that writes, sends, or costs money. |
| `trend.ts` | You are about to show somebody a chart of activity over time. |
| `url.ts` | Anywhere a person can type a web address that you later render as a link. |

`normalize.ts`, `trend.ts` and `url.ts` are TypeScript; `rate-limit.mjs` and `store-data.mjs`
are plain JavaScript modules with type annotations in comments, so they can be imported from
either language and unit tested in bare Node with no build step.

### Changing the sample

Three files, in the order most people want them:

1. **`lib/journey.ts`** — the five stages. Labels, one-line descriptions, and a colour each.
   Add or remove stages freely; the rest of the app reads the length of the list rather than
   assuming five.
2. **`lib/content.ts`** — learning resources, tasks, events, announcements. Ordinary arrays of
   plain objects.
3. **`lib/seed.ts`** — the people. **This is also the schema.** Adding a collection here is
   what makes it exist for returning users, because `normalize.ts` derives the shape from this
   file. Do not add a collection anywhere else.

Change those inputs first. Adjust a role view only when the model you are building genuinely
needs different behaviour, not merely different words.

### Changing the roles

The three roles are named in `lib/types.ts` and validated in `store-data.mjs`. Renaming them
is a small change. Adding a fourth is a slightly larger one: the role must be added to the
type, to the validator's list of acceptable roles, to the label map, and to whichever views
should exist for it.

The validator's list is the one people forget. If a role is not in it, a save containing that
role is rejected wholesale, and the symptom is an app that silently resets to sample data on
reload.

### If you outgrow the browser

The moment two people need to see the same data on two devices, this design has reached its
limit, and that limit is deliberate rather than accidental.

The good news is where the seam falls. `lib/store.tsx` is the only file that touches
persistence, and its context interface is the complete list of what the app can do. Implement
that interface against a real database, provide it in place of the current one, and every
screen keeps working — because no screen knows the difference.

The rest of that job is not a code change. It is authentication, authorisation, transport
security, backups, and a security review. Establish the server-side trust boundary **before**
adding real people, not after.

---

## Part Eight — Running and deploying

### Requirements

- **Node.js 20.9 or newer.** Node is the program that runs JavaScript outside a browser. The
  continuous-integration configuration pins Node 22.
- **npm 10 or newer.** It comes with Node.

Nothing else. No database, no environment file, no account, no key.

### Commands

| Command | What it does |
|---|---|
| `npm ci` | Installs exactly the dependency versions the project was tested with. Prefer it over `npm install`, which may quietly upgrade things. |
| `npm run dev` | Runs the app locally on port 3100, bound to this device only. |
| `npm test` | Runs all five suites. Takes seconds; needs no server and no browser. |
| `npm run typecheck` | Checks the types without producing output. |
| `npm run build` | Produces the static site in `out`. |
| `npm audit` | Reports known vulnerabilities in dependencies. |

### Deploying

`npm run build` produces plain files. Any host that can serve static files can serve this: a
hosting platform, a web server, a bucket, or a folder on a machine. **No platform-specific
adapter is required**, and there is nothing to configure at runtime because there is nothing
that runs at runtime except the browser.

Four things belong to whoever deploys it, and to nobody else:

- Transport security, which in practice means serving it over HTTPS.
- Browser security headers.
- Domain and DNS control.
- Deciding whether the thing should be public at all.

### Dependencies

Three at runtime — Next.js, React and React DOM — and four development-only packages, all
TypeScript tooling.

Two dependency versions are pinned by override rather than left to resolution, which is worth
knowing before you change them: `postcss` and `sharp`. Overrides exist to force a patched
version somewhere down the tree, and removing one silently reintroduces whatever it was
pinning away from.

---

## Appendix A — Glossary

Every difficult term in this guide, alphabetically.

| Term | In plain words |
|---|---|
| **Allowlist** | A list of what is permitted; everything else is refused. Safer than a denylist, because it does not need to know about dangers that have not been invented yet. |
| **Assertion** | One check inside a test: a statement that something is true, which fails loudly when it is not. |
| **Build** | Turning the code developers write into the files a browser downloads. |
| **CI (continuous integration)** | A service that runs your checks automatically on a clean machine every time the code changes. |
| **Client** | The program in front of the user. Here, the web browser. |
| **Cold start** | The first request handled by a freshly started server process, which begins with nothing in memory. Relevant because an in-memory rate limiter starts empty. |
| **Context (React)** | A way of making one value available to every screen in an app without passing it down by hand at each step. Open Beacon's store is a context. |
| **Control characters** | Invisible characters in text, below the printable range. Rejected in stored text because they cause visible chaos and are almost always a sign of tampering. |
| **Denylist** | A list of what is forbidden; everything else is permitted. The weaker of the two, because the list never hears about the next danger. |
| **Dependency** | Somebody else's code your project needs. Also their bugs, their security updates, and their decisions. |
| **Fail closed** | Choosing the restrictive answer when unsure. A lock that stays locked in a power cut. |
| **Fixed window** | A rate-limiting method that counts attempts within a fixed period of time — at most N in the last M minutes. |
| **Identifier (id)** | A short unique label for a record. Constrained here to letters, digits, hyphen and underscore, at most 64 characters. |
| **`localStorage`** | The browser's simple per-site notepad, kept on the user's own device, surviving a restart. Readable and editable by whoever holds the device. |
| **Normalisation** | Bringing data into an expected shape. Here specifically: making a save written by an older version usable by a newer one. |
| **Offline-first** | Built to work from what is on the device, treating the network as a bonus rather than a requirement. |
| **Origin** | The combination of scheme, host and port that identifies a website to the browser. Two different origins are two different applications, with separate storage. |
| **Proxy** | A server that sits in front of yours and passes requests along, often adding headers recording where the request came from. |
| **Pure function** | A function that only turns inputs into a return value — no saving, no network, no clock. Easy to test, because the same inputs always give the same answer. |
| **Query string** | The part of a web address after a question mark, carrying parameters. Frequently the private part, which is why the offline worker refuses to cache addresses that have one. |
| **Rate limiting** | Capping how often something can be done, to stop one caller flooding it. |
| **Regular expression (regex)** | A compact pattern for matching text. Powerful, easy to get subtly wrong, which is why the URL guard's pattern is tested against real payloads rather than merely read. |
| **Schema** | The expected shape of data: which fields exist, and of what type. |
| **Scheme** | The first part of a web address, before the colon: `https`, `http`, `mailto`, `javascript`. Which schemes are permitted is the entire subject of `url.ts`. |
| **Seed data** | The starting content an app ships with, so a new user sees something. Here it also defines the schema. |
| **Server** | A computer elsewhere that holds data and answers requests. Open Beacon has none. |
| **Service worker** | A background script the browser runs for a site, able to answer requests from a local copy when the network is unavailable. |
| **Static site** | A site made only of files, with no program running to serve them. |
| **State** | What is true right now in the running application. |
| **Store** | The single place state lives, and the only thing that reads or writes persistence. |
| **Stored XSS** | Cross-site scripting where the hostile value is saved in your data, so it runs for every user who views that record, again after every reload. |
| **Threat model** | A plain statement of who you are protecting against and what you are protecting. |
| **Trusted / untrusted input** | Untrusted means anything that did not come from your own code — typed by a person, sent over a network, or read back out of storage. All of it must be checked. |
| **Type stripping** | Node's ability to run TypeScript directly by discarding the type annotations, with no build step. It is why these tests can import the real source rather than a compiled copy. |
| **Unit test** | A small program that checks one piece of code behaves as claimed. |
| **Validation** | Checking data is what you expected before using it. |
| **Web Audio API** | The browser's built-in sound engine. Mini Orbit uses it to generate ambience locally, so no audio is downloaded, recorded, or uploaded. |
| **XSS (cross-site scripting)** | Text somebody typed being treated as instructions instead of words, so their code runs inside your application. |

---

## Appendix B — Module reference

### `lib/normalize.ts`

- `normalize(parsed, seed)` — returns a copy of `parsed` in the shape of `seed`.
- `loadState(key, seed)` — reads that key from `localStorage`, parses, normalises, and returns
  the seed on any failure.

**Promises:** an old save opens in new code; the user's own values are untouched; values of
the wrong type are treated as missing; unknown keys are kept; nothing returned shares memory
with the seed.

**Does not promise:** that any value is valid, safe, or sensible.

### `lib/store-data.mjs`

- `parseStoredStore(raw, lastStage)` — a clean bounded store, or `null`.
- `isSafeId(value)` — whether a value is an acceptable identifier.

**Promises:** all-or-nothing validation; caps on size and length; every reference points at a
person who exists; every member's guide is genuinely a guide.

**Does not promise:** authorisation. It is a structural boundary. Anything it enforces can be
bypassed by not using the browser.

### `lib/rate-limit.mjs`

- `createLimiter({ limit, windowMs, maxKeys })` — returns `take`, `size`, `reset`.
- `take(key, now)` — `{ allowed, remaining, retryAfterMs }`.
- `clientAddress(headers)` — the trustworthy address, or `null`.

**Promises:** a fixed window; refused attempts are never counted; the key map is bounded; the
rightmost forwarded address is used; plain objects and `Headers` both work, across JavaScript
contexts.

**Does not promise:** anything distributed. Per process, in memory, empty after a cold start.

### `lib/trend.ts`

- `trend(events, { grain, count, now, types })` — buckets, oldest first.
- `momentum(points)` — latest, previous, percentage change or `null`, direction.
- `peak(points)` — tallest bar, never zero.
- `quietCount(points)` — finished buckets that were empty.

**Promises:** the bucket in progress is marked; empty buckets are kept; growth from zero
returns `null`; bucket boundaries are recomputed rather than accumulated, so daylight saving
does not shift events.

**Does not promise:** that the events you supplied are the right ones.

### `lib/url.ts`

- `safeExternalUrl(url)` — the trimmed address, or `null`.

**Promises:** only `http` and `https` pass; anchored at the start; case-insensitive;
scheme-relative addresses refused; returns `null` rather than throwing.

**Does not promise:** that a permitted address is safe to visit.

---

## Appendix C — How this guide was checked

Written to be trusted, so here is exactly what was and was not done.

### Read in full

Every one of the forty tracked files in the repository, at commit `ed72866` plus the one fix
described below. Nothing in this guide is from memory of an earlier version.

### Run

- `npm test` — all five suites pass. The assertion counts in Part Six were produced by counting
  the output, not estimated.
- `node tests/security-invariants.mjs` — run separately before and after the fix described
  below, to confirm the change did what it claimed.

### Fixed while writing

Two assertions in `tests/security-invariants.mjs` were called with one argument instead of two,
printing `OK  undefined` and — more importantly — being incapable of failing. Corrected, with a
comment explaining the trap. Described in full in Part Six.

Because the actual detection for both checks happens in a loop above the affected line, no
security check was weakened by the defect. That is stated because it would be easy, and wrong,
to present this as a caught vulnerability.

### Counted rather than estimated

Line counts, the number of tracked files, the number of sample people by role, the number of
learning resources, tasks, events and announcements, and every assertion count.

### Not verified

- **The application was not opened in a browser for this guide.** Descriptions of the three
  views come from reading the components, not from using them.
- **No screenshots were taken.**
- **No accessibility audit** was carried out. The accessibility features described are present
  in the code; whether they work well for somebody relying on them was not tested.
- **No performance measurement.** Statements about staying usable on an older device are design
  intent.
- **No external security review** exists for this project, and this document is not one.
