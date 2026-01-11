import { describe, it, expect } from 'vitest';
import { parseLocalDate } from './dateHelpers';

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD string to local midnight', () => {
    const input = '2026-01-01';
    const result = parseLocalDate(input);

    // Check components to ensure local time match
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // Jan is 0
    expect(result.getDate()).toBe(1);

    // Verify it isn't shifted by timezone (simple check: hours shouled be 0 if we constructed it with new Date(y, m, d))
    expect(result.getHours()).toBe(0);
  });

  it('parses IS0 string and ignores time part', () => {
    const input = '2026-12-31T15:00:00.000Z';
    const result = parseLocalDate(input);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(11); // Dec is 11
    expect(result.getDate()).toBe(31);
    expect(result.getHours()).toBe(0);
  });

  it('handles empty string by returning current date', () => {
    const result = parseLocalDate('');
    const now = new Date();
    // Should stay within same day (unless executed at 23:59:59.999)
    expect(result.getDate()).toBe(now.getDate());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getFullYear()).toBe(now.getFullYear());
  });
});
