import { useEffect } from 'react';

/**
 * Detecta un clic o toque por fuera de `ref`.
 *
 * Se usa en el menú de perfil y en el desplegable de resultados. Escucha
 * `pointerdown` y no `click` para cerrar antes de que el clic llegue al
 * elemento de destino, que es lo que evita que se abra y cierre a la vez.
 *
 * @param {import('react').RefObject<HTMLElement>} ref elemento que delimita la zona
 * @param {() => void} onOutside se llama cuando el gesto ocurre por fuera
 * @param {boolean} isEnabled evita escuchar cuando el panel está cerrado
 */
export function useClickOutside(ref, onOutside, isEnabled = true) {
  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const node = ref.current;

      if (!node || node.contains(event.target)) {
        return;
      }

      onOutside();
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () =>
      document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, onOutside, isEnabled]);
}