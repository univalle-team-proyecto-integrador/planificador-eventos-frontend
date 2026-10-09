# Contrato — límite diario, reprogramación y reducción de horas

Documento puente entre backend y frontend para la épica de reprogramación.
Fija endpoints, payloads, la forma del conflicto y los estados de UI. Cuando el
backend gane endpoints nuevos, este archivo es el único que se actualiza.

> **Este documento describe el backend real, no el planeado.** Las formas que
> siguen se tomaron de las respuestas que devuelve hoy `SubtareaService` y
> `GlobalExceptionHandler`, y hay tests que las fijan
> (`backend/src/test/.../CapacidadApiTest`). Si el contrato y el código se
> contradicen, el código gana: hay que corregir este archivo.

## Alcance

- Configurar el límite de horas diarias del organizador.
- Reprogramar una subtarea (nueva fecha y nuevas horas) evaluando el límite.
- Reducir las horas de una subtarea sin cambiar su fecha.
- Resolver el conflicto cuando la reprogramación supera el límite diario.
- Marcar visualmente si una gestión quedó postergada o adelantada.

## Endpoints y payloads

### Leer el perfil y su límite

```http
GET /api/users/profile
Authorization: Bearer <token>
```

Respuesta `200` (`UsuarioDTO`):

```json
{
  "idUsuario": 1,
  "email": "ana@correo.com",
  "nombre": "Ana",
  "limiteHorasDiarias": 6
}
```

`limiteHorasDiarias` es un entero entre `1` y `16`; el backend lo inicializa en
`6`.

### Consultar la capacidad del día

```http
GET /api/users/capacity?fecha=2026-11-20
Authorization: Bearer <token>
```

Respuesta `200` (`CapacidadDTO`):

```json
{
  "usuarioId": 1,
  "limiteHorasDiarias": 6,
  "fecha": "2026-11-20",
  "horasPlanificadas": 5,
  "horasDisponibles": 1
}
```

Las horas planificadas suman las subtareas `pendiente` y `pospuesta` de esa
fecha; las `ejecutada` quedan fuera. `horasDisponibles` nunca es negativo.
Sin `fecha` se evalúa el hoy de Colombia.

### Configurar el límite diario

```http
PUT /api/users/capacity
Authorization: Bearer <token>
Content-Type: application/json

{ "limiteHorasDiarias": 8 }
```

Cuerpo: `LimiteHorasDTO` (`limiteHorasDiarias`, entero entre `1` y `16`).
Respuesta `200` (`CapacidadDTO`):

```json
{
  "usuarioId": 1,
  "limiteHorasDiarias": 8,
  "fecha": "2026-11-20",
  "horasPlanificadas": 5,
  "horasDisponibles": 3
}
```

Errores: `400` si está fuera de `1..16`; `401` sin token. El backend también
expone `GET /api/users/capacity` con la misma respuesta (capacidad de una fecha,
aún no se usa en la UI). `limiteHorasDiarias` se inicializa en `6`.

> Ojo con la ruta: **`/api/users/profile` es de solo lectura.** Ajustar el
> límite va por `/api/users/capacity`; mandarlo a `/profile` responde **405**, que
> en un log se lee fácil como "todo bien". El método del frontend se llama
> `updateProfileLimit` por historia del módulo, pero la ruta es la de capacidad.

### Reprogramar una subtarea

```http
PATCH /api/subtareas/{id}/reprogramar
Authorization: Bearer <token>
Content-Type: application/json

{ "nuevaFecha": "2026-11-15", "nuevasHoras": 3 }
```

Respuesta `200` (`SubtareaDTO` **plana**, sin envoltorio):

```json
{
  "idSubtarea": 1,
  "idEvento": 1,
  "nombreGestion": "Confirmar proveedor",
  "fechaObjetivo": "2026-11-15",
  "fechaObjetivoOriginal": "2026-11-03",
  "horasEstimadas": 3,
  "estado": "pendiente",
  "notaExplicativa": null,
  "fechaCreacion": "2026-09-24T10:15:30"
}
```

Respuesta `409` cuando no cabe en el límite (la subtarea **no** se persiste):

```json
{
  "type": "about:blank",
  "title": "Límite diario excedido",
  "status": 409,
  "detail": "La reprogramación supera el límite diario de 6 horas",
  "limiteDiario": 6,
  "horasAsignadasPreviamente": 5,
  "horasSolicitadas": 4,
  "horasPlanificadasTotales": 9,
  "excedente": 3,
  "fecha": "2026-11-15",
  "idSubtarea": 1
}
```

**Dos detalles que se dan por supuestos y rompen la integración:**

1. **Es un `409`, no un `200` con `conflicto: true`.** El plan original lo
   proponer así; el backend lo resolvió con una excepción. El frontend debe
   capturar el `ApiError` y mirar `error.status === 409`. El cuerpo del error
   llega en `error.details`, no devuelto.
2. **Las propiedades van aplanadas en la raíz**, no anidadas bajo una clave
   `properties`. Es como Spring serializa las extensiones de `ProblemDetail`.
   Leer `respuesta.properties.limiteDiario` da `undefined` siempre.

Notas de `SubtareaService.reprogramar`:

- `horasPlanificadasTotales` = horas no ejecutadas ya asignadas a `nuevaFecha`
  (excluyendo la propia subtarea si no cambia de fecha) + `nuevasHoras`.
- Si envían `nuevaFecha` igual a la actual, las horas de la propia subtarea no
  se cuentan dos veces.
- Las horas de subtareas ejecutadas no cuentan para el límite.

> **Forma del `409`.** El cuerpo es un `ProblemDetail` (RFC 7807) de Spring.
> Confirmado contra el código del backend (`CapacidadExcedidaException` +
> `GlobalExceptionHandler.handleCapacidadExcedida`) **y** ejecutando la respuesta
> real:
>
> ```json
> {
>   "type": "about:blank",
>   "title": "Límite diario excedido",
>   "status": 409,
>   "detail": "La reprogramación supera el límite diario de 6 horas",
>   "idSubtarea": 1,
>   "fecha": "2026-11-15",
>   "limiteDiario": 6,
>   "horasAsignadasPreviamente": 5,
>   "horasSolicitadas": 3,
>   "horasPlanificadasTotales": 9,
>   "excedente": 3
> }
> ```
>
> `normalizarConflicto409` lee `limiteDiario` y `horasPlanificadasTotales` (con
> `excedente` como respaldo) y el `detail` como mensaje; mantiene nombres
> antiguos **después** de los reales. Si el body no trae la aritmética, la UI cae
> al texto del servidor o a un mensaje genérico — nunca a "0 h".
>
> El backend ya documenta este body como `ProblemaCapacidadDTO` en su
> `/v3/api-docs`; antes springdoc deducía `SubtareaDTO` y la spec mentía.
### Reducir horas (misma fecha, menos horas)

No hay endpoint propio: se reutiliza la actualización de campos.

```http
PUT /api/subtareas/{id}
Authorization: Bearer <token>
Content-Type: application/json

{ "nombreGestion": "...", "fechaObjetivo": "2026-11-15", "horasEstimadas": 2 }
```

Respuesta `200`: `SubtareaDTO`. Errores: `400`, `404`. **Este camino no evalúa
el límite diario**; la reducción nunca lo empeora, así que se acepta tal cual.
Si se necesita garantía del servidor, pedir al backend que aplique la misma
regla que `reprogramar`.

## La marca de desfase: postergada / adelantada

Para poder marcar si una gestión se movió **hacia atrás o hacia adelante**, el
backend guarda la fecha con la que se planificó:

```sql
ALTER TABLE subtarea ADD COLUMN fecha_objetivo_original DATE;
```

Reglas (`SubtareaService.fijarLineaBaseSiFalta`):

- Se fija **la primera vez que la fecha cambia**, tanto al reprogramar como al
  editar con `PUT /api/subtareas/{id}`.
- **No se recalcula** en reprogramaciones siguientes: el desfase siempre se mide
  contra la planificación original, no contra la última movida.
- Si la fecha no cambia (solo se ajustan horas), no se marca nada.
- Es `null` en las subtareas que nunca cambiaron de fecha.

El backend **no** manda un estado tipo `postergada`: lo deriva el frontend
comparando `fechaObjetivo` contra `fechaObjetivoOriginal` en
`utils/taskMetrics.js` → `getDesfase(task)`, que devuelve
`{ tipo: 'postergada' | 'adelantada', dias }` o `null`.

Guardar un enum en la base habría duplicado un estado derivable y lo habría
dejado susceptible de desincronizarse de las fechas.

## Estados de UI

| Estado              | Cuándo                                                 | Componente                                              |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Cargando            | al pedir el perfil o al enviar el modal                | `disabled` + `aria-busy` en el botón de envío           |
| Vacío               | sin subtareas o sin conflictos pendientes              | `EmptyState`                                            |
| Éxito               | el servidor confirma la mutación                       | `Toast`                                                 |
| Error de red        | fallo de conexión o `5xx`                              | `ErrorState` / `ErrorModal`                             |
| Error de validación | campos inválidos (fecha, horas, límite fuera de rango) | mensaje por campo (`aria-invalid` + `aria-describedby`) |
| Conflicto de límite | `ApiError` con `status === 409`                        | `ConflictoModal`                                        |

Las mutaciones **no** son optimistas: la UI cambia solo tras la respuesta
persistida del servidor (ver `docs/decisiones-ux.md`).

## Mock de desarrollo

El mock (`src/services/mocks/reprogramacion.js`) debe **imitar al backend, no al
frontend**. Si el mock inventa una forma más cómoda —como un `200` con
`conflicto: true`— los tests pasan mientras la aplicación está rota, que es lo
que pasó antes de este arreglo.

Con `VITE_USE_MOCKS=true` el servicio elige el mock; sin la variable habla con
el backend real. El flag es **solo para desarrollo**.

## Verificación end-to-end

1. `VITE_USE_MOCKS` sin definir y backend arriba.
2. Configurar el límite en `/configuracion`; recargar y comprobar que persiste
   (`GET /api/users/capacity` o `GET /api/users/profile`).
3. Reprogramar una gestión a un día posterior → cambia fecha y horas, aparece
   la marca **Postergada** con los días de desfase en Hoy, Próximas y detalle.
4. Reprogramar a un día anterior → aparece **Adelantada**.
5. Reprogramar por encima del límite → abre `ConflictoModal` explicando el
   exceso, y **no** cambia nada en Supabase.
6. Reprogramar dos veces → la marca se sigue midiendo contra la fecha original,
   no contra la movida anterior.
7. Ajustar solo las horas → no aparece marca de desfase, y `horasEstimadas`
   sí cambia.
8. El `409` debe mostrar las horas **reales** del conflicto (por ejemplo
   "quedaría con 16 h"), nunca "0 h".
