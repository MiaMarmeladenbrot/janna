import { setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";
import type { InvoicePosition, PositionWeek } from "../store/types";

function formatWeekGroup(weeks: number[]): string {
  if (weeks.length === 1) return String(weeks[0]);
  if (weeks.length === 2) return `${weeks[0]} und ${weeks[1]}`;
  return `${weeks[0]} bis ${weeks[weeks.length - 1]}`;
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
