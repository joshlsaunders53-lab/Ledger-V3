import type { Trade, TradingSession } from "./types";
import { fmtMoney } from "./calculations";
import { disciplineLabel } from "./coach";

export interface WeeklyReview {
  sessionsCount: number;
  totalTrades: number;
  pnl: number;
  avgScore: number | null;
  objectivesMet: number;
  gradeLetters: string[];
  narrative: string[];
}

const GRADE_VALUE: Record<string, number> = {
  "A+": 98, A: 95, "A-": 91,
  "B+": 88, B: 85, "B-": 81,
  "C+": 78, C: 75, "C-": 71,
  D: 65, F: 40,
};

export function computeWeeklyReview(
  sessions: TradingSession[],
  trades: Trade[],
  weekDates: string[]
): WeeklyReview {
  const weekSessions = sessions.filter((s) => weekDates.includes(s.date));
  const weekTrades = trades.filter((t) => weekDates.includes(t.date));
  const pnl = weekTrades.reduce((s, t) => s + t.pnl, 0);
  const grades = weekSessions.map((s) => s.grade).filter((g): g is string => !!g);
  const avgScore = grades.length
    ? Math.round(grades.reduce((s, g) => s + (GRADE_VALUE[g] ?? 70), 0) / grades.length)
    : null;
  const objectivesMet = weekSessions.filter((s) => s.objectiveMet === true).length;

  const brokenPlanTrades = weekTrades.filter((t) => t.followedPlan === false);
  const brokenPlanCost = brokenPlanTrades.reduce((s, t) => s + t.pnl, 0);

  const narrative: string[] = [];

  if (weekSessions.length === 0) {
    narrative.push("No sessions logged this week yet.");
    narrative.push("Start one from Home whenever you're ready to trade.");
  } else {
    narrative.push(
      `You ran ${weekSessions.length} session${weekSessions.length === 1 ? "" : "s"} this week, logging ${weekTrades.length} trade${weekTrades.length === 1 ? "" : "s"}.`
    );

    if (avgScore !== null) {
      narrative.push(`Discipline this week: ${disciplineLabel(avgScore)}.`);
    }

    if (brokenPlanTrades.length > 0) {
      narrative.push(
        `${brokenPlanTrades.length} of those trades broke the plan. Combined, they ${
          brokenPlanCost >= 0 ? "made" : "cost"
        } you ${fmtMoney(Math.abs(brokenPlanCost))} — that's the real price of the exceptions.`
      );
    } else if (weekTrades.length > 0) {
      narrative.push("Every trade this week followed the plan. Zero exceptions.");
    }

    narrative.push(
      `You met your stated objective on ${objectivesMet} of ${weekSessions.length} day${weekSessions.length === 1 ? "" : "s"}.`
    );

    narrative.push(
      pnl >= 0
        ? `The week finished up ${fmtMoney(pnl)} — but that's not the number that matters most here.`
        : `The week finished down ${fmtMoney(Math.abs(pnl))} — if discipline held, that's the cost of being in the game, not a failure.`
    );

    narrative.push(
      avgScore !== null && avgScore >= 85
        ? "Keep the same pre-session ritual next week. Consistency compounds."
        : "Next week, pay closer attention to the exact moment you decide to deviate from plan — that's the pattern worth catching earlier, before it costs you again."
    );
  }

  return {
    sessionsCount: weekSessions.length,
    totalTrades: weekTrades.length,
    pnl,
    avgScore,
    objectivesMet,
    gradeLetters: grades,
    narrative,
  };
}
