/// <reference types="node" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Load .env files from project root (not from apps/web/)
  envDir: path.resolve(__dirname, '../..'),
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Permitir acesso via Traefik com domínios locais
    allowedHosts: [
      'dev.openpanel.local',
      'pre.openpanel.local',
      'openpanel.local',
      'localhost',
      '.local', // Permite qualquer domínio .local
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001', // Usar localhost em dev local, container em Docker
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Não reescrever o path
      },
    },
  },
  plugins: [
    react(),
    // Análise de bundle apenas quando MODE=analyze
    ...(process.env.MODE === 'analyze' ? [
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ] : []),
  ] as any[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  build: {
    // Otimizações de build
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // Code splitting automático
    rollupOptions: {
      output: {
        // Estratégia de chunking para melhor cache
        manualChunks: (id) => {
          // Separar node_modules em chunks menores
          if (id.includes('node_modules')) {
            // Vendor chunks separados por biblioteca grande
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@xterm')) {
              return 'vendor-terminal';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-ai';
            }
            // Outras dependências
            return 'vendor';
          }
          // Separar componentes pesados em chunks próprios
          if (id.includes('/components/WebTerminal')) {
            return 'terminal';
          }
          if (id.includes('/components/DatabaseConsole') || id.includes('/components/PostgresConsole') || id.includes('/components/MysqlConsole') || id.includes('/components/MongoConsole') || id.includes('/components/RedisConsole')) {
            return 'database-consoles';
          }
          if (id.includes('/components/TemplateMarketplace')) {
            return 'marketplace';
          }
        },
        // Nomes de arquivos mais legíveis
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Limite de aviso de tamanho de chunk (500KB)
    chunkSizeWarningLimit: 500,
    // Otimizações adicionais
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
});
