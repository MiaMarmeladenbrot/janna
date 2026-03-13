import type { TimeEntry, StundenKontoEntry } from '../store/types';
import { getKW } from './kw';
import { countWeeksInMonth } from './kw';
import { parseISO, getMonth, getYear } from 'date-fns';

export function getEntriesForMonth(entries: TimeEntry[], year: number, month: number, projectId?: string): TimeEntry[] {
  return entries.filter((e) => {
    const d = parseISO(e.date);
    return getYear(d) === year && getMonth(d) === month && (!projectId || e.projectId === projectId);
  });
}

export function getEntriesForProject(entries: TimeEntry[], projectId: string): TimeEntry[] {
  return entries.filter((e) => e.projectId === projectId);
}

export function getHoursByKW(entries: TimeEntry[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const e of entries) {
    const kw = getKW(e.date);
    map.set(kw, (map.get(kw) || 0) + e.hours);
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

// --- Stunden-Konto ---

/** Total excess hours from all time entries for a project (live, KW-based) */
export function getProjectExcessHours(
  timeEntries: TimeEntry[],
  projectId: string,
  weeklyTarget: number,
): { total: number; byKW: Map<number, number> } {
  const filtered = timeEntries.filter((e) => e.projectId === projectId);
  const kwMap = new Map<number, number>();
  for (const e of filtered) {
    const kw = getKW(e.date);
    kwMap.set(kw, (kwMap.get(kw) || 0) + e.hours);
  }

  let total = 0;
  const excessByKW = new Map<number, number>();
  for (const [kw, actual] of kwMap) {
    const excess = Math.max(0, actual - weeklyTarget);
    if (excess > 0) {
      excessByKW.set(kw, excess);
      total += excess;
    }
  }
  return { total, byKW: excessByKW };
}

/** Überstunden balance = live excess hours + manual/invoice konto entries. */
export function getStundenKontoBalance(
  kontoEntries: StundenKontoEntry[],
  timeEntries: TimeEntry[],
  projectId: string,
  weeklyTarget: number,
): number {
  const liveExcess = getProjectExcessHours(timeEntries, projectId, weeklyTarget).total;
  const manualAndInvoice = kontoEntries
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
