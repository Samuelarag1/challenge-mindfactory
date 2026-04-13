import { dateInputValidator, isValidPastOrPresentDate } from './yyyymm.validator';

describe('dateInputValidator', () => {
  it('accepts valid ISO date values', () => {
    expect(isValidPastOrPresentDate('2018-06-01')).toBe(true);
  });

  it('rejects invalid or future dates', () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 10);

    expect(isValidPastOrPresentDate('2018-13-01')).toBe(false);
    expect(isValidPastOrPresentDate('2024-02-31')).toBe(false);
    expect(isValidPastOrPresentDate(futureDate)).toBe(false);
    expect(dateInputValidator()({ value: futureDate } as never)).toEqual({
      dateInput: true,
    });
  });
});
