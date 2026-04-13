import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from '../services/confirmation.service';

export interface PendingChangesComponent {
  hasPendingChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<PendingChangesComponent> = (
  component,
) => {
  if (!component.hasPendingChanges()) {
    return true;
  }

  return inject(ConfirmationService).confirm({
    title: 'Descartar cambios',
    message:
      'Hay cambios sin guardar. Si continuas, se perderan los datos cargados.',
    confirmLabel: 'Salir',
    cancelLabel: 'Seguir editando',
  });
};
