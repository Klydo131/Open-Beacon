// The journey — a generic, linear set of stages a member moves through with the
// help of a guide. Everything here is neutral and configurable: swap these
// labels for whatever progression your own project needs (onboarding steps,
// course modules, training levels, health goals…).

export interface Stage {
  key: string;
  label: string;
  blurb: string;
  color: string;
}

export const STAGES: Stage[] = [
  { key: 'start', label: 'Start', blurb: 'Set a clear direction', color: '#7654a8' },
  { key: 'connect', label: 'Connect', blurb: 'Build a trusted connection', color: '#4376b8' },
  { key: 'grow', label: 'Grow', blurb: 'Learn through steady practice', color: '#2f9476' },
  { key: 'apply', label: 'Apply', blurb: 'Put learning into action', color: '#d47c36' },
  { key: 'complete', label: 'Complete', blurb: 'Reflect and help another', color: '#b28a2e' },
];

export function stageAt(index: number): Stage {
  const safeIndex = Number.isInteger(index) ? index : 0;
  const i = Math.max(0, Math.min(safeIndex, STAGES.length - 1));
  return STAGES[i];
}

export const LAST_STAGE = STAGES.length - 1;
