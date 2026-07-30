import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    eslint({ lintOnStart: true, include: ["src/**/*.{ts,tsx}"] }),
  ],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "build",
  },
  server: {
    port: 3000,
    proxy: {
      "/api/": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
