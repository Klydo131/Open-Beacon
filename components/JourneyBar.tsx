import { STAGES } from '@/lib/journey';

// A simple horizontal progress bar over the journey's stages. Filled dots are
// stages already reached; the current stage is ringed.
export function JourneyBar({ current }: { current: number }) {
  return (
    <div className="journey">
      {STAGES.map((s, i) => {
        const reached = i <= current;
        return (
          <div key={s.key} className="journey-step">
            <div
              className="journey-dot"
              style={{
                background: reached ? s.color : '#E5E7EB',
                boxShadow: i === current ? `0 0 0 4px ${s.color}33` : 'none',
                color: reached ? '#fff' : '#9CA3AF',
              }}
            >
              {i + 1}
            </div>
            <div className="journey-label" style={{ color: reached ? '#111827' : '#9CA3AF' }}>
              {s.label}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="journey-line"
                style={{ background: i < current ? s.color : '#E5E7EB' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
