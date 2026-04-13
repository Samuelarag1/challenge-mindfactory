import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Vehicle,
  VehiclesListResponse,
  VehiclesQuery,
  VehicleUpdatePayload,
  VehicleUpsertPayload,
} from '../models/automotor.model';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/vehicles`;

  list(query: VehiclesQuery): Observable<VehiclesListResponse> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<VehiclesListResponse>(this.resourceUrl, { params });
  }

  findByLicensePlate(licensePlate: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(
      `${this.resourceUrl}/${encodeURIComponent(licensePlate)}`,
    );
  }

  create(payload: VehicleUpsertPayload): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.resourceUrl, payload);
  }

  update(
    licensePlate: string,
    payload: VehicleUpdatePayload,
  ): Observable<Vehicle> {
    return this.http.put<Vehicle>(
      `${this.resourceUrl}/${encodeURIComponent(licensePlate)}`,
      payload,
    );
  }

  remove(licensePlate: string): Observable<void> {
    return this.http.delete<void>(
      `${this.resourceUrl}/${encodeURIComponent(licensePlate)}`,
    );
  }
}
