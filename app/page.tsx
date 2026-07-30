'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { STAGES } from '@/lib/journey';
import { useStore } from '@/lib/store';
import { ROLE_LABEL, type Role } from '@/lib/types';

const ROLE_DETAILS: Record<
  Role,
  { symbol: string; summary: string; action: string }
> = {
  coordinator: {
    symbol: 'C',
    summary: 'See the full journey and where support may be needed.',
    action: 'View the whole journey',
  },
  guide: {
    symbol: 'G',
    summary: 'Walk with assigned members and help each one move forward.',
    action: 'Support a small group',
  },
  member: {
    symbol: 'M',
    summary: 'See a personal path, current stage, and the next clear step.',
    action: 'Follow a personal path',
  },
};

const ROLE_ORDER: Role[] = ['coordinator', 'guide', 'member'];

const FEATURE_CARDS = [
  {
    symbol: '◇',
    title: 'Journey plans',
    detail: 'Stages, small actions, private notes, and upcoming sessions.',
  },
  {
    symbol: '✉',
    title: 'Local messages',
    detail: 'Test support conversations without a mail server or account.',
  },
  {
    symbol: '◌',
    title: 'Community',
    detail: 'Announcements, aggregate progress, and user-chosen sharing.',
  },
  {
    symbol: '▤',
    title: 'Learning shelf',
    detail: 'Search, filter, and save neutral resources on this device.',
  },
  {
    symbol: '✓',
    title: 'Focus tools',
    detail: 'Checklists, reflection notes, room themes, and a timer.',
  },
  {
    symbol: 'O',
    title: 'Mini Orbit',
    detail: 'Locally generated ambience with no streaming or recording.',
  },
];

export default function Home() {
  const { store, current, signInAs, reset } = useStore();
  const router = useRouter();

  const enter = (id: string) => {
    signInAs(id);
    router.push('/dashboard/');
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="home-header">
        <nav className="nav-shell" aria-label="Primary navigation">
          <Brand />
          <div className="nav-links">
            <a href="#journey">Journey</a>
            <a href="#roles">Roles</a>
          </div>
        </nav>

        <div className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true">●</span> Private by design
            </p>
            <h1>
              A clear path,
              <span> shared with care.</span>
            </h1>
            <p className="hero-lead">
              Learn how one simple journey can look different for the people
              coordinating it, guiding it, and moving through it.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#roles">
                Choose a role
              </a>
              {current && (
                <button
                  className="button button-light"
                  onClick={() => router.push('/dashboard/')}
                >
                  Continue as {current.name}
                </button>
              )}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="signal-card signal-card-back">
              <span>Guide</span>
              <strong>Steady support</strong>
            </div>
            <div className="signal-card signal-card-front">
              <span>Today&apos;s step</span>
              <strong>Grow through practice</strong>
              <div className="signal-line">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>

        <div className="privacy-strip" aria-label="Privacy summary">
          <span>No account</span>
          <span>No server</span>
          <span>No tracking</span>
          <strong>Saved only in this browser</strong>
        </div>
      </header>

      <main id="main-content">
        <section className="section-shell journey-section" id="journey">
          <div className="section-heading centered">
            <p className="eyebrow dark">One shared journey</p>
            <h2>Five steps. One clear direction.</h2>
            <p>
              The stages are neutral and easy to adapt for courses, mentoring,
              onboarding, or other guided learning.
            </p>
          </div>

          <ol className="journey-cards">
            {STAGES.map((stage, index) => (
              <li key={stage.key}>
                <span
                  className="stage-number"
                  style={{ backgroundColor: stage.color }}
                >
                  {index + 1}
                </span>
                <strong>{stage.label}</strong>
                <small>{stage.blurb}</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="roles-section" id="roles">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow dark">Explore every perspective</p>
              <h2>Everyone has a useful place.</h2>
              <p>
                Pick a fictional person to enter the sample workspace from that
                role&apos;s point of view.
              </p>
            </div>

            <div className="role-groups">
              {ROLE_ORDER.map((role) => {
                const details = ROLE_DETAILS[role];
                const people = store.people.filter(
                  (person) => person.role === role,
                );

                return (
                  <article className="role-group" key={role}>
                    <div className="role-group-heading">
                      <span className={`role-symbol role-${role}`}>
                        {details.symbol}
                      </span>
                      <div>
                        <h3>{ROLE_LABEL[role]}</h3>
                        <p>{details.summary}</p>
                      </div>
                    </div>
                    <div className="person-choices">
                      {people.map((person) => (
                        <button
                          className="person-choice"
                          key={person.id}
                          onClick={() => enter(person.id)}
                          aria-label={`Open as ${person.name}, ${ROLE_LABEL[role]}`}
                        >
                          <span className="person-choice-avatar">
                            {initials(person.name)}
                          </span>
                          <span>
                            <strong>{person.name}</strong>
                            <small>{details.action}</small>
                          </span>
                          <span className="choice-arrow" aria-hidden="true">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-shell features-section">
          <div className="section-heading centered">
            <p className="eyebrow dark">A complete local workspace</p>
            <h2>More than a progress bar.</h2>
            <p>
              Open a role to explore the tools that support planning,
              communication, reflection, community, and focused learning.
            </p>
          </div>
          <div className="feature-card-grid">
            {FEATURE_CARDS.map((feature, index) => (
              <article
                key={feature.title}
                style={{ '--item-index': index } as CSSProperties}
              >
                <span>{feature.symbol}</span>
                <h3>{feature.title}</h3>
                <p>{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell trust-section">
          <div className="trust-card">
            <div>
              <p className="eyebrow dark">A safe learning space</p>
              <h2>Your exploration stays with you.</h2>
              <p>
                Open Beacon uses fictional sample data and browser storage. It
                does not send your choices or progress anywhere.
              </p>
            </div>
            <ul>
              <li>Works without an account</li>
              <li>Continues after a refresh</li>
              <li>Can be reset at any time</li>
            </ul>
          </div>
          <button className="text-button" onClick={reset}>
            Reset sample data
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell footer-inner">
          <Brand />
          <p>A small, private learning application.</p>
        </div>
      </footer>
    </>
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
