import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { normalizeLicensePlate } from '../../common/utils/dominio.util';
import { IsLicensePlate } from '../../common/validators/is-dominio.validator';

export class VehicleLicensePlateParamDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeLicensePlate(value) : value,
  )
  @IsNotEmpty()
  @IsLicensePlate()
  dominio!: string;
}
