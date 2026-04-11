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
- `pg-mem`: base PostgreSQL en memoria para e2e rápidos y estables.
- `ESLint` + `Prettier`
- `Docker`

## Que hace el backend

- Expone endpoints REST para alta, consulta, actualización, baja y listado de automotores.
- Expone endpoints para alta y búsqueda de sujetos por CUIT.
- Normaliza inputs antes de persistir:
  - dominio en mayúsculas
  - CUIT sin guiones
  - textos con espacios internos colapsados
- Valida reglas de negocio y formato:
  - dominio `AAA999` o `AA999AA`
  - CUIT válido con dígito verificador
  - fecha de fabricación `YYYYMM`, mes válido y no futura
  - dominio único
  - el titular de un automotor debe existir
- Devuelve `422 Unprocessable Entity` con contrato consistente para validaciones y reglas de negocio.
- Soporta búsqueda simple, paginación y ordenamiento en el listado de automotores.

## Variables de entorno

Tomar como base [`.env.example`](./.env.example).

- `PORT=3000`
- `CORS_ORIGIN=http://localhost:4200`
- `DB_HOST=localhost` 
- `DB_PORT=5432` 
- `DB_USERNAME=postgres` 
- `DB_PASSWORD=postgres` 
- `DB_NAME=challenge_mindfactory` 
- `DB_SYNCHRONIZE=true` 
- `DB_SEED=false`

## Uso 

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar entorno

- Copiá `.env.example` a `.env` si querés trabajar con archivo local.
- Levantá PostgreSQL o usá Docker Compose desde la raíz del repo.

### 3. Levantar el backend

```bash
npm run start:dev
```

La API queda disponible en `http://localhost:3000/api`.

## Uso con Docker Compose

Desde la raíz del repo:

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

## Seed inicial

El seed es opt-in y solo corre si `DB_SEED=true`.

Hace `upsert`, así que es idempotente y se puede ejecutar más de una vez sin duplicar datos.

Datos demo:

- Sujetos:
  - `20123456786` / `Juan Perez`
  - `27234567891` / `Maria Gomez`
  - `30712345671` / `Transporte Delta SA`
- Automotores:
  - `AAA123`
  - `AB123CD`
  - `AC456EF`

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

- `422` si el CUIT es inválido
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

- `422` si el CUIT es inválido
- `404` si el sujeto no existe

### `POST /api/automotores`

Crea un automotor.

Body esperado:

```json
{
  "dominio": "AA123AA",
  "marca": "Ford",
  "modelo": "Fiesta",
  "fechaFabricacion": "201806",
  "titularCuit": "20123456786"
}
```

Respuesta `201`:

```json
{
  "dominio": "AA123AA",
  "marca": "Ford",
  "modelo": "Fiesta",
  "fechaFabricacion": "201806",
  "titular": {
    "cuit": "20123456786",
    "nombre": "Juan Perez"
  }
}
```

Errores comunes:

- `422` si el payload es inválido
- `422` si el dominio ya existe
- `422` si el titular no existe

### `GET /api/automotores`

Lista automotores con búsqueda, paginación y ordenamiento.

Query params soportados:

- `page`: opcional, default `1`
- `limit`: opcional, default `10`, máximo `50`
- `search`: opcional, busca por dominio o CUIT del titular
- `sortBy`: opcional, uno de `dominio`, `marca`, `modelo`, `fechaFabricacion`, `titularCuit`
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
      "marca": "Toyota",
      "modelo": "Corolla",
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

Parámetro esperado:

- `dominio`: obligatorio, acepta `AAA999` o `AA999AA`

Respuesta `200`:

```json
{
  "dominio": "AA123AA",
  "marca": "Ford",
  "modelo": "Fiesta",
  "fechaFabricacion": "201806",
  "titular": {
    "cuit": "20123456786",
    "nombre": "Juan Perez"
  }
}
```

Errores comunes:

- `422` si el dominio es inválido
- `404` si el automotor no existe

### `PUT /api/automotores/:dominio`

Actualiza un automotor existente.

Body esperado:

```json
{
  "marca": "Toyota",
  "modelo": "Etios",
  "fechaFabricacion": "202001",
  "titularCuit": "27234567891"
}
```

Respuesta `200`:

```json
{
  "dominio": "AA123AA",
  "marca": "Toyota",
  "modelo": "Etios",
  "fechaFabricacion": "202001",
  "titular": {
    "cuit": "27234567891",
    "nombre": "Maria Gomez"
  }
}
```

Errores comunes:

- `422` si el payload es inválido
- `422` si el nuevo titular no existe
- `404` si el automotor no existe

### `DELETE /api/automotores/:dominio`

Elimina un automotor.

Respuesta `204` sin body.

Errores comunes:

- `422` si el dominio es inválido
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

## Herramientas para verificar que el proyecto está bien

### Lint

Verifica tipado, seguridad básica y consistencia del código:

```bash
npm run lint
```

Si querés autocorregir lo posible:

```bash
npm run lint:fix
```

### Unit tests

Prueban utilidades puras y reglas de normalización/validación:

```bash
npm run test
```

### E2E / integración HTTP

Prueban endpoints reales con Nest, TypeORM y una base PostgreSQL en memoria vía `pg-mem`:

```bash
npm run test:e2e
```

### Build

Verifica compilación TypeScript/Nest:

```bash
npm run build
```

### Verificación completa

Corre el check completo de calidad local:

```bash
npm run verify
```
