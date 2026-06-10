import { describe, expect, it } from 'vitest';
import { DATE_FORMATS, formatDate } from '@/lib/dates';

describe('formatDate', () => {
  const date = new Date(2026, 5, 9); // June 9, 2026 (month is 0-based)

  it('formats MM/DD/YYYY', () => {
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('06/09/2026');
  });

  it('formats DD/MM/YYYY', () => {
    expect(formatDate(date, 'DD/MM/YYYY')).toBe('09/06/2026');
  });

  it('formats MMMM D, YYYY', () => {
    expect(formatDate(date, 'MMMM D, YYYY')).toBe('June 9, 2026');
  });

  it('exposes the list of supported formats', () => {
    expect(DATE_FORMATS).toEqual(['MM/DD/YYYY', 'DD/MM/YYYY', 'MMMM D, YYYY']);
  });
});
