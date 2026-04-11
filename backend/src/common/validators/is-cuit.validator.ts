import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isValidCuit } from '../utils/cuit.util';

export function IsCuit(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCuit',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidCuit(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser un CUIT valido con digito verificador.`;
        },
      },
    });
  };
}
