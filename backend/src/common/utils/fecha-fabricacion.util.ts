const YYYYMM_REGEX = /^\d{6}$/;
const ISO_MONTH_START_REGEX = /^\d{4}-\d{2}-01$/;
const HALF_DAY_IN_MS = 12 * 60 * 60 * 1000;

export function normalizeManufactureDate(value: string) {
  return value.trim();
}

export function manufactureDateToDatabase(value: string) {
  const normalized = normalizeManufactureDate(value);

  if (YYYYMM_REGEX.test(normalized)) {
    const year = normalized.slice(0, 4);
    const month = normalized.slice(4, 6);
    return `${year}-${month}-01`;
  }

  return normalized;
}

export function manufactureDateFromDatabase(value: string | Date): string {
  if (value instanceof Date) {
    const shifted = new Date(value.getTime() + HALF_DAY_IN_MS + 24 * 60 * 60 * 1000);
    return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  const normalized = normalizeManufactureDate(value);

  if (ISO_MONTH_START_REGEX.test(normalized)) {
    return normalized.slice(0, 4) + normalized.slice(5, 7);
  }

  const isoDateMatch = normalized.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (isoDateMatch) {
    const shifted = new Date(`${normalized}T12:00:00.000Z`);
    shifted.setUTCDate(shifted.getUTCDate() + 1);
    return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  const parsedDate = new Date(normalized);
  if (!Number.isNaN(parsedDate.getTime())) {
    const shifted = new Date(parsedDate.getTime() + HALF_DAY_IN_MS + 24 * 60 * 60 * 1000);
    return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  return normalized;
}

export function isValidManufactureDate(value: string) {
  const normalized = normalizeManufactureDate(value);

  if (!YYYYMM_REGEX.test(normalized)) {
    return false;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));

  if (year < 1900 || month < 1 || month > 12) {
    return false;
  }

  const today = new Date();
  const todayYearMonth =
    today.getUTCFullYear() * 100 + (today.getUTCMonth() + 1);
  const candidateYearMonth = year * 100 + month;

  return candidateYearMonth <= todayYearMonth;
}
