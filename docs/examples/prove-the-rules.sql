-- Prove the rules. Do not take them on trust.
--
--   createdb beacon
--   psql -d beacon -f docs/examples/schema.sql
--   psql -d beacon -f docs/examples/prove-the-rules.sql
--
-- Every check below is an ATTACK, run as a second account that should fail.
-- Reading a policy and believing it is not the same as watching it refuse:
-- the first draft of schema.sql read perfectly and contained two defects that
-- broke the application outright.
--
-- Every line must print PASS. Any FAIL is a real hole.
--
-- NOTE ON HOW THIS RUNS. Seeding happens as the owner, who bypasses RLS — that
-- is why the inserts work. The checks then use `set role app_user`, because a
-- superuser or table owner bypasses RLS and would make every check pass for
-- the wrong reason. That mistake is the most common way somebody "proves"
-- rules that do not actually work.

\set ON_ERROR_STOP on
\pset tuples_only on

-- --------------------------------------------------------------- seed ------
truncate messages, notes, support_requests, completed_tasks, saved_resources,
         preferences, people restart identity cascade;

insert into people (id, name, role, guide_id, stage_index) values
  ('11111111-1111-1111-1111-111111111111', 'Alex Rivera', 'coordinator', null, 0),
  ('22222222-2222-2222-2222-222222222222', 'Sam Okafor',  'guide',       null, 0),
  ('33333333-3333-3333-3333-333333333333', 'Priya Nair',  'guide',       null, 0),
  ('44444444-4444-4444-4444-444444444444', 'Jordan Lee',  'member', '22222222-2222-2222-2222-222222222222', 1),
  ('55555555-5555-5555-5555-555555555555', 'Chris Diaz',  'member', '33333333-3333-3333-3333-333333333333', 0);

insert into notes (author_id, subject_id, body) values
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
   'Jordan is finding this stage hard. Go slowly.');

insert into messages (author_id, participant_id, body) values
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
   'How did this week go?');

insert into support_requests (person_id, body, share_anonymously) values
  ('44444444-4444-4444-4444-444444444444', 'Please pray for my father.', false),
  ('55555555-5555-5555-5555-555555555555', 'I am struggling this month.', true);

-- Everything below runs as the application, not as the owner.
set role app_user;

-- 1. A SECOND GUIDE CANNOT READ THE FIRST ONE'S PRIVATE NOTES ---------------
set app.current_user_id = '33333333-3333-3333-3333-333333333333';
select case when count(*) = 0 then 'PASS' else 'FAIL' end
       || '  a second guide reads ' || count(*) || ' of the first guide''s notes (want 0)'
from notes;

-- 2. ...AND THE AUTHOR STILL READS THEIR OWN -------------------------------
set app.current_user_id = '22222222-2222-2222-2222-222222222222';
select case when count(*) = 1 then 'PASS' else 'FAIL' end
       || '  the author reads ' || count(*) || ' of their own notes (want 1)'
from notes;

-- 3. SOMEBODY OUTSIDE A CONVERSATION CANNOT READ IT ------------------------
set app.current_user_id = '55555555-5555-5555-5555-555555555555';
select case when count(*) = 0 then 'PASS' else 'FAIL' end
       || '  an outsider reads ' || count(*) || ' messages of a conversation (want 0)'
from messages;

-- 4. A GUIDE SEES THEMSELVES AND THEIR OWN MEMBER, AND NOBODY ELSE ---------
set app.current_user_id = '22222222-2222-2222-2222-222222222222';
select case when count(*) = 2 then 'PASS' else 'FAIL' end
       || '  a guide sees ' || count(*) || ' people: self + own member (want 2)'
from people;

-- 5. A MEMBER CAN SEE THEIR OWN GUIDE ---------------------------------------
--    Without this the member's room has no guide name and their messages
--    list is empty, so they cannot contact the person supporting them.
set app.current_user_id = '44444444-4444-4444-4444-444444444444';
select case when count(*) = 1 then 'PASS' else 'FAIL' end
       || '  a member can see their own guide (want 1)'
from people where role = 'guide';

-- 6. ...BUT NOT THE OTHER GUIDE OR THE OTHER MEMBER -------------------------
select case when count(*) = 2 then 'PASS' else 'FAIL' end
       || '  a member sees ' || count(*) || ' people in total: self + guide (want 2)'
from people;

-- 7. A COORDINATOR SEES EVERYONE -------------------------------------------
set app.current_user_id = '11111111-1111-1111-1111-111111111111';
select case when count(*) = 5 then 'PASS' else 'FAIL' end
       || '  a coordinator sees ' || count(*) || ' people (want 5)'
from people;

-- 8. ANONYMOUS MEANS ABSENT, NOT HIDDEN ------------------------------------
set app.current_user_id = '33333333-3333-3333-3333-333333333333';
select case when count(*) = 1 then 'PASS' else 'FAIL' end
       || '  the anonymous request carries no person id at all (want 1 such row)'
from community_requests where person_id is null;

-- 9. THE NAMED REQUEST STILL CARRIES ITS NAME ------------------------------
select case when count(*) = 1 then 'PASS' else 'FAIL' end
       || '  a request shared under a name keeps it (want 1)'
from community_requests where person_id is not null;

-- 10. NOBODY PROMOTES THEMSELVES -------------------------------------------
set app.current_user_id = '55555555-5555-5555-5555-555555555555';
update people set role = 'coordinator' where id = '55555555-5555-5555-5555-555555555555';
select case when role = 'member' then 'PASS' else 'FAIL' end
       || '  after trying to become coordinator, the role is still ' || role
from people where id = '55555555-5555-5555-5555-555555555555';

-- 11. NOBODY REASSIGNS SOMEBODY ELSE'S MEMBER ------------------------------
update people set guide_id = '55555555-5555-5555-5555-555555555555'
where id = '44444444-4444-4444-4444-444444444444';
set app.current_user_id = '11111111-1111-1111-1111-111111111111';
select case when guide_id = '22222222-2222-2222-2222-222222222222' then 'PASS' else 'FAIL' end
       || '  the member is still with their original guide'
from people where id = '44444444-4444-4444-4444-444444444444';

-- 12. A VIEW MUST NOT BE A HOLE THROUGH RLS --------------------------------
--     A Postgres view runs as its OWNER unless security_invoker is set, which
--     hands out every underlying row regardless of policy.
--
--     THIS IS A STRUCTURAL CHECK, DELIBERATELY, and the reason is worth
--     knowing. The first version compared the row count through the view with
--     the row count from the table and called them matching a pass. They match
--     whether or not security_invoker is set, because the community board is
--     readable by everyone by design — so the check passed with the option
--     removed. It was testing nothing.
--
--     The behaviour is genuinely unobservable on a table everyone may read,
--     so the option itself is what gets asserted. If you add a view over
--     something private, add a behavioural check there instead.
reset role;
select case when 'security_invoker=true' = any(coalesce(c.reloptions, '{}'))
            then 'PASS' else 'FAIL' end
       || '  the community_requests view sets security_invoker, so RLS applies to it'
from pg_class c
where c.relname = 'community_requests' and c.relkind = 'v';
