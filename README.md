# Challenge MindFactory

Repositorio con frontend Angular y backend NestJS para la gestion de automotores.

## Stack

- `frontend`: Angular 21, TypeScript, RxJS, Angular Material, Reactive Forms
- `backend`: NestJS, TypeORM, PostgreSQL
- `postgres`: base de datos para el backend

## Levantar el proyecto

### Opcion 1: Docker Compose

Desde la raiz:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

### Opcion 2: Desarrollo local

Backend:

```bash
cd backend
npm install
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm start
```

## Tests

Frontend:

```bash
cd frontend
npm test -- --watch=false
```

## Seed inicial

El seed del backend es opt-in. Solo corre si `DB_SEED=true`.

Cuando se activa, hace upsert de:

- Sujetos: 10 registros demo
- Automotores: 25 registros demo para probar paginacion, busqueda y sorting

## Arquitectura frontend

Se uso una estructura simple por features con componentes standalone:

```text
frontend/src/app
|- core
|  |- guards
|  |- models
|  `- services
|- shared
|  |- components
|  |- models
|  `- validators
`- features
   |- automotores
   |  |- components
   |  |- models
   |  |- pages
   |  `- services
   `- sujetos
      |- components
      |- models
      `- services
```

### Criterios de implementacion

- `core/`: guard de cambios sin guardar, confirmaciones y normalizacion de errores HTTP.
- `shared/`: validadores reutilizables, componentes de estado y dialogos compartidos.
- `features/automotores/`: listado server-side, formulario alta/edicion y servicios REST.
- `features/sujetos/`: lookup por CUIT y dialogo de alta para CUIT inexistente.

## Alcance de `frontend-core`

El frontend implementa:

- listado de automotores con busqueda por dominio o CUIT
- ordenamiento y paginacion server-side
- alta, edicion y eliminacion
- validaciones reutilizables para dominio, CUIT y fecha `YYYYMM`
- manejo de errores `422`, `404` y genericos
- guard de navegacion por formulario dirty
- flujo de CUIT inexistente con creacion de sujeto desde dialog
- testing minimo obligatorio

## Supuestos tecnicos

- El backend expone paginacion server-side mediante `page`, `limit`, `sortBy`, `sortDirection` y `search`.
- El frontend consume la API desde `http://localhost:3000/api`.
- El ordenamiento real se limita a los campos soportados por backend: `dominio`, `titularCuit`, `fechaFabricacion`.
- La creacion/edicion de automotores requiere que exista un sujeto para el CUIT; si no existe, el frontend lo crea inline.
- No se modifico backend ni se agrego manejo global de estado con NgRx.

## Trade-offs de esta etapa

- Se priorizo claridad funcional sobre refinamientos avanzados de UX y performance.
- No hay cache de queries ni estrategia de retry; eso queda para un PR posterior.
- La configuracion de `apiBaseUrl` es simple y orientada al entorno local del challenge.
