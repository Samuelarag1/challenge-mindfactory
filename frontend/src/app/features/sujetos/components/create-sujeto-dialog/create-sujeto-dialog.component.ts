import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
  templateUrl: './create-sujeto-dialog.component.html',
  styleUrl: './create-sujeto-dialog.component.css',
})
export class CreateOwnerDialogComponent {
  private readonly data = inject<CreateOwnerDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<CreateOwnerDialogComponent, Owner | null>,
  );
  private readonly ownersService = inject(OwnersService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly saving = signal(false);
  readonly errors = signal<string[]>([]);
  readonly form: CreateOwnerForm = new FormGroup({
    cuit: new FormControl({ value: this.data.cuit, disabled: true }, { nonNullable: true }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
    }),
  });

  constructor() {
    afterNextRender(() => {
      this.nameInput()?.nativeElement?.focus();
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.nameInput()?.nativeElement?.focus();
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
            this.apiErrorService.toMessages(error, 'No se pudo crear el titular.'),
          );
          queueMicrotask(() => {
            this.errorSummary()?.nativeElement?.focus();
          });
        },
      });
  }
}
