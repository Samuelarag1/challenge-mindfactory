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
    <mat-card
      appearance="outlined"
      class="state-card"
      [class.state-card--error]="tone() === 'error'"
      [class.state-card--empty]="tone() === 'empty'"
      [attr.aria-live]="tone() === 'error' ? 'assertive' : 'polite'"
      [attr.role]="tone() === 'error' ? 'alert' : 'status'"
    >
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <p>{{ message() }}</p>
      </mat-card-content>

      @if (actionLabel()) {
        <mat-card-actions>
          <button mat-flat-button color="primary" type="button" (click)="action.emit()">
            {{ actionLabel() }}
          </button>
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: `
    .state-card {
      border-color: rgba(148, 163, 184, 0.22);
      margin: 0 auto;
      max-width: 520px;
      padding-block: 0.25rem;
    }

    .state-card--error {
      background: var(--error-soft);
      border-color: rgba(220, 38, 38, 0.22);
    }

    .state-card--empty {
      background: var(--surface-soft);
    }

    mat-card-content p {
      color: var(--text-muted);
      margin: 0;
    }
  `,
})
export class StateCardComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string>();
  readonly tone = input<'neutral' | 'error' | 'empty'>('neutral');
  readonly action = output<void>();
}
