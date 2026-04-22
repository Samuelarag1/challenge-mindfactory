import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { normalizeText } from '../../common/utils/text.util';
import { IsCuit } from '../../common/validators/is-cuit.validator';

export class CreateOwnerDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCuit(value) : value,
  )
  @IsNotEmpty()
  @IsCuit()
  cuit!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;
}
