export function normalizeFechaFabricacion(value: string) {
  return value.trim();
}

export function isValidFechaFabricacion(value: string) {
  const normalized = normalizeFechaFabricacion(value);

  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));

  if (month < 1 || month > 12 || year < 1900) {
    return false;
  }

  const today = new Date();
  const currentPeriod = today.getFullYear() * 100 + (today.getMonth() + 1);
  const candidatePeriod = year * 100 + month;

  return candidatePeriod <= currentPeriod;
}
