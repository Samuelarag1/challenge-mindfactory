import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { normalizeCuit } from '../../common/utils/cuit.util';
import { normalizeLicensePlate } from '../../common/utils/dominio.util';
import { normalizeText } from '../../common/utils/text.util';

export const VEHICLE_SORT_FIELDS = [
  'dominio',
  'chasis',
  'color',
  'fechaFabricacion',
  'titularCuit',
  'titularNombre',
] as const;

export type VehicleSortField = (typeof VEHICLE_SORT_FIELDS)[number];

export class ListVehiclesQueryDto {
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
  @IsIn(VEHICLE_SORT_FIELDS)
  sortBy: VehicleSortField = 'dominio';

  @Transform(({ value }) => {
    if (value === undefined) {
      return 'asc';
    }

    return String(value).toLowerCase();
  })
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';

  get normalizedLicensePlateSearch() {
    if (!this.search) {
      return '';
    }

    return normalizeLicensePlate(this.search);
  }

  get normalizedCuitSearch() {
    if (!this.search) {
      return '';
    }

    return normalizeCuit(this.search);
  }

  get normalizedOwnerNameSearch() {
    if (!this.search) {
      return '';
    }

    return normalizeText(this.search);
  }
}
