import type { Store } from './types';

export function makeSeed(): Store {
  return {
    people: [
      {
        id: 'coord-1',
        name: 'Alex Rivera',
        role: 'coordinator',
        stage_index: 0,
      },
      { id: 'guide-1', name: 'Sam Okafor', role: 'guide', stage_index: 0 },
      { id: 'guide-2', name: 'Priya Nair', role: 'guide', stage_index: 0 },
      {
        id: 'mem-1',
        name: 'Jordan Lee',
        role: 'member',
        guide_id: 'guide-1',
        stage_index: 1,
      },
      {
        id: 'mem-2',
        name: 'Taylor Brooks',
        role: 'member',
        guide_id: 'guide-1',
        stage_index: 2,
      },
      {
        id: 'mem-3',
        name: 'Chris Diaz',
        role: 'member',
        guide_id: 'guide-2',
        stage_index: 0,
      },
      {
        id: 'mem-4',
        name: 'Robin Adeyemi',
        role: 'member',
        guide_id: 'guide-2',
        stage_index: 3,
      },
    ],
    completed_task_ids: [],
    saved_resource_ids: ['resource-listening'],
    notes: [
      {
        id: 'note-jordan-1',
        author_id: 'guide-1',
        subject_id: 'mem-1',
        body: 'Ask what made the last reading feel relevant.',
      },
    ],
    messages: [
      {
        id: 'message-jordan-1',
        author_id: 'mem-1',
        participant_id: 'guide-1',
        body: 'The reflection prompt helped me name the next step.',
      },
      {
        id: 'message-jordan-2',
        author_id: 'guide-1',
        participant_id: 'mem-1',
        body: 'That is good progress. Bring one question to our check-in.',
      },
    ],
    support_requests: [],
    preferences: {
      text_size: 'normal',
      motion: 'full',
      workspace_theme: 'desk',
    },
  };
}
