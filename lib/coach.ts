import type { Trade } from "./types";
import { fmtMoney } from "./calculations";

export interface CoachVerdict {
  grade: string;
  score: number;
  narrative: string[];
}

function isClean(t: Trade) {
  return t.followedPlan !== false;
}

function gradeFromScore(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

/** A status label for a raw discipline percentage — same tiering
 * philosophy as the grade, but for contexts that show a plain % rather
 * than a letter grade (Dashboard KPI, History day drawer). */
export function disciplineLabel(score: number | null): string {
  if (score === null) return "No data yet";
  if (score >= 85) return "Locked in";
  if (score >= 65) return "Holding steady";
  if (score >= 40) return "Slipping";
  return "Off the rails";
}

/**
 * Deliberately behavior-first: the score is built from discipline (did you
 * follow your plan?) and whether you met the objective you set for
 * yourself — P&L is only ever mentioned in the narrative as a fact, never
 * as an input to the grade. That's the whole point of this app.
 */
export function computeCoachVerdict(
  trades: Trade[],
  objectiveMet: boolean | null,
  objective?: string
): CoachVerdict {
  const total = trades.length;
  const broken = trades.filter((t) => !isClean(t)).length;
  const disciplinePct = total ? Math.round(((total - broken) / total) * 100) : 100;

  const score =
    objectiveMet === null
      ? disciplinePct
      : Math.round(disciplinePct * 0.7 + (objectiveMet ? 100 : 0) * 0.3);

  const grade = gradeFromScore(score);
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);

  const narrative: string[] = [];

  if (total === 0) {
    narrative.push("You didn't take a single trade today.");
  } else if (pnl > 0) {
    narrative.push("You made money today.");
  } else if (pnl < 0) {
    narrative.push("You lost money today.");
  } else {
    narrative.push("You broke even today.");
  }

  if (total > 0) {
    if (broken === 0) {
      narrative.push("You followed every rule. Zero exceptions.");
    } else {
      const pct = Math.round((broken / total) * 100);
      narrative.push(
        `You broke your plan on ${broken} of ${total} trade${total === 1 ? "" : "s"} — ${pct}% of today's decisions ignored the plan you set this morning.`
      );
    }
  }

  if (objectiveMet === true) {
    narrative.push("You did what you said you'd do. That's the whole game.");
  } else if (objectiveMet === false) {
    narrative.push(
      objective
        ? `You said "${objective}" this morning. You didn't do it.`
        : "You didn't meet today's objective."
    );
  }

  if (score >= 90) {
    narrative.push("Locked in. This is the standard — repeat it tomorrow, not just today.");
  } else if (score >= 80) {
    narrative.push("Solid, not perfect. Find the leak before it becomes a habit.");
  } else if (score >= 70) {
    narrative.push(
      total > 0 && pnl > 0
        ? "Today's profit is covering for today's behaviour. It won't always."
        : "The discipline wasn't there today. That's the real story, not the P&L."
    );
  } else {
    narrative.push(
      "This is the pattern that blows up accounts. Stop, reset, and don't trade again until you know why this happened."
    );
  }

  return { grade, score, narrative };
}

export function fmtPnlFact(trades: Trade[]): string {
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  return fmtMoney(pnl);
}
