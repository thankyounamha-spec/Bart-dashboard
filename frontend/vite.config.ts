import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 6001,
    proxy: {
      '/api': {
        target: 'http://localhost:6173',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:6173',
        ws: true,
      },
    },
  },
});
