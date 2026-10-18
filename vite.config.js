import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative asset paths for hosting on GitHub Pages (subpaths) or custom domains
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
