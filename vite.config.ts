import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ['react', 'react-dom'],

          // Firebase services
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],

          // Chart.js and related
          charts: ['chart.js', 'react-chartjs-2'],

          // Router
          router: ['react-router-dom'],

          // UI libraries
          ui: ['react-hot-toast'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,

    // Target modern browsers for smaller bundles
    target: ['es2020', 'chrome60', 'firefox60', 'safari11'],
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react-hot-toast',
    ],
  },
});
