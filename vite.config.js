import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    // US-11: la sesión vive en localStorage, así que los tests necesitan un
    // DOM real. Antes corría en node y `window` no existía.
    environment: 'jsdom',
  },
})