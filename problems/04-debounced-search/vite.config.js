import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",                       // served from /preview/<id>/, not the web root
  build: { outDir: "dist", emptyOutDir: true },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/setupTests.js" },
});
