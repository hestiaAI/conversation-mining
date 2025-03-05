import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/conversation-mining/', // Remplacez par le nom de votre dépôt
  server: {
    port: 8000
  }
})