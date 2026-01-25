import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    hmr: false, // Disable HMR to prevent WebSocket connection issues
    ws: false, // Disable WebSocket to prevent connection errors
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Enable Vite client for better development experience
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor_recharts';
            if (id.includes('lucide-react')) return 'vendor_icons';
            return 'vendor';
          }
        }
      }
    },
    // Optimize for development
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: true, // Enable source maps for debugging
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
}));
