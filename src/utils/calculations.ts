import type { TimeEntry, StundenKontoEntry, Settings } from '../store/types';
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

export function getSollHours(settings: Settings, year: number, month: number): number {
  const weeks = countWeeksInMonth(year, month);
  return settings.weeklyTarget * weeks;
}

// --- Stunden-Konto ---

export function getStundenKontoBalance(entries: StundenKontoEntry[]): number {
  return entries.reduce((sum, e) => sum + e.hours, 0);
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
  settings: Settings,
): CapAdjustedResult {
  const filtered = entries.filter(
    (e) => e.projectId === projectId && e.date >= from && e.date <= to,
  );

  const maxHoursPerWeek = settings.weeklyCap / settings.hourlyRate;
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
