const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const CANONICAL_CUIT_REGEX = /^\d{11}$/;
const HYPHENATED_CUIT_REGEX = /^\d{2}-\d{8}-\d$/;

export function normalizeCuit(value: string) {
  const trimmed = value.trim();

  if (CANONICAL_CUIT_REGEX.test(trimmed)) {
    return trimmed;
  }

  if (HYPHENATED_CUIT_REGEX.test(trimmed)) {
    return trimmed.replace(/-/g, '');
  }

  return trimmed;
}

export function isValidCuit(value: string) {
  const normalized = normalizeCuit(value);

  if (!CANONICAL_CUIT_REGEX.test(normalized)) {
    return false;
  }

  const digits = normalized.split('').map(Number);
  const verifier = digits[10];
  const sum = CUIT_WEIGHTS.reduce(
    (accumulator, weight, index) => accumulator + digits[index] * weight,
    0,
  );
  const remainder = sum % 11;
  const calculated = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return verifier === calculated;
}
