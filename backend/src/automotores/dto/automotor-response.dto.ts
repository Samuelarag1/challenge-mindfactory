export class VehicleOwnerResponseDto {
  cuit!: string;
  nombre!: string;
}

export class VehicleResponseDto {
  dominio!: string;
  chasis!: string;
  motor!: string;
  color!: string;
  fechaFabricacion!: string;
  titular!: VehicleOwnerResponseDto | null;
}

export class VehiclesListMetaDto {
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;
  search!: string | null;
  sortBy!: string;
  sortDirection!: string;
}

export class ListVehiclesResponseDto {
  items!: VehicleResponseDto[];
  meta!: VehiclesListMetaDto;
}
