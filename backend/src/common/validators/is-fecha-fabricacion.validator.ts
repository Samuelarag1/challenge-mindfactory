import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isValidManufactureDate } from '../utils/fecha-fabricacion.util';

export function IsManufactureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isManufactureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidManufactureDate(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato YYYYMM, un mes valido y no puede ser futura.`;
        },
      },
    });
  };
}
