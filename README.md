# Challenge MindFactory

Este repo contiene:

- `frontend`: Angular 
- `backend`: NestJS + TypeORM + PostgreSQL
- `postgres`: base de datos para el backend

## Requisitos

- Docker

## Levantar todo

Desde la raiz:

```bash
docker compose up --build
```

## URLs

- Frontend: http://localhost:4200
- Backend: http://localhost:3000/api
- PostgreSQL: http://localhost:5432

## Seed inicial

El seed del backend es opt-in. Solo corre si `DB_SEED=true`.

Cuando se activa, hace upsert de:

- Sujetos: `20123456786`, `27234567891`, `30712345671`
- Automotores: `AAA123`, `AB123CD`, `AC456EF`
 