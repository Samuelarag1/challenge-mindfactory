import { isValidLicensePlate, licensePlateValidator } from './dominio.validator';

describe('licensePlateValidator', () => {
  it('accepts old and mercosur license plate formats', () => {
    expect(isValidLicensePlate('AAA123')).toBe(true);
    expect(isValidLicensePlate('AA123AA')).toBe(true);
  });

  it('rejects invalid license plate formats', () => {
    expect(isValidLicensePlate('A123AA')).toBe(false);
    expect(isValidLicensePlate('AAA12')).toBe(false);
    expect(licensePlateValidator()({ value: 'AA12AAA' } as never)).toEqual({
      licensePlate: true,
    });
  });
});
