import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDateInput(value: string): string {
  return value.trim();
}

export function isValidPastOrPresentDate(value: string): boolean {
  const normalized = normalizeDateInput(value);

  if (!ISO_DATE_REGEX.test(normalized)) {
    return false;
  }

  const parsedDate = new Date(`${normalized}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const [year, month, day] = normalized.split('-').map(Number);

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day ||
    year < 1900
  ) {
    return false;
  }

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const candidateUtc = Date.UTC(year, month - 1, day);

  return candidateUtc <= todayUtc;
}

export function dateInputValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();

    if (!value) {
      return null;
    }

    return isValidPastOrPresentDate(value) ? null : { dateInput: true };
  };
}
