export function compareInvoiceNumbers(a: string, b: string): number {
  return a.localeCompare(b, 'de', { numeric: true });
}

export function incrementInvoiceNumber(current: string): string {
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return current;
  const [, prefix, digits] = match;
  const next = String(parseInt(digits, 10) + 1).padStart(digits.length, '0');
  return `${prefix}${next}`;
}
