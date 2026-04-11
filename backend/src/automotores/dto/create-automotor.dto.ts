import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { normalizeDominio } from '../../common/utils/dominio.util';
import { normalizeFechaFabricacion } from '../../common/utils/fecha-fabricacion.util';
import { normalizeText } from '../../common/utils/text.util';
import { IsCuit } from '../../common/validators/is-cuit.validator';
import { IsDominio } from '../../common/validators/is-dominio.validator';
import { IsFechaFabricacion } from '../../common/validators/is-fecha-fabricacion.validator';

export class CreateAutomotorDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeDominio(value) : value,
  )
  @IsNotEmpty()
  @IsDominio()
  dominio!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  chasis!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  motor!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeText(value) : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  color!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeFechaFabricacion(value) : value,
  )
  @IsNotEmpty()
  @IsFechaFabricacion()
  fechaFabricacion!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCuit(value) : value,
  )
  @IsNotEmpty()
  @IsCuit()
  titularCuit!: string;
}
