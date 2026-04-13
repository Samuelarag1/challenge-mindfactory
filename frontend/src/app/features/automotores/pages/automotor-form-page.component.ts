import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { PendingChangesComponent } from '../../../core/guards/pending-changes.guard';
import { ApiErrorService } from '../../../core/services/api-error.service';
import { StateCardComponent } from '../../../shared/components/state-card/state-card.component';
import { cuitValidator, normalizeCuit } from '../../../shared/validators/cuit.validator';
import { licensePlateValidator, normalizeLicensePlate } from '../../../shared/validators/dominio.validator';
import { dateInputValidator, normalizeDateInput } from '../../../shared/validators/yyyymm.validator';
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
  imports: [
    VehicleFormComponent,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    StateCardComponent,
  ],
  template: `
    <section class="page-shell">
      @if (loadingInitialData()) {
        <div class="centered-state">
          <mat-spinner />
        </div>
      } @else if (loadErrors().length > 0) {
        <app-state-card
          title="No pudimos cargar el automotor"
          [message]="loadErrors().join(' ')"
          actionLabel="Volver al listado"
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
    .centered-state {
      display: grid;
      min-height: 320px;
      place-items: center;
    }

    .page-shell {
      display: grid;
      gap: 1rem;
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

  readonly loadingInitialData = signal(false);
  readonly ownerLookupLoading = signal(false);
  readonly submitting = signal(false);
  readonly formErrors = signal<string[]>([]);
  readonly loadErrors = signal<string[]>([]);
  readonly owner = signal<Owner | null>(null);
  readonly originalOwnerCuit = signal<string | null>(null);

  readonly mode: FormMode = this.activatedRoute.snapshot.paramMap.has('licensePlate')
    ? 'edit'
    : 'create';
  readonly licensePlate = this.activatedRoute.snapshot.paramMap.get('licensePlate');
  readonly pageTitle = computed(() =>
    this.mode === 'edit' ? 'Editar automotor' : 'Crear automotor',
  );
  readonly submitLabel = computed(() =>
    this.mode === 'edit' ? 'Guardar cambios' : 'Crear automotor',
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
    const ownerCuitControl = this.form.controls.ownerCuit;
    ownerCuitControl.markAsTouched();
    ownerCuitControl.updateValueAndValidity();

    if (ownerCuitControl.invalid) {
      this.formErrors.set(['Ingresa un CUIT valido antes de buscar el titular.']);
      return;
    }

    this.ensureOwnerAvailable().subscribe();
  }

  save(): void {
    this.normalizeAllFields();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formErrors.set([]);
    this.submitting.set(true);

    this.ensureOwnerAvailable()
      .pipe(
        switchMap((owner) => {
          if (!owner) {
            this.formErrors.set([
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
            this.mode === 'edit' ? 'Automotor actualizado.' : 'Automotor creado.',
            'Cerrar',
            { duration: 3000 },
          );
          void this.router.navigate(['/vehicles']);
        },
        error: (error: unknown) => {
          this.formErrors.set(
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
      .pipe(finalize(() => this.loadingInitialData.set(false)))
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

  private ensureOwnerAvailable(): Observable<Owner | null> {
    const ownerCuitControl = this.form.controls.ownerCuit;
    const normalizedCuit = normalizeCuit(ownerCuitControl.value);

    if (ownerCuitControl.invalid || normalizedCuit.length === 0) {
      return of(null);
    }

    if (this.lastResolvedOwnerCuit === normalizedCuit && this.owner()) {
      return of(this.owner());
    }

    this.ownerLookupLoading.set(true);
    this.formErrors.set([]);

    return this.ownersService.findByCuit(normalizedCuit).pipe(
      tap((owner) => this.setResolvedOwner(owner)),
      map((owner) => owner),
      catchError((error: unknown) => {
        if (this.apiErrorService.isNotFound(error)) {
          return this.openCreateOwnerDialog(normalizedCuit).pipe(
            tap((owner) => {
              if (owner) {
                this.setResolvedOwner(owner);
              }
            }),
          );
        }

        this.formErrors.set(
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
        data: { cuit },
      })
      .afterClosed()
      .pipe(map((result) => result ?? null));
  }

  private setResolvedOwner(owner: Owner): void {
    this.owner.set(owner);
    this.lastResolvedOwnerCuit = owner.cuit;
    this.form.controls.ownerCuit.setValue(owner.cuit, { emitEvent: false });
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
}
