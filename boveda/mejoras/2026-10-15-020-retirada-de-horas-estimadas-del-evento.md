---
tipo: mejora
---

# Retirada de las horas estimadas del evento

- **Fecha:** 2026-10-15
- **Área:** interfaz / contrato
- **Estado:** hecha

## Commits relacionados

- `514e84b` (2026-10-08) — el evento declara sus horas estimadas al crearse.
- `41a1d50` (2026-10-14) — refactor: quita horas estimadas del evento para alinear con el
  backend.

Dos commits que se anulan, en la misma línea de trabajo y a una semana de distancia. Se
registran juntos porque el estado final es «no existe ese campo», y una nota que solo
documentara la primera mitad describiría algo que ya no está.

## Descripción

El 2026-10-08 el formulario de alta añadió un campo «Horas estimadas» al evento, con el
mismo tratamiento que las horas de una gestión: validación en `blur`, `FieldSuccess` y texto
de ayuda. El campo era **informativo**: no era un tope, no generaba 409 y no se comparaba con
nada. `normalizeEvent` lo exponía aparte, como `estimatedHours`, sin tocar `getTaskMetrics`,
para que el estimado y el total real no se confundieran en pantalla.

Seis días después se quitó, en el backend (`905acd1`, nota 035) y en el cliente (`41a1d50`).

**Por qué se quitó:** el dato no significaba nada accionable. Un estimado de 6 horas no
bloqueaba nada y nadie podía ajustarlo ni repartirlo, así que registrarlo solo generaba la
expectativa de que algo lo usara. El esfuerzo real se mide donde sí es accionable: las horas
de cada gestión, que participan del cálculo de carga por fecha y del límite diario.

**El detalle que costó el error:** el input era deliberadamente de texto con
`inputMode="numeric"` y no `type="number"`, porque en un input numérico se puede escribir
`e` o `1e`, el navegador lo entrega vacío y el usuario recibe un error de validación en vez
del mensaje de «no has escrito nada». Ese razonamiento no estaba en el código y se perdió
cuando el campo desapareció.

## Verificación

- `npm run test` → 148 pruebas en verde (98 al cerrar `514e84b`, 101 con sus tests nuevos).

## Pendiente

- Ninguna. El campo no existe en ninguna de las dos mitades del contrato.
