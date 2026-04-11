import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { normalizeDominio } from '../../common/utils/dominio.util';
import { IsDominio } from '../../common/validators/is-dominio.validator';

export class AutomotorDominioParamDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeDominio(value) : value,
  )
  @IsNotEmpty()
  @IsDominio()
  dominio!: string;
}
