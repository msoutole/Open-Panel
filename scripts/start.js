#!/usr/bin/env node

/**
 * Wrapper leve para usar o orquestrador unificado (start.js na raiz).
 * Mantém compatibilidade com automações que chamam scripts/start.js diretamente.
 */

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const entrypoint = path.join(projectRoot, 'start.js');

const child = spawn(process.execPath, [entrypoint, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: { ...process.env },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

child.on('error', (error) => {
  console.error('Erro ao executar start.js:', error);
  process.exit(1);
});