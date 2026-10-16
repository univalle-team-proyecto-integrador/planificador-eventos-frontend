---
tipo: mejora
---

# La información y la ayuda salen de la vista al menú de perfil

- **Fecha:** 2026-10-15
- **Área:** interfaz / UX / accesibilidad
- **Estado:** hecha

## Commits relacionados

- `136df0e` (2026-10-14) — la información y ayuda se mueve al menú de perfil.

Commit del 14 de octubre que llegó a `main` sin registro.

## Descripción

`InfoTip` era un botón de información con un `ⓘ` que colgaba de la barra superior, en el
sitio de la vista, y explicaba el papel de la cuenta. Un `ⓘ` suelto en la topbar junto al
CTA «Crear evento» competía por la atención sin aportar nada a la tarea que se está
haciendo.

Se integra al **menú de perfil**, junto al nombre del usuario: es información de la cuenta y
allí es donde se consulta cuando hace falta. La topbar queda con lo que hace falta para
trabajar —buscador, crear evento y cuenta— y el `ⓘ` desaparece de ella.

## Cambios

- `src/components/layout/InfoTip.jsx` — el componente se retira del layout; su contenido pasa
  al menú.
- `src/components/layout/ProfileMenu.jsx` — incorpora la información de la cuenta y la ayuda.
- `src/components/layout/Topbar.jsx` — deja de renderizar el `InfoTip`.
- `src/components/layout/shell.test.jsx` — cobertura del menú con la ayuda dentro.

## Decisiones

- **Al menú de perfil, no a la sidebar.** La sidebar es navegación entre vistas; la ayuda de
  la cuenta no es una sección. El menú es el único sitio donde lo que no es una tarea puede
  estar sin competir con la tarea.
- **Se conserva el componente.** `InfoTip` sigue siendo un componente con su `aria-expanded`,
  su `aria-describedby` y su cierre por `Escape`; lo que cambió fue dónde vive. Perder el
  comportamiento accesible al moverlo habría sido un retroceso.

## Verificación

- `npm run test` → 148 pruebas en verde, con la cobertura del menú en `shell.test.jsx`.
- `npm run lint` → exit 0; `npm run build` ✅.

## Pendiente

- El contenido del aviso no está revisado en el despliegue: al pasar a un elemento de menú
  con menos espacio, conviene confirmar que el texto no se corta.
