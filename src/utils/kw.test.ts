import { format } from 'date-fns';
import {
  getWeeksInMonth,
  getDaysInWeekForMonth,
  getKW,
  getKWYear,
  countWeeksInMonth,
  getISOWeekKey,
  formatWeekKey,
} from './kw';

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

describe('getKW', () => {
  it('returns ISO week for a date string', () => {
    expect(getKW('2025-01-02')).toBe(1); // KW 1/2025 (Thursday)
    expect(getKW('2025-04-26')).toBe(17);
  });

  it('returns ISO week for a Date', () => {
    expect(getKW(new Date('2025-01-02'))).toBe(1);
  });

  it('handles year-boundary days that belong to the previous year ISO-week-wise', () => {
    // Jan 1, 2023 is Sunday → ISO KW 52 of 2022
    expect(getKW('2023-01-01')).toBe(52);
  });

  it('handles year-end days that belong to the next year ISO-week-wise', () => {
    // Dec 30, 2024 is Monday → ISO KW 1 of 2025
    expect(getKW('2024-12-30')).toBe(1);
    expect(getKW('2024-12-31')).toBe(1);
  });
});

describe('getISOWeekKey', () => {
  it('returns "YYYY-WW" with zero-padded week from a string', () => {
    expect(getISOWeekKey('2025-04-14')).toBe('2025-16');
    expect(getISOWeekKey('2025-01-02')).toBe('2025-01');
  });

  it('uses the ISO year, not the calendar year, near year boundaries', () => {
    expect(getISOWeekKey('2024-12-30')).toBe('2025-01');
    expect(getISOWeekKey('2023-01-01')).toBe('2022-52');
  });

  it('accepts a Date object', () => {
    expect(getISOWeekKey(new Date('2025-04-14T12:00:00'))).toBe('2025-16');
  });
});

describe('formatWeekKey', () => {
  it('joins year and zero-padded week', () => {
    expect(formatWeekKey(2025, 1)).toBe('2025-01');
    expect(formatWeekKey(2025, 16)).toBe('2025-16');
    expect(formatWeekKey(2024, 52)).toBe('2024-52');
  });
});

describe('getKWYear', () => {
  it('returns the ISO week-year, which can differ from the calendar year', () => {
    expect(getKWYear('2024-12-30')).toBe(2025); // calendar 2024, ISO year 2025
    expect(getKWYear('2023-01-01')).toBe(2022); // calendar 2023, ISO year 2022
    expect(getKWYear('2025-04-26')).toBe(2025);
  });
});

describe('getWeeksInMonth', () => {
  it('returns ISO week numbers covering each day of the month', () => {
    // April 2025: Mar 31 (KW 14) → Apr 30 (KW 18). Apr 1 itself is Tue, KW 14.
    expect(getWeeksInMonth(2025, 3)).toEqual([14, 15, 16, 17, 18]);
  });

  it('includes a week from the next ISO year when the month spans the boundary', () => {
    // December 2024: Dec 1 is Sunday (still KW 48), Dec 30-31 are KW 1/2025.
    // KW 1 stays at the end since the days it covers are chronologically last.
    expect(getWeeksInMonth(2024, 11)).toEqual([48, 49, 50, 51, 52, 1]);
  });

  it('handles a leap-year February', () => {
    // Feb 2024 starts Thu Feb 1 (KW 5), ends Thu Feb 29 (KW 9).
    expect(getWeeksInMonth(2024, 1)).toEqual([5, 6, 7, 8, 9]);
  });
});

describe('countWeeksInMonth', () => {
  it('counts unique ISO weeks touching the month', () => {
    expect(countWeeksInMonth(2025, 3)).toBe(5);
    expect(countWeeksInMonth(2024, 1)).toBe(5);
  });
});

describe('getDaysInWeekForMonth', () => {
  it('returns Mon–Sun when the week is entirely inside the month', () => {
    // KW 16 of 2025 = Mon Apr 14 – Sun Apr 20
    const days = getDaysInWeekForMonth(16, 2025, 3);
    expect(days).toHaveLength(7);
    expect(fmt(days[0])).toBe('2025-04-14');
    expect(fmt(days[6])).toBe('2025-04-20');
  });

  it('clips days that fall outside the month at the start of a week', () => {
    // KW 14 of 2025 = Mon Mar 31 – Sun Apr 6. In April view, Mar 31 is excluded.
    const days = getDaysInWeekForMonth(14, 2025, 3);
    expect(days.map(fmt)).toEqual([
      '2025-04-01',
      '2025-04-02',
      '2025-04-03',
      '2025-04-04',
      '2025-04-05',
      '2025-04-06',
    ]);
  });

  it('clips days that fall outside the month at the end of a week', () => {
    // KW 18 of 2025 = Mon Apr 28 – Sun May 4. In April view, May 1-4 are excluded.
    const days = getDaysInWeekForMonth(18, 2025, 3);
    expect(days.map(fmt)).toEqual([
      '2025-04-28',
      '2025-04-29',
      '2025-04-30',
    ]);
  });

  it('returns [] when the requested KW does not touch the month at all', () => {
    expect(getDaysInWeekForMonth(40, 2025, 3)).toEqual([]);
  });
});
