import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { isValidFechaFabricacion } from '../utils/fecha-fabricacion.util';

export function IsFechaFabricacion(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFechaFabricacion',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidFechaFabricacion(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato YYYYMM, un mes valido y no puede ser futura.`;
        },
      },
    });
  };
}
