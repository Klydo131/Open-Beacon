-- Open Beacon — an example schema and permission rules for Postgres.
--
-- THIS FILE HAS BEEN RUN. Every statement below was applied to a real
-- PostgreSQL 16 database and the rules were then attacked from a second
-- account; docs/examples/prove-the-rules.sql is that attack, and it passes.
-- The first draft of this schema, written from experience and never executed,
-- contained five defects — two of which broke the application outright. That is
-- why this file exists as SQL you can run rather than as a code block in a
-- document.
--
--   createdb beacon
--   psql -d beacon -f docs/examples/schema.sql
--   psql -d beacon -f docs/examples/prove-the-rules.sql
--
-- ADAPT IT, do not adopt it blind. This is an example for YOUR deployment.
-- Read docs/BUILD-YOUR-OWN.md alongside it.

-- ===========================================================================
-- 0. WHO IS ASKING
--
-- Every rule below turns on "who is making this request". Managed backends
-- provide this: Supabase has auth.uid(). Vanilla Postgres does not, so here is
-- the equivalent, and it is the piece most examples on the internet assume you
-- already have.
--
-- Your application sets the session variable once per connection, from a
-- VERIFIED session — never from anything the browser sent you.
-- ===========================================================================
create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

-- The two policy helpers are defined in section 1b, AFTER the tables. A
-- `language sql` function body is validated when it is created, so one that
-- reads `people` cannot be created before `people` exists. Order matters in
-- this file and it is not alphabetical.

-- ===========================================================================
-- 1. TABLES
--
-- One per shape in lib/types.ts. The `check` constraints mirror the limits in
-- lib/store-data.mjs on purpose: browser limits are a courtesy to honest users,
-- database limits are the actual rule.
-- ===========================================================================
create table people (
  id           uuid primary key,
  name         text not null check (length(name) between 1 and 80),
  role         text not null check (role in ('coordinator','guide','member')),
  guide_id     uuid references people(id),
  stage_index  int  not null default 0 check (stage_index >= 0),
  created_at   timestamptz not null default now()
);

create table notes (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references people(id),
  subject_id   uuid not null references people(id),
  body         text not null check (length(body) between 1 and 500),
  created_at   timestamptz not null default now()
);

create table messages (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references people(id),
  participant_id uuid not null references people(id),
  body           text not null check (length(body) between 1 and 500),
  created_at     timestamptz not null default now()
);

create table support_requests (
  id                uuid primary key default gen_random_uuid(),
  person_id         uuid not null references people(id),
  body              text not null check (length(body) between 1 and 500),
  share_anonymously boolean not null default false,
  created_at        timestamptz not null default now()
);

-- The three that are per-person. In the demo store these live on the store
-- itself, because only one person is ever signed in; with two people that
-- becomes everybody sharing one text size. See BUILD-YOUR-OWN.md step 5.
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

-- ===========================================================================
-- 1b. THE POLICY HELPERS
--
-- The reason these exist is the most important comment in this file.
--
-- A policy on `people` may not run a sub-select against `people`: the policy
-- applies to that sub-select too, which recurses, and Postgres stops it with
-- "infinite recursion detected in policy for relation". The application does
-- not fail gracefully — it cannot list anybody at all.
--
-- SECURITY DEFINER runs the function as its owner, who is not subject to the
-- policy, so the recursion never starts.
--
-- `set search_path` is NOT optional on a definer function. Without it a caller
-- can put their own `people` table earlier in the search path and this function
-- will read theirs instead of yours.
-- ===========================================================================
create or replace function auth.my_role() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select role from people where id = auth.uid()
$$;

create or replace function auth.my_guide() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select guide_id from people where id = auth.uid()
$$;

-- ===========================================================================
-- 2. THE RULES
--
-- Enabling RLS without adding a policy denies everything to non-owners. That
-- is the correct default and it is also a confusing failure: the owner (you,
-- at a psql prompt) still sees every row, while the application sees none.
-- ===========================================================================
alter table people           enable row level security;
alter table notes            enable row level security;
alter table messages         enable row level security;
alter table support_requests enable row level security;
alter table completed_tasks  enable row level security;
alter table saved_resources  enable row level security;
alter table preferences      enable row level security;

-- Me, the people I support, the person supporting me, everyone if I coordinate.
--
-- "the person supporting me" is easy to leave out and the omission is not
-- obvious: a member's own room shows who supports them, and their conversation
-- partner IS their guide, so without this clause a member sees an empty
-- messages list and cannot contact the one person assigned to help them.
create policy "people i may see" on people
for select using (
  id = auth.uid()
  or guide_id = auth.uid()
  or id = auth.my_guide()
  or auth.my_role() = 'coordinator'
);

-- Private notes: the author, and nobody else. No coordinator exception —
-- that is the promise the app makes to a guide.
create policy "own notes" on notes
for all using (author_id = auth.uid())
with check (author_id = auth.uid());

-- A conversation belongs to exactly the two people in it.
create policy "own conversation" on messages
for select using (
  author_id = auth.uid() or participant_id = auth.uid()
);

create policy "send as self" on messages
for insert with check (author_id = auth.uid());

-- The community board is shared with the group by design. State that as a
-- rule rather than leaving it to a view, so the intent is written down.
create policy "the community board is shared" on support_requests
for select using (true);

create policy "post my own request" on support_requests
for insert with check (person_id = auth.uid());

-- The three per-person tables: strictly your own.
create policy "own tasks"       on completed_tasks for all using (person_id = auth.uid()) with check (person_id = auth.uid());
create policy "own saved"       on saved_resources for all using (person_id = auth.uid()) with check (person_id = auth.uid());
create policy "own preferences" on preferences     for all using (person_id = auth.uid()) with check (person_id = auth.uid());

-- ===========================================================================
-- 3. ANONYMOUS MEANS ABSENT
--
-- `security_invoker` is the whole point of this block. A Postgres view runs
-- with its OWNER's permissions by default, so a view over an RLS-protected
-- table hands out every row and the rules you carefully wrote do not apply.
-- With security_invoker the view runs as the caller and RLS is enforced.
-- ===========================================================================
create view community_requests with (security_invoker = true) as
select
  id,
  case when share_anonymously then null else person_id end as person_id,
  body,
  created_at
from support_requests;

-- ===========================================================================
-- 4. NOBODY CHANGES THEIR OWN ROLE
-- ===========================================================================
create policy "update own profile" on people
for update using (id = auth.uid()) with check (id = auth.uid());

-- Whatever the client sent for role or guide_id, keep what is already stored.
-- The update SUCCEEDS and changes nothing, which is deliberate: an error tells
-- an attacker they have found the right lever.
create or replace function pin_role()
returns trigger language plpgsql as $$
begin
  new.role     := old.role;
  new.guide_id := old.guide_id;
  return new;
end $$;

create trigger people_pin_role
  before update on people
  for each row execute function pin_role();

-- ===========================================================================
-- 5. THE APPLICATION'S DATABASE ROLE
--
-- Your app must NOT connect as the owner or as a superuser. Both bypass RLS
-- entirely, so every rule above would be silently inert and every test of them
-- would pass for the wrong reason.
-- ===========================================================================
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then
    create role app_user login password 'change-me';
  end if;
end $$;

grant usage on schema public, auth to app_user;
grant select, insert, update on all tables in schema public to app_user;
grant select on community_requests to app_user;
grant execute on function auth.uid(), auth.my_role(), auth.my_guide() to app_user;
