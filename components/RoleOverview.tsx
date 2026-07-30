'use client';

import type { CSSProperties } from 'react';
import { JourneyBar } from './JourneyBar';
import { JOURNEY_TASKS, WORKSPACE_EVENTS } from '@/lib/content';
import { LAST_STAGE, STAGES, stageAt } from '@/lib/journey';
import { useStore } from '@/lib/store';
import type { Person } from '@/lib/types';

interface RoleOverviewProps {
  current: Person;
  onOpenPeople: (personId?: string) => void;
  onToast: (message: string) => void;
}

export function RoleOverview({
  current,
  onOpenPeople,
  onToast,
}: RoleOverviewProps) {
  if (current.role === 'coordinator') return <CoordinatorOverview />;
  if (current.role === 'guide') {
    return (
      <GuideOverview
        guide={current}
        onOpenPeople={onOpenPeople}
        onToast={onToast}
      />
    );
  }
  return (
    <MemberOverview
      member={current}
      onOpenPeople={onOpenPeople}
      onToast={onToast}
    />
  );
}

function CoordinatorOverview() {
  const { store } = useStore();
  const members = store.people.filter((person) => person.role === 'member');
  const guides = store.people.filter((person) => person.role === 'guide');
  const completed = members.filter(
    (member) => member.stage_index === LAST_STAGE,
  ).length;
  const tasksComplete = JOURNEY_TASKS.filter((task) =>
    store.completed_task_ids.includes(task.id),
  ).length;

  return (
    <div className="feature-stack view-enter">
      <div className="metric-grid">
        <Metric value={members.length} label="Members" detail="Fictional sample people" />
        <Metric value={guides.length} label="Guides" detail="Small support groups" />
        <Metric value={completed} label="Completed" detail="Finished journeys" />
        <Metric
          value={tasksComplete}
          label="Actions done"
          detail="Across local checklists"
        />
      </div>

      <section className="workspace-card progress-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Aggregate progress</p>
            <h2>Journey health</h2>
          </div>
          <span>Names excluded from this chart</span>
        </div>
        <div className="stage-chart">
          {STAGES.map((stage, index) => {
            const count = members.filter(
              (member) => member.stage_index === index,
            ).length;
            const height = members.length
              ? Math.max(12, (count / members.length) * 100)
              : 12;
            return (
              <div className="stage-column" key={stage.key}>
                <div className="stage-column-track">
                  <span
                    style={{
                      height: `${height}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
                <strong>{count}</strong>
                <small>{stage.label}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="workspace-card coordinator-brief">
        <div>
          <p className="rail-kicker">Needs attention</p>
          <h2>One sample approval</h2>
          <p>
            Review the fictional onboarding request in People. No invitation is
            sent and no account is created.
          </p>
        </div>
        <span aria-hidden="true">1</span>
      </section>
    </div>
  );
}

function GuideOverview({
  guide,
  onOpenPeople,
  onToast,
}: {
  guide: Person;
  onOpenPeople: (personId?: string) => void;
  onToast: (message: string) => void;
}) {
  const { store, advance } = useStore();
  const members = store.people.filter(
    (person) => person.role === 'member' && person.guide_id === guide.id,
  );
  const openTasks = JOURNEY_TASKS.filter(
    (task) =>
      members.some((member) => member.id === task.person_id) &&
      !store.completed_task_ids.includes(task.id),
  );
  const events = WORKSPACE_EVENTS.filter((event) =>
    members.some((member) => member.id === event.person_id),
  );

  return (
    <div className="feature-stack view-enter">
      <div className="attention-row">
        <button onClick={() => onOpenPeople()}>
          <span>{openTasks.length}</span>
          <strong>open actions</strong>
          <small>Prepare the next useful step</small>
        </button>
        <button onClick={() => onOpenPeople()}>
          <span>{events.length}</span>
          <strong>upcoming sessions</strong>
          <small>Across the next seven days</small>
        </button>
        <button onClick={() => onOpenPeople()}>
          <span>{store.notes.filter((note) => note.author_id === guide.id).length}</span>
          <strong>private notes</strong>
          <small>Stored only on this device</small>
        </button>
      </div>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Next seven days</p>
            <h2>Upcoming sessions</h2>
          </div>
        </div>
        <div className="event-list">
          {events.map((event) => {
            const member = members.find(
              (person) => person.id === event.person_id,
            );
            return (
              <article key={event.id}>
                <span aria-hidden="true">◇</span>
                <div>
                  <strong>{event.title}</strong>
                  <small>{member?.name} · {event.when}</small>
                </div>
                <button onClick={() => onOpenPeople(member?.id)}>
                  Open plan →
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">People in your care</p>
            <h2>Support queue</h2>
          </div>
          <span>{members.length} people</span>
        </div>
        <div className="support-grid">
          {members.map((member, index) => {
            const stage = stageAt(member.stage_index);
            const complete = member.stage_index === LAST_STAGE;
            const tasks = JOURNEY_TASKS.filter(
              (task) =>
                task.person_id === member.id &&
                !store.completed_task_ids.includes(task.id),
            ).length;
            return (
              <article
                key={member.id}
                style={{ '--item-index': index } as CSSProperties}
              >
                <header>
                  <span className="person-choice-avatar">
                    {initials(member.name)}
                  </span>
                  <div>
                    <h3>{member.name}</h3>
                    <p>{stage.label} · {tasks} open actions</p>
                  </div>
                </header>
                <JourneyBar current={member.stage_index} />
                <div className="support-actions">
                  <button
                    className="button button-outline-dark small"
                    onClick={() => onOpenPeople(member.id)}
                  >
                    Open plan
                  </button>
                  <button
                    className="button button-primary small"
                    disabled={complete}
                    onClick={() => {
                      advance(member.id);
                      onToast(
                        complete
                          ? 'This journey is already complete.'
                          : `${member.name} moved forward.`,
                      );
                    }}
                  >
                    {complete ? 'Complete' : 'Next stage'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MemberOverview({
  member,
  onOpenPeople,
  onToast,
}: {
  member: Person;
  onOpenPeople: (personId?: string) => void;
  onToast: (message: string) => void;
}) {
  const { store, toggleTask } = useStore();
  const guide = store.people.find((person) => person.id === member.guide_id);
  const stage = stageAt(member.stage_index);
  const tasks = JOURNEY_TASKS.filter((task) => task.person_id === member.id);
  const event = WORKSPACE_EVENTS.find(
    (item) => item.person_id === member.id,
  );

  return (
    <div className="feature-stack view-enter">
      <section className="member-focus expanded">
        <div>
          <p className="eyebrow">Your current stage</p>
          <h2>{stage.label}</h2>
          <p>{stage.blurb}. {guide && `${guide.name} is walking with you.`}</p>
          <button
            className="button button-light small"
            onClick={() => onOpenPeople(member.id)}
          >
            Open your room
          </button>
        </div>
        <div className="member-orbit-preview" aria-hidden="true">
          <span />
          <span />
          <strong>{member.stage_index + 1}</strong>
        </div>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Personal journey</p>
            <h2>Your path</h2>
          </div>
          {event && <span>{event.title} · {event.when}</span>}
        </div>
        <JourneyBar current={member.stage_index} />
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">This week</p>
            <h2>Small actions</h2>
          </div>
        </div>
        <div className="task-list">
          {tasks.map((task) => {
            const complete = store.completed_task_ids.includes(task.id);
            return (
              <label className={complete ? 'task-row complete' : 'task-row'} key={task.id}>
                <input
                  type="checkbox"
                  checked={complete}
                  onChange={() => {
                    toggleTask(task.id);
                    onToast(complete ? 'Action reopened.' : 'Action completed.');
                  }}
                />
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.detail}</small>
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({
  value,
  label,
  detail,
}: {
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <div>
        <h2>{label}</h2>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
