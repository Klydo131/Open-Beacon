import type { Role } from './types';

export interface LearningResource {
  id: string;
  title: string;
  kind: 'Guide' | 'Exercise' | 'Reading' | 'Template';
  summary: string;
  tags: string[];
}

export interface JourneyTask {
  id: string;
  person_id: string;
  title: string;
  detail: string;
}

export interface WorkspaceEvent {
  id: string;
  person_id: string;
  title: string;
  when: string;
}

export const LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'resource-listening',
    title: 'A practical guide to listening well',
    kind: 'Guide',
    summary: 'A five-minute framework for asking, listening, and reflecting.',
    tags: ['connection', 'conversation'],
  },
  {
    id: 'resource-next-step',
    title: 'Plan one useful next step',
    kind: 'Exercise',
    summary: 'Turn a broad goal into one small action that can be completed.',
    tags: ['planning', 'practice'],
  },
  {
    id: 'resource-reflection',
    title: 'Weekly reflection prompts',
    kind: 'Template',
    summary: 'Simple questions for noticing progress, friction, and support.',
    tags: ['reflection', 'growth'],
  },
  {
    id: 'resource-trust',
    title: 'Building trust through consistency',
    kind: 'Reading',
    summary: 'Why reliable, respectful follow-through matters more than intensity.',
    tags: ['trust', 'support'],
  },
  {
    id: 'resource-feedback',
    title: 'Give feedback with care',
    kind: 'Guide',
    summary: 'Keep feedback specific, timely, and focused on the next action.',
    tags: ['feedback', 'conversation'],
  },
  {
    id: 'resource-facilitation',
    title: 'Small-group session planner',
    kind: 'Template',
    summary: 'A lightweight agenda for welcome, learning, practice, and close.',
    tags: ['planning', 'group'],
  },
];

export const JOURNEY_TASKS: JourneyTask[] = [
  {
    id: 'task-jordan-reflect',
    person_id: 'mem-1',
    title: 'Write one reflection',
    detail: 'Capture what felt clear and what still needs support.',
  },
  {
    id: 'task-jordan-meet',
    person_id: 'mem-1',
    title: 'Prepare for the next check-in',
    detail: 'Bring one question and one small win.',
  },
  {
    id: 'task-taylor-practice',
    person_id: 'mem-2',
    title: 'Try the practice exercise',
    detail: 'Complete one real-world attempt before the next session.',
  },
  {
    id: 'task-chris-connect',
    person_id: 'mem-3',
    title: 'Choose a first conversation',
    detail: 'Identify one person who can help clarify the goal.',
  },
  {
    id: 'task-robin-share',
    person_id: 'mem-4',
    title: 'Share what worked',
    detail: 'Record a short lesson that could help another learner.',
  },
];

export const WORKSPACE_EVENTS: WorkspaceEvent[] = [
  {
    id: 'event-jordan-checkin',
    person_id: 'mem-1',
    title: 'Progress check-in',
    when: 'Friday · 10:00',
  },
  {
    id: 'event-taylor-practice',
    person_id: 'mem-2',
    title: 'Practice review',
    when: 'Monday · 14:30',
  },
  {
    id: 'event-robin-reflect',
    person_id: 'mem-4',
    title: 'Completion reflection',
    when: 'Wednesday · 09:15',
  },
];

export const ANNOUNCEMENTS = [
  {
    id: 'announcement-session',
    title: 'Open learning session',
    detail: 'A guided practice session is available this week.',
    tag: 'This week',
  },
  {
    id: 'announcement-library',
    title: 'New reflection template',
    detail: 'The library now includes a short weekly review.',
    tag: 'Library',
  },
  {
    id: 'announcement-care',
    title: 'A reminder to move gently',
    detail: 'Small, consistent progress is still meaningful progress.',
    tag: 'Community',
  },
];

export const ROLE_WORKSPACE_COPY: Record<
  Role,
  { title: string; description: string }
> = {
  coordinator: {
    title: 'Program workspace',
    description: 'Coordinate support while keeping oversight proportional.',
  },
  guide: {
    title: 'Support workspace',
    description: 'Notice needs, prepare check-ins, and help people move forward.',
  },
  member: {
    title: 'Personal workspace',
    description: 'Learn, reflect, and choose the next useful step.',
  },
};
