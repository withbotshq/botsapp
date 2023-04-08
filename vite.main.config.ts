import {defineConfig} from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  build: {
    commonjsOptions: {
      // For SQLite3
      ignoreDynamicRequires: true
    }
  }
})
