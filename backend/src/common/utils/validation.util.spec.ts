import { isValidCuit, normalizeCuit } from './cuit.util';
import { isValidDominio, normalizeDominio } from './dominio.util';
import {
  isValidFechaFabricacion,
  normalizeFechaFabricacion,
} from './fecha-fabricacion.util';

describe('validation utils', () => {
  it('normaliza dominio de forma segura y valida formatos soportados', () => {
    expect(normalizeDominio(' aa123aa ')).toBe('AA123AA');
    expect(isValidDominio('AAA123')).toBe(true);
    expect(isValidDominio('AA123AA')).toBe(true);
    expect(isValidDominio('AAA***123')).toBe(false);
    expect(isValidDominio('AA@123@@AA')).toBe(false);
    expect(isValidDominio('A123AAA')).toBe(false);
  });

  it('normaliza formatos canonicos de cuit y rechaza basura arbitraria', () => {
    expect(normalizeCuit('20-12345678-6')).toBe('20123456786');
    expect(normalizeCuit(' 20123456786 ')).toBe('20123456786');
    expect(normalizeCuit('20-12345678-6abc')).toBe('20-12345678-6abc');
    expect(isValidCuit('20-12345678-6')).toBe(true);
    expect(isValidCuit('20-12345678-6abc')).toBe(false);
    expect(isValidCuit('20-12345678-0')).toBe(false);
  });

  it('acepta solo YYYYMM como fecha de fabricacion', () => {
    expect(normalizeFechaFabricacion(' 202001 ')).toBe('202001');
    expect(isValidFechaFabricacion('202001')).toBe(true);
    expect(isValidFechaFabricacion('2020/01')).toBe(false);
    expect(isValidFechaFabricacion('20a20b01')).toBe(false);
    expect(isValidFechaFabricacion('202013')).toBe(false);
  });
});
