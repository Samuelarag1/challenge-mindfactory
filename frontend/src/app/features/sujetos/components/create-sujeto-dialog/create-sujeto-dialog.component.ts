import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ApiErrorService } from '../../../../core/services/api-error.service';
import { normalizeCuit } from '../../../../shared/validators/cuit.validator';
import { CreateOwnerPayload, Owner } from '../../models/sujeto.model';
import { OwnersService } from '../../services/sujetos.service';

interface CreateOwnerDialogData {
  cuit: string;
}

type CreateOwnerForm = FormGroup<{
  cuit: FormControl<string>;
  name: FormControl<string>;
}>;

@Component({
  selector: 'app-create-sujeto-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Crear titular</h2>

    <mat-dialog-content>
      <p class="dialog-copy">
        No encontramos un sujeto para el CUIT ingresado. Puedes crearlo y seguir
        con el alta del automotor.
      </p>

      @if (errors().length > 0) {
        <mat-card appearance="outlined" class="error-card">
          <mat-card-content>
            <ul>
              @for (error of errors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      }

      <form class="dialog-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>CUIT</mat-label>
          <input matInput formControlName="cuit" readonly />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del titular</mat-label>
          <input
            matInput
            formControlName="name"
            maxlength="120"
            placeholder="Ej. Juan Perez"
          />
          @if (form.controls.name.hasError('required') && form.controls.name.touched) {
            <mat-error>El nombre es obligatorio.</mat-error>
          }
          @if (
            (form.controls.name.hasError('minlength') || form.controls.name.hasError('maxlength')) &&
            form.controls.name.touched
          ) {
            <mat-error>El nombre debe tener entre 3 y 120 caracteres.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="18" />
        } @else {
          <span>Crear titular</span>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-copy {
      margin: 0 0 1rem;
    }

    .dialog-form {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .error-card {
      border-color: #dc2626;
      margin-bottom: 1rem;
    }

    .error-card ul {
      margin: 0;
      padding-left: 1rem;
    }
  `,
})
export class CreateOwnerDialogComponent {
  private readonly data = inject<CreateOwnerDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<CreateOwnerDialogComponent, Owner | null>,
  );
  private readonly ownersService = inject(OwnersService);
  private readonly apiErrorService = inject(ApiErrorService);

  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);
  readonly form: CreateOwnerForm = new FormGroup({
    cuit: new FormControl({ value: this.data.cuit, disabled: true }, { nonNullable: true }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ],
    }),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateOwnerPayload = {
      cuit: normalizeCuit(this.data.cuit),
      name: this.form.controls.name.value.trim(),
    };

    this.errors.set([]);
    this.saving.set(true);

    this.ownersService
      .create(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (owner) => this.dialogRef.close(owner),
        error: (error: unknown) => {
          this.errors.set(
            this.apiErrorService.toMessages(
              error,
              'No se pudo crear el titular.',
            ),
          );
        },
      });
  }
}
