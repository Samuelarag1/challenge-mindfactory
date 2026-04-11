export class AutomotorTitularResponseDto {
  cuit!: string;
  nombre!: string;
}

export class AutomotorResponseDto {
  dominio!: string;
  chasis!: string;
  motor!: string;
  color!: string;
  fechaFabricacion!: string;
  titular!: AutomotorTitularResponseDto;
}

export class AutomotoresListMetaDto {
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;
  search!: string | null;
  sortBy!: string;
  sortDirection!: string;
}

export class ListAutomotoresResponseDto {
  items!: AutomotorResponseDto[];
  meta!: AutomotoresListMetaDto;
}
