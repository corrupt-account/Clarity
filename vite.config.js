import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // للسماح بالاتصال من خارج الجهاز
    allowedHosts: true, // للسماح لروابط localtunnel بالعمل (الحل للمشكلة الجديدة)
  }
})