import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { IsCuit } from '../../common/validators/is-cuit.validator';

export class FindSujetoByCuitQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCuit(value) : value,
  )
  @IsNotEmpty()
  @IsCuit()
  cuit!: string;
}
