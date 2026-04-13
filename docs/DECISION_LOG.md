# Decision Log

## 1. Mantener estado local por pagina y no sumar NgRx

Se mantuvo la orquestacion en las paginas de `automotores` con servicios HTTP simples y estado local (`signals`, `computed`, formularios reactivos).

Por que:

- el flujo principal entra en dos pantallas y un dialogo
- no hay colaboracion entre multiples features que justifique un store global
- agregar NgRx ahora subiria complejidad operativa, curva de entrada y volumen de codigo


## 2. Cancelar requests viejos del listado con `switchMap`

El listado ahora publica cambios de query y cancela la consulta anterior cuando cambian busqueda, orden o paginacion.

Por que:

- evita respuestas fuera de orden si el usuario interactua rapido
- reduce estados inconsistentes en UI
- mejora la sensacion de control sin tocar el backend

## 3. Preparar view models livianos para la tabla

La tabla no formatea fecha en cada render; recibe un item listo para pintar y usa `trackBy` por dominio.

Por que:

- baja trabajo repetido en template
- hace mas explicito que la tabla consume datos de vista y no adapta el contrato del backend
- deja mas claro donde agregar futuras columnas derivadas

## 4. Usar skeleton solo en estados frios

Se agrego skeleton en la carga inicial del listado y en la carga del formulario de edicion. Para refresh sobre datos ya visibles se mantiene una barra de progreso discreta.


## 5. Mejorar foco y accesibilidad sin introducir una capa generica

Se eligio resolver foco al primer campo invalido, resumen de errores y foco al titular resuelto con metodos puntuales en el formulario, en lugar de agregar una solucion abstracta para toda la app.

Por que:

- cubre el problema real del flujo actual
- mantiene la implementacion facil de leer
- evita un helper generico que todavia no tiene suficientes casos de uso
