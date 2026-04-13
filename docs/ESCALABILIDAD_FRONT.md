# Escalabilidad Front

## Punto de partida

El frontend actual tiene un alcance acotado pero ya marca una direccion util:

- paginas standalone lazy por feature
- servicios HTTP delgados
- validadores compartidos
- componentes presentacionales separados de las paginas que orquestan datos
- manejo de errores centralizado a nivel de frontend


## Como escalar a 20 formularios similares

No conviene crear un "mega form engine". la ruta razonable seria:

1. Mantener pagina + componente de formulario.
2. Extraer solo las piezas que se repiten de verdad.
3. Estandarizar contratos de entrada y salida entre pagina y formulario.

Patron recomendado:

- la pagina resuelve carga inicial, guardado, navigation y mensajes globales
- el componente de formulario recibe `FormGroup`, estado y callbacks
- los dialogos resuelven subflujos concretos, como alta de un titular o confirmaciones


## Estrategia de componentes reutilizables

Para crecer sin perder legibilidad:

- reutilizar layouts, banners, tablas simples y barras de acciones
- evitar componentes "smart" que mezclen fetch, reglas de negocio y render
- preferir componentes chicos con inputs tipados antes que uno gigante con muchos flags

## Validadores compartidos

Los validadores de dominio, CUIT y fecha ya viven en `shared/validators`. Esa idea deberia continuar.

Siguiente paso:

- agrupar tambien normalizadores por dominio cuando haya mas de uno por tipo de dato
- documentar formato esperado junto al validador
- cubrir los casos limite con tests unitarios antes de reutilizar en masa


## Manejo de errores

La app ya tiene un `ApiErrorService` para bajar errores HTTP a mensajes usables.


- mantener mensajes de red y errores tecnicos en una sola capa
- dejar que cada pagina decida el fallback mas entendible para su flujo
- separar error de carga inicial, error de submit y error de accion secundaria

No hace falta un sistema sofisticado todavia, pero si conviene sostener estas reglas:

- los errores de formulario deben aterrizar cerca de la accion
- los errores de listado deben permitir reintento rapido
- los errores 404 y 422 no deberian verse iguales para el usuario

## Observabilidad frontend

### Web Vitals

- medir `LCP`, `INP` y `CLS` al menos en entornos reales
- enviar mediciones por release y por ruta
- revisar si la carga inicial del listado o del formulario agrega regresiones