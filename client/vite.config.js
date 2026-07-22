import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies /api to the Express backend on :4000 so the browser
// only ever talks to same-origin /api routes (keys stay server-side).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:4000" },
  },
  build: {
    outDir: "dist",
    // Keep component/function names readable so runtime errors point to the
    // real component (e.g. "in CollegeCard") instead of a minified letter.
    minify: "esbuild",
  },
  esbuild: { keepNames: true },
});
