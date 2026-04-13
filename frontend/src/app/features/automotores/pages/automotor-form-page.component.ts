import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { PendingChangesComponent } from '../../../core/guards/pending-changes.guard';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { StateCardComponent } from '../../../shared/components/state-card/state-card.component';
import { cuitValidator, normalizeCuit } from '../../../shared/validators/cuit.validator';
import {
  licensePlateValidator,
  normalizeLicensePlate,
} from '../../../shared/validators/dominio.validator';
import {
  dateInputValidator,
  normalizeDateInput,
} from '../../../shared/validators/yyyymm.validator';
import { CreateOwnerDialogComponent } from '../../sujetos/components/create-sujeto-dialog/create-sujeto-dialog.component';
import { Owner } from '../../sujetos/models/sujeto.model';
import { OwnersService } from '../../sujetos/services/sujetos.service';
import { VehicleUpdatePayload, VehicleUpsertPayload } from '../models/automotor.model';
import { VehiclesService } from '../services/automotores.service';
import {
  VehicleFormComponent,
  VehicleFormGroup,
} from '../components/automotor-form/automotor-form.component';

type FormMode = 'create' | 'edit';
type VehicleFormValue = ReturnType<VehicleFormGroup['getRawValue']>;

const VEHICLE_FORM_FIELDS: Array<keyof VehicleFormValue> = [
  'licensePlate',
  'chassis',
  'engine',
  'color',
  'manufactureDate',
  'ownerCuit',
];

@Component({
  selector: 'app-automotor-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VehicleFormComponent, MatSnackBarModule, StateCardComponent],
  template: `
    <section class="page-shell">
      @if (loadingInitialData()) {
        <div class="form-skeleton" aria-hidden="true">
          <div class="skeleton-block skeleton-block--title"></div>
          <div class="skeleton-grid">
            @for (row of skeletonRows; track row) {
              <div class="skeleton-block"></div>
            }
          </div>
          <div class="skeleton-actions">
            <div class="skeleton-block skeleton-block--button"></div>
            <div class="skeleton-block skeleton-block--button"></div>
          </div>
        </div>
        <p class="visually-hidden" aria-live="polite">Cargando datos del automotor.</p>
      } @else if (loadErrors().length > 0) {
        <app-state-card
          title="No pudimos cargar el automotor"
          [message]="loadErrors().join(' ')"
          actionLabel="Volver al listado"
          tone="error"
          (action)="cancel()"
        />
      } @else {
        <app-automotor-form
          [title]="pageTitle()"
          [submitLabel]="submitLabel()"
          [form]="form"
          [owner]="owner()"
          [errors]="formErrors()"
          [submitting]="submitting()"
          [ownerLookupLoading]="ownerLookupLoading()"
          [originalOwnerCuit]="originalOwnerCuit()"
          (save)="save()"
          (cancel)="cancel()"
          (lookupOwner)="resolveOwner()"
        />
      }
    </section>
  `,
  styles: `
    .page-shell {
      display: grid;
      gap: 1rem;
    }

    .form-skeleton {
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 18px;
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
    }

    .skeleton-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .skeleton-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .skeleton-block {
      animation: pulse 1.2s ease-in-out infinite;
      background: linear-gradient(
        90deg,
        rgba(226, 232, 240, 0.55),
        rgba(241, 245, 249, 0.9),
        rgba(226, 232, 240, 0.55)
      );
      background-size: 200% 100%;
      border-radius: 12px;
      height: 56px;
    }

    .skeleton-block--title {
      height: 70px;
      max-width: 340px;
    }

    .skeleton-block--button {
      height: 42px;
      width: 170px;
    }

    @keyframes pulse {
      0% {
        background-position: 0 50%;
      }

      100% {
        background-position: 100% 50%;
      }
    }

    @media (max-width: 900px) {
      .skeleton-grid {
        grid-template-columns: 1fr;
      }

      .skeleton-actions {
        flex-direction: column;
      }

      .skeleton-block--button {
        width: 100%;
      }
    }
  `,
})
export class VehicleFormPageComponent implements PendingChangesComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly ownersService = inject(OwnersService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly vehicleFormComponent = viewChild(VehicleFormComponent);

  readonly loadingInitialData = signal(false);
  readonly ownerLookupLoading = signal(false);
  readonly submitting = signal(false);
  readonly formErrors = signal<string[]>([]);
  readonly loadErrors = signal<string[]>([]);
  readonly owner = signal<Owner | null>(null);
  readonly originalOwnerCuit = signal<string | null>(null);
  readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  readonly mode: FormMode = this.activatedRoute.snapshot.paramMap.has('licensePlate')
    ? 'edit'
    : 'create';
  readonly licensePlate = this.activatedRoute.snapshot.paramMap.get('licensePlate');
  readonly pageTitle = computed(() =>
    this.mode === 'edit' ? 'Editar automotor' : 'Crear automotor',
  );
  readonly submitLabel = computed(() =>
    this.mode === 'edit' ? 'Guardar cambios' : 'Guardar automotor',
  );

  readonly form: VehicleFormGroup = new FormGroup({
    licensePlate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, licensePlateValidator()],
    }),
    chassis: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
    }),
    engine: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
    }),
    color: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    }),
    manufactureDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, dateInputValidator()],
    }),
    ownerCuit: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cuitValidator()],
    }),
  });

  private initialFormValue: VehicleFormValue = this.captureFormValue();
  private lastResolvedOwnerCuit: string | null = null;
  private submittedSuccessfully = false;

  constructor() {
    this.form.controls.ownerCuit.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const normalized = normalizeCuit(value);

        if (normalized !== this.lastResolvedOwnerCuit) {
          this.owner.set(null);
          this.lastResolvedOwnerCuit = null;
        }
      });

    if (this.mode === 'edit' && this.licensePlate) {
      this.loadVehicle(this.licensePlate);
    }
  }

  hasPendingChanges(): boolean {
    return !this.submittedSuccessfully && this.hasFormValueChanged();
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasPendingChanges()) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  }

  cancel(): void {
    void this.router.navigate(['/vehicles']);
  }

  resolveOwner(): void {
    if (this.ownerLookupLoading() || this.submitting()) {
      return;
    }

    const ownerCuitControl = this.form.controls.ownerCuit;
    ownerCuitControl.markAsTouched();
    ownerCuitControl.updateValueAndValidity();

    if (ownerCuitControl.invalid) {
      this.setFormErrors(['Revisa el CUIT antes de validar el titular.']);
      this.focusFirstInvalidField();
      return;
    }

    this.ensureOwnerAvailable(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  save(): void {
    if (this.submitting()) {
      return;
    }

    this.normalizeAllFields();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.setFormErrors(['Hay campos pendientes o invalidos. Revisa los datos marcados.']);
      this.focusFirstInvalidField();
      return;
    }

    this.formErrors.set([]);
    this.submitting.set(true);

    this.ensureOwnerAvailable(false)
      .pipe(
        switchMap((owner) => {
          if (!owner) {
            this.setFormErrors([
              'Debes contar con un titular valido antes de guardar el automotor.',
            ]);
            return of(null);
          }

          const rawValue = this.form.getRawValue();
          const createPayload: VehicleUpsertPayload = {
            licensePlate: normalizeLicensePlate(rawValue.licensePlate),
            chassis: rawValue.chassis.trim(),
            engine: rawValue.engine.trim(),
            color: rawValue.color.trim(),
            manufactureDate: normalizeDateInput(rawValue.manufactureDate),
            ownerCuit: normalizeCuit(rawValue.ownerCuit),
          };

          if (this.mode === 'edit' && this.licensePlate) {
            return this.vehiclesService.update(
              this.licensePlate,
              this.toUpdatePayload(createPayload),
            );
          }

          return this.vehiclesService.create(createPayload);
        }),
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }

          this.submittedSuccessfully = true;
          this.syncInitialFormValue();
          this.form.markAsPristine();
          this.snackBar.open(
            this.mode === 'edit'
              ? `Cambios guardados para ${result.licensePlate}.`
              : `Automotor ${result.licensePlate} creado.`,
            'Cerrar',
            {
              duration: 3000,
              politeness: 'polite',
            },
          );
          void this.router.navigate(['/vehicles']);
        },
        error: (error: unknown) => {
          this.setFormErrors(
            this.apiErrorService.toMessages(error, 'No se pudo guardar el automotor.'),
          );
        },
      });
  }

  private loadVehicle(licensePlate: string): void {
    this.loadingInitialData.set(true);
    this.loadErrors.set([]);

    this.vehiclesService
      .findByLicensePlate(licensePlate)
      .pipe(finalize(() => this.loadingInitialData.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (vehicle) => {
          this.form.patchValue({
            licensePlate: vehicle.licensePlate,
            chassis: vehicle.chassis,
            engine: vehicle.engine,
            color: vehicle.color,
            manufactureDate: vehicle.manufactureDate,
            ownerCuit: vehicle.owner.cuit,
          });
          this.form.controls.licensePlate.disable({ emitEvent: false });
          this.setResolvedOwner(vehicle.owner);
          this.originalOwnerCuit.set(vehicle.owner.cuit);
          this.syncInitialFormValue();
          this.form.markAsPristine();
        },
        error: (error: unknown) => {
          this.loadErrors.set(
            this.apiErrorService.toMessages(error, 'No se pudo cargar el automotor solicitado.'),
          );
        },
      });
  }

  private ensureOwnerAvailable(focusSummary: boolean): Observable<Owner | null> {
    const ownerCuitControl = this.form.controls.ownerCuit;
    const normalizedCuit = normalizeCuit(ownerCuitControl.value);

    if (ownerCuitControl.invalid || normalizedCuit.length === 0) {
      return of(null);
    }

    if (this.lastResolvedOwnerCuit === normalizedCuit && this.owner()) {
      if (focusSummary) {
        this.focusResolvedOwner();
      }

      return of(this.owner());
    }

    this.ownerLookupLoading.set(true);
    this.formErrors.set([]);

    return this.ownersService.findByCuit(normalizedCuit).pipe(
      tap((owner) => this.setResolvedOwner(owner, focusSummary)),
      map((owner) => owner),
      catchError((error: unknown) => {
        if (this.apiErrorService.isNotFound(error)) {
          return this.openCreateOwnerDialog(normalizedCuit).pipe(
            tap((owner) => {
              if (owner) {
                this.setResolvedOwner(owner, true);
                return;
              }

              this.setFormErrors([
                'No existe un titular para ese CUIT. Puedes crearlo desde el dialogo o corregir el dato antes de guardar.',
              ]);
            }),
          );
        }

        this.setFormErrors(
          this.apiErrorService.toMessages(error, 'No se pudo validar el titular.'),
        );
        return of(null);
      }),
      finalize(() => this.ownerLookupLoading.set(false)),
    );
  }

  private openCreateOwnerDialog(cuit: string): Observable<Owner | null> {
    return this.dialog
      .open(CreateOwnerDialogComponent, {
        width: '480px',
        autoFocus: false,
        restoreFocus: true,
        data: { cuit },
      })
      .afterClosed()
      .pipe(map((result) => result ?? null));
  }

  private setResolvedOwner(owner: Owner, focusSummary = false): void {
    this.owner.set(owner);
    this.lastResolvedOwnerCuit = owner.cuit;
    this.formErrors.set([]);
    this.form.controls.ownerCuit.setValue(owner.cuit, { emitEvent: false });

    if (focusSummary) {
      this.focusResolvedOwner();
    }
  }

  private normalizeAllFields(): void {
    this.form.controls.licensePlate.setValue(
      normalizeLicensePlate(this.form.controls.licensePlate.value),
      { emitEvent: false },
    );
    this.form.controls.ownerCuit.setValue(normalizeCuit(this.form.controls.ownerCuit.value), {
      emitEvent: false,
    });
    this.form.controls.manufactureDate.setValue(
      normalizeDateInput(this.form.controls.manufactureDate.value),
      { emitEvent: false },
    );
  }

  private captureFormValue(): VehicleFormValue {
    return this.form.getRawValue();
  }

  private hasFormValueChanged(): boolean {
    const currentValue = this.captureFormValue();

    return VEHICLE_FORM_FIELDS.some(
      (field) => currentValue[field] !== this.initialFormValue[field],
    );
  }

  private syncInitialFormValue(): void {
    this.initialFormValue = this.captureFormValue();
  }

  private toUpdatePayload(payload: VehicleUpsertPayload): VehicleUpdatePayload {
    const { licensePlate: _licensePlate, ...updatePayload } = payload;
    return updatePayload;
  }

  private setFormErrors(messages: string[]): void {
    this.formErrors.set(messages);

    queueMicrotask(() => {
      this.vehicleFormComponent()?.focusErrorSummary();
    });
  }

  private focusFirstInvalidField(): void {
    queueMicrotask(() => {
      this.vehicleFormComponent()?.focusFirstInvalidField();
    });
  }

  private focusResolvedOwner(): void {
    queueMicrotask(() => {
      this.vehicleFormComponent()?.focusResolvedOwner();
    });
  }
}
