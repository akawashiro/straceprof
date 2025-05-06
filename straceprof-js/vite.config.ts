import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration for straceprof
export default defineConfig({
  plugins: [react()],
  base: './', // Base path for GitHub Pages deployment
});
