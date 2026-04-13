import { isValidCuit, normalizeCuit } from './cuit.util';
import { normalizeManufactureDate, isValidManufactureDate } from './fecha-fabricacion.util';
import { isValidLicensePlate, normalizeLicensePlate } from './dominio.util';
import { normalizeText } from './text.util';

function getFutureManufactureDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

describe('validation utils', () => {
  it('normalizes license plates safely and validates supported formats', () => {
    expect(normalizeLicensePlate(' aa123aa ')).toBe('AA123AA');
    expect(isValidLicensePlate('AAA123')).toBe(true);
    expect(isValidLicensePlate('AA123AA')).toBe(true);
    expect(isValidLicensePlate('AAA***123')).toBe(false);
    expect(isValidLicensePlate('AA@123@@AA')).toBe(false);
    expect(isValidLicensePlate('A123AAA')).toBe(false);
  });

  it('normalizes canonical cuit formats and rejects arbitrary garbage', () => {
    expect(normalizeCuit('20-12345678-6')).toBe('20123456786');
    expect(normalizeCuit(' 20123456786 ')).toBe('20123456786');
    expect(normalizeCuit('20-12345678-6abc')).toBe('20-12345678-6abc');
    expect(isValidCuit('20-12345678-6')).toBe(true);
    expect(isValidCuit('20-12345678-6abc')).toBe(false);
    expect(isValidCuit('20-12345678-0')).toBe(false);
  });

  it('accepts only valid ISO dates for manufactureDate', () => {
    expect(normalizeManufactureDate(' 2020-01-15 ')).toBe('2020-01-15');
    expect(isValidManufactureDate('2020-01-15')).toBe(true);
    expect(isValidManufactureDate('2020/01/15')).toBe(false);
    expect(isValidManufactureDate('20a0-01-15')).toBe(false);
    expect(isValidManufactureDate('2020-13-01')).toBe(false);
    expect(isValidManufactureDate('2020-02-31')).toBe(false);
    expect(isValidManufactureDate(getFutureManufactureDate())).toBe(false);
  });

  it('collapses internal spacing in free text fields', () => {
    expect(normalizeText('  Azul   metalizado  ')).toBe('Azul metalizado');
  });
});
