import type { Store } from './types';

// Sample data so the demo has something to show on first run. All names are
// fictional. Feel free to replace this with your own.
export function makeSeed(): Store {
  return {
    people: [
      { id: 'coord-1', name: 'Alex Rivera', role: 'coordinator', stage_index: 0 },

      { id: 'guide-1', name: 'Sam Okafor', role: 'guide', stage_index: 0 },
      { id: 'guide-2', name: 'Priya Nair', role: 'guide', stage_index: 0 },

      { id: 'mem-1', name: 'Jordan Lee', role: 'member', guide_id: 'guide-1', stage_index: 1 },
      { id: 'mem-2', name: 'Taylor Brooks', role: 'member', guide_id: 'guide-1', stage_index: 2 },
      { id: 'mem-3', name: 'Chris Diaz', role: 'member', guide_id: 'guide-2', stage_index: 0 },
      { id: 'mem-4', name: 'Robin Adeyemi', role: 'member', guide_id: 'guide-2', stage_index: 3 },
    ],
  };
}
