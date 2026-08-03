export type Direction = "long" | "short";

export interface TradeScreenshots {
  before?: string | null;
  during?: string | null;
  after?: string | null;
  markup?: string | null;
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  direction: Direction;
  entry?: number;
  exit?: number;
  stop?: number;
  target?: number;
  size?: number; // shown to the user as "Contracts"
  pnl: number;
  account?: string;
  setup: string;
  durationMinutes?: number;
  executionScore?: number; // 1-10, self-rated
  emotionBefore?: string;
  emotionAfter?: string;
  mistake?: string;
  tags: string[];
  emotions: string[];
  mistakes: string[];
  rulesBroken: string[]; // rule ids
  notes: string;
  reflection?: string;
  confidence?: number;
  followedPlan?: boolean;
  /** Storage paths (private bucket) for up to 4 named screenshots. */
  screenshots?: TradeScreenshots;
  sessionId?: string;
  /** Full insert timestamp from Postgres — used for time-of-day analytics
   * and for chronological ordering within a single day. */
  createdAt?: string;
}

export interface Rule {
  id: string;
  text: string;
}

export interface CheckIn {
  id: string;
  date: string;
  mood: string | null;
  rulesChecked: string[];
}

/** V1 pre-session ritual — deliberately just 4 sliders + one objective,
 * meant to take under a minute. */
export interface PreTradeCheck {
  sleep: number; // 1-10
  stress: number; // 1-10
  confidence: number; // 1-10
  energy: number; // 1-10
  objective: string;
}

export interface TradingSession {
  id: string;
  date: string;
  preTrade: PreTradeCheck;
  startedAt: string; // ISO timestamp
  endedAt: string | null; // ISO timestamp, null while live
  tradeIds: string[];
  /** Asked once at the end of the session — free-text objectives can't be
   * verified programmatically, so the trader is just asked directly. */
  objectiveMet: boolean | null;
  /** Computed once at end-of-session and persisted here, since
   * objectiveMet can't be re-derived later from trade data alone. */
  grade: string | null;
  narrative: string[] | null;
}

export interface LedgerState {
  rules: Rule[];
  checkins: CheckIn[];
  trades: Trade[];
  sessions: TradingSession[];
  startingBalance: number;
}

export const EMPTY_STATE: LedgerState = {
  rules: [],
  checkins: [],
  trades: [],
  sessions: [],
  startingBalance: 0,
};

// ---- Daily Journal (Priority 4) — a personal journal, separate from
// the trade journal. One entry per calendar date. ----

export interface MorningJournal {
  mood: string;
  sleep: number; // 0-10
  energy: number; // 1-10
  stress: number; // 1-10
  confidence: number; // 1-10
  focus: string;
  goals: string;
  avoid: string;
  distraction: string;
  affirmation: string;
  freeWriting: string; // markdown
}

export interface EveningJournal {
  mood: string;
  proudOf: string;
  frustrated: string;
  repeatedMistakes: string;
  learned: string;
  improveTomorrow: string;
  followedRules: boolean | null;
  wouldRepeatToday: boolean | null;
  dayRating: number; // 1-10
  gratitude: string;
  freeWriting: string; // markdown
}

export interface DailyJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD, one entry per day
  morning: MorningJournal | null;
  evening: EveningJournal | null;
}

// ---- Habits ----

export interface Habit {
  id: string;
  name: string;
  sortOrder: number;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export const DEFAULT_HABITS = [
  "Sleep",
  "Gym",
  "Water",
  "Reading",
  "Meditation",
  "Journaling",
  "Content Creation",
  "Steps",
] as const;
