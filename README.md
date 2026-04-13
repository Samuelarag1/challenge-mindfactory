# Challenge MindFactory

Repositorio con frontend Angular 21 y backend NestJS para administrar automotores y titulares.

La base funcional ya estaba resuelta en `frontend-core`. Este estado incorpora una segunda capa de trabajo orientada a UX, accesibilidad, performance y documentacion tecnica, sin cambiar el contrato con el backend.

## Que incluye

- listado de automotores con busqueda por dominio o CUIT
- paginacion y ordenamiento server-side
- alta, edicion y eliminacion de automotores
- alta inline de titular cuando el CUIT no existe
- validaciones compartidas para dominio, CUIT y fecha
- feedback de errores y estados vacios mas claros
- mejoras de accesibilidad y foco para teclado

## Setup rapido


Desde la raiz:

```bash
docker compose up --build
```

Servicios esperados:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000/api`
- PostgreSQL: `localhost:5432`

## Comandos utiles

Backend:

```bash
cd backend
npm run test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm test -- --watch=false
```

## Flujo recomendado para revisar

1. Abrir el listado y probar busqueda por dominio y por CUIT.
2. Crear un automotor nuevo con un titular existente.
3. Repetir el alta con un CUIT inexistente y crear el titular desde el dialogo.
4. Editar el CUIT de un automotor existente y confirmar la reasignacion.
5. Eliminar un registro y verificar paginacion y feedback.

## Estructura del proyecto

```text
backend/
  src/
    automotores/
    sujetos/
    common/
frontend/
  src/app/
    core/
    shared/
    features/
      automotores/
      sujetos/
docs/
  DECISION_LOG.md
  ESCALABILIDAD_FRONT.md
  IA_ACELERADORES.md
```

## Decisiones tecnicas relevantes

- Se mantuvo arquitectura por features con componentes standalone.
- El routing del frontend es lazy por pagina para no cargar todo el bundle de una vez.
- Se evito incorporar NgRx porque el alcance actual no justifica un estado global mas costoso.
- En el listado se cancela la consulta anterior cuando cambia paginacion, busqueda u orden para evitar respuestas viejas pisando el ultimo estado.
- Se mantuvo `OnPush` y se agregaron `computed` y `trackBy` donde aportan valor concreto.
- El formulario sigue separado entre pagina orquestadora y componente presentacional para escalar sin duplicar toda la logica de datos.

## Como testear

### Automatizado

- `frontend`: unit tests con Vitest a traves de `ng test`
- `backend`: tests unitarios y e2e propios del servicio

## Supuestos

- El backend expone paginacion server-side mediante `page`, `limit`, `sortBy`, `sortDirection` y `search`.
- El frontend consume la API desde `http://localhost:3000/api`.
- Los campos ordenables se limitan a los soportados por backend.
- La creacion o edicion de automotores requiere que el titular exista o se cree durante el flujo.

## Documentacion adicional

- [DECISION_LOG](docs/DECISION_LOG.md)
- [ESCALABILIDAD_FRONT](docs/ESCALABILIDAD_FRONT.md)
- [IA_ACELERADORES](docs/IA_ACELERADORES.md)
