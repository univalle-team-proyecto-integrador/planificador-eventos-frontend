---
tipo: mejora
---

# El motivo de la posposición se ve

- **Fecha:** 2026-10-16
- **Área:** interfaz
- **Estado:** hecha

## Descripción

`esNotaObligatoria` obliga a escribir un motivo al posponer: *"sin un motivo,
'pospuesta' no le dice al resto del equipo por qué la gestión no avanza"*. Pero
ese texto **no se veía en ninguna parte**. La app te obligaba a escribir un
motivo y luego nunca te lo enseñaba, en ninguna pantalla, para ninguna gestión.

La causa no era de pintado: `normalizeSubtask` tiraba el campo. La
`SubtareaDTO` del backend sí devuelve `notaExplicativa` (`SubtareaDTO:36`), pero
el normalizador del cliente se quedaba con seis campos y la nota no era uno, así
que el dato se perdía antes de llegar a cualquier componente. No había ni un
sitio donde **poder** mirar la nota, y por eso no seضح en ninguno.

## Cambios

- `src/utils/taskMetrics.js` — `normalizeSubtask` conserva `note` (lee `note` o
  `notaExplicativa`). Nueva `notaLegible(task)`: colapsa espacios, recorta a 90
  caracteres con puntos suspensivos y entrecomilla.
- `src/components/ui/TaskCard.jsx` — acepta `note` y la pinta como línea en
  cursiva bajo la fecha, con la nota entera en el `title`.
- `src/views/HoyView.jsx` — `TaskSection` acepta `mostrarNota`, que **solo**
  activa el grupo de Pospuestas.
- `src/views/EventDetailView.jsx` — la muestra bajo "Fecha límite" cuando existe.
- Tests: siete de lógica pura y tres de render.

## Decisiones

- **Solo en Pospuestas, en `/hoy`.** Ahí la nota responde a una pregunta real:
  "¿por qué esto está aquí?". En "Para hoy" o "Próximas" el motivo de un cambio
  pasado es ruido. De ahí que `note` llegue como prop y no se lea del `task`
  dentro de `TaskCard`: si se leyera allí, saldría en cualquier tarjeta con nota.
- **En el detalle sí sale en cualquier estado.** El usuario ya abrió esa gestión
  a propósito, así que el contexto es la gestión entera y el porqué interesa
  igual. Solo hay una gestión en pantalla y ya se está leyendo.
- **Recortada a 90 caracteres con el texto entero en el `title`.** El backend no
  limita `notaExplicativa`, así que puede llegar un párrafo y descuadrar la fila.
  Quien necesite el texto completo lo tiene al pasar el ratón, y los lectores de
  pantalla leen el atributo aunque no se vea.
- **Lógica pura en `utils/`.** `notaLegible` no sabe nada de React ni de la
  pantalla: es una función de texto, y el repo prefiere eso en `src/utils/` con
  sus tests.

## Verificación

- `npm run lint` → 3 warnings, los tres preexistentes; `npm run test` → **19
  archivos, 229 pruebas**; `npm run build` ✅.
- La prueba que importa es la negativa: una gestión **pendiente** que trae nota
  no la muestra en `/hoy`. Fija que la prop, no el dato, decide.

## Pendiente

- **Casi ninguna gestión tiene nota todavía.** El motivo se empieza a escribir
  con US-09 (posponer desde `/hoy`), así que solo lo tienen las pospuestas
  creadas desde entonces; las anteriores vendrán con `null` y no se verá nada.
  No es un fallo del cambio, es que el dato es nuevo.
- **`/progreso` y el buscador siguen sin mostrar la nota.** `EventCard` es otro
  componente y el buscador normaliza por su cuenta. Ninguno de los dos lo
  necesita hoy, pero el dato ya viaja.