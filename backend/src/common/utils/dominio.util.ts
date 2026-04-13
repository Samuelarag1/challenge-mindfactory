export function normalizeLicensePlate(value: string) {
  return value.trim().toUpperCase();
}

export function isValidLicensePlate(value: string) {
  const normalized = normalizeLicensePlate(value);
  return /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(normalized);
}
