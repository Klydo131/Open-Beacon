'use client';

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { JourneyBar } from './JourneyBar';
import { MiniOrbit } from './MiniOrbit';
import {
  ANNOUNCEMENTS,
  JOURNEY_TASKS,
  LEARNING_RESOURCES,
} from '@/lib/content';
import { LAST_STAGE, STAGES, stageAt } from '@/lib/journey';
import { useStore } from '@/lib/store';
import { ROLE_LABEL, type Person } from '@/lib/types';

interface ViewProps {
  current: Person;
  onToast: (message: string) => void;
}

export function PeopleView({
  current,
  onToast,
  initialPersonId,
}: ViewProps & { initialPersonId?: string }) {
  const {
    store,
    advance,
    reassignMember,
    toggleTask,
    addNote,
  } = useStore();
  const members = store.people.filter((person) => person.role === 'member');
  const guides = store.people.filter((person) => person.role === 'guide');
  const availableMembers =
    current.role === 'guide'
      ? members.filter((member) => member.guide_id === current.id)
      : current.role === 'member'
        ? [current]
        : members;
  const [selectedId, setSelectedId] = useState(
    initialPersonId ?? availableMembers[0]?.id ?? current.id,
  );
  const selected =
    availableMembers.find((person) => person.id === selectedId) ??
    availableMembers[0];
  const [note, setNote] = useState('');
  const approvalComplete = store.completed_task_ids.includes('approval-morgan');

  if (current.role === 'coordinator') {
    return (
      <div className="feature-stack view-enter">
        <section className="workspace-card privacy-banner">
          <span aria-hidden="true">◉</span>
          <div>
            <h2>Proportional oversight</h2>
            <p>
              Pairing and aggregate progress are visible here. Private notes and
              messages remain with the people directly involved.
            </p>
          </div>
        </section>

        {!approvalComplete && (
          <section className="workspace-card approval-card">
            <div className="card-heading">
              <div>
                <p className="rail-kicker">Local onboarding simulation</p>
                <h2>One learner is ready for review</h2>
              </div>
              <span>Fictional sample</span>
            </div>
            <div className="approval-person">
              <span className="person-choice-avatar">MC</span>
              <div>
                <strong>Morgan Chen</strong>
                <small>Requested the Member learning view</small>
              </div>
              <button
                className="button button-primary small"
                onClick={() => {
                  toggleTask('approval-morgan');
                  onToast('Sample learner approved on this device.');
                }}
              >
                Approve sample
              </button>
            </div>
          </section>
        )}

        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">People and pairing</p>
              <h2>Support assignments</h2>
            </div>
            <span>{members.length} fictional members</span>
          </div>
          <div className="assignment-list">
            {members.map((member) => (
              <article className="assignment-row" key={member.id}>
                <span className="person-choice-avatar">
                  {initials(member.name)}
                </span>
                <div>
                  <strong>{member.name}</strong>
                  <small>{stageAt(member.stage_index).label} stage</small>
                </div>
                <label>
                  <span>Guide</span>
                  <select
                    value={member.guide_id ?? ''}
                    onChange={(event) => {
                      reassignMember(member.id, event.target.value);
                      onToast('Support assignment updated.');
                    }}
                  >
                    {guides.map((guide) => (
                      <option key={guide.id} value={guide.id}>
                        {guide.name}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (!selected) return null;

  const tasks = JOURNEY_TASKS.filter((task) => task.person_id === selected.id);
  const notes = store.notes.filter((item) => item.subject_id === selected.id);
  const guide = store.people.find((person) => person.id === selected.guide_id);

  const submitNote = (event: FormEvent) => {
    event.preventDefault();
    if (addNote(selected.id, note)) {
      setNote('');
      onToast('Note saved only on this device.');
    }
  };

  return (
    <div className="feature-stack view-enter">
      {availableMembers.length > 1 && (
        <div className="people-switcher" aria-label="Choose a member">
          {availableMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedId(member.id)}
              aria-pressed={selected.id === member.id}
            >
              <span>{initials(member.name)}</span>
              {member.name}
            </button>
          ))}
        </div>
      )}

      <section className="member-plan">
        <div>
          <p className="eyebrow">Individual support plan</p>
          <h2>{current.role === 'member' ? 'Your journey' : selected.name}</h2>
          <p>
            {current.role === 'member'
              ? guide
                ? `${guide.name} is supporting this journey.`
                : 'A guide has not been assigned yet.'
              : stageAt(selected.stage_index).blurb}
          </p>
        </div>
        <div className="member-plan-stage">
          <span>{selected.stage_index + 1}</span>
          <small>of {STAGES.length}</small>
        </div>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Journey</p>
            <h2>{stageAt(selected.stage_index).label}</h2>
          </div>
          {current.role === 'guide' && selected.stage_index < LAST_STAGE && (
            <button
              className="button button-primary small"
              onClick={() => {
                advance(selected.id);
                onToast(`${selected.name} moved to the next sample stage.`);
              }}
            >
              Advance stage →
            </button>
          )}
        </div>
        <JourneyBar current={selected.stage_index} />
      </section>

      <div className="feature-two-column">
        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">Next actions</p>
              <h2>Small steps</h2>
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
                    onChange={() => toggleTask(task.id)}
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

        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">Private workspace notes</p>
              <h2>Reflections</h2>
            </div>
          </div>
          <div className="note-list">
            {notes.length === 0 && <p className="empty-copy">No notes yet.</p>}
            {notes.map((item) => {
              const author = store.people.find(
                (person) => person.id === item.author_id,
              );
              return (
                <article key={item.id}>
                  <strong>{author?.name ?? 'Sample user'}</strong>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
          <form className="compact-form" onSubmit={submitNote}>
            <label>
              <span>Add a note</span>
              <textarea
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Write a short reflection or preparation note"
              />
            </label>
            <button className="button button-primary small" disabled={!note.trim()}>
              Save note
            </button>
          </form>
        </section>
      </div>

      {current.role === 'member' && <MiniOrbit />}
    </div>
  );
}

export function CommunityView({ current, onToast }: ViewProps) {
  const { store, addSupportRequest } = useStore();
  const [request, setRequest] = useState('');
  const [share, setShare] = useState(false);
  const members = store.people.filter((person) => person.role === 'member');
  const sharedRequests = store.support_requests.filter(
    (item) => item.share_anonymously,
  );
  const ownRequests = store.support_requests.filter(
    (item) => item.person_id === current.id,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (addSupportRequest(request, share)) {
      setRequest('');
      setShare(false);
      onToast(share ? 'Shared anonymously on this device.' : 'Private request saved.');
    }
  };

  return (
    <div className="feature-stack view-enter">
      <section className="community-hero">
        <div>
          <p className="eyebrow">Shared learning space</p>
          <h2>Community</h2>
          <p>Announcements, encouragement, and user-chosen support requests.</p>
        </div>
        <div className="community-pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <div className="feature-two-column">
        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">Bulletin</p>
              <h2>Latest updates</h2>
            </div>
          </div>
          <div className="announcement-list">
            {ANNOUNCEMENTS.map((item, index) => (
              <article key={item.id} style={{ '--item-index': index } as CSSProperties}>
                <span>{item.tag}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">Journey together</p>
              <h2>Aggregate progress</h2>
            </div>
            <span>No private details</span>
          </div>
          <div className="community-stages">
            {STAGES.map((stage, index) => (
              <div key={stage.key}>
                <span style={{ backgroundColor: stage.color }} />
                <strong>
                  {
                    members.filter(
                      (member) => member.stage_index === index,
                    ).length
                  }
                </strong>
                <small>{stage.label}</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="feature-two-column">
        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">Ask for support</p>
              <h2>Your choice, every time</h2>
            </div>
          </div>
          <form className="compact-form" onSubmit={submit}>
            <label>
              <span>What support would help?</span>
              <textarea
                maxLength={500}
                value={request}
                onChange={(event) => setRequest(event.target.value)}
                placeholder="Write a short request"
              />
            </label>
            <label className="check-control">
              <input
                type="checkbox"
                checked={share}
                onChange={(event) => setShare(event.target.checked)}
              />
              <span>Show this anonymously on the community wall</span>
            </label>
            <p className="privacy-copy">
              Everything remains on this device. Sharing only changes who can
              see it inside this sample workspace.
            </p>
            <button className="button button-primary small" disabled={!request.trim()}>
              Save request
            </button>
          </form>
          {ownRequests.map((item) => (
            <article className="own-request" key={item.id}>
              <span>{item.share_anonymously ? 'Shared anonymously' : 'Only you'}</span>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className="workspace-card">
          <div className="card-heading">
            <div>
              <p className="rail-kicker">Anonymous wall</p>
              <h2>Support without exposure</h2>
            </div>
          </div>
          <div className="support-wall">
            <article>
              <span aria-hidden="true">“</span>
              <p>Help me stay consistent with one small practice this week.</p>
              <small>Anonymous sample request</small>
            </article>
            {sharedRequests.map((item) => (
              <article key={item.id}>
                <span aria-hidden="true">“</span>
                <p>{item.body}</p>
                <small>Anonymous local request</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function LibraryView({ current, onToast }: ViewProps) {
  const { store, toggleSavedResource } = useStore();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('All');
  const kinds = ['All', 'Guide', 'Exercise', 'Reading', 'Template'];
  const resources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return LEARNING_RESOURCES.filter(
      (resource) =>
        (kind === 'All' || resource.kind === kind) &&
        (!normalized ||
          resource.title.toLowerCase().includes(normalized) ||
          resource.summary.toLowerCase().includes(normalized) ||
          resource.tags.some((tag) => tag.includes(normalized))),
    );
  }, [kind, query]);

  return (
    <div className="feature-stack view-enter">
      <section className="library-hero">
        <div>
          <p className="eyebrow">Learning shelf</p>
          <h2>Resource library</h2>
          <p>
            Short, neutral materials for guided learning. Saved choices stay on
            this device.
          </p>
        </div>
        <div className="library-count">
          <strong>{store.saved_resource_ids.length}</strong>
          <span>saved</span>
        </div>
      </section>

      <div className="library-tools">
        <label>
          <span className="sr-only">Search resources</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the library"
          />
        </label>
        <div className="filter-chips" aria-label="Resource type">
          {kinds.map((option) => (
            <button
              key={option}
              onClick={() => setKind(option)}
              aria-pressed={kind === option}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="resource-grid">
        {resources.map((resource, index) => {
          const saved = store.saved_resource_ids.includes(resource.id);
          return (
            <article
              className="resource-card"
              key={resource.id}
              style={{ '--item-index': index } as CSSProperties}
            >
              <span className="resource-kind">{resource.kind}</span>
              <h3>{resource.title}</h3>
              <p>{resource.summary}</p>
              <div className="resource-tags">
                {resource.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button
                className={saved ? 'save-resource saved' : 'save-resource'}
                onClick={() => {
                  toggleSavedResource(resource.id);
                  onToast(saved ? 'Removed from your shelf.' : 'Saved to your shelf.');
                }}
                aria-pressed={saved}
              >
                {saved ? '✓ Saved' : '+ Save'}
              </button>
            </article>
          );
        })}
      </div>
      {resources.length === 0 && (
        <p className="empty-copy">No resources match that search.</p>
      )}
      <p className="feature-footnote">
        Viewing as {ROLE_LABEL[current.role]}. This library contains no external
        links or automatic downloads.
      </p>
    </div>
  );
}

export function MessagesView({ current, onToast }: ViewProps) {
  const { store, sendMessage } = useStore();
  const participants = useMemo(() => {
    if (current.role === 'member') {
      return store.people.filter((person) => person.id === current.guide_id);
    }
    if (current.role === 'guide') {
      return store.people.filter(
        (person) =>
          person.role === 'member' && person.guide_id === current.id,
      );
    }
    return store.people.filter((person) => person.role === 'guide');
  }, [current, store.people]);
  const [selectedId, setSelectedId] = useState(participants[0]?.id ?? '');
  const selected =
    participants.find((person) => person.id === selectedId) ?? participants[0];
  const [draft, setDraft] = useState('');
  const conversation = selected
    ? store.messages.filter(
        (message) =>
          (message.author_id === current.id &&
            message.participant_id === selected.id) ||
          (message.author_id === selected.id &&
            message.participant_id === current.id),
      )
    : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selected && sendMessage(selected.id, draft)) {
      setDraft('');
      onToast('Message added to the local conversation.');
    }
  };

  return (
    <div className="message-layout view-enter">
      <aside className="conversation-list" aria-label="Conversations">
        <div>
          <p className="rail-kicker">Local mailbox</p>
          <h2>Messages</h2>
        </div>
        {participants.map((person) => {
          const count = store.messages.filter(
            (message) =>
              (message.author_id === current.id &&
                message.participant_id === person.id) ||
              (message.author_id === person.id &&
                message.participant_id === current.id),
          ).length;
          return (
            <button
              key={person.id}
              onClick={() => setSelectedId(person.id)}
              aria-pressed={selected?.id === person.id}
            >
              <span className="person-choice-avatar">
                {initials(person.name)}
              </span>
              <span>
                <strong>{person.name}</strong>
                <small>{count} local messages</small>
              </span>
            </button>
          );
        })}
      </aside>

      <section className="conversation-panel">
        {selected ? (
          <>
            <header>
              <span className="person-choice-avatar">
                {initials(selected.name)}
              </span>
              <div>
                <h2>{selected.name}</h2>
                <p>Simulated conversation · stays on this device</p>
              </div>
            </header>
            <div className="message-thread" aria-live="polite">
              {conversation.length === 0 && (
                <p className="empty-copy">Start the local conversation.</p>
              )}
              {conversation.map((message) => {
                const mine = message.author_id === current.id;
                return (
                  <article className={mine ? 'message mine' : 'message'} key={message.id}>
                    <p>{message.body}</p>
                    <small>{mine ? 'You' : selected.name}</small>
                  </article>
                );
              })}
            </div>
            <form className="message-composer" onSubmit={submit}>
              <label>
                <span className="sr-only">Message</span>
                <textarea
                  value={draft}
                  maxLength={500}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Write to ${selected.name}`}
                />
              </label>
              <button className="button button-primary" disabled={!draft.trim()}>
                Send locally
              </button>
            </form>
          </>
        ) : (
          <p className="empty-copy">No sample conversation is available.</p>
        )}
      </section>
    </div>
  );
}

export function ProfileView({ current, onToast }: ViewProps) {
  const { store, updateCurrentName } = useStore();
  const [name, setName] = useState(current.name);
  const ownNotes = store.notes.filter(
    (note) => note.author_id === current.id || note.subject_id === current.id,
  ).length;
  const ownMessages = store.messages.filter(
    (message) =>
      message.author_id === current.id || message.participant_id === current.id,
  ).length;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (updateCurrentName(name)) onToast('Profile name saved on this device.');
  };

  return (
    <div className="profile-layout view-enter">
      <section className="profile-card">
        <div className="profile-avatar">{initials(current.name)}</div>
        <p className="eyebrow dark">{ROLE_LABEL[current.role]}</p>
        <h2>{current.name}</h2>
        <p>Fictional local profile</p>
        <div className="profile-stats">
          <div>
            <strong>{ownNotes}</strong>
            <small>notes</small>
          </div>
          <div>
            <strong>{ownMessages}</strong>
            <small>messages</small>
          </div>
          <div>
            <strong>{current.role === 'member' ? current.stage_index + 1 : '—'}</strong>
            <small>stage</small>
          </div>
        </div>
      </section>

      <section className="workspace-card profile-form-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Profile details</p>
            <h2>How you appear in this sample</h2>
          </div>
        </div>
        <form className="settings-form" onSubmit={submit}>
          <label>
            <span>Display name</span>
            <input
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span>Role</span>
            <input value={ROLE_LABEL[current.role]} disabled />
          </label>
          <button className="button button-primary">Save profile</button>
        </form>
        <p className="privacy-copy">
          No photo, email, phone number, or personal identifier is requested.
        </p>
      </section>
    </div>
  );
}

export function SettingsView({
  current: _current,
  onToast,
  onOpenTutorial,
}: ViewProps & { onOpenTutorial: () => void }) {
  const {
    store,
    setTextSize,
    setMotion,
    setWorkspaceTheme,
    restoreData,
    reset,
  } = useStore();
  const [armedReset, setArmedReset] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: 'application/json',
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'open-beacon-backup.json';
    link.click();
    URL.revokeObjectURL(objectUrl);
    onToast('Local backup prepared.');
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 100_000) {
      setRestoreMessage('That file is larger than the 100 KB safety limit.');
      return;
    }
    const raw = await file.text();
    const restored = restoreData(raw);
    setRestoreMessage(
      restored
        ? 'Backup restored on this device.'
        : 'The backup was invalid and was not used.',
    );
    if (restored) onToast('Validated backup restored.');
  };

  return (
    <div className="settings-grid view-enter">
      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Appearance</p>
            <h2>Comfort and motion</h2>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>Text size</strong>
            <p>Choose a comfortable reading scale.</p>
          </div>
          <div className="segmented-control">
            {(['small', 'normal', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                aria-pressed={store.preferences.text_size === size}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>Animation</strong>
            <p>Reduce non-essential movement at any time.</p>
          </div>
          <div className="segmented-control">
            {(['full', 'reduced'] as const).map((motion) => (
              <button
                key={motion}
                onClick={() => setMotion(motion)}
                aria-pressed={store.preferences.motion === motion}
              >
                {motion}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row vertical">
          <div>
            <strong>Room theme</strong>
            <p>Changes the workspace canvas, not your data.</p>
          </div>
          <div className="theme-choices">
            {(['desk', 'slate', 'warm', 'focus'] as const).map((theme) => (
              <button
                key={theme}
                className={`theme-choice theme-${theme}`}
                onClick={() => setWorkspaceTheme(theme)}
                aria-pressed={store.preferences.workspace_theme === theme}
              >
                <span />
                {theme}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Guide</p>
            <h2>Learn the workspace</h2>
          </div>
        </div>
        <p className="settings-copy">
          A short tour explains the local privacy boundary, role views, and
          Mini Orbit.
        </p>
        <button className="button button-primary" onClick={onOpenTutorial}>
          Start tutorial
        </button>
      </section>

      <section className="workspace-card">
        <div className="card-heading">
          <div>
            <p className="rail-kicker">Local data</p>
            <h2>Backup and restore</h2>
          </div>
        </div>
        <p className="settings-copy">
          Export a readable JSON backup or restore one after validation.
          Nothing is uploaded.
        </p>
        <div className="data-actions">
          <button className="button button-outline-dark" onClick={downloadBackup}>
            Download backup
          </button>
          <label className="button button-outline-dark file-button">
            Restore backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importBackup(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
        </div>
        {restoreMessage && <p className="restore-message">{restoreMessage}</p>}
      </section>

      <section className="workspace-card danger-zone">
        <div>
          <p className="rail-kicker">Reset</p>
          <h2>Restore fictional sample data</h2>
          <p>This removes your local notes, messages, preferences, and progress.</p>
        </div>
        {armedReset ? (
          <div className="reset-confirm">
            <button
              className="button danger"
              onClick={() => {
                reset();
                setArmedReset(false);
                onToast('Sample data restored.');
              }}
            >
              Confirm reset
            </button>
            <button
              className="text-button"
              onClick={() => setArmedReset(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="button button-outline-dark"
            onClick={() => setArmedReset(true)}
          >
            Reset sample
          </button>
        )}
      </section>
    </div>
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
