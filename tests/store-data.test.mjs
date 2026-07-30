import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStoredStore } from '../lib/store-data.mjs';

const validStore = {
  people: [
    { id: 'guide-1', name: 'Sample Guide', role: 'guide', stage_index: 0 },
    {
      id: 'member-1',
      name: 'Sample Member',
      role: 'member',
      guide_id: 'guide-1',
      stage_index: 2,
    },
  ],
  completed_task_ids: ['task-one'],
  saved_resource_ids: ['resource-one'],
  notes: [
    {
      id: 'note-one',
      author_id: 'guide-1',
      subject_id: 'member-1',
      body: 'A safe local note.',
    },
  ],
  messages: [
    {
      id: 'message-one',
      author_id: 'member-1',
      participant_id: 'guide-1',
      body: 'A safe local message.',
    },
  ],
  support_requests: [
    {
      id: 'request-one',
      person_id: 'member-1',
      body: 'Please help with the next step.',
      share_anonymously: false,
    },
  ],
  preferences: {
    text_size: 'normal',
    motion: 'full',
    workspace_theme: 'desk',
  },
};

test('accepts a valid store and copies only supported fields', () => {
  const parsed = parseStoredStore(
    JSON.stringify({ ...validStore, ignored: 'not retained' }),
    4,
  );

  assert.deepEqual(parsed, validStore);
});

test('migrates missing feature collections to safe defaults', () => {
  const parsed = parseStoredStore(
    JSON.stringify({ people: validStore.people }),
    4,
  );

  assert.deepEqual(parsed, {
    people: validStore.people,
    completed_task_ids: [],
    saved_resource_ids: [],
    notes: [],
    messages: [],
    support_requests: [],
    preferences: validStore.preferences,
  });
});

test('rejects malformed, unbounded, and inconsistent stores', () => {
  const cases = [
    '{',
    JSON.stringify({ people: 'not-an-array' }),
    JSON.stringify({
      ...validStore,
      people: [{ ...validStore.people[0], stage_index: 1.5 }],
    }),
    JSON.stringify({
      ...validStore,
      people: Array.from({ length: 51 }, (_, index) => ({
        id: `member-${index}`,
        name: `Member ${index}`,
        role: 'member',
        stage_index: 0,
      })),
    }),
    JSON.stringify({
      ...validStore,
      people: [validStore.people[0], { ...validStore.people[0] }],
    }),
    JSON.stringify({
      ...validStore,
      people: [{ ...validStore.people[1], guide_id: 'missing-guide' }],
    }),
    JSON.stringify({
      ...validStore,
      notes: [{ ...validStore.notes[0], subject_id: 'missing-person' }],
    }),
    JSON.stringify({
      ...validStore,
      messages: [{ ...validStore.messages[0], body: 'x'.repeat(501) }],
    }),
    JSON.stringify({
      ...validStore,
      preferences: { ...validStore.preferences, motion: 'always' },
    }),
  ];

  for (const value of cases) {
    assert.equal(parseStoredStore(value, 4), null);
  }
  assert.equal(parseStoredStore(' '.repeat(100_001), 4), null);
});
