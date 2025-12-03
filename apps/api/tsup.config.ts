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
  noExternal: [], // Manter dependências externas (Node.js)
})
