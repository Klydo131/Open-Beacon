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
  { key: 'start', label: 'Start', blurb: 'First hello', color: '#6366F1' },
  { key: 'connect', label: 'Connect', blurb: 'Building trust', color: '#0EA5E9' },
  { key: 'grow', label: 'Grow', blurb: 'Learning together', color: '#10B981' },
  { key: 'apply', label: 'Apply', blurb: 'Putting it to work', color: '#F59E0B' },
  { key: 'complete', label: 'Complete', blurb: 'Ready to give back', color: '#22C55E' },
];

export function stageAt(index: number): Stage {
  const i = Math.max(0, Math.min(index, STAGES.length - 1));
  return STAGES[i];
}

export const LAST_STAGE = STAGES.length - 1;
