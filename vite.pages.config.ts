import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
const project = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: path.join(project, "github-pages"), envDir: project, publicDir: path.join(project, "public"),
  base: process.env.PAGES_BASE_PATH || "/",
  define: { "import.meta.env.VITE_GITHUB_PAGES": "true" },
  plugins: [tanstackRouter({ target: "react", routesDirectory: path.join(project, "src/routes"), generatedRouteTree: path.join(project, "src/routeTree.gen.ts"), autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: [{ find: "@/lib/hermes", replacement: path.join(project, "src/lib/hermes-browser.ts") }, { find: "@", replacement: path.join(project, "src") }] },
  build: { outDir: path.join(project, "dist-pages"), emptyOutDir: true },
});
