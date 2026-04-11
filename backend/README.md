# Backend Challenge MindFactory

## Tecnologias

- `NestJS`
- `TypeScript`
- `TypeORM`
- `PostgreSQL`
- `class-validator`
- `class-transformer`
- `Jest`
- `Supertest`
- `pg-mem`
- `ESLint` + `Prettier`
- `Docker`

## Que hace el backend

- Expone endpoints REST para alta, consulta, actualizacion, baja y listado de automotores.
- Expone endpoints para alta y busqueda de sujetos por CUIT.
- Normaliza inputs antes de persistir:
  - dominio en mayusculas
  - CUIT sin guiones
  - textos con espacios internos colapsados
- Valida reglas de negocio y formato:
  - dominio `AAA999` o `AA999AA`
  - CUIT valido con digito verificador
  - fecha de fabricacion `YYYYMM`, mes valido y no futura
  - dominio unico
  - el titular de un automotor debe existir
- Devuelve `422 Unprocessable Entity` con contrato consistente para validaciones y reglas de negocio.
- Soporta busqueda simple, paginacion y ordenamiento en el listado de automotores.

## Modelo funcional de automotor

El recurso `automotor` queda alineado al challenge de frontend con este shape:

```json
{
  "dominio": "AA123AA",
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "ABC123456",
  "color": "Rojo",
  "fechaFabricacion": "201806",
  "titular": {
    "cuit": "20123456786",
    "nombre": "Juan Perez"
  }
}
```

Para creacion y actualizacion, el request usa `titularCuit`:

```json
{
  "dominio": "AA123AA",
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "ABC123456",
  "color": "Rojo",
  "fechaFabricacion": "201806",
  "titularCuit": "20123456786"
}
```

## Variables de entorno

Tomar como base [`.env.example`](./.env.example).

- `PORT=3000`
- `CORS_ORIGIN=http://localhost:4200`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=challenge_mindfactory`
- `DB_MIGRATIONS_RUN=true`
- `DB_SEED=false`

## Uso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar entorno

- Copia `.env.example` a `.env` si quieres trabajar con archivo local.
- Levanta PostgreSQL o usa Docker Compose desde la raiz del repo.

### 3. Levantar el backend

```bash
npm run start:dev
```

La API queda disponible en `http://localhost:3000/api`.

## Uso con Docker Compose

Desde la raiz del repo:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

## Seed inicial

El seed es opt-in y solo corre si `DB_SEED=true`.

Hace `upsert`, asi que es idempotente y se puede ejecutar mas de una vez sin duplicar datos.

Antes del seed, el backend ejecuta una migracion idempotente para asegurar el esquema actual de `sujetos` y `automotores`.

Si encuentra una base legacy con `automotores.marca` y `automotores.modelo`, la migra al esquema nuevo con `chasis`, `motor` y `color` para evitar fallos de arranque sobre volumenes persistidos.

Datos demo:

- Sujetos:
  - `20123456786` / `Juan Perez`
  - `27234567891` / `Maria Gomez`
  - `30712345671` / `Transporte Delta SA`
- Automotores:
  - `AAA123` / `8AFZZZ54ZMJ000001` / `MTR000001` / `Blanco` / `201806` / titular `20123456786`
  - `AB123CD` / `8AFZZZ54ZMJ000002` / `MTR000002` / `Negro` / `202112` / titular `27234567891`
  - `AC456EF` / `8AFZZZ54ZMJ000003` / `MTR000003` / `Gris` / `202001` / titular `30712345671`

## Endpoints

### `POST /api/sujetos`

Crea un sujeto.

Body esperado:

```json
{
  "cuit": "20-12345678-6",
  "nombre": "Juan Perez"
}
```

Respuesta `201`:

```json
{
  "cuit": "20123456786",
  "nombre": "Juan Perez"
}
```

Errores comunes:

- `422` si el CUIT es invalido
- `422` si ya existe un sujeto con ese CUIT

### `GET /api/sujetos/by-cuit?cuit=20123456786`

Busca un sujeto por CUIT.

Query esperado:

- `cuit`: obligatorio, acepta formato con o sin guiones

Respuesta `200`:

```json
{
  "cuit": "20123456786",
  "nombre": "Juan Perez"
}
```

Errores comunes:

- `422` si el CUIT es invalido
- `404` si el sujeto no existe

### `POST /api/automotores`

Crea un automotor.

Body esperado:

```json
{
  "dominio": "AA123AA",
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "ABC123456",
  "color": "Rojo",
  "fechaFabricacion": "201806",
  "titularCuit": "20123456786"
}
```

Respuesta `201`:

```json
{
  "dominio": "AA123AA",
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "ABC123456",
  "color": "Rojo",
  "fechaFabricacion": "201806",
  "titular": {
    "cuit": "20123456786",
    "nombre": "Juan Perez"
  }
}
```

Errores comunes:

- `422` si el payload es invalido
- `422` si el dominio ya existe
- `422` si el titular no existe

### `GET /api/automotores`

Lista automotores con busqueda, paginacion y ordenamiento.

Query params soportados:

- `page`: opcional, default `1`
- `limit`: opcional, default `10`, maximo `50`
- `search`: opcional, busca por dominio o CUIT del titular
- `sortBy`: opcional, uno de `dominio`, `chasis`, `color`, `fechaFabricacion`, `titularCuit`
- `sortDirection`: opcional, `asc` o `desc`

Ejemplo:

```http
GET /api/automotores?page=1&limit=10&search=20-12345678-6&sortBy=fechaFabricacion&sortDirection=desc
```

Respuesta `200`:

```json
{
  "items": [
    {
      "dominio": "AB123CD",
      "chasis": "8AFZZZ54ZMJ000002",
      "motor": "MTR000002",
      "color": "Negro",
      "fechaFabricacion": "202112",
      "titular": {
        "cuit": "20123456786",
        "nombre": "Juan Perez"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "search": "20-12345678-6",
    "sortBy": "fechaFabricacion",
    "sortDirection": "desc"
  }
}
```

### `GET /api/automotores/:dominio`

Busca un automotor por dominio.

Parametro esperado:

- `dominio`: obligatorio, acepta `AAA999` o `AA999AA`

Respuesta `200`:

```json
{
  "dominio": "AA123AA",
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "ABC123456",
  "color": "Rojo",
  "fechaFabricacion": "201806",
  "titular": {
    "cuit": "20123456786",
    "nombre": "Juan Perez"
  }
}
```

Errores comunes:

- `422` si el dominio es invalido
- `404` si el automotor no existe

### `PUT /api/automotores/:dominio`

Actualiza un automotor existente.

Body esperado:

```json
{
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "XYZ987654",
  "color": "Azul",
  "fechaFabricacion": "202001",
  "titularCuit": "27234567891"
}
```

Respuesta `200`:

```json
{
  "dominio": "AA123AA",
  "chasis": "8AFZZZ54ZMJ123456",
  "motor": "XYZ987654",
  "color": "Azul",
  "fechaFabricacion": "202001",
  "titular": {
    "cuit": "27234567891",
    "nombre": "Maria Gomez"
  }
}
```

Errores comunes:

- `422` si el payload es invalido
- `422` si el nuevo titular no existe
- `404` si el automotor no existe

### `DELETE /api/automotores/:dominio`

Elimina un automotor.

Respuesta `204` sin body.

Errores comunes:

- `422` si el dominio es invalido
- `404` si el automotor no existe

## Contrato de errores

### Error `422`

Se usa tanto para validaciones de formato como para reglas de negocio.

Ejemplo:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "errors": [
    "No existe un sujeto para el CUIT 20123456786. Crealo y reintenta la operacion."
  ],
  "path": "/api/automotores",
  "timestamp": "2026-04-11T12:00:00.000Z"
}
```

### Error `404`

Ejemplo:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "No existe un automotor con dominio AA123AA.",
  "path": "/api/automotores/AA123AA",
  "timestamp": "2026-04-11T12:00:00.000Z"
}
```

## Compatibilidad y ruptura

Este cambio rompe compatibilidad con el contrato anterior de `automotores` basado en `marca` y `modelo`.

Cambios incompatibles:

- `POST /api/automotores` ya no acepta `marca` ni `modelo`.
- `PUT /api/automotores/:dominio` ya no acepta `marca` ni `modelo`.
- `GET /api/automotores` y `GET /api/automotores/:dominio` ya no devuelven `marca` ni `modelo`.
- `sortBy` ya no admite `marca` ni `modelo`.
- La tabla `automotores` cambia su esquema para persistir `chasis`, `motor` y `color` en lugar de `marca` y `modelo`.

El runtime ya no depende de `TypeORM synchronize` para este cambio. El backend ejecuta una migracion idempotente al iniciar y puede levantar tanto con una base nueva como con una base persistida del esquema anterior.

Para filas legacy preexistentes de `automotores`, la migracion completa `chasis` y `motor` con identificadores tecnicos `LEGACY-*` y `color` con `No informado`, solo para destrabar la compatibilidad de datos viejos que no tenian esos campos en origen.

## Herramientas para verificar el proyecto

### Lint

```bash
npm run lint
```

### Unit tests

```bash
npm run test
```

### E2E / integracion HTTP

```bash
npm run test:e2e
```

### Build

```bash
npm run build
```

### Verificacion completa

```bash
npm run verify
```
