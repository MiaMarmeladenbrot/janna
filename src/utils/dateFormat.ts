import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd.MM.yyyy', { locale: de });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd-MM-yyyy');
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: de });
}

export function formatMonthOnly(date: Date): string {
  return format(date, 'MMMM', { locale: de });
}

export function getMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function parseMonthKey(key: string): Date {
  return parseISO(key + '-01');
}

export const WEEKDAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
