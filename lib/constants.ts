export const EMOTIONS = [
  "Calm",
  "Confident",
  "Anxious",
  "FOMO",
  "Revenge",
  "Impatient",
  "Greedy",
  "Bored",
  "Tilted",
] as const;

export const MISTAKES = [
  "Broke trading plan",
  "Moved stop loss",
  "No stop loss set",
  "Oversized position",
  "Chased entry",
  "Ignored trade plan",
  "Revenge trade",
  "FOMO entry",
  "Exited too early",
  "Held too long",
] as const;

export const DEFAULT_RULES = [
  "Wait for confirmation before entering",
  "Risk no more than 1% per trade",
  "Set a stop loss before entering",
  "No trading after 2 losses in a day",
  "Journal every trade the same day",
] as const;

export const SETUPS = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Trend continuation",
  "Range / mean reversion",
  "News / event",
  "Other",
] as const;

export const MOODS = ["Great", "Good", "Okay", "Rough", "Bad"] as const;

export const BIASES = [
  { value: "bullish", label: "Bullish" },
  { value: "bearish", label: "Bearish" },
  { value: "neutral", label: "Neutral" },
] as const;

export const OBJECTIVE_PRESETS = [
  "Follow every rule",
  "Maximum 3 trades",
  "No revenge trading",
  "Protect capital",
] as const;
