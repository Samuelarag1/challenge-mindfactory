export function normalizeDominio(value: string) {
  return value.trim().toUpperCase();
}

export function isValidDominio(value: string) {
  const normalized = normalizeDominio(value);
  return /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(normalized);
}
