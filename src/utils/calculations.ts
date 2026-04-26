import type { Invoice, TimeEntry, OvertimeEntry } from '../store/types';
import { countWeeksInMonth, getISOWeekKey, getKW } from './kw';
import {
  parseISO,
  getMonth,
  getYear,
  startOfISOWeek,
  addDays,
  format,
} from 'date-fns';

/** Net / VAT / gross totals for an invoice. */
export function getInvoiceTotals(
  invoice: Invoice,
): { net: number; vat: number; gross: number } {
  const net = invoice.positions.reduce((s, p) => s + p.netAmount, 0);
  const vat = net * invoice.vatRate;
  return { net, vat, gross: net + vat };
}

/**
 * Hours between `start` and `end` (HH:MM strings) minus optional break in
 * minutes. Returns 0 if either time is missing or the result is non-positive.
 * Result is rounded to 2 decimals.
 */
export function calcHours(start: string, end: string, breakMin = 0): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em - (sh * 60 + sm) - breakMin) / 60;
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

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
    const key = getISOWeekKey(e.date);
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
    const key = getISOWeekKey(e.date);
    kwMap.set(key, (kwMap.get(key) || 0) + e.hours);
  }

  const currentKey = getISOWeekKey(new Date());
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
  year: number;
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

/**
 * Group project entries by ISO week and compute cap per week.
 *
 * A week is included if its **Thursday** falls in [from, to]. This avoids
 * splitting weeks across month imports: KW 27/2025 (Mon June 30 - Sun July 6,
 * Thursday July 3) is always grouped under July, never split between June and
 * July imports. When a week is included, all its entries are considered —
 * even those with dates outside [from, to] — so the cap is computed against
 * the full ISO-week hours.
 *
 * `excludeWeeks` skips weeks already booked on another invoice (key format
 * `"YYYY-WW"` with zero-padded week).
 */
export function getCapAdjustedHours(
  entries: TimeEntry[],
  projectId: string,
  from: string,
  to: string,
  weeklyTarget: number,
  excludeWeeks?: ReadonlySet<string>,
): CapAdjustedResult {
  const projectEntries = entries.filter((e) => e.projectId === projectId);

  // Group all project entries by ISO year+week.
  const weekEntries = new Map<string, TimeEntry[]>();
  for (const e of projectEntries) {
    const key = getISOWeekKey(e.date);
    const list = weekEntries.get(key);
    if (list) list.push(e);
    else weekEntries.set(key, [e]);
  }

  const kwDetails: KWCapDetail[] = [];
  const includedEntries: TimeEntry[] = [];
  let totalBillableHours = 0;
  let totalExcessHours = 0;

  for (const [key, weekEs] of weekEntries) {
    if (excludeWeeks?.has(key)) continue;

    // Determine Thursday: start of ISO week (Monday) + 3 days.
    const thursday = addDays(startOfISOWeek(parseISO(weekEs[0].date)), 3);
    const thursdayStr = format(thursday, 'yyyy-MM-dd');
    if (thursdayStr < from || thursdayStr > to) continue;

    const [yearStr, weekStr] = key.split('-');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    const actual = weekEs.reduce((s, e) => s + e.hours, 0);
    const billable = Math.min(actual, weeklyTarget);
    const excess = Math.max(0, actual - weeklyTarget);

    kwDetails.push({ year, kw: week, actual, billable, excess });
    includedEntries.push(...weekEs);
    totalBillableHours += billable;
    totalExcessHours += excess;
  }

  kwDetails.sort((a, b) => a.year - b.year || a.kw - b.kw);

  return {
    kwNumbers: kwDetails.map((d) => d.kw),
    totalBillableHours,
    totalExcessHours,
    entries: includedEntries,
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
