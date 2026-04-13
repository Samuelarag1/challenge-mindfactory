import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { StateCardComponent } from '../../../shared/components/state-card/state-card.component';
import { VehiclesTableComponent } from '../components/automotores-table/automotores-table.component';
import {
  Vehicle,
  VehiclesListMeta,
  VehiclesQuery,
} from '../models/automotor.model';
import { VehiclesService } from '../services/automotores.service';

const DEFAULT_META: VehiclesListMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  search: null,
  sortBy: 'licensePlate',
  sortDirection: 'asc',
};

@Component({
  selector: 'app-automotores-list-page',
  standalone:true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VehiclesTableComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    StateCardComponent,
  ],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div class="header-copy">
          <span class="section-kicker">Gestion vehicular</span>

          <div class="heading-row">
            <div>
              <h1>Automotores</h1>
              <p>Consulta, edita y elimina automotores registrados.</p>
            </div>
          </div>
        </div>

        <button
          mat-flat-button
          color="primary"
          type="button"
          class="create-button"
          (click)="goToCreate()"
        >
          Nuevo automotor
        </button>
      </header>

      <mat-card appearance="outlined" class="search-card">
        <mat-card-content class="search-card-content">
          <div class="filters">
            <div class="filter-copy">
              <mat-form-field appearance="outline" class="full-width filter-field">
                <mat-label>Buscar por dominio o CUIT</mat-label>
                <input
                  matInput
                  [formControl]="searchControl"
                  placeholder="Ej. AAA123 o 20123456786"
                  (keyup.enter)="applySearch()"
                />
              </mat-form-field>
            </div>

            <div class="filter-actions">
              <button
                mat-flat-button
                color="primary"
                type="button"
                class="filter-button"
                (click)="applySearch()"
              >
                Buscar
              </button>
              <button
                mat-stroked-button
                type="button"
                class="filter-button"
                (click)="clearSearch()"
              >
                Limpiar
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (errorMessages().length > 0 && items().length > 0) {
        <mat-card appearance="outlined" class="error-banner">
          <mat-card-content>
            <ul>
              @for (error of errorMessages(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      }

      @if (errorMessages().length > 0 && items().length === 0) {
        <app-state-card
          title="No pudimos cargar el listado"
          [message]="errorMessages().join(' ')"
          actionLabel="Reintentar"
          (action)="reload()"
        />
      } @else if (!loading() && items().length === 0) {
        <app-state-card
          title="Sin resultados"
          message="No encontramos automotores para la busqueda aplicada."
          actionLabel="Crear automotor"
          (action)="goToCreate()"
        />
      } @else {
        <app-automotores-table
          [items]="items()"
          [meta]="meta()"
          [loading]="loading()"
          (pageChange)="onPageChange($event)"
          (sortChange)="onSortChange($event)"
          (edit)="editVehicle($event)"
          (remove)="deleteVehicle($event)"
        />
      }
    </section>
  `,
  styles: `
    .page-shell {
      display: grid;
      gap: 1.25rem;
    }

    .page-header {
      align-items: end;
      display: flex;
      gap: 1.25rem;
      justify-content: space-between;
    }

    .header-copy {
      display: grid;
      gap: 0.75rem;
    }

    .section-kicker {
      color: #2563eb;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .heading-row {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 2rem;
      letter-spacing: -0.03em;
      margin: 0;
    }

    .page-header p {
      color: #52607a;
      margin: 0.35rem 0 0;
      max-width: 42rem;
    }

    .header-stat {
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(37, 99, 235, 0.12);
      border-radius: 18px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      display: grid;
      gap: 0.15rem;
      min-width: 10.5rem;
      padding: 0.9rem 1rem;
    }

    .header-stat strong {
      color: #172033;
      font-size: 1rem;
      line-height: 1.1;
    }

    .header-stat span {
      color: #64748b;
      font-size: 0.82rem;
    }

    .create-button {
      min-height: 46px;
      min-width: 11rem;
    }

    .filters {
      align-items: end;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .filter-copy {
      display: grid;
      gap: 0.5rem;
      min-width: 0;
    }

    .filter-field {
      width: 100%;
    }

    .filter-support {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.45;
      margin: 0;
    }

    .filter-actions {
      align-items: center;
      display: flex;
      gap: 0.75rem;
      padding-bottom: 1.35rem;
    }

    .filter-button {
      min-height: 44px;
      min-width: 8.5rem;
    }

    .search-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
    }

    .search-card-content {
      padding: 1.4rem 1.5rem !important;
    }

    .error-banner {
      border-color: #dc2626;
    }

    .error-banner ul {
      margin: 0;
      padding-left: 1rem;
    }

    @media (max-width: 720px) {
      .page-header {
        align-items: stretch;
        flex-direction: column;
      }

      .heading-row {
        align-items: stretch;
        flex-direction: column;
      }

      .filters {
        grid-template-columns: 1fr;
      }

      .filter-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding-bottom: 0;
        width: 100%;
      }

      .filter-button {
        min-width: 0;
      }
    }
  `,
})
export class VehiclesListPageComponent {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly items = signal<Vehicle[]>([]);
  readonly meta = signal<VehiclesListMeta>(DEFAULT_META);
  readonly loading = signal(false);
  readonly errorMessages = signal<string[]>([]);


  private query: VehiclesQuery = {
    page: DEFAULT_META.page,
    limit: DEFAULT_META.limit,
    sortBy: DEFAULT_META.sortBy,
    sortDirection: DEFAULT_META.sortDirection,
  };

  constructor() {
    this.loadVehicles();
  }

  applySearch(): void {
    this.query = {
      ...this.query,
      page: 1,
      search: this.searchControl.value.trim() || undefined,
    };
    this.loadVehicles();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.query = {
      ...this.query,
      page: 1,
      search: undefined,
    };
    this.loadVehicles();
  }

  reload(): void {
    this.loadVehicles();
  }

  goToCreate(): void {
    void this.router.navigate(['/vehicles/new']);
  }

  editVehicle(vehicle: Vehicle): void {
    void this.router.navigate(['/vehicles', vehicle.licensePlate, 'edit']);
  }

  onPageChange(event: PageEvent): void {
    this.query = {
      ...this.query,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    };
    this.loadVehicles();
  }

  onSortChange(event: Sort): void {
    const nextDirection = event.direction === 'desc' ? 'desc' : 'asc';
    const nextSortBy =
      event.active === 'ownerCuit' ||
      event.active === 'ownerName' ||
      event.active === 'manufactureDate'
        ? event.active
        : 'licensePlate';

    this.query = {
      ...this.query,
      page: 1,
      sortBy: nextSortBy,
      sortDirection: nextDirection,
    };
    this.loadVehicles();
  }

  deleteVehicle(vehicle: Vehicle): void {
    this.confirmationService
      .confirm({
        title: 'Eliminar automotor',
        message: `Se eliminara el automotor ${vehicle.licensePlate}. Esta accion no se puede deshacer.`,
        confirmLabel: 'Eliminar',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((confirmed) => {
          if (!confirmed) {
            return EMPTY;
          }

          this.loading.set(true);
          return this.vehiclesService
            .remove(vehicle.licensePlate)
            .pipe(finalize(() => this.loading.set(false)));
        }),
      )
      .subscribe({
        next: () => {
          if (this.items().length === 1 && this.query.page > 1) {
            this.query = { ...this.query, page: this.query.page - 1 };
          }

          this.snackBar.open('Automotor eliminado.', 'Cerrar', {
            duration: 3000,
          });
          this.loadVehicles();
        },
        error: (error: unknown) => {
          this.errorMessages.set(
            this.apiErrorService.toMessages(error, 'No se pudo eliminar el automotor.'),
          );
        },
      });
  }

  private loadVehicles(): void {
    this.loading.set(true);
    this.errorMessages.set([]);

    this.vehiclesService
      .list(this.query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.items.set(response.items);
          this.meta.set(response.meta);
        },
        error: (error: unknown) => {
          this.items.set([]);
          this.meta.set({
            ...DEFAULT_META,
            page: this.query.page,
            limit: this.query.limit,
            sortBy: this.query.sortBy,
            sortDirection: this.query.sortDirection,
            search: this.query.search ?? null,
          });
          this.errorMessages.set(
            this.apiErrorService.toMessages(error, 'No se pudo cargar el listado de automotores.'),
          );
        },
      });
  }
}
