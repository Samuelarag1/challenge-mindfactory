import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Vehicle, VehiclesListMeta } from '../../models/automotor.model';

export interface VehicleTableItem extends Vehicle {
  manufactureDateLabel: string;
}

@Component({
  selector: 'app-automotores-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
  ],
  template: `
    <mat-card appearance="outlined" class="table-card">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (loading() && items().length === 0) {
        <div class="skeleton-table" aria-hidden="true">
          @for (row of skeletonRows; track row) {
            <div class="skeleton-row">
              <span class="skeleton-cell skeleton-cell--short"></span>
              <span class="skeleton-cell"></span>
              <span class="skeleton-cell skeleton-cell--medium"></span>
              <span class="skeleton-cell skeleton-cell--medium"></span>
              <span class="skeleton-cell skeleton-cell--short"></span>
            </div>
          }
        </div>
        <p class="visually-hidden" aria-live="polite">Cargando automotores.</p>
      } @else {
        <div class="table-wrapper">
          <table
            id="vehicles-table"
            mat-table
            [dataSource]="items()"
            [trackBy]="trackByLicensePlate"
            matSort
            [matSortActive]="meta().sortBy"
            [matSortDirection]="meta().sortDirection"
            [matSortDisableClear]="true"
            (matSortChange)="sortChange.emit($event)"
          >
            <caption class="visually-hidden">
              Listado de automotores con acciones para editar o eliminar registros.
            </caption>

            <ng-container matColumnDef="licensePlate">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header="dominio"
                sortActionDescription="Ordenar por dominio"
              >
                Dominio
              </th>
              <td mat-cell *matCellDef="let vehicle">
                <span class="domain-pill">{{ vehicle.licensePlate }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="owner">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header="titularNombre"
                sortActionDescription="Ordenar por titular"
              >
                Titular
              </th>
              <td mat-cell *matCellDef="let vehicle">
                <div class="owner-block">
                  <strong class="owner-name">{{ vehicle.owner.name }}</strong>
                  <span class="owner-meta">Responsable actual</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="ownerCuit">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header="titularCuit"
                sortActionDescription="Ordenar por CUIT"
              >
                CUIT
              </th>
              <td mat-cell *matCellDef="let vehicle">
                <span class="mono-text">{{ vehicle.owner.cuit }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="newColumn">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header="fechaFabricacion"
                sortActionDescription="Ordenar por fecha de fabricacion"
              >
                Fabricacion
              </th>
              <td mat-cell *matCellDef="let vehicle">
                <!-- <span class="date-text">{{ vehicle.manufactureDateLabel }}</span> -->
                 <span>No hay dato porque es una new column que me va a venir del backend</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="manufactureDate">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header="fechaFabricacion"
                sortActionDescription="Ordenar por fecha de fabricacion"
              >
                Fabricacion
              </th>
              <td mat-cell *matCellDef="let vehicle">
                <span class="date-text">{{ vehicle.manufactureDateLabel }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let vehicle" class="actions-cell">
                <div class="actions-group">
                  <button
                    mat-stroked-button
                    type="button"
                    class="action-button"
                    [attr.aria-label]="'Editar automotor ' + vehicle.licensePlate"
                    (click)="edit.emit(vehicle)"
                  >
                    Editar
                  </button>
                  <button
                    mat-button
                    type="button"
                    class="action-button action-button--danger"
                    [attr.aria-label]="'Eliminar automotor ' + vehicle.licensePlate"
                    (click)="remove.emit(vehicle)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>
      }

      <mat-paginator
        aria-label="Paginacion del listado de automotores"
        [length]="meta().total"
        [pageIndex]="meta().page - 1"
        [pageSize]="meta().limit"
        [pageSizeOptions]="pageSizeOptions"
        (page)="pageChange.emit($event)"
      />
    </mat-card>
  `,
  styles: `
    .table-card {
      overflow: hidden;
    }

    .skeleton-table {
      display: grid;
      gap: 0.85rem;
      padding: 1rem 1.25rem 1.1rem;
    }

    .skeleton-row {
      display: grid;
      gap: 0.85rem;
      grid-template-columns: 120px minmax(160px, 1fr) 160px 130px 160px;
    }

    .skeleton-cell {
      animation: pulse 1.2s ease-in-out infinite;
      background: linear-gradient(
        90deg,
        rgba(226, 232, 240, 0.55),
        rgba(241, 245, 249, 0.9),
        rgba(226, 232, 240, 0.55)
      );
      background-size: 200% 100%;
      border-radius: 10px;
      height: 44px;
    }

    .skeleton-cell--short {
      max-width: 110px;
    }

    .skeleton-cell--medium {
      max-width: 140px;
    }

    .table-wrapper {
      overflow-x: auto;
      padding: 0.35rem 1rem 0.5rem;
    }

    .table-wrapper table {
      border-collapse: separate;
      border-spacing: 0;
      min-width: 860px;
      width: 100%;
    }

    .table-wrapper th {
      background: rgba(248, 250, 252, 0.88);
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .table-wrapper th,
    .table-wrapper td {
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);
      padding: 1rem 1.1rem;
      vertical-align: middle;
    }

    .table-wrapper tr.mat-mdc-row:hover {
      background: rgba(241, 245, 249, 0.78);
    }

    .table-wrapper .mat-column-licensePlate {
      width: 140px;
    }

    .table-wrapper .mat-column-ownerCuit {
      width: 170px;
    }

    .table-wrapper .mat-column-manufactureDate {
      width: 160px;
    }

    .table-wrapper .mat-column-actions {
      text-align: right;
      width: 220px;
    }

    .domain-pill {
      background: rgba(239, 246, 255, 0.92);
      border: 1px solid rgba(37, 99, 235, 0.14);
      border-radius: 999px;
      color: #1d4ed8;
      display: inline-flex;
      font-size: 0.86rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      padding: 0.48rem 0.72rem;
      text-transform: uppercase;
    }

    .owner-block {
      display: grid;
      gap: 0.18rem;
    }

    .owner-name {
      color: var(--text-strong);
      font-size: 0.97rem;
      font-weight: 700;
    }

    .owner-meta {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .mono-text {
      color: #0f172a;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .date-text {
      color: #334155;
      font-weight: 600;
    }

    .actions-cell {
      white-space: nowrap;
    }

    .actions-group {
      display: inline-flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .action-button {
      min-width: 88px;
    }

    .action-button--danger {
      color: #b91c1c;
    }

    mat-paginator {
      border-top: 1px solid rgba(226, 232, 240, 0.9);
    }

    @keyframes pulse {
      0% {
        background-position: 0 50%;
      }

      100% {
        background-position: 100% 50%;
      }
    }

    @media (max-width: 720px) {
      .skeleton-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .table-wrapper {
        padding-inline: 0.35rem;
      }
    }
  `,
})
export class VehiclesTableComponent {
  readonly items = input.required<VehicleTableItem[]>();
  readonly meta = input.required<VehiclesListMeta>();
  readonly loading = input(false);
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();
  readonly edit = output<Vehicle>();
  readonly remove = output<Vehicle>();

  protected readonly displayedColumns = [
    'licensePlate',
    'owner',
    'ownerCuit',
    'manufactureDate',
    'actions',
    'newColumn'
  ];
  protected readonly pageSizeOptions = [5, 10, 20, 50];
  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  protected readonly trackByLicensePlate = (_index: number, vehicle: Vehicle): string =>
    vehicle.licensePlate;
}
