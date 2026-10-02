// Foco atrapado dentro de un diálogo o un panel superpuesto.
//
// Se extrajo de ConfirmModal para que el drawer móvil de la barra lateral lo
// reutilice en lugar de duplicar el manejo de Tab, Escape y la restauración del
// foco. El contrato es: llama a `trapFocus(container, { onEscape, isEnabled })`
// cuando el panel se abre y devuelve la función de limpieza para el `useEffect`.

export const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const getFocusableElements = (container) =>
  Array.from(container?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []).filter(
    (element) => !element.hasAttribute('disabled')
  );

/**
 * Mueve el foco dentro de `container` y lo mantiene ahí.
 *
 * @param {HTMLElement|null} container elemento que atrapa el foco
 * @param {{onEscape?: () => void, initialFocus?: HTMLElement|null}} options
 * @returns {() => void} limpieza; devuelve el foco a donde estaba
 */
export const trapFocus = (container, { onEscape, initialFocus } = {}) => {
  if (!container) {
    return () => {};
  }

  const previouslyFocused = document.activeElement;
  const target = initialFocus ?? getFocusableElements(container)[0];

  (target ?? container).focus?.();

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape?.();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const elements = getFocusableElements(container);

    if (elements.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    previouslyFocused?.focus?.();
  };
};

/**
 * Cierra el scroll del fondo mientras el panel está abierto y lo restaura al
 * cerrar, sin tocar el valor que ya tuviera.
 */
export const lockBodyScroll = () => {
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  return () => {
    document.body.style.overflow = previousOverflow;
  };
};