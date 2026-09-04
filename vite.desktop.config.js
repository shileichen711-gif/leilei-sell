import { defineConfig } from "vite";

export default defineConfig({
  root: "desktop",
  base: "./",
  build: {
    outDir: "../desktop-app/renderer",
    emptyOutDir: true,
  },
});
