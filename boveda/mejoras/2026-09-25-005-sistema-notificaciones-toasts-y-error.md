---
tipo: mejora
---

# Sistema de notificaciones: toasts de éxito y modal de error cognitivo

- **Fecha:** 2026-09-25
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Descripción

Se reemplazó el feedback de las acciones por un sistema de notificaciones dividido por naturaleza del resultado:

- **Éxito:** toast que entra deslizándose desde la derecha y se retira a los 3.5 s deslizándose de vuelta; el ícono varía según la acción (check, editar, papelera, reabrir) y admite cierre manual.
- **Error de acción:** modal cognitivamente amigable con paleta suave (ámbar, sin rojos intensos), iconografía simple, mensaje claro y no alarmante, y un único botón `Entendido`.

## Cambios

- `src/providers/notifications-context.js` (nuevo) — contexto y hook `useNotifications`.
- `src/providers/NotificationsProvider.jsx` (nuevo) — cola de toasts, modal único de error y montaje de los contenedores.
- `src/components/ui/Toast.jsx` (nuevo) — tarjeta de notificación con ícono por tipo de acción.
- `src/components/ui/ToastContainer.jsx` (nuevo) — contenedor fijo superior derecho con apilado.
- `src/components/ui/ErrorModal.jsx` (nuevo) — modal de error cognitivo con focus y `Escape`.
- `src/index.css` — keyframes `toast-in`, `toast-out`, `modal-in` y variantes con `prefers-reduced-motion`.
- `src/App.jsx` — se monta `NotificationsProvider` por encima de las rutas para que los toasts sobrevivan a la navegación.
- `src/views/CreateEventView.jsx` — toast de éxito al crear; los fallos de guardado usan `notifyError`; los avisos de pre-condición quedan como nota suave inline.
- `src/views/EventDetailView.jsx` — toasts por cada mutación exitosa (añadir, editar, completar, reabrir, eliminar, guardar evento); los `actionError` inline migran al modal; los errores de eliminación permanecen dentro del `ConfirmModal`.
- `DESIGN_SYSTEM.md` — secciones 5.6 (toast) y 5.7 (modal de error).

## Decisiones

- Montar el provider en `App.jsx` (fuera del enrutador) para que el toast persista al navegar tras crear un evento.
- Los errores de **carga inicial** siguen usando `ErrorState` con reintento; el modal se reserva para **errores de acciones** para no bloquear la pantalla en el primer render.
- El error de eliminación se conserva dentro del `ConfirmModal` por contexto destructivo; el resto de errores usan el modal cognitivo.
- Iconos SVG inline (sin dependencias nuevas) y paletas reservadas del design system (`success-50/600`, `warning-50/600`, `primary-50/600`).

## Verificación

- `npm run lint` → 0 warnings y 0 errors.
- `npm run build` → BUILD SUCCESS (Vite 8).