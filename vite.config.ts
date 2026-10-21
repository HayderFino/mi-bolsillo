import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { APP_NAME } from './src/types/index.ts'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      // Keeps APP_NAME as the single source of the app name, also in index.html.
      name: 'app-name-in-html',
      transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%APP_NAME%', APP_NAME) },
    },
  ],
  test: {
    // jsdom for component tests; services run on plain IndexedDB via fake-indexeddb.
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
})
