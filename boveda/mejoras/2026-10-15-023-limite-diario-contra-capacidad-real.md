---
tipo: mejora
---

# Límite diario editable contra la capacidad real del backend

- **Fecha:** 2026-10-15
- **Área:** interfaz / integración
- **Estado:** hecha

## Commits relacionados

- `998cfab` (2026-10-13) — feat: límite diario editable contra `PUT /api/users/capacity`.
- `c9ec302` — merge de la línea de trabajo.
- `a468fcd` (2026-10-14) — refactor: quita la vista previa del sistema de botones de
  Configuración.

## Descripción

`/configuracion` era un placeholder con la tarjeta «Próximamente». El backend ya exponía
`GET` y `PUT /api/users/capacity` desde la mejora 030 (2026-10-08), con su `CapacidadDTO` y
su rango de 1 a 16 horas, y **nadie lo consumía**: el `limite_horas_diarias` de la base de
datos existía desde el modelo de datos (mejora 005) sin ninguna forma de verlo ni de
cambiarlo.

La pantalla pasa a ser real, y para eso hace falta el contrato completo: `api.getCapacity`
para leer, `api.updateProfileLimit` para guardar, y el `ConflictoModal` para el 409 que
devuelve la vía de escritura del límite.

**El detalle que casi se cuela:** la primera versión del cliente llamaba a
`PATCH /api/users/profile`, una ruta que **el backend nunca ha tenido**. Como el único
camino real era el mock, guardar el límite solo funcionaba con `VITE_USE_MOCKS=true`. En
producción —donde esa variable no está definida— la pantalla mostraba «¡Listo! Límite diario
guardado.» y el valor no se guardaba. Un mensaje de éxito falso sobre una operación que no
ocurrió, que es peor que un error visible porque nadie va a mirar atrás.

## Cambios

- `src/services/api.js` — `updateProfileLimit` apunta a `PUT /api/users/capacity` con
  `{ limiteHorasDiarias }`; se añade `getCapacity(fecha)`.
- `src/services/reprogramacionService.js` — puerta única del perfil, con el mismo criterio de
  mock que el resto: `VITE_USE_MOCKS=true` responde en memoria, si no habla con el backend.
- `src/views/ConfiguracionView.jsx` — deja de ser placeholder: lee el límite, lo edita con
  validación de rango, `aria-invalid`, `aria-describedby`, `FieldSuccess` y `aria-busy` en el
  envío.
- `src/views/ConfiguracionView.jsx` — se retira la tarjeta de vista previa del sistema de
  botones: un catálogo de estilos en una pantalla de ajustes es ruido, y
  `examples/button-system.html` ya permite revisarlo aparte.
- `docs/contrato-reprogramacion.md` — documenta `PUT /api/users/capacity` con su respuesta y
  sus errores.
- `docs/decisiones-ux.md`, `docs/guia-microcopy.md` — textos y decisión de la pantalla.

## Decisiones

- **`PUT /api/users/capacity`, no `PATCH /api/profile`.** El nombre lo dice: no es el perfil,
  es la capacidad. Y `/profile` es de solo lectura: no acepta `PATCH`.
- **La lectura usa `GET /capacity`, que devuelve más que el perfil.** Trae la fecha evaluada,
  las horas comprometidas y las disponibles, así que la pantalla puede explicar la carga del
  día y no solo el tope.
- **El formulario no se condiciona a nada.** No hay bandera ni entorno que lo controle: la
  ruta existe, el cliente la usa. `VITE_USE_MOCKS` sigue siendo la única forma de trabajar
  sin backend.
- **El comentario en `api.js` documenta el error, no solo la ruta.** Se dejó explícito que
  `/profile` es de solo lectura, porque volver a confundirlas es lo que costó el `PATCH`
  inventado.

## Verificación

- `npm run test` → **148 pruebas** en verde; `npm run lint` → exit 0; `npm run build` ✅.
- Del lado del backend, `GET`/`PUT /api/users/capacity` ya venían cubiertos por
  `CapacidadApiTest` y `UsuarioServiceTest` con token JWT y los tres mensajes de rango.
- **Pendiente la comprobación manual en el despliegue:** guardar el límite desde Vercel y
  confirmar que persiste en `usuario.limite_horas_diarias` en Supabase.

## Pendiente

- Cierra el pendiente «Frontend» de la nota 030 del backend, registrado allí como
  actualización del 2026-10-15.
- Falta la verificación end-to-end, que es la prueba que habría destapado el `PATCH`
  inexistente antes de llegar a producción.
