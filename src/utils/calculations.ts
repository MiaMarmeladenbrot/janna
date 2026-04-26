import type { TimeEntry, OvertimeEntry } from '../store/types';
import { getKW } from './kw';
import { countWeeksInMonth } from './kw';
import { parseISO, getMonth, getYear, getISOWeek, getISOWeekYear } from 'date-fns';

export function getEntriesForMonth(entries: TimeEntry[], year: number, month: number, projectId?: string): TimeEntry[] {
  return entries.filter((e) => {
    const d = parseISO(e.date);
    return getYear(d) === year && getMonth(d) === month && (!projectId || e.projectId === projectId);
  });
}

export function getEntriesForProject(entries: TimeEntry[], projectId: string): TimeEntry[] {
  return entries.filter((e) => e.projectId === projectId);
}

export function getHoursByKW(entries: TimeEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    const d = parseISO(e.date);
    const key = `${getISOWeekYear(d)}-${String(getISOWeek(d)).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + e.hours);
  }
  return map;
}

export function getTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, e) => sum + e.hours, 0);
}

export function getSollHours(weeklyTarget: number, year: number, month: number): number {
  const weeks = countWeeksInMonth(year, month);
  return weeklyTarget * weeks;
}

// --- Overtime account ---

/** Total excess hours from all time entries for a project (live, KW-based).
 *  Map keys are `"YYYY-WW"` (zero-padded ISO year + week) so that same KW
 *  numbers from different years don't collide. */
export function getProjectExcessHours(
  timeEntries: TimeEntry[],
  projectId: string,
  weeklyTarget: number,
): { total: number; byKW: Map<string, number> } {
  const filtered = timeEntries.filter((e) => e.projectId === projectId);
  const kwMap = new Map<string, number>();
  for (const e of filtered) {
    const d = parseISO(e.date);
    const key = `${getISOWeekYear(d)}-${String(getISOWeek(d)).padStart(2, '0')}`;
    kwMap.set(key, (kwMap.get(key) || 0) + e.hours);
  }

  const now = new Date();
  const currentKey = `${getISOWeekYear(now)}-${String(getISOWeek(now)).padStart(2, '0')}`;
  let total = 0;
  const diffByKW = new Map<string, number>();
  for (const [key, actual] of kwMap) {
    if (key === currentKey) continue;
    const diff = actual - weeklyTarget;
    if (diff !== 0) {
      diffByKW.set(key, diff);
      // Only positive surplus contributes to the overtime balance.
      // Weeks below target are informational, not a debt.
      if (diff > 0) total += diff;
    }
  }
  return { total, byKW: diffByKW };
}

/** Overtime balance = live excess hours + manual/invoice overtime entries. */
export function getOvertimeBalance(
  overtimeEntries: OvertimeEntry[],
  timeEntries: TimeEntry[],
  projectId: string,
  weeklyTarget: number,
): number {
  const liveExcess = getProjectExcessHours(timeEntries, projectId, weeklyTarget).total;
  const manualAndInvoice = overtimeEntries
    .filter((e) => e.projectId === projectId)
    .reduce((sum, e) => sum + e.hours, 0);
  return liveExcess + manualAndInvoice;
}

export interface KWCapDetail {
  kw: number;
  actual: number;
  billable: number;
  excess: number;
}

export interface CapAdjustedResult {
  kwNumbers: number[];
  totalBillableHours: number;
  totalExcessHours: number;
  entries: TimeEntry[];
  kwDetails: KWCapDetail[];
}

export function getCapAdjustedHours(
  entries: TimeEntry[],
  projectId: string,
  from: string,
  to: string,
  weeklyTarget: number,
): CapAdjustedResult {
  const filtered = entries.filter(
    (e) => e.projectId === projectId && e.date >= from && e.date <= to,
  );

  const maxHoursPerWeek = weeklyTarget;
  const kwMap = new Map<number, number>();

  for (const e of filtered) {
    const kw = getKW(e.date);
    kwMap.set(kw, (kwMap.get(kw) || 0) + e.hours);
  }

  const kwDetails: KWCapDetail[] = [];
  let totalBillableHours = 0;
  let totalExcessHours = 0;

  for (const [kw, actual] of Array.from(kwMap.entries()).sort(([a], [b]) => a - b)) {
    const billable = Math.min(actual, maxHoursPerWeek);
    const excess = Math.max(0, actual - maxHoursPerWeek);
    kwDetails.push({ kw, actual, billable, excess });
    totalBillableHours += billable;
    totalExcessHours += excess;
  }

  return {
    kwNumbers: kwDetails.map((d) => d.kw),
    totalBillableHours,
    totalExcessHours,
    entries: filtered,
    kwDetails,
  };
}

// Keep simple version for non-capped use (e.g. flatrate)
export function getHoursForProjectRange(
  entries: TimeEntry[],
  projectId: string,
  from: string,
  to: string,
): { kwNumbers: number[]; totalHours: number; entries: TimeEntry[] } {
  const filtered = entries.filter(
    (e) => e.projectId === projectId && e.date >= from && e.date <= to,
  );
  const kwSet = new Set<number>();
  let totalHours = 0;
  for (const e of filtered) {
    kwSet.add(getKW(e.date));
    totalHours += e.hours;
  }
  const kwNumbers = Array.from(kwSet).sort((a, b) => a - b);
  return { kwNumbers, totalHours, entries: filtered };
}
