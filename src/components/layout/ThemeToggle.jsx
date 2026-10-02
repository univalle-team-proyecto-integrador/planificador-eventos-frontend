import { useTheme } from '../../providers/theme-context';

/**
 * Interruptor de tema claro / oscuro.
 *
 * Va como `role="switch"` con `aria-checked`: es un control de dos estados, no
 * un par de botones, y así lo anuncian los lectores de pantalla. Al ser un
 * <button> nativo, Space y Enter funcionan sin código extra.
 */
export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={
        isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      }
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      onClick={toggleTheme}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface-raised p-1 pr-2 text-xs font-semibold text-secondary-text transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className={`relative block h-5 w-9 shrink-0 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-border-strong'}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] duration-150 ${isDark ? 'left-[1.125rem]' : 'left-0.5'}`}
        />
      </span>
      <span className="hidden sm:inline">{isDark ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}