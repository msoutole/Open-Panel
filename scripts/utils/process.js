const { spawn } = require('child_process');
const http = require('http');
const { print, printError, icons, colors } = require('./logger');
const { retryUntilCondition } = require('./retry');

/**
 * Gerenciador de processos da aplicação
 */
class ProcessManager {
  constructor() {
    this.apiProcess = null;
    this.webProcess = null;
    this.cleanupExecuted = false;
    this.apiProcessExited = false;
    this.webProcessExited = false;
    this.processesStarted = false;
    
    // Registrar handlers de cleanup
    this.setupHandlers();
  }

  /**
   * Configura handlers de processo (SIGINT, SIGTERM, etc.)
   */
  setupHandlers() {
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.cleanup();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      printError('Erro não tratado:', error, [
        'Verifique os logs acima para mais detalhes',
        'Tente executar novamente: npm start',
        'Se o problema persistir, abra uma issue no GitHub'
      ]);
      this.cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      printError('Promise rejeitada não tratada:', reason, [
        'Verifique os logs acima para mais detalhes',
        'Tente executar novamente: npm start'
      ]);
      this.cleanup();
      process.exit(1);
    });
  }

  /**
   * Limpa recursos (processos)
   */
  cleanup() {
    if (this.cleanupExecuted) return;
    this.cleanupExecuted = true;

    print(`\n${icons.info} Limpando recursos...`, 'yellow');
    
    try {
      if (this.apiProcess && !this.apiProcess.killed) {
        this.apiProcess.kill('SIGTERM');
      }
      if (this.webProcess && !this.webProcess.killed) {
        this.webProcess.kill('SIGTERM');
      }
    } catch (error) {
      // Ignorar erros de cleanup
    }
  }

  /**
   * Inicia processo API
   * @param {Object} env - Variáveis de ambiente
   */
  startAPI(env) {
    this.apiProcess = spawn('npm', ['run', 'dev:api'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });

    this.apiProcess.on('error', (error) => {
      this.apiProcessExited = true;
      printError('Erro ao iniciar API', error, [
        'Verifique se a porta 3001 está disponível',
        'Tente: npm run dev:api manualmente'
      ]);
    });

    this.apiProcess.on('exit', (code, signal) => {
      if (this.processesStarted && !this.cleanupExecuted) {
        if (code !== null && code !== 0) {
          this.apiProcessExited = true;
          print(`\n${icons.warn} API terminou inesperadamente (código: ${code}, sinal: ${signal || 'N/A'})`, 'yellow');
          print(`   Verifique os logs acima para mais detalhes`, 'dim');
          print(`   Tente executar manualmente: npm run dev:api`, 'dim');
          
          if (this.webProcessExited) {
            print(`\n${icons.warn} Ambos os processos terminaram. Encerrando...`, 'yellow');
            this.cleanup();
            process.exit(1);
          }
        }
      }
    });
  }

  /**
   * Inicia processo Web
   * @param {Object} env - Variáveis de ambiente
   */
  startWeb(env) {
    this.webProcess = spawn('npm', ['run', 'dev:web'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });

    this.webProcess.on('error', (error) => {
      this.webProcessExited = true;
      printError('Erro ao iniciar Web', error, [
        'Verifique se a porta 3000 está disponível',
        'Tente: npm run dev:web manualmente'
      ]);
    });

    this.webProcess.on('exit', (code, signal) => {
      if (this.processesStarted && !this.cleanupExecuted) {
        if (code !== null && code !== 0) {
          this.webProcessExited = true;
          print(`\n${icons.warn} Web terminou inesperadamente (código: ${code}, sinal: ${signal || 'N/A'})`, 'yellow');
          print(`   Verifique os logs acima para mais detalhes`, 'dim');
          print(`   Tente executar manualmente: npm run dev:web`, 'dim');
          
          if (this.apiProcessExited) {
            print(`\n${icons.warn} Ambos os processos terminaram. Encerrando...`, 'yellow');
            this.cleanup();
            process.exit(1);
          }
        }
      }
    });
  }

  /**
   * Marca processos como iniciados
   */
  markProcessesStarted() {
    this.processesStarted = true;
    this.apiProcessExited = false;
    this.webProcessExited = false;
  }

  /**
   * Verifica se processos estão rodando
   * @returns {{api: boolean, web: boolean}}
   */
  areProcessesRunning() {
    const apiRunning = this.apiProcess && !this.apiProcess.killed && this.apiProcess.exitCode === null;
    const webRunning = this.webProcess && !this.webProcess.killed && this.webProcess.exitCode === null;
    
    return {
      api: apiRunning && !this.apiProcessExited,
      web: webRunning && !this.webProcessExited,
    };
  }
}

/**
 * Verifica se API está respondendo usando retryUntilCondition
 * @param {number} maxRetries - Número máximo de tentativas (padrão: 30)
 * @returns {Promise<boolean>} true se API está respondendo
 */
function checkAPI(maxRetries = 30) {
  let attemptCount = 0;
  
  return retryUntilCondition(
    () => {
      return new Promise((resolve) => {
        attemptCount++;
        const req = http.request(
          {
            hostname: 'localhost',
            port: 3001,
            path: '/health',
            method: 'GET',
            timeout: 3000,
          },
          (res) => {
            if (res.statusCode === 200) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        );

        req.on('error', () => {
          resolve(false);
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        req.end();
      });
    },
    {
      maxRetries,
      delay: 2000,
      timeout: maxRetries * 2000,
    }
  ).then((success) => {
    if (success) {
      print(`\n${icons.check} API está respondendo`, 'green');
    } else {
      print(`\n${icons.warn} API não respondeu a tempo, mas pode estar iniciando...`, 'yellow');
      print(`   Verifique manualmente: http://localhost:3001/health`, 'dim');
    }
    return success;
  });
}

// Criar instância singleton do ProcessManager
const processManager = new ProcessManager();

module.exports = {
  ProcessManager,
  processManager,
  checkAPI,
};

