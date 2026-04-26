import { setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";
import type { InvoicePosition, PositionWeek } from "../store/types";

// Group consecutive week numbers into "bis"-ranges, separate non-consecutive
// runs by ", ". E.g.:
//   [14]              → "14"
//   [14, 15]          → "14 bis 15"
//   [14, 15, 16]      → "14 bis 16"
//   [14, 16]          → "14, 16"
//   [6, 8, 9]         → "6, 8 bis 9"
//   [14, 15, 17, 18]  → "14 bis 15, 17 bis 18"
function formatWeekGroup(weeks: number[]): string {
  if (weeks.length === 0) return "";
  const sorted = [...weeks].sort((a, b) => a - b);

  const runs: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = runs[runs.length - 1];
    if (sorted[i] === last[last.length - 1] + 1) {
      last.push(sorted[i]);
    } else {
      runs.push([sorted[i]]);
    }
  }

  return runs
    .map((run) =>
      run.length === 1 ? String(run[0]) : `${run[0]} bis ${run[run.length - 1]}`,
    )
    .join(", ");
}

export function formatPeriod(pos: InvoicePosition): string {
  const weeks = pos.weeks ?? [];
  if (weeks.length === 0) return pos.periodLabel ?? "";

  const sorted = [...weeks].sort(
    (a, b) => a.year - b.year || a.week - b.week,
  );

  const byYear = new Map<number, number[]>();
  for (const w of sorted) {
    const arr = byYear.get(w.year) ?? [];
    arr.push(w.week);
    byYear.set(w.year, arr);
  }

  if (byYear.size === 1) {
    const weeks = sorted.map((w) => w.week);
    return `KW ${formatWeekGroup(weeks)}`;
  }

  return Array.from(byYear.entries())
    .map(([year, weeks]) => `${year}/KW ${formatWeekGroup(weeks)}`)
    .join(", ");
}

export function uniqueWeeks(positions: InvoicePosition[]): PositionWeek[] {
  const seen = new Set<string>();
  const result: PositionWeek[] = [];
  for (const pos of positions) {
    for (const w of pos.weeks ?? []) {
      const key = `${w.year}-${w.week}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(w);
    }
  }
  return result.sort((a, b) => a.year - b.year || a.week - b.week);
}

export function isoWeekDateRange(year: number, week: number): { start: Date; end: Date } {
  const base = setISOWeek(setISOWeekYear(new Date(), year), week);
  return { start: startOfISOWeek(base), end: endOfISOWeek(base) };
}
