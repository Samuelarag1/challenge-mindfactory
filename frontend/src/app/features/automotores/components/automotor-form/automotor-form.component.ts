import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { normalizeCuit } from '../../../../shared/validators/cuit.validator';
import { normalizeLicensePlate } from '../../../../shared/validators/dominio.validator';
import { normalizeDateInput } from '../../../../shared/validators/yyyymm.validator';
import { Owner } from '../../../sujetos/models/sujeto.model';

export type VehicleFormGroup = FormGroup<{
  licensePlate: FormControl<string>;
  chassis: FormControl<string>;
  engine: FormControl<string>;
  color: FormControl<string>;
  manufactureDate: FormControl<string>;
  ownerCuit: FormControl<string>;
}>;

@Component({
  selector: 'app-automotor-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  template: `
    <mat-card appearance="outlined" class="form-shell">
      <mat-card-header class="form-header">
        <mat-card-title>{{ title() }}</mat-card-title>
        <mat-card-subtitle>
          Completa los datos del vehiculo y valida el titular antes de guardar.
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="form-content">
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

        <div class="form-grid" [formGroup]="form()">
          <mat-form-field appearance="outline" class="field">
            <mat-label>Dominio</mat-label>
            <input
              matInput
              formControlName="licensePlate"
              maxlength="7"
              placeholder="AAA123 o AA123AA"
              (blur)="normalizeControl('licensePlate')"
            />
            <mat-hint>Formatos permitidos: AAA123 o AA123AA.</mat-hint>
            @if (control('licensePlate').hasError('required') && control('licensePlate').touched) {
              <mat-error>El dominio es obligatorio.</mat-error>
            }
            @if (
              control('licensePlate').hasError('licensePlate') &&
              control('licensePlate').touched
            ) {
              <mat-error>Ingresa un dominio valido: AAA999 o AA999AA.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>CUIT del titular</mat-label>
            <input
              matInput
              formControlName="ownerCuit"
              maxlength="13"
              placeholder="20123456786"
              (blur)="handleOwnerCuitBlur()"
            />
            <mat-hint>Al salir del campo se consulta el titular.</mat-hint>
            @if (control('ownerCuit').hasError('required') && control('ownerCuit').touched) {
              <mat-error>El CUIT es obligatorio.</mat-error>
            }
            @if (control('ownerCuit').hasError('cuit') && control('ownerCuit').touched) {
              <mat-error>Ingresa un CUIT valido con digito verificador.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Chasis</mat-label>
            <input
              matInput
              formControlName="chassis"
              maxlength="30"
              placeholder="8AFZZZ54ZMJ123456"
            />
            @if (showLengthError('chassis')) {
              <mat-error>El chasis debe tener entre 3 y 30 caracteres.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Motor</mat-label>
            <input matInput formControlName="engine" maxlength="30" placeholder="ABC123456" />
            @if (showLengthError('engine')) {
              <mat-error>El motor debe tener entre 3 y 30 caracteres.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Color</mat-label>
            <input matInput formControlName="color" maxlength="40" placeholder="Rojo" />
            @if (showLengthError('color')) {
              <mat-error>El color debe tener entre 2 y 40 caracteres.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Fecha de fabricacion</mat-label>
            <input
              matInput
              type="date"
              formControlName="manufactureDate"
              (blur)="normalizeControl('manufactureDate')"
            />
            @if (
              control('manufactureDate').hasError('required') &&
              control('manufactureDate').touched
            ) {
              <mat-error>La fecha de fabricacion es obligatoria.</mat-error>
            }
            @if (
              control('manufactureDate').hasError('dateInput') &&
              control('manufactureDate').touched
            ) {
              <mat-error>Ingresa una fecha valida y no futura.</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="status-stack">
          @if (showOwnerReassignmentNotice()) {
            <mat-card appearance="outlined" class="info-card info-card--warning">
              <mat-card-content>
                El CUIT cambio respecto del titular original. Al guardar se reasignara el automotor
                al nuevo dueño.
              </mat-card-content>
            </mat-card>
          }

          @if (owner()) {
            <mat-card appearance="outlined" class="info-card">
              <mat-card-content>
                <strong>Titular resuelto:</strong> {{ owner()!.name }} (CUIT
                {{ owner()!.cuit }})
              </mat-card-content>
            </mat-card>
          }
        </div>
      </mat-card-content>

      <mat-card-actions class="form-actions">
        <p class="actions-copy">
          Revisa el titular antes de guardar. Si modificaste el CUIT, el automotor quedara vinculado
          al nuevo responsable.
        </p>

        <div class="actions-group">
          <button mat-button type="button" class="action-button" (click)="cancel.emit()">
            Cancelar
          </button>
          <button
            mat-stroked-button
            color="primary"
            type="button"
            class="action-button"
            [disabled]="ownerLookupLoading()"
            (click)="lookupOwner.emit()"
          >
            @if (ownerLookupLoading()) {
              <mat-spinner diameter="18" />
            } @else {
              <span>Validar titular</span>
            }
          </button>
          <button
            mat-flat-button
            color="primary"
            type="button"
            class="action-button"
            [disabled]="submitting()"
            (click)="save.emit()"
          >
            @if (submitting()) {
              <mat-spinner diameter="18" />
            } @else {
              <span>{{ submitLabel() }}</span>
            }
          </button>
        </div>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .form-shell {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
      overflow: hidden;
    }

    .form-header {
      align-items: flex-start;
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);
      padding-bottom: 1rem;
    }

    .form-content {
      display: grid;
      gap: 1.1rem;
      padding-top: 1.25rem;
    }

    .form-grid {
      align-items: start;
      display: grid;
      gap: 1rem 1.25rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .field {
      width: 100%;
    }

    .status-stack {
      display: grid;
      gap: 0.85rem;
    }

    .error-card,
    .info-card {
      margin: 0;
    }

    .error-card {
      border-color: #dc2626;
    }

    .info-card {
      background: rgba(239, 246, 255, 0.82);
      border-color: rgba(59, 130, 246, 0.18);
    }

    .info-card--warning {
      background: rgba(255, 247, 237, 0.9);
      border-color: rgba(249, 115, 22, 0.18);
    }

    .error-card ul {
      margin: 0;
      padding-left: 1rem;
    }

    .form-actions {
      align-items: center;
      border-top: 1px solid rgba(226, 232, 240, 0.9);
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      margin: 0;
      padding: 1rem 1.5rem 1.5rem;
    }

    .actions-copy {
      color: #52607a;
      font-size: 0.92rem;
      line-height: 1.45;
      margin: 0;
      max-width: 30rem;
    }

    .actions-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .action-button {
      min-height: 44px;
      min-width: 9.5rem;
    }

    @media (max-width: 900px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .actions-copy {
        max-width: none;
      }

      .actions-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        width: 100%;
      }

      .action-button {
        min-width: 0;
      }
    }
  `,
})
export class VehicleFormComponent {
  readonly title = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly form = input.required<VehicleFormGroup>();
  readonly owner = input<Owner | null>(null);
  readonly errors = input<string[]>([]);
  readonly submitting = input(false);
  readonly ownerLookupLoading = input(false);
  readonly originalOwnerCuit = input<string | null>(null);
  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly lookupOwner = output<void>();

  readonly showOwnerReassignmentNotice = computed(() => {
    const originalCuit = this.originalOwnerCuit();
    if (!originalCuit) {
      return false;
    }

    const currentCuit = normalizeCuit(this.form().controls.ownerCuit.value);
    return currentCuit.length > 0 && currentCuit !== originalCuit;
  });

  protected control(name: keyof VehicleFormGroup['controls']) {
    return this.form().controls[name];
  }

  protected showLengthError(name: 'chassis' | 'engine' | 'color'): boolean {
    const control = this.control(name);
    return (
      control.touched &&
      (control.hasError('required') ||
        control.hasError('minlength') ||
        control.hasError('maxlength'))
    );
  }

  protected handleOwnerCuitBlur(): void {
    this.normalizeControl('ownerCuit');
    this.lookupOwner.emit();
  }

  protected normalizeControl(
    name: 'licensePlate' | 'ownerCuit' | 'manufactureDate',
  ): void {
    const control = this.control(name);
    const rawValue = control.value;

    let normalized = rawValue;
    if (name === 'licensePlate') {
      normalized = normalizeLicensePlate(rawValue);
    } else if (name === 'ownerCuit') {
      normalized = normalizeCuit(rawValue);
    } else {
      normalized = normalizeDateInput(rawValue);
    }

    control.setValue(normalized, { emitEvent: false });
    control.updateValueAndValidity();
  }
}
