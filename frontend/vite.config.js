import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['rightbridge-x9o1.onrender.com'],
    host: true, // This makes the server accessible on the local network
    proxy: {
      '/api': {
        target: 'https://rightbridge.onrender.com',
        changeOrigin: true,
      },
    },
  },
});
