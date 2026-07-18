import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const copyIndexTo404: Plugin = {
  name: 'copy-index-to-404',
  apply: 'build',
  closeBundle() {
    const src = path.resolve(__dirname, 'dist/index.html');
    const dest = path.resolve(__dirname, 'dist/404.html');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  },
};

export default defineConfig(() => ({
  server: {
    port: 3000,
    host: '127.0.0.1',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.2.58',
      'little-bags-travel.loca.lt',
    ],
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: ['console', 'debugger'] as ('console' | 'debugger')[],
  },
  plugins: [react(), copyIndexTo404],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
