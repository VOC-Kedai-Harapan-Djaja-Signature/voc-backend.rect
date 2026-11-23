import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Salin index.html ke dist/dashboard/index.html setelah build, supaya alamat
// /dashboard tetap bisa dibuka walaupun hosting tidak membaca aturan rewrite
// di vercel.json (misalnya yang di-upload hanya folder dist).
function salinHalamanDashboard() {
  return {
    name: 'salin-halaman-dashboard',
    apply: 'build',
    closeBundle() {
      const dist = resolve('dist');
      mkdirSync(resolve(dist, 'dashboard'), { recursive: true });
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, 'dashboard', 'index.html'));
    },
  };
}

export default defineConfig({
  plugins: [react(), salinHalamanDashboard()],
  server: {
    port: 5173,
  },
});