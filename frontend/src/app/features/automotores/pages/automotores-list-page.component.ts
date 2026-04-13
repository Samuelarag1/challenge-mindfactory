import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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
import { EMPTY, Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { StateCardComponent } from '../../../shared/components/state-card/state-card.component';
import {
  VehicleTableItem,
  VehiclesTableComponent,
} from '../components/automotores-table/automotores-table.component';
import {
  Vehicle,
  VehiclesListMeta,
  VehiclesListResponse,
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

type VehiclesLoadResult =
  | {
      kind: 'success';
      query: VehiclesQuery;
      response: VehiclesListResponse;
    }
  | {
      kind: 'error';
      query: VehiclesQuery;
      error: unknown;
    };

function formatManufactureDateLabel(value: string): string {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');

  return `${year}/${month}`;
}

@Component({
  selector: 'app-automotores-list-page',
  standalone: true,
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
    <section class="page-shell" [attr.aria-busy]="loading()">
      <header class="page-header">
        <div class="header-copy">
          <span class="section-kicker">Gestion vehicular</span>

          <div class="heading-row">
            <div class="heading-copy">
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
          <div class="filters" role="search" aria-label="Buscar automotores">
            <div class="filter-copy">
              <p id="search-help" class="filter-support">
                Puedes buscar por dominio o por CUIT exacto del titular.
              </p>

              <mat-form-field appearance="outline" class="full-width filter-field">
                <mat-label>Buscar por dominio o CUIT</mat-label>
                <input
                  matInput
                  type="search"
                  [formControl]="searchControl"
                  placeholder="Ej. AAA123 o 20123456786"
                  spellcheck="false"
                  autocomplete="off"
                  aria-describedby="search-help"
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
                [disabled]="loading()"
                (click)="applySearch()"
              >
                Buscar
              </button>
              <button
                mat-stroked-button
                type="button"
                class="filter-button"
                [disabled]="loading() || !canClearSearch()"
                (click)="clearSearch()"
              >
                Limpiar
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (errorMessages().length > 0 && items().length > 0) {
        <mat-card appearance="outlined" class="error-banner" role="alert" aria-live="assertive">
          <mat-card-content>
            <strong>No se pudo completar la accion.</strong>
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
          tone="error"
          (action)="reload()"
        />
      } @else if (!loading() && items().length === 0) {
        <app-state-card
          [title]="emptyStateTitle()"
          [message]="emptyStateMessage()"
          [actionLabel]="emptyStateActionLabel()"
          tone="empty"
          (action)="handleEmptyStateAction()"
        />
      } @else {
        <app-automotores-table
          [items]="tableItems()"
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

    .heading-copy {
      min-width: 0;
    }

    .section-kicker {
      color: #0f766e;
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
      color: var(--text-muted);
      margin: 0.35rem 0 0;
      max-width: 42rem;
    }

    .header-stat {
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(14, 116, 144, 0.12);
      border-radius: 16px;
      display: grid;
      gap: 0.15rem;
      min-width: 11rem;
      padding: 0.9rem 1rem;
    }

    .header-stat strong {
      color: var(--text-strong);
      font-size: 1rem;
      line-height: 1.1;
    }

    .header-stat span {
      color: var(--text-muted);
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
      gap: 0.35rem;
      min-width: 0;
    }

    .filter-field {
      width: 100%;
    }

    .filter-support {
      color: var(--text-muted);
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
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
    }

    .search-card-content {
      padding: 1.35rem 1.5rem !important;
    }

    .error-banner {
      background: var(--error-soft);
      border-color: rgba(220, 38, 38, 0.18);
    }

    .error-banner strong {
      display: block;
      margin-bottom: 0.5rem;
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
  private readonly queryChanges = new Subject<VehiclesQuery>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly items = signal<Vehicle[]>([]);
  readonly meta = signal<VehiclesListMeta>(DEFAULT_META);
  readonly loading = signal(false);
  readonly errorMessages = signal<string[]>([]);
  readonly tableItems = computed<VehicleTableItem[]>(() =>
    this.items().map((vehicle) => ({
      ...vehicle,
      manufactureDateLabel: formatManufactureDateLabel(vehicle.manufactureDate),
    })),
  );
  readonly hasActiveSearch = computed(() => Boolean(this.meta().search?.trim()));
  readonly resultCountLabel = computed(() => {
    if (this.loading() && this.items().length === 0) {
      return 'Cargando listado';
    }

    const total = this.meta().total;
    return total === 1 ? '1 registro' : `${total} registros`;
  });
  readonly resultContextLabel = computed(() => {
    const meta = this.meta();

    if (meta.totalPages > 0) {
      return `Pagina ${meta.page} de ${meta.totalPages}`;
    }

    if (this.hasActiveSearch()) {
      return 'Busqueda aplicada';
    }

    return 'Sin registros cargados';
  });
  readonly emptyStateTitle = computed(() =>
    this.hasActiveSearch() ? 'No hubo coincidencias' : 'Todavia no hay automotores',
  );
  readonly emptyStateMessage = computed(() => {
    const search = this.meta().search?.trim();

    if (search) {
      return `No encontramos resultados para "${search}". Revisa el dominio o el CUIT e intenta de nuevo.`;
    }

    return 'Cuando registres el primer automotor, aparecera en este listado.';
  });
  readonly emptyStateActionLabel = computed(() =>
    this.hasActiveSearch() ? 'Limpiar busqueda' : 'Crear automotor',
  );

  private query: VehiclesQuery = {
    page: DEFAULT_META.page,
    limit: DEFAULT_META.limit,
    sortBy: DEFAULT_META.sortBy,
    sortDirection: DEFAULT_META.sortDirection,
  };

  constructor() {
    this.queryChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.loading.set(true);
          this.errorMessages.set([]);
        }),
        switchMap((query) =>
          this.vehiclesService.list(query).pipe(
            map(
              (response): VehiclesLoadResult => ({
                kind: 'success',
                query,
                response,
              }),
            ),
            catchError((error: unknown) =>
              of({
                kind: 'error',
                query,
                error,
              } satisfies VehiclesLoadResult),
            ),
          ),
        ),
      )
      .subscribe((result) => {
        this.loading.set(false);

        if (result.kind === 'success') {
          this.items.set(result.response.items);
          this.meta.set(result.response.meta);
          return;
        }

        this.items.set([]);
        this.meta.set({
          ...DEFAULT_META,
          page: result.query.page,
          limit: result.query.limit,
          sortBy: result.query.sortBy,
          sortDirection: result.query.sortDirection,
          search: result.query.search ?? null,
        });
        this.errorMessages.set(
          this.apiErrorService.toMessages(
            result.error,
            'No se pudo cargar el listado de automotores.',
          ),
        );
      });

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
    if (!this.canClearSearch()) {
      return;
    }

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
        message: `Vas a eliminar el automotor ${vehicle.licensePlate}. Esta accion no se puede deshacer.`,
        confirmLabel: 'Eliminar automotor',
        cancelLabel: 'Cancelar',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((confirmed) => {
          if (!confirmed) {
            return EMPTY;
          }

          this.loading.set(true);
          return this.vehiclesService.remove(vehicle.licensePlate);
        }),
      )
      .subscribe({
        next: () => {
          if (this.items().length === 1 && this.query.page > 1) {
            this.query = { ...this.query, page: this.query.page - 1 };
          }

          this.snackBar.open(`Se elimino ${vehicle.licensePlate}.`, 'Cerrar', {
            duration: 3000,
            politeness: 'polite',
          });
          this.loadVehicles();
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessages.set(
            this.apiErrorService.toMessages(error, 'No se pudo eliminar el automotor.'),
          );
        },
      });
  }

  handleEmptyStateAction(): void {
    if (this.hasActiveSearch()) {
      this.clearSearch();
      return;
    }

    this.goToCreate();
  }

  canClearSearch(): boolean {
    return this.searchControl.value.trim().length > 0 || this.hasActiveSearch();
  }

  private loadVehicles(): void {
    this.queryChanges.next({ ...this.query });
  }
}
