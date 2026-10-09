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

### Configurar el límite diario — **pendiente de backend**

```http
PATCH /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{ "limiteHorasDiarias": 8 }
```

Respuesta `200`: `UsuarioDTO` actualizado. Errores: `400` si está fuera de
`1..16`. **Hoy no existe**: mientras el backend no lo exponga, el frontend
trabaja contra el mock (ver abajo) y esta sección es la referencia del contrato
a implementar.

### Reprogramar una subtarea

```http
PATCH /api/subtareas/{id}/reprogramar
Authorization: Bearer <token>
Content-Type: application/json

{ "nuevaFecha": "2026-11-15", "nuevasHoras": 3 }
```

Respuesta `200` — **siempre `200`**, incluso con conflicto. El frontend ramifica
por el campo `conflicto`:

Sin conflicto:

```json
{
  "conflicto": false,
  "limiteDiario": 6,
  "horasTotalesCalculadas": 5,
  "subtarea": { "...": "SubtareaDTO actualizada" }
}
```

Con conflicto (la subtarea **no** se persiste):

```json
{
  "conflicto": true,
  "limiteDiario": 6,
  "horasTotalesCalculadas": 9,
  "mensaje": "La reprogramación supera el límite diario de horas asignado"
}
```

Notas del backend (`SubtareaService.reprogramar`):

- `horasTotalesCalculadas` = horas no ejecutadas ya asignadas a `nuevaFecha`
  (excluyendo la propia subtarea si no cambia de fecha) + `nuevasHoras`.
- Si envían `nuevaFecha` igual a la actual, las horas de la propia subtarea no
  se cuentan dos veces.
- Errores: `400` si `nuevaFecha`/`nuevasHoras` no son válidas o el límite es
  inválido; `404` si la subtarea no existe o es de otro usuario.

> **No se usa `409`.** El plan original proponía `409 DAILY_LIMIT_EXCEEDED` con
> `subtareasEnConflicto`; el backend ya resolvió el conflicto como `200` con
> `conflicto: true`. El frontend se adapta a esa forma.

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
| Conflicto de límite | respuesta `200` con `conflicto: true`                  | `ConflictoModal`                                        |

Las mutaciones **no** son optimistas: la UI cambia solo tras la respuesta
persistida del servidor (ver `docs/decisiones-ux.md`).

## Mock de desarrollo

Mientras el backend no exponga `PATCH /api/users/profile`, el frontend puede
trabajar sin backend con `VITE_USE_MOCKS=true`:

- `src/services/mocks/reprogramacion.js` — perfil con límite editable y
  reprogramación con conflicto determinista, en memoria.
- `src/services/reprogramacionService.js` — elige entre real y mock según la
  variable `VITE_USE_MOCKS`.

El flag es **solo para desarrollo**; en producción debe quedar sin definir
(se comporta como `false`) y hablar con los endpoints reales.

## Verificación end-to-end

1. `VITE_USE_MOCKS=false` y backend arriba.
2. Configurar el límite; recargar y comprobar que persiste (Supabase,
   `usuario.limite_horas_diarias`).
3. Reprogramar dentro del límite: la subtarea cambia de fecha y horas.
4. Reprogramar por encima del límite: aparece el conflicto y **no** cambia nada
   en Supabase.
5. Reducir horas y comprobar `subtarea.horas_estimadas`.
