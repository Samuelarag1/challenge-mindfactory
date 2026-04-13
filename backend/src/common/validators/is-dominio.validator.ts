import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isValidLicensePlate } from '../utils/dominio.util';

export function IsLicensePlate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLicensePlate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidLicensePlate(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato AAA999 o AA999AA.`;
        },
      },
    });
  };
}
