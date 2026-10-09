# Contrato — límite diario, reprogramación y reducción de horas

Documento puente entre backend y frontend para la épica de reprogramación.
Fija endpoints, payloads, la forma del conflicto y los estados de UI. Cuando el
backend gane endpoints nuevos, este archivo es el único que se actualiza.

## Alcance

- Configurar el límite de horas diarias del organizador.
- Reprogramar una subtarea (nueva fecha y nuevas horas) evaluando el límite.
- Reducir las horas de una subtarea sin cambiar su fecha.
- Resolver el conflicto cuando la reprogramación supera el límite diario.

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
`6`. La lectura **ya existe**; el frontend la usa para mostrar el límite actual.

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

### Reprogramar una subtarea

```http
PATCH /api/subtareas/{id}/reprogramar
Authorization: Bearer <token>
Content-Type: application/json

{ "nuevaFecha": "2026-11-15", "nuevasHoras": 3 }
```

El endpoint evalúa el límite diario. Notas del backend
(`SubtareaService.reprogramar`):

- `horasTotalesCalculadas` = horas no ejecutadas ya asignadas a `nuevaFecha`
  (excluyendo la propia subtarea si no cambia de fecha) + `nuevasHoras`.
- Si envían `nuevaFecha` igual a la actual, las horas de la propia subtarea no
  se cuentan dos veces.
- Las horas de subtareas ejecutadas no cuentan para el límite.

Respuestas:

- `200`: la subtarea **entra** en el límite y se persiste. El cuerpo es la
  `SubtareaDTO` directamente (sin envoltorio):

  ```json
  {
    "idSubtarea": 1,
    "idEvento": 2,
    "nombreGestion": "Confirmar proveedor de flores",
    "fechaObjetivo": "2026-11-15",
    "horasEstimadas": 3,
    "estado": "pendiente",
    "notaExplicativa": null,
    "fechaCreacion": "2026-09-24T10:15:30"
  }
  ```

- `409`: la **supera** y no se guarda nada, con el detalle de cuánto hay que
  liberar. El frontend traduce este estado con `normalizarConflicto409`
  (`src/utils/reprogramacion.js`) a la forma `{ conflicto, limiteDiario,
  horasTotalesCalculadas, mensaje }` que consume `ConflictoModal`.

Errores: `400` si `nuevaFecha`/`nuevasHoras` no son válidas o el límite es
inválido; `404` si la subtarea no existe o es de otro usuario; `401` sin token.

> **Forma del `409`.** El backend no documenta un schema propio para el body del
> conflicto (el Swagger lo deja sin shape). `normalizarConflicto409` es tolerante
> y prueba variantes (`limiteDiario`/`horasTotalesCalculadas`, `horasALiberar`
> contra el límite, shape `capacidad` con `horasPlanificadas` + `nuevasHoras`,
> mensajes en `detail`/`mensaje`/`message`). Si el body no trae la aritmética, la
> UI cae a un mensaje genérico. **Pendiente**: confirmar los nombres reales de
> los campos con una prueba sobre Render y fijarlos aquí.

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

## Estados de UI

| Estado              | Cuándo                                                 | Componente                                              |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Cargando            | al pedir el perfil o al enviar el modal                | `disabled` + `aria-busy` en el botón de envío           |
| Vacío               | sin subtareas o sin conflictos pendientes              | `EmptyState`                                            |
| Éxito               | el servidor confirma la mutación                       | `Toast`                                                 |
| Error de red        | fallo de conexión o `5xx`                              | `ErrorState` / `ErrorModal`                             |
| Error de validación | campos inválidos (fecha, horas, límite fuera de rango) | mensaje por campo (`aria-invalid` + `aria-describedby`) |
| Conflicto de límite | respuesta `409` normalizada por el servicio (`conflicto: true`) | `ConflictoModal`                                        |

Las mutaciones **no** son optimistas: la UI cambia solo tras la respuesta
persistida del servidor (ver `docs/decisiones-ux.md`).

## Mock de desarrollo

El flag `VITE_USE_MOCKS=true` sirve para desarrollar sin backend: responde el
mock en memoria de `src/services/mocks/reprogramacion.js` (perfil con límite
editable y reprogramación con conflicto determinista). En producción el flag
queda sin definir y el frontend habla con los endpoints reales
(`GET/PUT /api/users/capacity`, `PATCH /api/subtareas/{id}/reprogramar`).

## Verificación end-to-end

1. `VITE_USE_MOCKS=false` y backend arriba.
2. Cambiar el límite en Configuración; recargar y comprobar que persiste
   (`GET /api/users/capacity` o `GET /api/users/profile`).
3. Reprogramar dentro del límite: la subtarea cambia de fecha y horas (`200`).
4. Reprogramar por encima del límite: aparece el conflicto (`409`) y la
   subtarea **no** se modifica; aprovechar la prueba para confirmar los campos
   del body del `409` y fijarlos en este documento.
5. Reducir horas y comprobar `subtarea.horasEstimadas`.
