export class VehicleOwnerResponseDto {
  cuit!: string;
  name!: string;
}

export class VehicleResponseDto {
  licensePlate!: string;
  chassis!: string;
  engine!: string;
  color!: string;
  manufactureDate!: string;
  owner!: VehicleOwnerResponseDto | null;
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
