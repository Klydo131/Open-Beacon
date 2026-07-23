'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ROLE_LABEL, type Person } from '@/lib/types';
import { STAGES, stageAt, LAST_STAGE } from '@/lib/journey';
import { JourneyBar } from '@/components/JourneyBar';

export default function Dashboard() {
  const { current, signOut } = useStore();
  const router = useRouter();

  // No one "signed in" — send them back to pick a role.
  useEffect(() => {
    if (!current) router.replace('/');
  }, [current, router]);
  if (!current) return null;

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">Open Beacon</div>
          <div className="spacer" />
          <span className="small" style={{ opacity: 0.8 }}>
            {current.name} · {ROLE_LABEL[current.role]}
          </span>
          <button
            className="btn light small"
            onClick={() => {
              signOut();
              router.push('/');
            }}
          >
            Switch
          </button>
        </div>
      </div>

      <div className="container">
        {current.role === 'coordinator' && <CoordinatorView />}
        {current.role === 'guide' && <GuideView me={current} />}
        {current.role === 'member' && <MemberView me={current} />}
      </div>
    </>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Coordinator: the whole-program view — counts by stage + every member.
function CoordinatorView() {
  const { store } = useStore();
  const members = store.people.filter((p) => p.role === 'member');
  const nameById = new Map(store.people.map((p) => [p.id, p.name]));

  const counts = STAGES.map(
    (s, i) => members.filter((m) => m.stage_index === i).length,
  );

  return (
    <>
      <h2>Everyone&rsquo;s progress</h2>
      <p className="muted small">
        A coordinator sees the whole program at a glance — how many people are at
        each stage.
      </p>

      <div className="stats" style={{ marginBottom: 20 }}>
        {STAGES.map((s, i) => (
          <div className="stat" key={s.key}>
            <div className="n">{counts[i]}</div>
            <div className="l">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Members</h3>
        {members.map((m) => {
          const st = stageAt(m.stage_index);
          return (
            <div className="person-row" key={m.id}>
              <div className="avatar">{initials(m.name)}</div>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div className="muted small">
                  Guide: {m.guide_id ? nameById.get(m.guide_id) : 'Unassigned'}
                </div>
              </div>
              <span className="pill" style={{ background: st.color }}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Guide: only the members assigned to me, with a button to move them forward.
function GuideView({ me }: { me: Person }) {
  const { store, advance } = useStore();
  const mine = store.people.filter(
    (p) => p.role === 'member' && p.guide_id === me.id,
  );

  return (
    <>
      <h2>Your members</h2>
      <p className="muted small">
        A guide supports a handful of people and helps them take the next step.
      </p>

      {mine.length === 0 && (
        <div className="card muted">No members assigned yet.</div>
      )}

      {mine.map((m) => {
        const atEnd = m.stage_index >= LAST_STAGE;
        return (
          <div className="card" key={m.id}>
            <div className="person-row" style={{ paddingTop: 0 }}>
              <div className="avatar">{initials(m.name)}</div>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div className="muted small">{stageAt(m.stage_index).blurb}</div>
              </div>
              {atEnd ? (
                <span className="pill" style={{ background: '#22C55E' }}>
                  Complete 🎉
                </span>
              ) : (
                <button className="btn small" onClick={() => advance(m.id)}>
                  Next step →
                </button>
              )}
            </div>
            <JourneyBar current={m.stage_index} />
          </div>
        );
      })}
    </>
  );
}

// Member: my own journey, in a warm and simple view.
function MemberView({ me }: { me: Person }) {
  const { store } = useStore();
  const guide = store.people.find((p) => p.id === me.guide_id);
  const st = stageAt(me.stage_index);
  const atEnd = me.stage_index >= LAST_STAGE;

  return (
    <>
      <div className="hero">
        <p style={{ opacity: 0.75, margin: 0 }}>Welcome,</p>
        <h1>{me.name.split(' ')[0]}</h1>
        <p>
          You&rsquo;re at the <strong>{st.label}</strong> stage
          {guide ? <> — {guide.name} is walking with you.</> : '.'}
        </p>
      </div>

      <div className="card">
        <h3>Your journey</h3>
        <JourneyBar current={me.stage_index} />
        <p className="muted small" style={{ marginTop: 12 }}>
          {atEnd
            ? 'You’ve reached the end of the journey. Nicely done!'
            : `Next up: ${stageAt(me.stage_index + 1).label} — ${stageAt(me.stage_index + 1).blurb}.`}
        </p>
      </div>
    </>
  );
}
