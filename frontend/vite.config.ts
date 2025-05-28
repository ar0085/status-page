import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    // Ensure proper module resolution in production
    preserveSymlinks: false,
  },
  build: {
    sourcemap: false,
    // More lenient module resolution for Render
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
  },
  esbuild: {
    // Enable TypeScript resolution
    target: "es2020",
  },
});
