import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: [
      { find: "@", replacement: "/src" },
      { find: "@/lib", replacement: "/src/lib" },
      { find: "@/components", replacement: "/src/components" },
      { find: "@/hooks", replacement: "/src/hooks" },
      { find: "@/types", replacement: "/src/types" },
      { find: "@/pages", replacement: "/src/pages" },
    ],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
