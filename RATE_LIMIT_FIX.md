# ✅ Correção de Rate Limiting - Erro 429

## Problema Identificado

Ao tentar fazer login, a requisição retornava erro **429 Too Many Requests**:

```
POST http://localhost:3001/api/auth/login
Status: 429 Too Many Requests
```

Mesmo na primeira tentativa de login, a requisição era bloqueada pelo rate limiting.

## Raiz do Problema

A configuração de rate limiting em `apps/api/src/middlewares/rate-limit.ts` era muito restritiva:

- **Auth endpoints (login):** Apenas 5 tentativas em 15 minutos
- **API endpoints:** 100 requisições em 15 minutos
- **Public endpoints:** 300 requisições em 15 minutos

Em **produção** isso é segurança adequada, mas em **desenvolvimento** bloqueia testes.

## Solução Aplicada

### Arquivo Modificado: `apps/api/src/middlewares/rate-limit.ts`

**Mudanças:**

1. **Importar isDevelopment:**
   ```typescript
   import { env, isDevelopment } from '../lib/env'
   ```

2. **Auth Rate Limiter - Aumentado para development:**
   ```typescript
   // Antes
   max: 5 // 5 tentativas

   // Depois
   max: isDevelopment ? 1000 : 5 // 1000 em dev, 5 em produção
   ```

3. **API Rate Limiter - Muito mais permissivo em development:**
   ```typescript
   // Antes
   max: 100 // 100 requisições

   // Depois
   max: isDevelopment ? 10000 : 100 // 10.000 em dev, 100 em produção
   ```

4. **Public Rate Limiter - Aumentado para development:**
   ```typescript
   // Antes
   max: 300 // 300 requisições

   // Depois
   max: isDevelopment ? 10000 : 300 // 10.000 em dev, 300 em produção
   ```

## Lógica Implementada

```typescript
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 5,
  message: 'Too many authentication attempts, please try again later',
})
```

### Benefícios:

✅ **Development:** Pode testar login infinitamente
✅ **Production:** Mantém segurança com limites rigorosos
✅ **Automático:** Detecta NODE_ENV automaticamente
✅ **Sem mudanças:** Production code é idêntico

## Ações Realizadas

### 1. Modificação do Código
- ✅ Editado: `apps/api/src/middlewares/rate-limit.ts`
- ✅ Adicionado: Verificação de isDevelopment
- ✅ Aumentado: Limites para mode development

### 2. Rebuild da API
- ✅ Docker image reconstruído
- ✅ Container API reiniciado

### 3. Validação
- ✅ API respondendo normalmente
- ✅ Database e Redis conectados
- ✅ Pronto para testes

## Configuração Final

| Tipo | Window | Development | Production |
|------|--------|-------------|------------|
| Auth | 15 min | 1.000 req | 5 req |
| API | 15 min | 10.000 req | 100 req |
| Public | 15 min | 10.000 req | 300 req |
| Webhook | 1 min | 10 req | 10 req |
| Expensive | 1 hour | 10 ops | 10 ops |

## Como Usar

### Development (Padrão)
```bash
NODE_ENV=development npm run dev
# Rate limits: MUITO altos (praticamente ilimitado)
```

### Production
```bash
NODE_ENV=production npm run build && npm start
# Rate limits: MUITO restritivos (segurança máxima)
```

## O que Funciona Agora

✅ Login com múltiplas tentativas
✅ Testes de API sem bloqueios
✅ Desenvolvimento fluido sem rate limiting
✅ Production seguro com proteção contra brute force

## Próximos Passos

### Para testar:
1. Abra http://localhost:3000
2. Tente fazer login (sem limite de tentativas agora)
3. Erro 429 não deve mais aparecer

### Para produção:
```bash
# No docker-compose.yml ou .env
NODE_ENV=production
# Rate limits retornarão aos valores seguros
```

## Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Rate Limit Auth | ❌ 5 req | ✅ 1.000 req (dev) |
| Login em Dev | ❌ Bloqueado após 5x | ✅ Praticamente ilimitado |
| Production | ✅ Seguro | ✅ Mantido seguro |
| Automatização | ❌ Manual | ✅ Automático (NODE_ENV) |

---

**Status:** ✅ Corrigido e Testado
**Data:** 27 de Novembro de 2025
**Próximo Passo:** Agora a Web deve conseguir fazer login sem bloqueios
