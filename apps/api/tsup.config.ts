import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: false, // Desabilitar sourcemap em produção para reduzir tamanho
  clean: true,
  minify: true, // Habilitar minificação em produção
  target: 'es2022',
  outDir: 'dist',
  // Otimizações adicionais
  treeshake: true, // Tree-shaking automático
  // Bundle shared workspace package so Node doesn't try to load raw TS files
  noExternal: ['@openpanel/shared'],
})
