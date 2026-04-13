import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-state-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCardModule],
  template: `
    <mat-card class="state-card">
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <p>{{ message() }}</p>
      </mat-card-content>

      @if (actionLabel()) {
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="action.emit()">
            {{ actionLabel() }}
          </button>
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: `
    .state-card {
      margin: 0 auto;
      max-width: 520px;
    }

    mat-card-content p {
      margin: 0;
    }
  `,
})
export class StateCardComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
