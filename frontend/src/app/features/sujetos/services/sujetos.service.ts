import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateOwnerPayload, Owner } from '../models/sujeto.model';

@Injectable({ providedIn: 'root' })
export class OwnersService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/owners`;

  findByCuit(cuit: string): Observable<Owner> {
    const params = new HttpParams().set('cuit', cuit);
    return this.http.get<Owner>(`${this.resourceUrl}/by-cuit`, { params });
  }

  create(payload: CreateOwnerPayload): Observable<Owner> {
    return this.http.post<Owner>(this.resourceUrl, payload);
  }
}
