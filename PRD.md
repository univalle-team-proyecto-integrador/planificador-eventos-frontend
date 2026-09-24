# PRD — Planificador de Eventos

**Versión:** 1.0 · **Fecha:** 2026-09-24 · **Estado:** MVP implementado localmente · **Ámbito:** frontend + integración con backend

## 1. Visión y objetivos

### Problema central

Los organizadores independientes de eventos necesitan coordinar muchas tareas logísticas —reservas, compras, transporte y preparación— sin depender de planillas dispersas. El producto centraliza esa información, permite dividir cada evento en un plan inicial y muestra qué gestión falta o ya está completada.

### Propósito del producto

Ofrecer una SPA de escritorio, clara y accesible, para crear eventos, organizar sus subtareas y consultar el avance logístico desde un mismo lugar.

### Objetivos del MVP

- Permitir registrar eventos con sus datos esenciales.
- Crear un plan logístico inicial mediante subtareas.
- Visualizar el avance del evento mediante estados y porcentaje.
- Evitar pérdidas de contexto con estados vacío, error y carga.
- Proporcionar validaciones que indiquen qué ocurrió y cómo corregirlo.
- Conectar el frontend con una API REST de eventos y subtareas.
- Dejar preparada la aplicación para Vercel y el backend para Render.
- Aplicar una base de accesibilidad para teclado, foco, labels y lectores de pantalla.

### Indicadores de éxito iniciales

- Una persona puede crear un evento válido sin asistencia técnica.
- Puede dividirlo en subtareas y cambiar su estado.
- Puede identificar el avance sin recargar la página.
- Las acciones destructivas siempre requieren confirmación.
- Los errores de validación y de red son comprensibles y accionables.

## 2. Alcance

### Incluido en esta fase

- Sistema de diseño con Tailwind CSS 4.
- Botón multivariante: `primary`, `neutral` y `danger`.
- Layout persistente con Header, navegación y `Outlet`.
- Rutas `/hoy`, `/crear`, `/evento/:id`, `/progreso` y `/login`.
- Estados de carga, vacío y error.
- Formulario de creación y edición de evento.
- Validación de nombre, tipo, cliente, fecha y lugar.
- Detalle de evento con lectura y edición.
- Subtareas con nombre, horas estimadas, fecha límite y estado.
- Progreso logístico calculado sobre subtareas completadas.
- Completar/reabrir subtareas.
- Eliminación de subtareas mediante modal con focus trap.
- Cliente HTTP centralizado con `VITE_API_URL` y `VITE_USER_ID`.
- API REST de eventos y subtareas en el backend.
- Manejo global de errores 400/404 en backend.
- Documentación de UX, microcopy, accesibilidad y arquitectura.
- Configuración de fallback SPA para Vercel.

### Fuera de alcance

- Autenticación JWT definitiva y gestión de sesiones.
- Recuperación de contraseña y roles/permisos.
- Notificaciones push, correo o recordatorios automáticos.
- Calendario completo y vista de línea de tiempo.
- Resolución automática de conflictos horarios.
- Reprogramación masiva de subtareas.
- Aplicación móvil nativa.
- Colaboración simultánea y auditoría multiusuario.
- Analítica avanzada y reportes PDF.
- Integraciones con proveedores externos.

## 3. Personas y necesidades

### Organizador independiente

Necesita crear eventos, dividir el trabajo en tareas concretas, limitar la cantidad de horas diarias y saber qué gestión está pendiente.

### Persona responsable de la coordinación

Necesita consultar el avance de un evento, detectar tareas atrasadas y verificar que el plan sea comprensible para el equipo.

## 4. Historias de usuario

| ID    | Historia                                                                                          | Prioridad | Story Points | Estado local               |
| ----- | ------------------------------------------------------------------------------------------------- | --------- | -----------: | -------------------------- |
| US-01 | Como organizador, quiero crear un evento con sus datos esenciales para comenzar su planificación. | Muy alta  |            5 | Completada                 |
| US-02 | Como organizador, quiero añadir subtareas con horas y fecha límite para dividir el trabajo.       | Muy alta  |            5 | Completada                 |
| US-03 | Como organizador, quiero consultar, editar y eliminar una gestión de forma segura.                | Media     |            5 | Completada                 |
| US-04 | Como organizador, quiero ver el progreso de un evento para saber cuánto está preparado.           | Alta      |            3 | Completada                 |
| US-11 | Como organizador, quiero acceder a mi cuenta para proteger mis eventos.                           | Media     |            5 | Pendiente de autenticación |

## 5. Criterios de aceptación

### US-01 — Crear evento

- El formulario contiene nombre, tipo, cliente, fecha y lugar.
- Todos los campos requeridos están asociados a un `label` y tienen `id`.
- Los mensajes explican qué ocurrió y cómo corregirlo.
- La fecha no puede ser anterior al día actual.
- El botón permanece deshabilitado mientras se guarda.
- Una respuesta exitosa redirige a `/evento/:id`.
- Un error de red muestra `ErrorState` y permite reintentar.
- El payload usa los nombres del DTO del backend.

### US-02 — Plan logístico

- El usuario puede añadir varias subtareas a un evento.
- Cada subtarea contiene nombre, horas, fecha límite y estado.
- Las horas deben ser mayores que cero.
- El estado inicial es `pendiente`.
- La lista distingue visualmente `pendiente`, `ejecutada` y `pospuesta`.
- El porcentaje se calcula sobre subtareas completadas.
- Una subtarea puede completarse y reabrirse.
- Las operaciones usan la API y no solo estado local.

### US-03 — Seguridad y edición

- Los datos del evento se muestran en modo lectura.
- El modo edición permite actualizar los campos permitidos.
- Eliminar una subtarea abre un modal de confirmación.
- El modal se cierra con `Escape` o Cancelar.
- El foco queda dentro del modal y se restaura al cerrarlo.
- La eliminación solo se confirma mediante una acción explícita.

### US-04 — Progreso

- La vista global consulta eventos y sus subtareas.
- Cada tarjeta muestra nombre, cliente, fecha, lugar y progreso.
- El estado vacío ofrece crear el primer evento.
- Un error de red ofrece reintentar.
- La barra de progreso expone valores accesibles.

### US-11 — Acceso

- `/login` existe y es una ruta válida.
- La autenticación real todavía no forma parte de este MVP.
- `VITE_USER_ID` solo se usa como configuración temporal de desarrollo.

## 6. Requisitos no funcionales

- Interfaz de escritorio adaptable a viewports estrechos.
- Textos, documentación y mensajes de error en español.
- Navegación completa por teclado.
- Focos visibles y estados semánticos ARIA.
- No exponer secretos en el bundle del frontend.
- El frontend debe usar exclusivamente el cliente API centralizado.
- El build de producción debe completar con Vite.
- El backend debe validar DTOs y devolver errores comprensibles.

## 7. Dependencias y supuestos

- El backend expone los endpoints documentados en `ARCHITECTURE.md`.
- `VITE_API_URL` apunta al backend correcto en cada entorno.
- `VITE_USER_ID` será reemplazado por autenticación.
- La base de datos y el esquema se administran según el flujo de Supabase del backend.
- La publicación de Render requiere configurar sus variables de entorno.

## 8. Definición de terminado

Una historia se considera terminada cuando:

1. Sus criterios de aceptación están implementados.
2. Los estados de carga, vacío y error funcionan.
3. La accesibilidad básica está revisada.
4. La integración usa el contrato de API documentado.
5. El frontend compila y pasa `npm run lint`.
6. El backend pasa sus pruebas cuando la historia modifica API o persistencia.
7. La documentación correspondiente está actualizada.
