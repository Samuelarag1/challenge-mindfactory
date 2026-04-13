import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { normalizeLicensePlate } from '../../common/utils/dominio.util';
import { normalizeManufactureDate } from '../../common/utils/fecha-fabricacion.util';
import { normalizeText } from '../../common/utils/text.util';
import { IsCuit } from '../../common/validators/is-cuit.validator';
import { IsLicensePlate } from '../../common/validators/is-dominio.validator';
import { IsManufactureDate } from '../../common/validators/is-fecha-fabricacion.validator';

export class CreateVehicleDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeLicensePlate(value) : value,
  )
  @IsNotEmpty()
  @IsLicensePlate()
  licensePlate!: string;

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
  @IsNotEmpty()
  @IsManufactureDate()
  manufactureDate!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCuit(value) : value,
  )
  @IsNotEmpty()
  @IsCuit()
  ownerCuit!: string;
}
