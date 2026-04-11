import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isValidDominio } from '../utils/dominio.util';

export function IsDominio(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDominio',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidDominio(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato AAA999 o AA999AA.`;
        },
      },
    });
  };
}
