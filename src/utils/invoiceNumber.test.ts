import { describe, it, expect } from 'vitest';
import { compareInvoiceNumbers, incrementInvoiceNumber } from './invoiceNumber';

describe('incrementInvoiceNumber', () => {
  it('increments plain numbers', () => {
    expect(incrementInvoiceNumber('41')).toBe('42');
  });

  it('keeps prefix and zero padding', () => {
    expect(incrementInvoiceNumber('2026-01')).toBe('2026-02');
    expect(incrementInvoiceNumber('2026-09')).toBe('2026-10');
  });

  it('grows past the padding width', () => {
    expect(incrementInvoiceNumber('2026-99')).toBe('2026-100');
  });

  it('leaves numbers without trailing digits unchanged', () => {
    expect(incrementInvoiceNumber('RE-A')).toBe('RE-A');
  });
});

describe('compareInvoiceNumbers', () => {
  it('compares numerically within the string', () => {
    expect(compareInvoiceNumbers('2026-10', '2026-9')).toBeGreaterThan(0);
    expect(compareInvoiceNumbers('9', '10')).toBeLessThan(0);
  });
});
