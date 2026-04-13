import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { normalizeManufactureDate } from '../../common/utils/fecha-fabricacion.util';
import { normalizeText } from '../../common/utils/text.util';
import { IsCuit } from '../../common/validators/is-cuit.validator';
import { IsManufactureDate } from '../../common/validators/is-fecha-fabricacion.validator';

export class UpdateVehicleDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  chassis!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  engine!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  color!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeManufactureDate(value) : value,
  )
  @IsManufactureDate()
  manufactureDate!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCuit(value) : value,
  )
  @IsCuit()
  ownerCuit!: string;
}
