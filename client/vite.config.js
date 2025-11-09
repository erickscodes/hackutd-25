import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173, // or whatever you use for the frontend
    proxy: {
      // Proxy websocket + HTTP requests to backend
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
