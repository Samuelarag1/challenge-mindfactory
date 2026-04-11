import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { normalizeDominio } from '../../common/utils/dominio.util';

export const AUTOMOTOR_SORT_FIELDS = [
  'dominio',
  'marca',
  'modelo',
  'fechaFabricacion',
  'titularCuit',
] as const;

export type AutomotorSortField = (typeof AUTOMOTOR_SORT_FIELDS)[number];

export class ListAutomotoresQueryDto {
  @Transform(({ value }) => {
    if (value === undefined) {
      return 1;
    }

    return Number(value);
  })
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => {
    if (value === undefined) {
      return 10;
    }

    return Number(value);
  })
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => {
    if (value === undefined) {
      return 'dominio';
    }

    return String(value);
  })
  @IsIn(AUTOMOTOR_SORT_FIELDS)
  sortBy: AutomotorSortField = 'dominio';

  @Transform(({ value }) => {
    if (value === undefined) {
      return 'asc';
    }

    return String(value).toLowerCase();
  })
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';

  get normalizedDominioSearch() {
    if (!this.search) {
      return '';
    }

    return normalizeDominio(this.search);
  }

  get normalizedCuitSearch() {
    if (!this.search) {
      return '';
    }

    return normalizeCuit(this.search);
  }
}
