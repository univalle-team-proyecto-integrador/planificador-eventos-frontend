---
tipo: mejora
---

# El cliente habla el 409 real y el conflicto distingue el origen

- **Fecha:** 2026-10-15
- **Área:** interfaz / integración / UX
- **Estado:** hecha

## Commits relacionados

- `9954b17`, `ce071cb`, `e651d02`, `db2dbbd` (2026-10-13) — la reprogramación pasa a leer el
  contrato que devuelve el backend desplegado.
- `67cdc34`, `1f374ad` (2026-10-14) — el aviso de sobrecarga no borra la selección y vuelve
  a dispararse al editar.
- `38fa9af` (2026-10-14) — el 409 al crear una gestión abre el mismo `ConflictoModal` con
  origen `'create'`.

Ocho commits que no estaban registrados en la bóveda. Se agrupan aquí porque son una sola
corrección de contrato repartida en varios pasos.

## Descripción

El cliente había escrito el contrato de la reprogramación **antes** que el backend, contra
un `200` con una bandera `conflicto: true` dentro del body. El backend mientras tanto cambió
esa forma a un **`409` con los números del choque en la raíz del `ProblemDetail`**
(`limiteDiario`, `horasAsignadasPreviamente`, `horasSolicitadas`, `horasPlanificadasTotales`,
`excedente`, `fecha`, `idSubtarea`) — es la mejora 030 del backend, del 2026-10-08.

Con las dos líneas de trabajo en paralelo, el cliente se encontró con un contrato que ya no
existía. La consecuencia era que **el 409 caía en el manejador genérico de errores**: el
usuario veía «No pudimos completar la acción» en lugar de la explicación de cuántas horas
hay que liberar y por qué.

## Cambios

- `src/utils/reprogramacion.js` — `esConflicto(error)` reconoce el 409 y normaliza el
  `ProblemDetail` a los campos reales; `getMensajeConflicto` compone el texto a partir de
  ellos en vez de leer una bandera.
- `src/components/ui/ConflictoModal.jsx` — acepta un **origen** (`'reprogramar'` o
  `'create'`) y deriva de él el título y el mensaje: no es el mismo problema ni la misma
  salida cuando el conflicto aparece al mover una gestión que al crearla.
- `src/views/EventDetailView.jsx` — `handleReprogramar` y `handleUpdateSubtask` detectan el
  409 y abren el `ConflictoModal` con las cifras; `handleAddSubtask` hace lo mismo con
  origen `'create'`.
- `src/views/EventDetailView.jsx` — el `ConflictoModal` se declara **fuera del `try`** que
  hace la llamada. Declarado dentro, un 409 salteaba la declaración y el modal nunca se
  abría: es el orden de las dos rutas que van bien y la que falla no es el mismo.
- `src/views/EventDetailView.jsx` — el aviso **no borra la selección**: al abrir el conflicto
  se conservan la fecha y las horas escritas, para que «Ajustar horas» devuelva al formulario
  con lo que el usuario ya eligió en vez de obligarlo a escribirlo otra vez (US-06/US-07).
- `src/views/EventDetailView.jsx` — editar una gestión vuelve a disparar el conflicto: el
  caso «reducir y aun así seguir sobrecargado» guarda y avisa (`resuelto: false`), y esa
  respuesta también tiene que abrir el modal.
- `src/services/mocks/reprogramacion.js` — `createSubtask` del mock devuelve el mismo 409
  plano que el backend, con `idSubtarea` ausente, para que las vistas no cambien entre
  desarrollo y producción.
- `docs/contrato-reprogramacion.md` — documenta que `POST /api/eventos/{id}/subtareas`
  devuelve 409 con `idSubtarea` nulo.
- `src/views/EventDetailView.test.jsx` (**nuevo**, 232 líneas) — cobertura del render y de los
  caminos de conflicto.

## Decisiones

- **Se normaliza el `ProblemDetail` en un solo sitio.** `esConflicto` y
  `getMensajeConflicto` concentran la forma del 409. Con el conflicto llegando por tres
  caminos distintos, duplicar el parseo en cada uno era la forma segura de que uno se
  quedara atrás.
- **El origen cambia el mensaje, no el componente.** Un `ConflictoModal` con dos títulos y
  dos textos; dos modales con el mismo layout habrían sido dos fuentes de verdad para lo
  visual.
- **`idSubtarea` ausente, no `null`.** En una creación fallida no hay gestión que
  identificar; mandar un id haría creer que se puede editar algo que no existe.
- **El aviso no borra lo escrito.** Descartar la selección obligaba al usuario a repetir
  exactamente lo que acababa de hacer para ver el mismo conflicto otra vez.

## Verificación

- `npm run test` → **148 pruebas** en verde, 16 archivos.
- `npm run lint` y `npm run build` limpios.
- `npm run build` ✅.

## Pendiente

- **Falta la verificación end-to-end contra Render.** Los commits del backend que producen
  estos 409 (`33483fa`, `d120e18`) y estos commits del cliente salieron el mismo día y sin
  una prueba que los junte sobre el despliegue real. Es el hueco más importante que queda
  abierto en la épica de capacidad.
- El backend solo evalúa el límite en las tres vías de escritura; cualquier otra que añada
  horas a una fecha (por ejemplo un endpoint futuro de plantilla) heredará el mismo hueco.
