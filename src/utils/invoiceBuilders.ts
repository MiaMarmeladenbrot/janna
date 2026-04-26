import type { InvoicePosition, PositionWeek, Project } from '../store/types';
import type { CapAdjustedResult } from './calculations';

const DEFAULT_HOURLY_RATE = 35;
const DEFAULT_WEEKLY_CAP = 1000;

type IdGen = () => string;
const defaultIdGen: IdGen = () => crypto.randomUUID();

/**
 * Convert a {@link CapAdjustedResult} into 0-2 invoice positions:
 * - one combined "hours" position for weeks under the cap
 * - one combined "flatrate" position for capped weeks (priced as
 *   `weeklyCap * cappedWeekCount`).
 *
 * Returns `[]` when the cap result is empty.
 */
export function buildHoursPositions(
  capResult: CapAdjustedResult,
  project: Project | undefined,
  idGen: IdGen = defaultIdGen,
): InvoicePosition[] {
  if (capResult.totalBillableHours === 0 && capResult.totalExcessHours === 0) {
    return [];
  }

  const description = project?.description || '';
  const hourlyRate = project?.hourlyRate ?? DEFAULT_HOURLY_RATE;
  const weeklyCap = project?.weeklyCap ?? DEFAULT_WEEKLY_CAP;

  const uncapped = capResult.kwDetails.filter((d) => d.excess === 0);
  const capped = capResult.kwDetails.filter((d) => d.excess > 0);
  const toWeeks = (details: typeof capResult.kwDetails): PositionWeek[] =>
    details.map((d) => ({ year: d.year, week: d.kw }));

  const positions: InvoicePosition[] = [];

  if (uncapped.length > 0) {
    const totalHours = uncapped.reduce((s, d) => s + d.actual, 0);
    positions.push({
      id: idGen(),
      description,
      billingType: 'hours',
      weeks: toWeeks(uncapped),
      totalHours,
      hourlyRate,
      flatAmount: 0,
      netAmount: totalHours * hourlyRate,
    });
  }

  if (capped.length > 0) {
    positions.push({
      id: idGen(),
      description,
      billingType: 'flatrate',
      weeks: toWeeks(capped),
      totalHours: 0,
      hourlyRate,
      flatAmount: weeklyCap * capped.length,
      netAmount: weeklyCap * capped.length,
    });
  }

  return positions;
}

export interface OvertimeBuildInput {
  description: string;
  weeks: PositionWeek[];
  periodLabel?: string;
  overtimeHours: number;
}

/**
 * Build a single "hours" invoice position for redeeming overtime.
 * Uses `periodLabel` only when no structured weeks are given.
 */
export function buildOvertimePosition(
  input: OvertimeBuildInput,
  project: Project | undefined,
  idGen: IdGen = defaultIdGen,
): InvoicePosition {
  const hourlyRate = project?.hourlyRate ?? DEFAULT_HOURLY_RATE;
  const hours = Math.round(input.overtimeHours * 100) / 100;
  return {
    id: idGen(),
    description: input.description,
    billingType: 'hours',
    weeks: input.weeks,
    periodLabel: input.weeks.length === 0 ? input.periodLabel : undefined,
    totalHours: hours,
    hourlyRate,
    flatAmount: 0,
    netAmount: hours * hourlyRate,
  };
}

/**
 * Build a manual flatrate position from form fields.
 * Returns `null` when both `description` and `amount` are empty/zero.
 */
export function buildFlatratePosition(
  description: string,
  kwRange: string,
  amount: number,
  idGen: IdGen = defaultIdGen,
): InvoicePosition | null {
  if (!amount && !description) return null;
  return {
    id: idGen(),
    description,
    billingType: 'flatrate',
    weeks: [],
    periodLabel: kwRange || undefined,
    totalHours: 0,
    hourlyRate: 0,
    flatAmount: amount,
    netAmount: amount,
  };
}
