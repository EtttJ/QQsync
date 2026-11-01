import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5177,
    proxy: {
      "/api": "http://localhost:8877",
      "/uploads": "http://localhost:8877",
      "/ws": { target: "ws://localhost:8877", ws: true }
    }
  }
});
