import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const LICENSE_PLATE_REGEX = /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export function normalizeLicensePlate(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidLicensePlate(value: string): boolean {
  return LICENSE_PLATE_REGEX.test(normalizeLicensePlate(value));
}

export function licensePlateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();

    if (!value) {
      return null;
    }

    return isValidLicensePlate(value) ? null : { licensePlate: true };
  };
}
