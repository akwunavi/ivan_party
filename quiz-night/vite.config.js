import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // относительные пути — работает на GitHub Pages в любой подпапке
  server: { port: 3000 }
})
