// Activity over time, without a charting library.
//
// Most dashboards show totals since the beginning. A total can only go up, so it
// cannot answer the question people actually ask, which is never "how many
// things have ever happened" but "is there more happening than there was".
//
// Three decisions in here are the whole point, and each one exists because the
// obvious alternative misleads the person reading the screen:
//
//   1. THE BUCKET IN PROGRESS IS MARKED. This week is always lower than last
//      week for the sole reason that it has not finished. A chart that hides
//      that invites everyone to read a Tuesday as a decline.
//   2. EMPTY BUCKETS ARE KEPT. Dropping them silently closes the gap up and
//      draws a busy fortnight where there was a quiet one. A gap is a reading.
//   3. GROWTH FROM ZERO HAS NO PERCENTAGE. "Up 100%" from nothing is a lie
//      dressed as arithmetic. The function returns null and the caller says
//      something truthful instead.
//
// Pure functions over a list of timestamped events, so the same numbers can be
// drawn, read aloud, or checked by a test without any of them disagreeing.

/** The minimum an event needs for any of this to work. */
export interface TimedEvent {
  /** ISO 8601. Anything unparseable is ignored rather than counted as now. */
  at: string;
  /** Optional label so a chart can show one kind of event. */
  type?: string;
}

export type Grain = 'day' | 'week';

export interface TrendPoint {
  /** Start of the bucket, as an ISO string (local midnight). */
  start: string;
  /** Short label for an axis, e.g. "12 Aug". */
  label: string;
  total: number;
  /** True for the bucket containing `now` — incomplete, and says so. */
  partial: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Monday-start weeks, because a week is talked about as a week. */
function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t));
  const shift = (d.getDay() + 6) % 7; // getDay() is 0 for Sunday
  d.setDate(d.getDate() - shift);
  return d.getTime();
}

/**
 * Bucket events into the last `count` days or weeks, oldest first.
 */
export function trend(
  events: ReadonlyArray<TimedEvent>,
  opts: { grain: Grain; count: number; now?: number; types?: ReadonlyArray<string> },
): TrendPoint[] {
  const { grain, count } = opts;
  const now = opts.now ?? Date.now();
  const typeSet = opts.types ? new Set(opts.types) : null;

  const size = grain === 'week' ? 7 * DAY_MS : DAY_MS;
  const currentStart = grain === 'week' ? startOfWeek(now) : startOfDay(now);

  const starts: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    // Step back by a fixed size then RE-NORMALISE. Subtracting seven times
    // twenty-four hours is not a week across a daylight-saving change, and the
    // drift silently moves events into neighbouring buckets.
    const approx = currentStart - i * size;
    starts.push(grain === 'week' ? startOfWeek(approx) : startOfDay(approx));
  }

  const totals = new Array<number>(starts.length).fill(0);
  const firstStart = starts[0];
  for (const e of events) {
    if (typeSet && !(e.type && typeSet.has(e.type))) continue;
    const t = new Date(e.at).getTime();
    if (!Number.isFinite(t) || t < firstStart || t > now) continue;
    for (let i = starts.length - 1; i >= 0; i--) {
      if (t >= starts[i]) {
        totals[i] += 1;
        break;
      }
    }
  }

  return starts.map((start, i) => ({
    start: new Date(start).toISOString(),
    label: new Date(start).toLocaleDateString([], { day: 'numeric', month: 'short' }),
    total: totals[i],
    partial: i === starts.length - 1,
  }));
}

export interface Momentum {
  /** The bucket in progress. Incomplete by definition. */
  latest: number;
  /** The last complete bucket — the honest comparison. */
  previous: number;
  /** Null when there is nothing to divide by. See the note at the top. */
  deltaPct: number | null;
  direction: 'up' | 'down' | 'flat';
}

export function momentum(points: ReadonlyArray<TrendPoint>): Momentum {
  const latest = points.length ? points[points.length - 1].total : 0;
  const previous = points.length > 1 ? points[points.length - 2].total : 0;
  const deltaPct = previous === 0 ? null : Math.round(((latest - previous) / previous) * 100);
  return {
    latest,
    previous,
    deltaPct,
    direction: latest > previous ? 'up' : latest < previous ? 'down' : 'flat',
  };
}

/** The tallest bar, for scaling. Never zero, so an empty chart divides by one. */
export function peak(points: ReadonlyArray<TrendPoint>): number {
  return Math.max(1, ...points.map((p) => p.total));
}

/** Finished buckets with nothing in them. Quiet stretches are worth naming. */
export function quietCount(points: ReadonlyArray<TrendPoint>): number {
  return points.filter((p) => !p.partial && p.total === 0).length;
}
