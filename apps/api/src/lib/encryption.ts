import crypto from 'crypto';

/**
 * Biblioteca de criptografia para API keys e dados sensíveis
 * Usa AES-256-GCM para criptografia simétrica
 */

// Algoritmo de criptografia
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Para AES, este é sempre 16 bytes
const AUTH_TAG_LENGTH = 16; // Tag de autenticação GCM
const SALT_LENGTH = 64;
const KEY_LENGTH = 32; // 256 bits

/**
 * Obtém a chave de criptografia do ambiente
 * Usa JWT_SECRET como base para derivar a chave
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      'ENCRYPTION_KEY ou JWT_SECRET não está definido nas variáveis de ambiente'
    );
  }

  // Derivar chave de 32 bytes do secret usando PBKDF2
  const salt = Buffer.from('openpanel-encryption-salt-v1'); // Salt fixo (idealmente deveria ser por registro)
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Criptografa uma string
 * @param text Texto a ser criptografado
 * @returns String criptografada em formato base64 (iv:authTag:encrypted)
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Texto para criptografar não pode ser vazio');
  }

  try {
    const key = getEncryptionKey();

    // Gerar IV aleatório
    const iv = crypto.randomBytes(IV_LENGTH);

    // Criar cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Criptografar
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Obter auth tag
    const authTag = cipher.getAuthTag();

    // Retornar formato: iv:authTag:encrypted (tudo em base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha ao criptografar dados');
  }
}

/**
 * Descriptografa uma string
 * @param encryptedData String criptografada em formato base64 (iv:authTag:encrypted)
 * @returns Texto descriptografado
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Dados criptografados não podem ser vazios');
  }

  try {
    const key = getEncryptionKey();

    // Separar componentes
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato de dados criptografados inválido');
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    // Converter de base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    // Criar decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Descriptografar
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha ao descriptografar dados');
  }
}

/**
 * Gera hash seguro de uma string (útil para comparações)
 * @param text Texto para gerar hash
 * @returns Hash SHA-256 em formato hexadecimal
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Compara um texto com um hash de forma segura (timing-safe)
 * @param text Texto a comparar
 * @param hashedText Hash para comparar
 * @returns true se correspondem
 */
export function compareHash(text: string, hashedText: string): boolean {
  const textHash = hash(text);
  return crypto.timingSafeEqual(
    Buffer.from(textHash, 'hex'),
    Buffer.from(hashedText, 'hex')
  );
}

/**
 * Gera uma string aleatória segura
 * @param length Comprimento da string (padrão: 32)
 * @returns String hexadecimal aleatória
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Mascara uma API key para exibição
 * @param apiKey API key completa
 * @param visibleChars Número de caracteres visíveis no final (padrão: 4)
 * @returns API key mascarada (ex: "••••••••1234")
 */
export function maskApiKey(apiKey: string, visibleChars: number = 4): string {
  if (!apiKey || apiKey.length <= visibleChars) {
    return '••••••';
  }

  const masked = '•'.repeat(Math.max(apiKey.length - visibleChars, 6));
  const visible = apiKey.slice(-visibleChars);

  return masked + visible;
}

/**
 * Valida se uma string está no formato criptografado correto
 * @param encryptedData String a validar
 * @returns true se está no formato correto
 */
export function isValidEncryptedFormat(encryptedData: string): boolean {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return false;
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    return false;
  }

  // Verificar se todas as partes são base64 válidos
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return parts.every((part) => part.length > 0 && base64Regex.test(part));
}
