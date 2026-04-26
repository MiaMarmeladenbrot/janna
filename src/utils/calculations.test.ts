import { afterEach, beforeEach } from 'vitest';
import type { TimeEntry, OvertimeEntry } from '../store/types';
import {
  calcHours,
  getEntriesForMonth,
  getEntriesForProject,
  getHoursByKW,
  getTotalHours,
  getSollHours,
  getProjectExcessHours,
  getOvertimeBalance,
  getCapAdjustedHours,
  getHoursForProjectRange,
} from './calculations';

const PROJECT_A = 'project-a';
const PROJECT_B = 'project-b';

function makeEntry(date: string, hours: number, projectId = PROJECT_A): TimeEntry {
  return {
    id: `e-${date}-${projectId}`,
    date,
    hours,
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 0,
    projectId,
    checkedTasks: [],
  };
}

function makeOvertime(
  projectId: string,
  hours: number,
  source: 'manual' | 'invoice' = 'manual',
): OvertimeEntry {
  return {
    id: `o-${projectId}-${hours}-${Math.random()}`,
    projectId,
    month: '2025-04',
    hours,
    source,
  };
}

// Pin "now" so getProjectExcessHours's current-week exclusion is deterministic.
beforeEach(() => {
  vi.setSystemTime(new Date('2026-04-26T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('calcHours', () => {
  it('returns the difference between two HH:MM strings in hours', () => {
    expect(calcHours('09:00', '17:30')).toBe(8.5);
  });

  it('subtracts the optional break in minutes', () => {
    expect(calcHours('09:00', '17:30', 30)).toBe(8);
  });

  it('rounds to 2 decimals', () => {
    expect(calcHours('09:00', '09:20')).toBe(0.33);
  });

  it('returns 0 when either time is missing', () => {
    expect(calcHours('', '17:00')).toBe(0);
    expect(calcHours('09:00', '')).toBe(0);
  });

  it('returns 0 when the result would be negative or zero', () => {
    expect(calcHours('17:00', '09:00')).toBe(0);
    expect(calcHours('09:00', '09:00')).toBe(0);
    expect(calcHours('09:00', '09:30', 60)).toBe(0); // break > range
  });
});

describe('getEntriesForMonth', () => {
  const entries: TimeEntry[] = [
    makeEntry('2025-03-31', 8),
    makeEntry('2025-04-01', 7),
    makeEntry('2025-04-15', 6),
    makeEntry('2025-04-30', 5),
    makeEntry('2025-05-01', 4),
    makeEntry('2025-04-10', 3, PROJECT_B),
  ];

  it('filters by year and month (month is 0-indexed)', () => {
    const april = getEntriesForMonth(entries, 2025, 3);
    expect(april.map((e) => e.date)).toEqual([
      '2025-04-01',
      '2025-04-15',
      '2025-04-30',
      '2025-04-10',
    ]);
  });

  it('optionally filters by project', () => {
    const april = getEntriesForMonth(entries, 2025, 3, PROJECT_B);
    expect(april).toHaveLength(1);
    expect(april[0].date).toBe('2025-04-10');
  });
});

describe('getEntriesForProject', () => {
  it('keeps only entries for the given project', () => {
    const entries = [makeEntry('2025-04-01', 8), makeEntry('2025-04-02', 6, PROJECT_B)];
    const result = getEntriesForProject(entries, PROJECT_A);
    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe(PROJECT_A);
  });
});

describe('getTotalHours', () => {
  it('sums hours', () => {
    const entries = [makeEntry('2025-04-01', 8), makeEntry('2025-04-02', 6.5)];
    expect(getTotalHours(entries)).toBe(14.5);
  });

  it('returns 0 for empty list', () => {
    expect(getTotalHours([])).toBe(0);
  });
});

describe('getSollHours', () => {
  it('multiplies the weekly target by the number of ISO weeks touching the month', () => {
    // April 2025 touches 5 ISO weeks (KW 14-18).
    expect(getSollHours(28.5, 2025, 3)).toBeCloseTo(28.5 * 5);
  });
});

describe('getHoursByKW', () => {
  it('aggregates by ISO year+week with zero-padded keys', () => {
    const entries = [
      makeEntry('2025-04-14', 4), // KW 16/2025
      makeEntry('2025-04-15', 5), // KW 16/2025
      makeEntry('2025-04-21', 6), // KW 17/2025
    ];
    const map = getHoursByKW(entries);
    expect(map.get('2025-16')).toBe(9);
    expect(map.get('2025-17')).toBe(6);
  });

  it('keeps KW 1 of different ISO years separate', () => {
    const entries = [
      makeEntry('2024-12-30', 2), // KW 1/2025 (Mon)
      makeEntry('2024-01-01', 3), // KW 1/2024 (Mon)
    ];
    const map = getHoursByKW(entries);
    expect(map.get('2025-01')).toBe(2);
    expect(map.get('2024-01')).toBe(3);
  });
});

describe('getProjectExcessHours', () => {
  it('counts only positive surplus toward total', () => {
    const entries = [
      makeEntry('2025-04-14', 30), // KW 16/2025: +1.5
      makeEntry('2025-04-21', 25), // KW 17/2025: -3.5 (informational, no debt)
    ];
    const { total, byKW } = getProjectExcessHours(entries, PROJECT_A, 28.5);
    expect(total).toBeCloseTo(1.5);
    expect(byKW.get('2025-16')).toBeCloseTo(1.5);
    expect(byKW.get('2025-17')).toBeCloseTo(-3.5);
  });

  it('skips the current ISO week', () => {
    // System time pinned to 2026-04-26 (Sun) → KW 17/2026.
    const entries = [
      makeEntry('2026-04-20', 40), // KW 17/2026, current → skipped
      makeEntry('2026-04-13', 32), // KW 16/2026: +3.5
    ];
    const { total, byKW } = getProjectExcessHours(entries, PROJECT_A, 28.5);
    expect(total).toBeCloseTo(3.5);
    expect(byKW.has('2026-17')).toBe(false);
  });

  it('ignores entries from other projects', () => {
    const entries = [
      makeEntry('2025-04-14', 40, PROJECT_A),
      makeEntry('2025-04-14', 100, PROJECT_B),
    ];
    const { total } = getProjectExcessHours(entries, PROJECT_A, 28.5);
    expect(total).toBeCloseTo(11.5);
  });
});

describe('getOvertimeBalance', () => {
  it('sums live excess + manual/invoice overtime entries', () => {
    const entries = [makeEntry('2025-04-14', 30)]; // +1.5
    const ot = [makeOvertime(PROJECT_A, 5), makeOvertime(PROJECT_A, -2, 'invoice')];
    expect(getOvertimeBalance(ot, entries, PROJECT_A, 28.5)).toBeCloseTo(1.5 + 5 - 2);
  });

  it('filters overtime entries by project', () => {
    const ot = [makeOvertime(PROJECT_A, 5), makeOvertime(PROJECT_B, 999)];
    expect(getOvertimeBalance(ot, [], PROJECT_A, 28.5)).toBeCloseTo(5);
  });
});

describe('getCapAdjustedHours', () => {
  it('caps a single week at the weekly target and reports excess', () => {
    const entries = [
      makeEntry('2025-04-14', 10),
      makeEntry('2025-04-15', 10),
      makeEntry('2025-04-16', 15), // total 35 in KW 16
    ];
    const result = getCapAdjustedHours(entries, PROJECT_A, '2025-04-01', '2025-04-30', 28.5);
    expect(result.kwDetails).toHaveLength(1);
    expect(result.kwDetails[0]).toMatchObject({
      year: 2025,
      kw: 16,
      actual: 35,
      billable: 28.5,
      excess: 6.5,
    });
    expect(result.totalBillableHours).toBeCloseTo(28.5);
    expect(result.totalExcessHours).toBeCloseTo(6.5);
  });

  it('does not split a week across month imports — Donnerstag-Regel', () => {
    // KW 27/2025: Mon June 30 – Sun July 6, Thursday July 3.
    // Entries on Mon-Wed are calendar-June, Thu-Sun are calendar-July.
    const entries = [
      makeEntry('2025-06-30', 8), // Mon (June)
      makeEntry('2025-07-01', 8), // Tue (July)
      makeEntry('2025-07-03', 8), // Thu (July)
      makeEntry('2025-07-06', 8), // Sun (July)
    ];

    // June import (range June 1–30): KW 27 has Thursday July 3 → not in range.
    const june = getCapAdjustedHours(entries, PROJECT_A, '2025-06-01', '2025-06-30', 28.5);
    expect(june.kwDetails).toEqual([]);
    expect(june.totalBillableHours).toBe(0);

    // July import (range July 1–31): KW 27 belongs entirely to July, including
    // the Monday that is calendar-June.
    const july = getCapAdjustedHours(entries, PROJECT_A, '2025-07-01', '2025-07-31', 28.5);
    expect(july.kwDetails).toHaveLength(1);
    expect(july.kwDetails[0].actual).toBe(32); // all 4 days, including Mon June 30
    expect(july.entries).toHaveLength(4);
  });

  it('keeps KW 1 of the new ISO year out of the previous December import', () => {
    // Dec 30, 2024 (Mon) and Dec 31, 2024 (Tue) belong to KW 1/2025.
    const entries = [
      makeEntry('2024-12-30', 8), // KW 1/2025
      makeEntry('2024-12-23', 8), // KW 52/2024
    ];

    const dec = getCapAdjustedHours(entries, PROJECT_A, '2024-12-01', '2024-12-31', 28.5);
    // Only KW 52/2024 should appear (Thu = Dec 26, in range).
    expect(dec.kwDetails.map((d) => `${d.year}-${String(d.kw).padStart(2, '0')}`)).toEqual(['2024-52']);

    const jan = getCapAdjustedHours(entries, PROJECT_A, '2025-01-01', '2025-01-31', 28.5);
    // KW 1/2025 has Thursday Jan 2 → in range.
    expect(jan.kwDetails.map((d) => `${d.year}-${String(d.kw).padStart(2, '0')}`)).toEqual(['2025-01']);
  });

  it('skips weeks listed in excludeWeeks', () => {
    const entries = [
      makeEntry('2025-04-14', 10), // KW 16/2025
      makeEntry('2025-04-21', 10), // KW 17/2025
    ];
    const result = getCapAdjustedHours(
      entries,
      PROJECT_A,
      '2025-04-01',
      '2025-04-30',
      28.5,
      new Set(['2025-16']),
    );
    expect(result.kwDetails.map((d) => d.kw)).toEqual([17]);
  });

  it('ignores entries from other projects', () => {
    const entries = [
      makeEntry('2025-04-14', 10, PROJECT_A),
      makeEntry('2025-04-14', 40, PROJECT_B),
    ];
    const result = getCapAdjustedHours(entries, PROJECT_A, '2025-04-01', '2025-04-30', 28.5);
    expect(result.kwDetails).toHaveLength(1);
    expect(result.kwDetails[0].actual).toBe(10);
  });

  it('sorts kwDetails by year, then by week', () => {
    const entries = [
      makeEntry('2025-01-06', 5), // KW 2/2025
      makeEntry('2024-12-23', 5), // KW 52/2024
      makeEntry('2024-12-30', 5), // KW 1/2025
    ];
    const result = getCapAdjustedHours(entries, PROJECT_A, '2024-12-01', '2025-12-31', 28.5);
    expect(result.kwDetails.map((d) => `${d.year}-${String(d.kw).padStart(2, '0')}`)).toEqual([
      '2024-52',
      '2025-01',
      '2025-02',
    ]);
  });
});

describe('getHoursForProjectRange', () => {
  it('sums hours and unique KWs strictly within [from, to]', () => {
    const entries = [
      makeEntry('2025-04-14', 4), // KW 16
      makeEntry('2025-04-15', 5), // KW 16
      makeEntry('2025-04-21', 6), // KW 17
      makeEntry('2025-05-01', 7), // out of range
    ];
    const result = getHoursForProjectRange(entries, PROJECT_A, '2025-04-01', '2025-04-30');
    expect(result.totalHours).toBe(15);
    expect(result.kwNumbers).toEqual([16, 17]);
    expect(result.entries).toHaveLength(3);
  });
});
