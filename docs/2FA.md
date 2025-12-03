# Autenticação de Dois Fatores (2FA)

## Visão Geral

O OpenPanel implementa autenticação de dois fatores usando TOTP (Time-based One-Time Password), compatível com aplicativos como Google Authenticator, Authy e Microsoft Authenticator.

## Funcionalidades

- ✅ Geração de QR Code para configuração fácil
- ✅ Suporte a backup codes para recuperação
- ✅ Criptografia de secrets no banco de dados
- ✅ Validação no login
- ✅ Regeneração de backup codes

## Configuração

### 1. Gerar Secret e QR Code

```bash
POST /api/auth/2fa/setup
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Resposta**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "manualEntryKey": "JBSWY3DPEHPK3PXP"
}
```

### 2. Habilitar 2FA

```bash
POST /api/auth/2fa/enable
```

**Body**:
```json
{
  "code": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Resposta**:
```json
{
  "message": "2FA enabled successfully",
  "backupCodes": [
    "12345678",
    "87654321",
    ...
  ]
}
```

⚠️ **IMPORTANTE**: Guarde os backup codes em local seguro. Eles só são mostrados uma vez.

### 3. Login com 2FA

```bash
POST /api/auth/login
```

**Body** (primeira tentativa):
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta** (se 2FA habilitado):
```json
{
  "error": "2FA code required",
  "requires2FA": true
}
```

**Body** (segunda tentativa):
```json
{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorCode": "123456"
}
```

**Ou usando backup code**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "backupCode": "12345678"
}
```

## Desabilitar 2FA

```bash
POST /api/auth/2fa/disable
```

**Body**:
```json
{
  "password": "password123"
}
```

**Resposta**:
```json
{
  "message": "2FA disabled successfully"
}
```

## Regenerar Backup Codes

```bash
POST /api/auth/2fa/backup-codes
```

**Headers**:
```
Authorization: Bearer <access_token>
```

**Resposta**:
```json
{
  "message": "Backup codes generated successfully",
  "backupCodes": [
    "11111111",
    "22222222",
    ...
  ]
}
```

## Segurança

- Secrets são criptografados usando AES-256-GCM antes de armazenar no banco
- Backup codes são hasheados com SHA-256
- Rate limiting aplicado em todas as rotas de 2FA
- Audit logs registram todas as operações de 2FA

## Compatibilidade

- ✅ Google Authenticator
- ✅ Microsoft Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ Qualquer aplicativo TOTP compatível com RFC 6238

## Schema do Banco de Dados

```prisma
model User {
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String? @db.Text // Encrypted
  twoFactorBackupCodes Json? // Array of hashed codes
}
```

## Fluxo de Configuração

1. Usuário solicita setup de 2FA
2. Sistema gera secret TOTP
3. Sistema gera QR Code
4. Usuário escaneia QR Code no app autenticador
5. Usuário insere código de verificação
6. Sistema valida código e habilita 2FA
7. Sistema gera backup codes
8. Usuário salva backup codes

## Fluxo de Login

1. Usuário insere email e senha
2. Sistema valida credenciais
3. Se 2FA habilitado, sistema solicita código
4. Usuário insere código do app ou backup code
5. Sistema valida código
6. Se backup code usado, remove do banco
7. Sistema gera tokens de acesso

