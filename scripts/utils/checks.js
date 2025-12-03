const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { print, printError, icons } = require('./logger');

/**
 * Verifica se um comando existe no sistema
 * @param {string} command - Nome do comando a verificar
 * @returns {boolean} true se o comando existe, false caso contrário
 */
function commandExists(command) {
  try {
    if (process.platform === 'win32') {
      execSync(`where ${command}`, { stdio: 'ignore', timeout: 5000 });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore', timeout: 5000 });
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Tenta instalar Node.js automaticamente (apenas Linux/macOS)
 * @returns {Promise<boolean>} true se instalado com sucesso
 */
async function tryInstallNodeJS() {
  if (process.platform === 'win32') {
    return false; // Windows requer instalação manual
  }

  print(`${icons.info} Tentando instalar Node.js automaticamente...`, 'cyan');
  
  try {
    if (commandExists('apt-get')) {
      // Ubuntu/Debian
      print(`${icons.info} Detectado: apt-get (Ubuntu/Debian)`, 'cyan');
      print(`${icons.info} Instalando Node.js via NodeSource...`, 'cyan');
      try {
        execSync('curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -', { 
          stdio: 'inherit', 
          timeout: 60000 
        });
        execSync('sudo apt-get install -y nodejs', { stdio: 'inherit', timeout: 120000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('brew')) {
      // macOS
      print(`${icons.info} Detectado: Homebrew (macOS)`, 'cyan');
      print(`${icons.info} Instalando Node.js via Homebrew...`, 'cyan');
      try {
        execSync('brew install node@20', { stdio: 'inherit', timeout: 300000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('yum')) {
      // CentOS/RHEL
      print(`${icons.info} Detectado: yum (CentOS/RHEL)`, 'cyan');
      print(`${icons.info} Instalando Node.js...`, 'cyan');
      try {
        execSync('curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -', { 
          stdio: 'inherit', 
          timeout: 60000 
        });
        execSync('sudo yum install -y nodejs', { stdio: 'inherit', timeout: 120000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('dnf')) {
      // Fedora
      print(`${icons.info} Detectado: dnf (Fedora)`, 'cyan');
      print(`${icons.info} Instalando Node.js...`, 'cyan');
      try {
        execSync('sudo dnf install -y nodejs npm', { stdio: 'inherit', timeout: 120000 });
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica versão do Node.js e tenta instalar se necessário
 * @returns {Promise<boolean>} true se Node.js está OK
 */
async function checkNodeVersion() {
  try {
    const version = execSync('node -v', { encoding: 'utf-8', timeout: 5000 }).trim();
    const versionMatch = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
    
    if (!versionMatch) {
      throw new Error('Não foi possível determinar a versão do Node.js');
    }

    const major = parseInt(versionMatch[1]);
    const minor = parseInt(versionMatch[2]);
    
    if (major < 18 || (major === 18 && minor < 0)) {
      print(`${icons.warn} Node.js ${version} detectado. Requer Node.js 18.0.0 ou superior`, 'yellow');
      
      // Tentar instalar automaticamente
      const installed = await tryInstallNodeJS();
      if (installed) {
        // Verificar novamente
        const newVersion = execSync('node -v', { encoding: 'utf-8', timeout: 5000 }).trim();
        print(`${icons.check} Node.js ${newVersion} instalado com sucesso`, 'green');
        return true;
      }
      
      printError(
        `Node.js versão ${version} detectada. Requer Node.js 18.0.0 ou superior`,
        null,
        [
          'Baixe Node.js LTS: https://nodejs.org/',
          'Ou use nvm: nvm install 20',
          'Windows: Baixe o instalador de https://nodejs.org/'
        ]
      );
      process.exit(1);
    }
    
    print(`${icons.check} Node.js ${version} detectado`, 'green');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.message.includes('não encontrado')) {
      print(`${icons.warn} Node.js não encontrado`, 'yellow');
      
      // Tentar instalar automaticamente
      const installed = await tryInstallNodeJS();
      if (installed) {
        // Verificar novamente
        try {
          const version = execSync('node -v', { encoding: 'utf-8', timeout: 5000 }).trim();
          print(`${icons.check} Node.js ${version} instalado com sucesso`, 'green');
          return true;
        } catch {
          // Continuar para erro
        }
      }
      
      printError(
        'Node.js não encontrado',
        error,
        [
          'Instale Node.js 18+ de: https://nodejs.org/',
          'Ou use nvm: nvm install 20',
          'Windows: Execute o instalador baixado de https://nodejs.org/'
        ]
      );
    } else {
      printError('Erro ao verificar versão do Node.js', error);
    }
    process.exit(1);
  }
}

/**
 * Tenta instalar Docker automaticamente (apenas Linux)
 * @returns {Promise<boolean>} true se instalado com sucesso
 */
async function tryInstallDocker() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return false; // Windows/macOS requer Docker Desktop manual
  }

  print(`${icons.info} Tentando instalar Docker automaticamente...`, 'cyan');
  
  try {
    if (commandExists('apt-get')) {
      // Ubuntu/Debian
      print(`${icons.info} Instalando Docker via script oficial...`, 'cyan');
      try {
        execSync('curl -fsSL https://get.docker.com -o get-docker.sh', { 
          stdio: 'inherit', 
          timeout: 30000 
        });
        execSync('sudo sh get-docker.sh', { stdio: 'inherit', timeout: 300000 });
        execSync('sudo usermod -aG docker $USER', { stdio: 'inherit', timeout: 5000 });
        print(`${icons.check} Docker instalado. Você precisa fazer logout/login para usar Docker sem sudo`, 'green');
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('yum')) {
      // CentOS/RHEL
      print(`${icons.info} Instalando Docker...`, 'cyan');
      try {
        execSync('sudo yum install -y docker', { stdio: 'inherit', timeout: 120000 });
        execSync('sudo systemctl start docker', { stdio: 'inherit', timeout: 10000 });
        execSync('sudo systemctl enable docker', { stdio: 'inherit', timeout: 5000 });
        execSync('sudo usermod -aG docker $USER', { stdio: 'inherit', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    } else if (commandExists('dnf')) {
      // Fedora
      print(`${icons.info} Instalando Docker...`, 'cyan');
      try {
        execSync('sudo dnf install -y docker', { stdio: 'inherit', timeout: 120000 });
        execSync('sudo systemctl start docker', { stdio: 'inherit', timeout: 10000 });
        execSync('sudo systemctl enable docker', { stdio: 'inherit', timeout: 5000 });
        execSync('sudo usermod -aG docker $USER', { stdio: 'inherit', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica Docker e tenta instalar/iniciar se necessário
 * @returns {Promise<boolean>} true se Docker está OK
 */
async function checkDocker() {
  if (!commandExists('docker')) {
    print(`${icons.warn} Docker não encontrado`, 'yellow');
    
    // Tentar instalar automaticamente (apenas Linux)
    const installed = await tryInstallDocker();
    if (installed) {
      // Verificar novamente
      if (commandExists('docker')) {
        try {
          execSync('docker info', { stdio: 'ignore', timeout: 10000 });
          print(`${icons.check} Docker instalado e rodando`, 'green');
          return true;
        } catch {
          print(`${icons.warn} Docker instalado mas precisa ser iniciado`, 'yellow');
          print(`${icons.info} Execute: sudo systemctl start docker (Linux)`, 'cyan');
        }
      }
    }
    
    printError(
      'Docker não encontrado',
      null,
      [
        'Windows/macOS: Instale Docker Desktop: https://www.docker.com/products/docker-desktop',
        'Linux: Execute: curl -fsSL https://get.docker.com | sh',
        'Certifique-se de que o Docker está no PATH'
      ]
    );
    process.exit(1);
  }

  try {
    execSync('docker info', { stdio: 'ignore', timeout: 10000 });
    print(`${icons.check} Docker está instalado e rodando`, 'green');
    
    // Verificar versão do Docker
    try {
      const version = execSync('docker --version', { encoding: 'utf-8', timeout: 5000 }).trim();
      print(`   ${version}`, 'dim');
    } catch {
      // Ignorar erro de versão
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('Cannot connect') || error.message.includes('connection refused')) {
      // Tentar iniciar Docker (Linux)
      if (process.platform !== 'win32' && process.platform !== 'darwin') {
        print(`${icons.info} Tentando iniciar Docker...`, 'cyan');
        try {
          execSync('sudo systemctl start docker', { stdio: 'ignore', timeout: 10000 });
          // Verificar novamente
          execSync('docker info', { stdio: 'ignore', timeout: 10000 });
          print(`${icons.check} Docker iniciado com sucesso`, 'green');
          return true;
        } catch {
          // Continuar para erro
        }
      }
      
      printError(
        'Docker está instalado mas não está rodando',
        error,
        [
          'Windows/macOS: Inicie o Docker Desktop',
          'Linux: Execute: sudo systemctl start docker',
          'Aguarde até que o Docker esteja completamente iniciado',
          'Verifique com: docker info'
        ]
      );
    } else {
      printError('Erro ao verificar Docker', error, [
        'Certifique-se de que o Docker Desktop está rodando',
        'Verifique permissões: sudo usermod -aG docker $USER (Linux)'
      ]);
    }
    process.exit(1);
  }
}

/**
 * Verifica permissões de escrita no diretório atual
 * @returns {boolean} true se tem permissão de escrita
 */
function checkWritePermissions() {
  try {
    const testFile = path.join(process.cwd(), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    printError(
      'Sem permissão de escrita no diretório atual',
      error,
      [
        'Verifique as permissões do diretório',
        'Execute: chmod 755 . (Linux/macOS)',
        'Ou execute como administrador (Windows)'
      ]
    );
    process.exit(1);
  }
}

/**
 * Verifica se a estrutura do projeto está correta
 */
function checkProjectStructure() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    printError(
      'package.json não encontrado',
      null,
      [
        'Certifique-se de estar no diretório raiz do projeto',
        'Execute: cd /caminho/para/openpanel'
      ]
    );
    process.exit(1);
  }
}

/**
 * Verifica se npm está instalado
 * @returns {Promise<boolean>} true se npm está OK
 */
function checkNPM() {
  if (!commandExists('npm')) {
    print(`${icons.warn} npm não encontrado`, 'yellow');
    print(`${icons.info} npm geralmente vem com Node.js`, 'cyan');
    print(`${icons.info} Tentando verificar novamente após instalação do Node.js...`, 'cyan');
    
    // Aguardar um pouco e verificar novamente
    return new Promise((resolve) => {
      setTimeout(() => {
        if (commandExists('npm')) {
          print(`${icons.check} npm encontrado`, 'green');
          resolve(true);
        } else {
          printError(
            'npm não encontrado',
            null,
            [
              'npm vem junto com Node.js',
              'Reinstale Node.js de: https://nodejs.org/',
              'Certifique-se de marcar "npm" durante a instalação'
            ]
          );
          resolve(false);
        }
      }, 2000);
    });
  }
  
  // Verificar versão do npm
  try {
    const version = execSync('npm -v', { encoding: 'utf-8', timeout: 5000 }).trim();
    print(`${icons.check} npm ${version} detectado`, 'green');
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(true); // Continuar mesmo se não conseguir verificar versão
  }
}

/**
 * Instala dependências npm
 * @returns {Promise<void>}
 */
async function installDependencies() {
  print(`${icons.info} Instalando dependências npm...`, 'cyan');
  
  // Verificar npm primeiro
  const npmOk = await checkNPM();
  if (!npmOk) {
    process.exit(1);
  }
  
  try {
    // Verificar se node_modules existe (instalação parcial)
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      print(`${icons.info} node_modules encontrado, verificando dependências...`, 'cyan');
    }

    // Verificar se package.json existe
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      printError(
        'package.json não encontrado',
        null,
        [
          'Certifique-se de estar no diretório raiz do projeto',
          'Execute: cd /caminho/para/openpanel'
        ]
      );
      process.exit(1);
    }

    print(`${icons.info} Isso pode levar alguns minutos na primeira vez...`, 'cyan');
    execSync('npm install', { 
      stdio: 'inherit',
      timeout: 600000, // 10 minutos para primeira instalação
      env: { ...process.env, NODE_ENV: 'development' }
    });
    print(`${icons.check} Dependências instaladas`, 'green');
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      printError(
        'Timeout ao instalar dependências',
        error,
        [
          'Verifique sua conexão com a internet',
          'Tente novamente: npm install',
          'Ou use um mirror: npm install --registry https://registry.npmjs.org/',
          'Aumente timeout: npm install --timeout=600000'
        ]
      );
    } else if (error.code === 'ENOENT') {
      printError(
        'npm não encontrado',
        error,
        [
          'Certifique-se de que npm está instalado',
          'npm vem junto com Node.js',
          'Reinstale Node.js se necessário'
        ]
      );
    } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
      printError(
        'Erro de permissão ao instalar dependências',
        error,
        [
          'Linux/macOS: Use sudo npm install (não recomendado)',
          'Melhor: Corrija permissões: sudo chown -R $USER:$(id -gn $USER) ~/.npm',
          'Ou use um gerenciador de versões: nvm ou n'
        ]
      );
    } else {
      printError('Erro ao instalar dependências', error, [
        'Tente manualmente: npm install',
        'Verifique se há erros de permissão',
        'Limpe cache: npm cache clean --force',
        'Verifique logs acima para mais detalhes'
      ]);
    }
    process.exit(1);
  }
}

module.exports = {
  commandExists,
  checkNodeVersion,
  tryInstallNodeJS,
  checkDocker,
  tryInstallDocker,
  checkWritePermissions,
  checkProjectStructure,
  checkNPM,
  installDependencies,
};

