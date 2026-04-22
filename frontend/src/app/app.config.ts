import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';
import { buildPaginatorIntl } from './core/config/mat-paginator-intl';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), //listener global de errores
    provideHttpClient(), // habilita cliente http para obtener llamadas
    provideRouter(routes), //  permite configurar rutas de la aplicacion
    { // necesario para la paginacion
      provide: MatPaginatorIntl,
      useFactory: buildPaginatorIntl,
    },
  ],
};
