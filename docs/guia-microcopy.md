---
tipo: guia-microcopy
---

# Guía de microcopy

## Voz de producto

- Escribir en español claro y directo.
- Usar frases breves y orientadas a la acción.
- Nombrar el objeto de la acción: evento, gestión, fecha límite, horas.
- Evitar lenguaje técnico innecesario como “endpoint”, “payload” o “response”.
- Mostrar el error sin culpar a la persona usuaria.

## Regla para validaciones

Cada mensaje de campo debe seguir esta estructura:

```text
Qué ocurrió + cómo corregirlo.
```

### Ejemplos aprobados

- “Dejaste el nombre vacío. Ingresa un título para identificar el evento.”
- “Faltan las horas estimadas. Ingresa un valor mayor a 0.”
- “Ingresaste 0 o menos. Asigna al menos 1 hora de esfuerzo.”
- “Ingresaste una fracción de hora. Ingresa un número entero de horas.”
- “La fecha del evento ya pasó. Selecciona hoy o una fecha futura.”
- “La fecha objetivo ya pasó. Selecciona hoy o una fecha futura.”
- “No pudimos conectar con el servidor. Revisa tu red e inténtalo de nuevo.”

## Felicitaciones por campo válido

Cuando un campo ya es válido (tras tocarlo y sin errores) se muestra un mensaje breve de éxito, antecedido por un check. La felicitación es corta y confirma en qué campo se logró el acierto; el error nunca convive con la felicitación del mismo campo.

### Mensajes de éxito por campo

| Campo                  | Mensaje                            |
| ---------------------- | ---------------------------------- |
| Nombre del evento      | “¡Listo! Nombre válido.”           |
| Tipo de evento         | “Bien, tipo seleccionado.”         |
| Cliente                | “¡Listo! Cliente registrado.”      |
| Fecha del evento       | “Bien, fecha válida.”              |
| Lugar                  | “¡Listo! Lugar correcto.”          |
| Gestión                | “¡Listo! Nombre de la gestión válido.” |
| Horas estimadas        | “Bien, horas válidas.”             |
| Fecha objetivo         | “¡Listo! Fecha límite válida.”     |

## Estados vacíos

El estado vacío debe responder tres preguntas:

1. Qué significa que no haya información.
2. Por qué aparecerá cuando haya datos.
3. Qué acción puede realizar la persona ahora.

Ejemplo: “¿Aún no hay gestiones logísticas? Divide el evento en tareas pequeñas, asigna horas y define una fecha límite para cada gestión.”

## Acciones

- Usar verbos específicos: “Crear evento”, “Añadir gestión”, “Guardar cambios”.
- Usar “Reintentar” cuando la acción repite la misma operación.
- Usar “Eliminar” solo en acciones destructivas.
- Mantener el texto del botón corto; el contexto de la tarjeta explica la consecuencia.

## Microcopy de la aplicación

| Contexto              | Texto                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Crear evento          | “Crear nuevo evento”                                                           |
| Volver desde detalle  | “Volver a eventos”                                                            |
| Abrir evento         | “Ver evento”                                                                   |
| Guardar formulario    | “Guardar evento”                                                               |
| Crear primera gestión | “Añadir gestión”                                                               |
| Tareas atrasadas      | “Vencida hace 2 días”                                                         |
| Tarea próxima         | “Mañana”                                                                      |
| Cargar                | “Cargando información...”                                                     |
| Cargar panel de hoy   | “Cargando el panel de hoy...”                                                |
| Error de red          | “No pudimos conectar con el servidor. Revisa tu red e inténtalo de nuevo.”     |
| Eliminar gestión      | “¿Seguro que quieres eliminar esta gestión? Esta acción no se puede deshacer.” |
| Eliminar evento       | “Esta acción borrará el evento y su logística asociada. No se puede deshacer.” |
