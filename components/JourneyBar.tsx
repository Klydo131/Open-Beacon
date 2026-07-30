import type { CSSProperties } from 'react';
import { STAGES, stageAt } from '@/lib/journey';

export function JourneyBar({ current }: { current: number }) {
  const safeCurrent = STAGES.indexOf(stageAt(current));

  return (
    <ol
      className="journey"
      aria-label={`Journey progress: ${stageAt(current).label}`}
    >
      {STAGES.map((stage, index) => {
        const reached = index <= safeCurrent;
        const style = {
          '--stage-color': stage.color,
        } as CSSProperties;

        return (
          <li
            key={stage.key}
            className={reached ? 'journey-step is-reached' : 'journey-step'}
            style={style}
            aria-current={index === safeCurrent ? 'step' : undefined}
          >
            <span className="journey-dot">{index + 1}</span>
            <span className="journey-label">{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
