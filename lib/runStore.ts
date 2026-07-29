// ============================================================================
// A "run": the state of dealing yourself one archived card after another.
//
// Kept in sessionStorage, not localStorage, on purpose - a run is a sitting.
// Close the tab and it's over; nobody wants to come back tomorrow to a ticket
// saying they're four cards deep in something they've forgotten.
//
// The store is the reason the run doesn't feel like being lost: every page a
// run touches reads the same numbers from here, so the ticket says the same
// thing everywhere and Done is always one tap from wherever you are.
// ============================================================================

export interface RunState {
  /** Cards finished in this run. */
  cards: number;
  /** Points banked across those cards. */
  points: number;
  /** Dates already counted - a card can only add to the run once. */
  dates: string[];
}

const KEY = "whohadmore:run";

const EMPTY: RunState = { cards: 0, points: 0, dates: [] };

type Listener = (run: RunState | null) => void;
const listeners = new Set<Listener>();

function read(): RunState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RunState>;
    return {
      cards: typeof parsed.cards === "number" ? parsed.cards : 0,
      points: typeof parsed.points === "number" ? parsed.points : 0,
      dates: Array.isArray(parsed.dates) ? parsed.dates.filter((d) => typeof d === "string") : [],
    };
  } catch {
    return null;
  }
}

function write(run: RunState | null): void {
  if (typeof window === "undefined") return;
  try {
    if (run) window.sessionStorage.setItem(KEY, JSON.stringify(run));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* storage disabled - the run just won't persist across navigations */
  }
  for (const l of listeners) l(run);
}

export function getRun(): RunState | null {
  return read();
}

/** Begin a run (idempotent - dealing again mid-run doesn't reset the tally). */
export function startRun(): RunState {
  const existing = read();
  if (existing) return existing;
  write(EMPTY);
  return EMPTY;
}

export function endRun(): void {
  write(null);
}

/**
 * Count a finished card into the run. Keyed by date, so re-opening a card you
 * already finished in this run doesn't inflate the tally.
 */
export function addRunCard(date: string, points: number): RunState | null {
  const run = read();
  if (!run || run.dates.includes(date)) return run;
  const next: RunState = {
    cards: run.cards + 1,
    points: run.points + Math.max(0, Math.round(points)),
    dates: [...run.dates, date],
  };
  write(next);
  return next;
}

export function subscribeRun(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
