'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from './Brand';
import {
  CommunityView,
  LibraryView,
  MessagesView,
  PeopleView,
  ProfileView,
  SettingsView,
} from './FeatureViews';
import { MiniOrbit } from './MiniOrbit';
import { RoleOverview } from './RoleOverview';
import { JOURNEY_TASKS, ROLE_WORKSPACE_COPY, WORKSPACE_EVENTS } from '@/lib/content';
import { useStore } from '@/lib/store';
import { ROLE_LABEL, type Person } from '@/lib/types';

type WorkspaceView =
  | 'overview'
  | 'people'
  | 'community'
  | 'library'
  | 'messages'
  | 'profile'
  | 'settings';

const VIEW_COPY: Record<
  WorkspaceView,
  { title: string; description: string }
> = {
  overview: {
    title: 'Overview',
    description: 'The signals and next actions that matter now.',
  },
  people: {
    title: 'People and journey',
    description: 'Plans, assignments, actions, and private local notes.',
  },
  community: {
    title: 'Community',
    description: 'Updates, aggregate progress, and user-chosen support.',
  },
  library: {
    title: 'Library',
    description: 'A small shelf of neutral guided-learning resources.',
  },
  messages: {
    title: 'Messages',
    description: 'Local-only conversations for testing the support workflow.',
  },
  profile: {
    title: 'Profile',
    description: 'A minimal fictional identity with no sensitive fields.',
  },
  settings: {
    title: 'Settings',
    description: 'Comfort, motion, room theme, tutorial, and local data.',
  },
};

const TUTORIAL = [
  {
    title: 'Welcome to your workspace',
    body: 'Each role sees only the tools needed for its part of the journey.',
    symbol: '◇',
  },
  {
    title: 'Local means local',
    body: 'Notes, messages, settings, and progress remain inside this browser.',
    symbol: '◉',
  },
  {
    title: 'Move with one clear step',
    body: 'Plans use short actions, stage progress, and preparation notes.',
    symbol: '→',
  },
  {
    title: 'Mini Orbit is attached',
    body: 'Use locally generated ambience and a focus timer without streaming audio.',
    symbol: 'O',
  },
];

export function WorkspaceShell({ current }: { current: Person }) {
  const { store, signOut } = useStore();
  const router = useRouter();
  const [view, setView] = useState<WorkspaceView>('overview');
  const [focusPersonId, setFocusPersonId] = useState<string>();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const viewCopy =
    view === 'people' && current.role === 'member'
      ? {
          title: 'My room',
          description: 'Your journey, notes, focus tools, and Mini Orbit.',
        }
      : VIEW_COPY[view];

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notifications = useMemo(() => {
    if (current.role === 'coordinator') {
      return store.completed_task_ids.includes('approval-morgan')
        ? []
        : ['A fictional onboarding request is ready for review.'];
    }
    if (current.role === 'guide') {
      const memberIds = new Set(
        store.people
          .filter(
            (person) =>
              person.role === 'member' && person.guide_id === current.id,
          )
          .map((person) => person.id),
      );
      const openActions = JOURNEY_TASKS.filter(
        (task) =>
          memberIds.has(task.person_id) &&
          !store.completed_task_ids.includes(task.id),
      ).length;
      const sessions = WORKSPACE_EVENTS.filter((event) =>
        memberIds.has(event.person_id),
      ).length;
      return [
        `${openActions} support actions remain open.`,
        `${sessions} sample sessions are coming up.`,
      ];
    }
    const openTasks = JOURNEY_TASKS.filter(
      (task) =>
        task.person_id === current.id &&
        !store.completed_task_ids.includes(task.id),
    ).length;
    return openTasks ? [`${openTasks} small actions are ready for you.`] : [];
  }, [current, store.completed_task_ids, store.people]);

  const navItems: Array<{
    id: WorkspaceView;
    label: string;
    symbol: string;
  }> = [
    { id: 'overview', label: 'Overview', symbol: '⌂' },
    {
      id: 'people',
      label: current.role === 'member' ? 'My room' : 'People',
      symbol: current.role === 'member' ? '◇' : '◎',
    },
    { id: 'community', label: 'Community', symbol: '◌' },
    { id: 'library', label: 'Library', symbol: '▤' },
    { id: 'messages', label: 'Messages', symbol: '✉' },
    { id: 'profile', label: 'Profile', symbol: '○' },
    { id: 'settings', label: 'Settings', symbol: '⚙' },
  ];

  const navigate = (next: WorkspaceView) => {
    setView(next);
    setNotificationsOpen(false);
  };

  const openPeople = (personId?: string) => {
    setFocusPersonId(personId);
    navigate('people');
  };

  const switchRole = () => {
    signOut();
    router.push('/');
  };

  return (
    <>
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>

      <header className="workspace-header expanded-header">
        <Brand />
        <nav className="header-tools" aria-label="Quick access">
          <button onClick={() => navigate('community')} aria-label="Open community">
            ◌
          </button>
          <button onClick={() => navigate('library')} aria-label="Open library">
            ▤
          </button>
          <button onClick={() => navigate('messages')} aria-label="Open messages">
            ✉
          </button>
          <div className="notification-wrap">
            <button
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label={`${notifications.length} notifications`}
              aria-expanded={notificationsOpen}
            >
              ♢
              {notifications.length > 0 && <span>{notifications.length}</span>}
            </button>
            {notificationsOpen && (
              <div className="notification-panel">
                <p className="rail-kicker">Notifications</p>
                {notifications.length === 0 ? (
                  <p>You are all caught up.</p>
                ) : (
                  notifications.map((item) => <p key={item}>{item}</p>)
                )}
                <button onClick={() => navigate('people')}>Open workspace →</button>
              </div>
            )}
          </div>
        </nav>
        <button
          className="workspace-account account-button"
          onClick={() => navigate('profile')}
          aria-label={`Open profile for ${current.name}`}
        >
          <span className="workspace-avatar">{initials(current.name)}</span>
          <span>
            <strong>{current.name}</strong>
            <small>{ROLE_LABEL[current.role]}</small>
          </span>
        </button>
        <button className="button button-outline small" onClick={switchRole}>
          Switch role
        </button>
      </header>

      <div className="workspace-layout feature-layout">
        <aside className="workspace-sidebar feature-sidebar">
          <p className="sidebar-label">
            {current.role === 'member' ? 'My room' : 'Workspace'}
          </p>
          <nav aria-label="Workspace sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={view === item.id ? 'sidebar-link active' : 'sidebar-link'}
                onClick={() => navigate(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.symbol}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-role">
            <span
              className={`role-symbol role-${current.role}`}
              aria-hidden="true"
            >
              {ROLE_LABEL[current.role][0]}
            </span>
            <div>
              <small>Your role</small>
              <strong>{ROLE_LABEL[current.role]}</strong>
            </div>
          </div>

          <button
            className="sidebar-tutorial"
            onClick={() => setTutorialStep(0)}
          >
            <span aria-hidden="true">✦</span>
            Take the tutorial
          </button>
          <button className="sidebar-switch" onClick={switchRole}>
            ← Choose another role
          </button>
        </aside>

        <main className="workspace-main feature-main" id="workspace-main">
          <section className="workspace-welcome feature-welcome">
            <div>
              <p className="eyebrow dark">
                {view === 'overview'
                  ? ROLE_WORKSPACE_COPY[current.role].title
                  : viewCopy.title}
              </p>
              <h1>
                {view === 'overview'
                  ? `Welcome, ${firstName(current.name)}.`
                  : viewCopy.title}
              </h1>
              <p>
                {view === 'overview'
                  ? ROLE_WORKSPACE_COPY[current.role].description
                  : viewCopy.description}
              </p>
            </div>
            <span className="local-status">
              <i aria-hidden="true" /> Saved on this device
            </span>
          </section>

          {view === 'overview' && (
            <RoleOverview
              current={current}
              onOpenPeople={openPeople}
              onToast={setToast}
            />
          )}
          {view === 'people' && (
            <PeopleView
              key={focusPersonId ?? 'people'}
              current={current}
              initialPersonId={focusPersonId}
              onToast={setToast}
            />
          )}
          {view === 'community' && (
            <CommunityView current={current} onToast={setToast} />
          )}
          {view === 'library' && (
            <LibraryView current={current} onToast={setToast} />
          )}
          {view === 'messages' && (
            <MessagesView current={current} onToast={setToast} />
          )}
          {view === 'profile' && (
            <ProfileView current={current} onToast={setToast} />
          )}
          {view === 'settings' && (
            <SettingsView
              current={current}
              onToast={setToast}
              onOpenTutorial={() => setTutorialStep(0)}
            />
          )}
        </main>

        <aside className="workspace-rail feature-rail">
          {current.role !== 'member' && <MiniOrbit />}
          <section className="rail-card privacy-rail">
            <p className="rail-kicker">Privacy boundary</p>
            <h2>Nothing leaves this browser</h2>
            <p>
              Open Beacon has no account server, remote mailbox, analytics, or
              streaming service.
            </p>
            <dl className="privacy-facts">
              <div>
                <dt>Personal data</dt>
                <dd>Not requested</dd>
              </div>
              <div>
                <dt>Network sync</dt>
                <dd>None</dd>
              </div>
              <div>
                <dt>Role access</dt>
                <dd>Demonstration</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          <span aria-hidden="true">✓</span>
          {toast}
        </div>
      )}

      {tutorialStep !== null && (
        <div className="tutorial-backdrop">
          <section
            className="tutorial-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
          >
            <button
              className="tutorial-close"
              onClick={() => setTutorialStep(null)}
              aria-label="Close tutorial"
            >
              ×
            </button>
            <div className="tutorial-symbol" aria-hidden="true">
              {TUTORIAL[tutorialStep].symbol}
            </div>
            <p className="rail-kicker">
              Step {tutorialStep + 1} of {TUTORIAL.length}
            </p>
            <h2 id="tutorial-title">{TUTORIAL[tutorialStep].title}</h2>
            <p>{TUTORIAL[tutorialStep].body}</p>
            <div className="tutorial-progress" aria-hidden="true">
              {TUTORIAL.map((step, index) => (
                <span
                  key={step.title}
                  className={index <= tutorialStep ? 'complete' : ''}
                />
              ))}
            </div>
            <div className="tutorial-actions">
              <button
                className="button button-outline-dark"
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep((step) => Math.max(0, (step ?? 0) - 1))}
              >
                Back
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  if (tutorialStep === TUTORIAL.length - 1) {
                    setTutorialStep(null);
                    setToast('Tutorial complete. Explore at your own pace.');
                  } else {
                    setTutorialStep(tutorialStep + 1);
                  }
                }}
              >
                {tutorialStep === TUTORIAL.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function firstName(name: string) {
  return name.split(' ')[0];
}

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
