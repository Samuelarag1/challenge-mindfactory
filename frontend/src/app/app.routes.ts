import { Routes } from '@angular/router';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'vehicles',
  },
  {
    path: 'vehicles',
    loadComponent: () =>
      import(
        './features/automotores/pages/automotores-list-page.component'
      ).then((module) => module.VehiclesListPageComponent),
  },
  {
    path: 'vehicles/new',
    canDeactivate: [pendingChangesGuard],
    loadComponent: () =>
      import(
        './features/automotores/pages/automotor-form-page.component'
      ).then((module) => module.VehicleFormPageComponent),
  },
  {
    path: 'vehicles/:licensePlate/edit',
    canDeactivate: [pendingChangesGuard],
    loadComponent: () =>
      import(
        './features/automotores/pages/automotor-form-page.component'
      ).then((module) => module.VehicleFormPageComponent),
  },
  {
    path: '**',
    redirectTo: 'vehicles',
  },
];
