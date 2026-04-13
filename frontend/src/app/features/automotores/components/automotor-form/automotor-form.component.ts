import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
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
        <mat-card-title id="vehicle-form-title">{{ title() }}</mat-card-title>
        <mat-card-subtitle>
          Completa los datos del automotor y valida el titular antes de guardar.
        </mat-card-subtitle>
      </mat-card-header>

      <form
        class="vehicle-form"
        [formGroup]="form()"
        [attr.aria-busy]="submitting() || ownerLookupLoading()"
        aria-labelledby="vehicle-form-title"
        (ngSubmit)="save.emit()"
      >
        <mat-card-content class="form-content">
          @if (errors().length > 0) {
            <mat-card
              #errorSummary
              appearance="outlined"
              class="error-card"
              tabindex="-1"
              role="alert"
              aria-live="assertive"
            >
              <mat-card-content>
                <strong class="feedback-title">Revisa estos puntos antes de continuar:</strong>
                <ul>
                  @for (error of errors(); track error) {
                    <li>{{ error }}</li>
                  }
                </ul>
              </mat-card-content>
            </mat-card>
          }

          <p class="form-help">
            Si cambias el CUIT en una edicion, el automotor quedara asociado al nuevo titular.
          </p>

          <div class="form-grid">
            <mat-form-field appearance="outline" class="field">
              <mat-label>Dominio</mat-label>
              <input
                matInput
                formControlName="licensePlate"
                maxlength="7"
                placeholder="AAA123 o AA123AA"
                spellcheck="false"
                autocomplete="off"
                autocapitalize="characters"
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
                <mat-error>Ingresa un dominio valido: AAA123 o AA123AA.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>CUIT del titular</mat-label>
              <input
                matInput
                formControlName="ownerCuit"
                maxlength="13"
                placeholder="20123456786"
                spellcheck="false"
                autocomplete="off"
                inputmode="numeric"
                (blur)="handleOwnerCuitBlur()"
              />
              <mat-hint>Se consulta al salir del campo o con el boton Validar titular.</mat-hint>
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
                spellcheck="false"
              />
              @if (control('chassis').hasError('required') && control('chassis').touched) {
                <mat-error>El chasis es obligatorio.</mat-error>
              }
              @if (
                (control('chassis').hasError('minlength') ||
                  control('chassis').hasError('maxlength')) &&
                control('chassis').touched
              ) {
                <mat-error>El chasis debe tener entre 3 y 30 caracteres.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Motor</mat-label>
              <input
                matInput
                formControlName="engine"
                maxlength="30"
                placeholder="ABC123456"
                spellcheck="false"
              />
              @if (control('engine').hasError('required') && control('engine').touched) {
                <mat-error>El motor es obligatorio.</mat-error>
              }
              @if (
                (control('engine').hasError('minlength') ||
                  control('engine').hasError('maxlength')) &&
                control('engine').touched
              ) {
                <mat-error>El motor debe tener entre 3 y 30 caracteres.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Color</mat-label>
              <input
                matInput
                formControlName="color"
                maxlength="40"
                placeholder="Rojo"
                autocomplete="off"
              />
              @if (control('color').hasError('required') && control('color').touched) {
                <mat-error>El color es obligatorio.</mat-error>
              }
              @if (
                (control('color').hasError('minlength') ||
                  control('color').hasError('maxlength')) &&
                control('color').touched
              ) {
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
                  Vas a reasignar el automotor al CUIT informado cuando guardes los cambios.
                </mat-card-content>
              </mat-card>
            }

            @if (owner()) {
              <mat-card
                #ownerSummary
                appearance="outlined"
                class="info-card"
                tabindex="-1"
                role="status"
                aria-live="polite"
              >
                <mat-card-content>
                  <strong>Titular listo para usar:</strong> {{ owner()!.name }} (CUIT
                  {{ owner()!.cuit }})
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-card-content>

        <mat-card-actions class="form-actions">
          <p class="actions-copy">
            Antes de guardar, confirma que el titular resuelto sea el correcto.
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
              [disabled]="ownerLookupLoading() || submitting()"
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
              type="submit"
              class="action-button"
              [disabled]="submitting() || ownerLookupLoading()"
            >
              @if (submitting()) {
                <mat-spinner diameter="18" />
              } @else {
                <span>{{ submitLabel() }}</span>
              }
            </button>
          </div>
        </mat-card-actions>
      </form>
    </mat-card>
  `,
  styles: `
    .form-shell {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
      overflow: hidden;
    }

    .vehicle-form {
      display: block;
    }

    .form-header {
      align-items: flex-start;
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);
      padding-bottom: 1rem;
    }

    .form-content {
      display: grid;
      gap: 1rem;
      padding-top: 1.25rem;
    }

    .form-help {
      color: var(--text-muted);
      margin: 0;
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
      background: var(--error-soft);
      border-color: rgba(220, 38, 38, 0.22);
    }

    .feedback-title {
      display: block;
      margin-bottom: 0.5rem;
    }

    .info-card {
      background: var(--success-soft);
      border-color: rgba(14, 116, 144, 0.16);
    }

    .info-card--warning {
      background: var(--warning-soft);
      border-color: rgba(234, 88, 12, 0.16);
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
      color: var(--text-muted);
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
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly ownerSummary = viewChild<ElementRef<HTMLElement>>('ownerSummary');

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

  focusErrorSummary(): void {
    this.errorSummary()?.nativeElement?.focus();
  }

  focusResolvedOwner(): void {
    this.ownerSummary()?.nativeElement?.focus();
  }

  focusFirstInvalidField(): void {
    const hostElement = this.hostElement.nativeElement as HTMLElement;
    const invalidField = hostElement.querySelector<HTMLElement>(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid',
    );

    invalidField?.focus();
  }

  protected control(name: keyof VehicleFormGroup['controls']) {
    return this.form().controls[name];
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
