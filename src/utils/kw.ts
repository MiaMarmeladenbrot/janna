import { getISOWeek, startOfMonth, endOfMonth, eachDayOfInterval, startOfISOWeek, endOfISOWeek, isWithinInterval, parseISO, getISOWeekYear } from 'date-fns';

export function getWeeksInMonth(year: number, month: number): number[] {
  const start = startOfMonth(new Date(year, month, 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  const weeks = new Set<number>();
  days.forEach((d) => weeks.add(getISOWeek(d)));
  return Array.from(weeks).sort((a, b) => a - b);
}

export function getDaysInWeekForMonth(
  kw: number,
  year: number,
  month: number
): Date[] {
  // Find a date in the given KW
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const monthInterval = { start: monthStart, end: monthEnd };

  // Find the Monday of this KW
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dayInWeek = allDays.find((d) => getISOWeek(d) === kw);
  if (!dayInWeek) return [];

  const weekStart = startOfISOWeek(dayInWeek);
  const weekEnd = endOfISOWeek(dayInWeek);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return weekDays.filter((d) => isWithinInterval(d, monthInterval));
}

export function getKW(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getISOWeek(d);
}

export function getKWYear(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getISOWeekYear(d);
}

export function countWeeksInMonth(year: number, month: number): number {
  return getWeeksInMonth(year, month).length;
}
