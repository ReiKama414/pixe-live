import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site needs base "/pixe-live/"; Cloudflare / local keep "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
});
