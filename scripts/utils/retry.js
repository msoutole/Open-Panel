/**
 * Função genérica de retry com timeout
 * @param {Function} fn - Função assíncrona a executar
 * @param {Object} options - Opções de retry
 * @param {number} options.maxRetries - Número máximo de tentativas (padrão: 10)
 * @param {number} options.delay - Delay entre tentativas em ms (padrão: 1000)
 * @param {number} options.timeout - Timeout total em ms (padrão: 30000)
 * @param {Function} options.onRetry - Callback chamado a cada tentativa (opcional)
 * @param {Function} options.shouldRetry - Função que determina se deve tentar novamente (opcional)
 * @returns {Promise<any>} Resultado da função ou lança erro se todas as tentativas falharem
 */
async function retryWithTimeout(fn, options = {}) {
  const {
    maxRetries = 10,
    delay = 1000,
    timeout = 30000,
    onRetry = null,
    shouldRetry = null,
  } = options;

  const startTime = Date.now();
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Verificar timeout total
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout após ${timeout}ms (${attempt} tentativas)`);
    }

    try {
      const result = await fn(attempt);
      
      // Se shouldRetry retornar false, parar mesmo com sucesso
      if (shouldRetry && !shouldRetry(result, attempt)) {
        return result;
      }
      
      return result;
    } catch (error) {
      lastError = error;

      // Se shouldRetry retornar false, parar retry
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }

      // Chamar callback de retry se fornecido
      if (onRetry) {
        onRetry(error, attempt, maxRetries);
      }

      // Não aguardar após a última tentativa
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`Falhou após ${maxRetries} tentativas`);
}

/**
 * Retry com verificação de condição (polling)
 * @param {Function} checkFn - Função que retorna true quando condição é satisfeita
 * @param {Object} options - Opções de retry
 * @returns {Promise<boolean>} true se condição foi satisfeita, false se timeout
 */
async function retryUntilCondition(checkFn, options = {}) {
  const {
    maxRetries = 15,
    delay = 1500,
    timeout = null,
  } = options;

  const startTime = Date.now();
  const maxTime = timeout || (maxRetries * delay);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Verificar timeout total
    if (Date.now() - startTime > maxTime) {
      return false;
    }

    try {
      const result = await checkFn();
      if (result === true || result === 'success') {
        return true;
      }
    } catch (error) {
      // Continuar tentando em caso de erro
    }

    // Aguardar antes da próxima tentativa
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}

module.exports = {
  retryWithTimeout,
  retryUntilCondition,
};

