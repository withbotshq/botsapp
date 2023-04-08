import {defineConfig} from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  build: {
    commonjsOptions: {
      // For better-sqlite3
      ignoreDynamicRequires: true
    }
  }
})
