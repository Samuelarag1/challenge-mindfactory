# Guia de Defensa del Challenge

Este documento esta pensado para estudiar rapido antes de una entrevista tecnica sobre este repo.

Objetivo:

- entender como esta armada la app
- poder explicar las decisiones sin sonar improvisado
- cubrir lo minimo de Angular para defender el frontend sin vender humo
- tener preparadas respuestas honestas para los puntos incomodos

## 1. Resumen ejecutivo que deberias poder decir en 30 segundos

"Es una app fullstack para administrar automotores y titulares. El frontend esta hecho con Angular standalone components y Angular Material. El backend esta hecho con NestJS, TypeORM y PostgreSQL. El flujo principal permite listar, buscar, crear, editar y eliminar automotores. Si al crear o editar un automotor el titular no existe, el frontend abre un dialogo para darlo de alta y luego continuar el flujo. La API valida datos con DTOs y devuelve errores 422 consistentes para que el frontend los muestre de forma usable."

Si te piden una version mas tecnica:

"En frontend use routing lazy por pagina, estado local con signals y formularios reactivos. Evite NgRx porque el alcance no lo justificaba. En backend use controladores delgados, DTOs con class-validator y servicios con la logica de negocio. El listado soporta paginacion, orden y busqueda server-side."

## 2. Que tenes que entender del producto

Flujos principales:

1. Listar automotores.
2. Buscar por dominio o CUIT.
3. Crear automotor con titular existente.
4. Crear automotor con CUIT inexistente y alta inline del titular.
5. Editar automotor y eventualmente reasignarlo a otro titular.
6. Eliminar automotor.

Regla de negocio importante:

- un automotor necesita un titular valido para poder guardarse
- si el titular no existe, se puede crear desde el dialogo
- la edicion no cambia el dominio, pero si puede cambiar el titular

## 3. Mapa mental del repo

Abrite estos archivos y entendelos en este orden:

### Frontend

- `frontend/src/main.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/features/automotores/pages/automotores-list-page.component.ts`
- `frontend/src/app/features/automotores/pages/automotor-form-page.component.ts`
- `frontend/src/app/features/automotores/components/automotor-form/automotor-form.component.ts`
- `frontend/src/app/features/automotores/components/automotores-table/automotores-table.component.ts`
- `frontend/src/app/features/automotores/services/automotores.service.ts`
- `frontend/src/app/features/sujetos/services/sujetos.service.ts`
- `frontend/src/app/features/sujetos/components/create-sujeto-dialog/create-sujeto-dialog.component.ts`
- `frontend/src/app/core/guards/pending-changes.guard.ts`
- `frontend/src/app/core/services/api-error.service.ts`
- `frontend/src/app/shared/validators/cuit.validator.ts`
- `frontend/src/app/shared/validators/dominio.validator.ts`
- `frontend/src/app/shared/validators/yyyymm.validator.ts`

### Backend

- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/automotores/automotores.controller.ts`
- `backend/src/automotores/automotores.service.ts`
- `backend/src/automotores/dto/create-automotor.dto.ts`
- `backend/src/automotores/dto/list-automotores-query.dto.ts`
- `backend/src/sujetos/sujetos.controller.ts`
- `backend/src/sujetos/sujetos.service.ts`
- `backend/src/sujetos/dto/create-sujeto.dto.ts`
- `backend/src/common/filters/api-exception.filter.ts`
- `backend/src/common/validation/validation-exception.factory.ts`

## 4. Angular basico que tenes que saber si o si

No hace falta que te vuelvas experto. Con esto deberias poder defender el proyecto.

### 4.1 Que significa que Angular aca use standalone components

En este proyecto no se usa la estructura clasica basada en `NgModule` para cada feature.

Que ver:

- `frontend/src/main.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.ts`

Idea clave:

- `bootstrapApplication(App, appConfig)` arranca la app
- los providers globales se registran en `app.config.ts`
- cada componente declara sus propios `imports`

Como explicarlo:

"Use standalone components para reducir ceremonia y mantener cada pagina autocontenida. Para este challenge me daba una estructura mas directa que seguir creando modulos por todos lados."

### 4.2 Routing lazy

Que ver:

- `frontend/src/app/app.routes.ts`

Idea clave:

- la ruta raiz redirige a `vehicles`
- `loadComponent` carga la pagina solo cuando el usuario entra
- el formulario usa `canDeactivate` para evitar perder cambios

Como explicarlo:

"La app tiene pocas pantallas, asi que el lazy loading por pagina es suficiente y simple. No necesitaba una arquitectura mas pesada."

### 4.3 Signals y computed

Que ver:

- `VehiclesListPageComponent`
- `VehicleFormPageComponent`

Idea clave:

- `signal()` guarda estado local reactivo
- `computed()` deriva valores desde ese estado
- se usan para `loading`, `items`, `meta`, `errors`, `owner`, etc.

Como explicarlo:

"Use signals para estado local de UI porque el alcance era acotado y no justificaba store global. Me permiten expresar estado y derivados de forma simple."

### 4.4 Reactive Forms

Que ver:

- `VehicleFormPageComponent`
- `VehicleFormComponent`
- `CreateOwnerDialogComponent`

Idea clave:

- el formulario se arma con `FormGroup` y `FormControl`
- las validaciones van en el form y se reflejan en la UI
- la pagina orquesta datos y el componente pinta el formulario

Como explicarlo:

"Separe la pagina del componente presentacional para no mezclar carga de datos, submit y navegacion con el markup del formulario."

### 4.5 RxJS solo donde hace falta

Que ver:

- `VehiclesListPageComponent`
- `VehicleFormPageComponent`
- `ConfirmationService`

Idea clave:

- `switchMap` se usa en el listado para cancelar requests viejos
- `takeUntilDestroyed` evita leaks al destruir el componente
- no hay sobreuso de RxJS para estado global

Como explicarlo:

"Use RxJS para flujos asincronos concretos, no como arquitectura total del frontend."

### 4.6 OnPush

Que ver:

- casi todos los componentes usan `ChangeDetectionStrategy.OnPush`

Idea clave:

- Angular no re-renderiza de mas
- con signals, inputs y eventos esto encaja bien

Como explicarlo:

"OnPush ayuda a mantener el render mas predecible. En una app chica no era obligatorio, pero es una optimizacion razonable y entendible."

## 5. Flujo del frontend que tenes que poder contar

### Listado

Archivo principal:

- `frontend/src/app/features/automotores/pages/automotores-list-page.component.ts`

Que pasa:

1. Se inicializa una query con pagina, limite y orden default.
2. Un `Subject` publica cambios de query.
3. `switchMap` llama al backend y cancela la request anterior si el usuario vuelve a interactuar.
4. Si la respuesta sale bien, se actualizan `items` y `meta`.
5. Si falla, se transforma el error a mensajes de UI con `ApiErrorService`.

Por que esta bien:

- evita respuestas fuera de orden
- deja la tabla como componente tonto
- el backend hace paginacion, sort y search

### Formulario de automotor

Archivos principales:

- `frontend/src/app/features/automotores/pages/automotor-form-page.component.ts`
- `frontend/src/app/features/automotores/components/automotor-form/automotor-form.component.ts`

Que pasa:

1. La pagina detecta si esta en create o edit por la ruta.
2. Si es edit, carga el automotor y llena el formulario.
3. El componente de formulario solo recibe el `FormGroup`, estados y callbacks.
4. Antes de guardar se normalizan dominio, CUIT y fecha.
5. Se valida si existe el titular.
6. Si no existe, se abre un dialogo para crearlo.
7. Si existe o se crea, se hace create o update del automotor.

Punto importante:

- `licensePlate` queda deshabilitado en edicion
- si cambia el CUIT, el formulario avisa que se reasignara el automotor

### Dialogo de alta de titular

Archivo:

- `frontend/src/app/features/sujetos/components/create-sujeto-dialog/create-sujeto-dialog.component.ts`

Que pasa:

- recibe el CUIT
- pide solo el nombre
- crea el titular
- cierra devolviendo el owner al flujo principal

Como explicarlo:

"Resolvi el caso de CUIT inexistente sin sacar al usuario del flujo principal. El dialogo encapsula ese subflujo y devuelve el titular creado."

## 6. Backend que tenes que poder explicar

### Bootstrap global

Archivo:

- `backend/src/main.ts`

Que hace:

- define prefijo global `api`
- configura CORS
- usa `ValidationPipe`
- transforma datos de entrada
- elimina campos no permitidos
- usa un filtro global de excepciones

Frase util:

"Quise que la validacion y el formato de error estuvieran centralizados para no repetir logica en cada controlador."

### AppModule y persistencia

Archivo:

- `backend/src/app.module.ts`

Que hace:

- configura TypeORM
- registra entidades automaticamente
- conecta `OwnersModule` y `VehiclesModule`

Punto incomodo que te pueden preguntar:

- hay `synchronize: true` y tambien migraciones

Respuesta honesta:

"Para un challenge priorice velocidad de setup y compatibilidad con cambios del schema. En una app productiva elegiria una sola estrategia, normalmente migraciones."

### Controller + Service

Archivos:

- `backend/src/automotores/automotores.controller.ts`
- `backend/src/automotores/automotores.service.ts`
- `backend/src/sujetos/sujetos.controller.ts`
- `backend/src/sujetos/sujetos.service.ts`

Como esta repartido:

- el controller expone endpoints y delega
- el service tiene la logica
- los DTOs validan input y normalizan datos

Esto esta bien defenderlo asi:

"Los controladores son delgados. La logica vive en servicios y los DTOs se encargan de transformar y validar la entrada."

### DTOs y validacion

Archivos:

- `backend/src/automotores/dto/create-automotor.dto.ts`
- `backend/src/automotores/dto/list-automotores-query.dto.ts`
- `backend/src/sujetos/dto/create-sujeto.dto.ts`

Idea clave:

- `@Transform` normaliza
- `class-validator` valida
- el backend no confia en el frontend

Ejemplos:

- dominio se normaliza
- CUIT se normaliza y valida
- fecha se valida
- texto se trimmea

### Errores 422 y 404

Archivos:

- `backend/src/common/validation/validation-exception.factory.ts`
- `backend/src/common/filters/api-exception.filter.ts`
- `frontend/src/app/core/services/api-error.service.ts`

Explicacion buena:

"Busque consistencia entre backend y frontend. El backend devuelve 422 con un array `errors`, y el frontend lo transforma a mensajes usables sin tener que conocer cada caso puntual."

## 7. Contrato front-back que tenes que saber de memoria

Base URL:

- `http://localhost:3000/api`

Endpoints:

- `GET /vehicles`
- `GET /vehicles/:licensePlate`
- `POST /vehicles`
- `PUT /vehicles/:licensePlate`
- `DELETE /vehicles/:licensePlate`
- `GET /owners/by-cuit?cuit=...`
- `POST /owners`

Parametros del listado:

- `page`
- `limit`
- `sortBy`
- `sortDirection`
- `search`

Payload de automotor:

```json
{
  "licensePlate": "AAA123",
  "chassis": "8AFZZZ54ZMJ123456",
  "engine": "ABC123456",
  "color": "Rojo",
  "manufactureDate": "2021-06-01",
  "ownerCuit": "20123456786"
}
```

Respuesta tipica de automotor:

```json
{
  "licensePlate": "AAA123",
  "chassis": "8AFZZZ54ZMJ123456",
  "engine": "ABC123456",
  "color": "Rojo",
  "manufactureDate": "2021-06-01",
  "owner": {
    "cuit": "20123456786",
    "name": "Juan Perez"
  }
}
```

## 8. Puntos tecnicos que te conviene estudiar esta noche

### Angular

1. Que es un standalone component.
2. Que hace `bootstrapApplication`.
3. Diferencia entre `signal`, `computed` y `Observable`.
4. Que es un `FormGroup`.
5. Para que sirve `ChangeDetectionStrategy.OnPush`.
6. Que hace `inject()` y por que evita llenar el constructor.
7. Que hace `loadComponent` en routes.
8. Que hace `switchMap`.
9. Que hace `takeUntilDestroyed`.
10. Que hace un `CanDeactivate` guard.

### NestJS

1. Que es un controller.
2. Que es un service.
3. Que hace `ValidationPipe`.
4. Que hacen `class-validator` y `class-transformer`.
5. Que hace un exception filter.
6. Como TypeORM mapea entidades y relaciones.

## 9. Puntos incomodos del repo y como responder

No los escondas. Reconocelos con criterio.

### 9.1 Mezcla de ingles y espanol

Lo que pasa:

- el runtime usa `vehicles`, `owners`, `licensePlate`, `ownerCuit`
- varias carpetas y nombres internos siguen en espanol: `automotores`, `sujetos`, `dominio`

Como responder:

"El contrato HTTP y los modelos expuestos quedaron en ingles, pero internamente quedaron nombres historicos en espanol de etapas previas. No afecta el funcionamiento, aunque si fuera una siguiente iteracion cerraria esa consistencia interna."

### 9.2 Validador `yyyymm` que en realidad valida fecha ISO

Archivo:

- `frontend/src/app/shared/validators/yyyymm.validator.ts`

Como responder:

"Es un nombre heredado de una etapa anterior. La implementacion actual valida fecha ISO. Lo correcto seria renombrarlo para que el nombre coincida con el comportamiento."

### 9.3 Debug logs y restos de refactor en backend

Archivo:

- `backend/src/automotores/automotores.service.ts`

Lo que pasa:

- hay `console.log`
- hay codigo comentado
- hay un `null as any`

Como responder:

"Son restos de una iteracion de cierre. No cambian la logica, pero los limpiaria antes de una entrega final porque bajan la prolijidad del repo."

### 9.4 `synchronize: true` mas migraciones

Archivo:

- `backend/src/app.module.ts`

Como responder:

"En challenge priorice setup rapido. En un entorno productivo consolidaria una sola estrategia de cambios de schema."

## 10. Preguntas probables y respuestas cortas

### Por que no usaste NgRx?

"Porque el estado esta contenido en dos paginas y un dialogo. Con services HTTP, signals y formularios reactivos alcanzaba. Meter un store global agregaba complejidad sin resolver un problema real."

### Por que usaste Angular Material?

"Porque me permitia resolver componentes accesibles y consistentes rapido, que era importante para el tiempo del challenge."

### Por que separaste pagina y formulario?

"Para separar orquestacion de datos y navegacion del markup y la experiencia de entrada. Eso hace mas legible el flujo y evita duplicacion."

### Como manejas errores de API?

"Centralice el parseo de errores HTTP en `ApiErrorService` y del lado backend uniforme 422 y 404 con un filtro global."

### Como evitas condiciones de carrera en el listado?

"El listado emite cambios de query y usa `switchMap` para cancelar requests anteriores."

### Por que la busqueda vive en backend y no en frontend?

"Porque la lista ya usa paginacion y orden server-side. Filtrar del lado cliente seria incoherente con un dataset potencialmente mayor."

### Como resuelves el CUIT inexistente?

"Intento buscar el titular por CUIT. Si el backend responde 404, abro un dialogo para crearlo y luego continuo el flujo."

## 11. Mini machete de Angular para no trabarte

Si te hablan de esto, pensa asi:

- componente: una pieza de UI con template, estilos y logica
- standalone: el componente declara lo que importa y no depende de un modulo
- signal: estado local reactivo
- computed: valor derivado
- FormGroup: objeto que agrupa controles de formulario
- validator: funcion que marca un control invalido
- service: clase para comunicar con API o encapsular logica reusable
- guard: logica que corre antes de entrar o salir de una ruta
- `inject()`: forma moderna de pedir dependencias

## 12. Orden de estudio recomendado para hoy

Si tenes poco tiempo, segui este orden:

1. Lee `README.md`.
2. Recorre `frontend/src/app/app.routes.ts`.
3. Entiende `VehiclesListPageComponent`.
4. Entiende `VehicleFormPageComponent`.
5. Entiende `VehicleFormComponent`.
6. Revisa `VehiclesService` y `OwnersService`.
7. Revisa `ApiErrorService`.
8. Revisa validadores de CUIT, dominio y fecha.
9. Revisa `backend/src/main.ts`.
10. Revisa `VehiclesController` y `VehiclesService`.
11. Revisa `OwnersController` y `OwnersService`.
12. Revisa el filtro de excepciones.

## 13. Que no deberias hacer en la entrevista

- no digas que conoces Angular a fondo si no es cierto
- no inventes que hay una arquitectura mas sofisticada de la que realmente hay
- no defiendas nombres inconsistentes como si fueran una decision brillante
- no vendas optimizaciones como si fueran hiper complejas

Conviene decir algo asi:

"En Angular no vengo con tantos anos de experiencia como en otras capas, pero en este challenge me enfoque en entender bien standalone components, routing, reactive forms, signals y el flujo de datos para construir algo consistente."

## 14. Frase final util para cerrar bien

"Mi foco en este challenge fue resolver bien el flujo principal, mantener consistente el contrato entre frontend y backend, y evitar sobreingenieria para el tiempo disponible. Donde hay cosas perfectibles, las puedo senalar y priorizar sin problema."
