// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const icons = {
  check: '✓',
  cross: '✗',
  warn: '⚠',
  info: 'ℹ',
  rocket: '🚀',
};

/**
 * Imprime mensagem com cor
 * @param {string} message - Mensagem a imprimir
 * @param {string} color - Cor da mensagem (padrão: 'white')
 */
function print(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Imprime erro detalhado com sugestões
 * @param {string} message - Mensagem de erro
 * @param {Error|null} error - Objeto de erro (opcional)
 * @param {string[]} suggestions - Array de sugestões (opcional)
 */
function printError(message, error = null, suggestions = []) {
  print(`\n${icons.cross} ${message}`, 'red');
  if (error) {
    print(`   Detalhes: ${error.message}`, 'dim');
    if (process.env.DEBUG && error.stack) {
      print(`   Stack: ${error.stack}`, 'dim');
    }
  }
  if (suggestions.length > 0) {
    print(`\n   Sugestões:`, 'yellow');
    suggestions.forEach(suggestion => {
      print(`   • ${suggestion}`, 'cyan');
    });
  }
  console.log();
}

/**
 * Imprime o cabeçalho do OpenPanel no terminal
 */
function printHeader() {
  try {
    console.clear();
  } catch {
    // Ignorar erro se clear não estiver disponível
  }
  print('╔═══════════════════════════════════════════════════════════════╗', 'blue');
  print('║                                                               ║', 'blue');
  print('║   ██████╗ ██████╗ ███████╗███╗   ██╗██████╗  █████╗ ███╗   ██╗║', 'blue');
  print('║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔══██╗████╗  ██║║', 'blue');
  print('║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██████╔╝███████║██╔██╗ ██║║', 'blue');
  print('║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔═══╝ ██╔══██║██║╚██╗██║║', 'blue');
  print('║  ╚██████╔╝██║     ███████╗██║ ╚████║██║     ██║  ██║██║ ╚████║║', 'blue');
  print('║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝║', 'blue');
  print('║                                                               ║', 'blue');
  print('║            Inicialização Automática Simplificada              ║', 'blue');
  print('║                                                               ║', 'blue');
  print('╚═══════════════════════════════════════════════════════════════╝', 'blue');
  console.log();
}

module.exports = {
  print,
  printError,
  printHeader,
  colors,
  icons,
};

