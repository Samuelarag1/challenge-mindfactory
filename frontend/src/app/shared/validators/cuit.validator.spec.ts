import { cuitValidator, isValidCuit, normalizeCuit } from './cuit.validator';

describe('cuitValidator', () => {
  it('accepts valid CUIT values and normalizes hyphenated input', () => {
    expect(normalizeCuit('20-12345678-6')).toBe('20123456786');
    expect(isValidCuit('20123456786')).toBe(true);
  });

  it('rejects invalid verifier digits', () => {
    expect(isValidCuit('20123456780')).toBe(false);
    expect(cuitValidator()({ value: '20123456780' } as never)).toEqual({
      cuit: true,
    });
  });
});
