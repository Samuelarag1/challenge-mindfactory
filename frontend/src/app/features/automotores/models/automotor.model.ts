import { PaginatedMeta } from '../../../shared/models/pagination.model';
import { Owner } from '../../sujetos/models/sujeto.model';

export type VehicleSortField =
  | 'dominio'
  | 'titularCuit'
  | 'titularNombre'
  | 'fechaFabricacion';
export type SortDirection = 'asc' | 'desc';

export interface Vehicle {
  licensePlate: string;
  chassis: string;
  engine: string;
  color: string;
  manufactureDate: string;
  owner: Owner;
}

export interface VehicleUpsertPayload {
  licensePlate: string;
  chassis: string;
  engine: string;
  color: string;
  manufactureDate: string;
  ownerCuit: string;
}

export interface VehicleUpdatePayload
  extends Omit<VehicleUpsertPayload, 'licensePlate'> {}

export interface VehiclesListMeta extends PaginatedMeta {
  search: string | null;
  sortBy: VehicleSortField;
  sortDirection: SortDirection;
}

export interface VehiclesListResponse {
  items: Vehicle[];
  meta: VehiclesListMeta;
}

export interface VehiclesQuery {
  page: number;
  limit: number;
  search?: string;
  sortBy: VehicleSortField;
  sortDirection: SortDirection;
}
