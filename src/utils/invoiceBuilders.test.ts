import type { Project } from '../store/types';
import type { CapAdjustedResult, KWCapDetail } from './calculations';
import {
  buildHoursPositions,
  buildOvertimePosition,
  buildFlatratePosition,
} from './invoiceBuilders';

const project: Project = {
  id: 'p1',
  clientId: 'c1',
  name: 'Test Project',
  description: 'Beratung',
  active: true,
  commonTasks: [],
  hourlyRate: 35,
  weeklyTarget: 28.5,
  weeklyCap: 1000,
  vatRate: 0.19,
  paymentTerms: '14 Tage',
};

let counter = 0;
const idGen = () => `id-${++counter}`;
beforeEach(() => {
  counter = 0;
});

function makeCapResult(details: KWCapDetail[]): CapAdjustedResult {
  return {
    kwNumbers: details.map((d) => d.kw),
    totalBillableHours: details.reduce((s, d) => s + d.billable, 0),
    totalExcessHours: details.reduce((s, d) => s + d.excess, 0),
    entries: [],
    kwDetails: details,
  };
}

describe('buildHoursPositions', () => {
  it('returns [] for an empty cap result', () => {
    expect(buildHoursPositions(makeCapResult([]), project, idGen)).toEqual([]);
  });

  it('builds a single hours position when no week is capped', () => {
    const result = makeCapResult([
      { year: 2025, kw: 16, actual: 20, billable: 20, excess: 0 },
      { year: 2025, kw: 17, actual: 25, billable: 25, excess: 0 },
    ]);
    const positions = buildHoursPositions(result, project, idGen);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({
      id: 'id-1',
      billingType: 'hours',
      description: 'Beratung',
      totalHours: 45,
      hourlyRate: 35,
      flatAmount: 0,
      netAmount: 45 * 35,
      weeks: [
        { year: 2025, week: 16 },
        { year: 2025, week: 17 },
      ],
    });
  });

  it('builds a single flatrate position when every week is capped', () => {
    const result = makeCapResult([
      { year: 2025, kw: 16, actual: 35, billable: 28.5, excess: 6.5 },
      { year: 2025, kw: 17, actual: 40, billable: 28.5, excess: 11.5 },
    ]);
    const positions = buildHoursPositions(result, project, idGen);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({
      billingType: 'flatrate',
      flatAmount: 2000, // 1000 * 2 capped weeks
      netAmount: 2000,
      totalHours: 0,
      weeks: [
        { year: 2025, week: 16 },
        { year: 2025, week: 17 },
      ],
    });
  });

  it('splits into hours + flatrate positions when some weeks are capped', () => {
    const result = makeCapResult([
      { year: 2025, kw: 16, actual: 20, billable: 20, excess: 0 },
      { year: 2025, kw: 17, actual: 35, billable: 28.5, excess: 6.5 },
    ]);
    const positions = buildHoursPositions(result, project, idGen);
    expect(positions).toHaveLength(2);
    expect(positions[0].billingType).toBe('hours');
    expect(positions[0].totalHours).toBe(20);
    expect(positions[1].billingType).toBe('flatrate');
    expect(positions[1].flatAmount).toBe(1000);
  });

  it('uses default hourly rate and weekly cap when project is undefined', () => {
    const result = makeCapResult([
      { year: 2025, kw: 16, actual: 35, billable: 28.5, excess: 6.5 },
    ]);
    const positions = buildHoursPositions(result, undefined, idGen);
    expect(positions[0].flatAmount).toBe(1000); // default cap
    expect(positions[0].hourlyRate).toBe(35); // default rate
  });
});

describe('buildOvertimePosition', () => {
  it('builds an hours position with structured weeks (no periodLabel)', () => {
    const pos = buildOvertimePosition(
      {
        description: 'Überstunden 2025 / KW 16',
        weeks: [{ year: 2025, week: 16 }],
        periodLabel: '2025 / KW 16',
        overtimeHours: 6.5,
      },
      project,
      idGen,
    );
    expect(pos).toMatchObject({
      id: 'id-1',
      billingType: 'hours',
      totalHours: 6.5,
      hourlyRate: 35,
      flatAmount: 0,
      netAmount: 6.5 * 35,
      weeks: [{ year: 2025, week: 16 }],
    });
    expect(pos.periodLabel).toBeUndefined();
  });

  it('uses periodLabel when no weeks are given (e.g. manual monthly overtime)', () => {
    const pos = buildOvertimePosition(
      {
        description: 'Überstunden — Sonderaktion',
        weeks: [],
        periodLabel: 'April 2025',
        overtimeHours: 3,
      },
      project,
      idGen,
    );
    expect(pos.periodLabel).toBe('April 2025');
    expect(pos.weeks).toEqual([]);
  });

  it('rounds overtime hours to 2 decimals', () => {
    const pos = buildOvertimePosition(
      {
        description: 'x',
        weeks: [],
        overtimeHours: 1.234567,
      },
      project,
      idGen,
    );
    expect(pos.totalHours).toBe(1.23);
    expect(pos.netAmount).toBeCloseTo(1.23 * 35);
  });
});

describe('buildFlatratePosition', () => {
  it('returns null when both description and amount are empty/zero', () => {
    expect(buildFlatratePosition('', '', 0, idGen)).toBeNull();
  });

  it('builds a flatrate position with periodLabel when kwRange is given', () => {
    const pos = buildFlatratePosition('Workshop', 'KW 16-17', 1500, idGen);
    expect(pos).toMatchObject({
      id: 'id-1',
      description: 'Workshop',
      billingType: 'flatrate',
      weeks: [],
      periodLabel: 'KW 16-17',
      flatAmount: 1500,
      netAmount: 1500,
      totalHours: 0,
      hourlyRate: 0,
    });
  });

  it('omits periodLabel when kwRange is empty', () => {
    const pos = buildFlatratePosition('Workshop', '', 1500, idGen);
    expect(pos?.periodLabel).toBeUndefined();
  });

  it('builds a position when only description is set (zero amount)', () => {
    const pos = buildFlatratePosition('Reminder', '', 0, idGen);
    expect(pos).not.toBeNull();
    expect(pos?.flatAmount).toBe(0);
  });
});
