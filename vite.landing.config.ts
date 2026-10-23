import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

/**
 * Build independiente de la landing pública.
 *
 * No incluye el panel de administración, el router ni el store: genera solo
 * `dist-landing`, que se publica aparte (igual que el sitio de CheckApp).
 * El entry vive en `landing/`, así el `index.html` de la app no cambia.
 */
export default defineConfig({
  root: path.resolve(__dirname, "landing"),
  publicDir: path.resolve(__dirname, "landing/public"),
  base: "./",
  plugins: [react()],
  server: {
    port: 5007,
    strictPort: true,
  },
  preview: {
    port: 5007,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist-landing"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@entities": path.resolve(__dirname, "./src/entities"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@widgets": path.resolve(__dirname, "./src/widgets"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
});
