import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, hash, maskApiKey } from '../encryption';

describe('Encryption Library', () => {
  // Ensure JWT_SECRET is set for tests
  beforeAll(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests-must-be-32-chars-minimum';
    }
  });

  describe('encrypt() and decrypt()', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const original = 'test-api-key-123';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
      expect(encrypted).not.toBe(original);
    });

    it('should encrypt the same string differently each time (due to random IV)', () => {
      const original = 'test-api-key-123';
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(original);
      expect(decrypt(encrypted2)).toBe(original);
    });

    it('should handle empty strings', () => {
      const original = '';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle special characters and unicode', () => {
      const original = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`áéíóúñÑ🔒🔑';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle long strings', () => {
      const original = 'a'.repeat(10000);
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should throw error when decrypting invalid data', () => {
      expect(() => decrypt('invalid-encrypted-data')).toThrow();
    });

    it('should throw error when decrypting tampered data', () => {
      const original = 'test-api-key-123';
      const encrypted = encrypt(original);

      // Tamper with the encrypted data
      const tampered = encrypted.replace(/.$/, 'X');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should produce encrypted string with correct format (iv:authTag:encrypted)', () => {
      const original = 'test-api-key-123';
      const encrypted = encrypt(original);

      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);

      // Each part should be base64 encoded
      parts.forEach(part => {
        expect(part).toMatch(/^[A-Za-z0-9+/]+=*$/);
      });
    });
  });

  describe('hash()', () => {
    it('should generate a consistent hash for the same input', () => {
      const input = 'test-string';
      const hash1 = hash(input);
      const hash2 = hash(input);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hash('test-string-1');
      const hash2 = hash('test-string-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate a 64-character hex string (SHA-256)', () => {
      const result = hash('test-string');

      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle empty strings', () => {
      const result = hash('');

      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be case-sensitive', () => {
      const hash1 = hash('Test');
      const hash2 = hash('test');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters and unicode', () => {
      const input = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`áéíóúñÑ🔒🔑';
      const result = hash(input);

      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('maskApiKey()', () => {
    it('should mask all but last 4 characters by default', () => {
      const apiKey = 'sk-1234567890abcdef';
      const masked = maskApiKey(apiKey);

      expect(masked).toBe('••••••••••••cdef');
      expect(masked).toHaveLength(apiKey.length);
    });

    it('should mask all but specified number of characters', () => {
      const apiKey = 'sk-1234567890abcdef';
      const masked = maskApiKey(apiKey, 6);

      expect(masked).toBe('••••••••••••abcdef');
      expect(masked).toHaveLength(apiKey.length);
    });

    it('should handle short API keys', () => {
      const apiKey = 'abc';
      const masked = maskApiKey(apiKey, 2);

      expect(masked).toBe('•bc');
    });

    it('should handle API key shorter than visible characters', () => {
      const apiKey = 'ab';
      const masked = maskApiKey(apiKey, 4);

      // Should show the entire key if it's shorter than visibleChars
      expect(masked).toBe('ab');
    });

    it('should handle empty string', () => {
      const apiKey = '';
      const masked = maskApiKey(apiKey);

      expect(masked).toBe('');
    });

    it('should mask with bullet character (•)', () => {
      const apiKey = '1234567890';
      const masked = maskApiKey(apiKey, 3);

      expect(masked).toContain('•');
      expect(masked.split('•').length - 1).toBe(7); // 7 bullet characters
    });
  });

  describe('Edge Cases and Security', () => {
    it('should not expose original data in encrypted format', () => {
      const sensitive = 'my-super-secret-api-key-12345';
      const encrypted = encrypt(sensitive);

      // Encrypted data should not contain the original string
      expect(encrypted.toLowerCase()).not.toContain(sensitive.toLowerCase());
    });

    it('should handle null bytes in data', () => {
      const original = 'test\x00data\x00with\x00nulls';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should maintain data integrity through multiple encrypt/decrypt cycles', () => {
      let data = 'initial-data';

      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(data);
        data = decrypt(encrypted);
      }

      expect(data).toBe('initial-data');
    });

    it('should handle concurrent encryption operations', () => {
      const original = 'concurrent-test';
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(encrypt(original))
      );

      return Promise.all(promises).then(results => {
        // All should be different (due to random IVs)
        const uniqueResults = new Set(results);
        expect(uniqueResults.size).toBe(100);

        // But all should decrypt to the same value
        results.forEach(encrypted => {
          expect(decrypt(encrypted)).toBe(original);
        });
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should successfully encrypt and decrypt realistic API keys', () => {
      const apiKeys = [
        'sk-1234567890abcdefghijklmnopqrstuvwxyz',
        'AIzaSyD-1234567890abcdefghijklmnopqrstuvwxyz',
        'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
      ];

      apiKeys.forEach(key => {
        const encrypted = encrypt(key);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(key);
      });
    });

    it('should mask API keys for display purposes', () => {
      const apiKey = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';
      const masked = maskApiKey(apiKey);

      // Should show last 4 characters
      expect(masked.endsWith('wxyz')).toBe(true);

      // Should hide the beginning
      expect(masked.startsWith('•')).toBe(true);
    });

    it('should create consistent hashes for credential validation', () => {
      const credentials = [
        { password: 'postgres123', salt: 'random-salt-1' },
        { password: 'postgres123', salt: 'random-salt-1' },
      ];

      const hash1 = hash(credentials[0].password + credentials[0].salt);
      const hash2 = hash(credentials[1].password + credentials[1].salt);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Performance', () => {
    it('should encrypt and decrypt within reasonable time', () => {
      const original = 'performance-test-string';
      const iterations = 1000;

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const encrypted = encrypt(original);
        decrypt(encrypted);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 1000 encrypt/decrypt cycles in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should hash within reasonable time', () => {
      const input = 'hash-performance-test';
      const iterations = 10000;

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        hash(input);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10000 hashes in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
