import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/client.tsx',
      formats: ['es'],
      fileName: () => 'client.js'
    },
    sourcemap: false,
    emptyOutDir: false
  }
})
