# Implementação de Autenticação JWT

## Objetivo
Implementar autenticação JWT completa no frontend para permitir acesso aos recursos protegidos da API.

## Problema
Frontend não está autenticando com a API, resultando em erro 401 Unauthorized em todas as requisições protegidas.

## Proposed Changes

### A. Frontend - Autenticação

#### [MODIFY] `apps/web/pages/Login.tsx`

Implementar autenticação real com a API:

**Mudanças**:
1. Substituir login simulado por chamada real a `/api/auth/login`
2. Armazenar tokens JWT no localStorage
3. Tratar erros de autenticação adequadamente

**Implementação**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  
  if (!validateEmail(email) || !validatePassword(password)) {
    setError('Invalid email or password');
    return;
  }

  setIsLoading(true);

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store tokens and user data
    localStorage.setItem('openpanel_access_token', data.accessToken);
    localStorage.setItem('openpanel_refresh_token', data.refreshToken);
    localStorage.setItem('openpanel_user', JSON.stringify(data.user));

    if (rememberMe) {
      localStorage.setItem('openpanel_remember', 'true');
      localStorage.setItem('openpanel_email', email);
    }

    onLogin();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

#### [MODIFY] `apps/web/services/api.ts`

Adicionar autenticação em todas as requisições:

**Mudanças**:
1. Criar função helper `getAuthHeaders()`
2. Adicionar header Authorization em todas as requisições
3. Implementar interceptor para refresh token (401)

**Implementação**:
```typescript
// Helper para obter headers com autenticação
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('openpanel_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Helper para lidar com respostas e refresh token
const handleResponse = async <T>(response: Response): Promise<T> => {
  // Se 401, tentar refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Redirecionar para login
      localStorage.removeItem('openpanel_access_token');
      localStorage.removeItem('openpanel_refresh_token');
      localStorage.removeItem('openpanel_session');
      window.location.href = '/';
      throw new Error('Session expired');
    }
    // Não fazer nova requisição aqui, deixar para retry no nível superior
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

// Refresh token
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('openpanel_refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem('openpanel_access_token', data.accessToken);
    localStorage.setItem('openpanel_refresh_token', data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

// Atualizar todas as funções de API
export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/api/projects`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ projects: Project[] }>(response);
  return data.projects;
};

// Repetir para todas as outras funções...
```

---

#### [MODIFY] `apps/web/App.tsx`

Atualizar gerenciamento de sessão:

**Mudanças**:
1. Verificar token válido ao carregar app
2. Limpar tokens ao fazer logout

**Implementação**:
```typescript
const [isLoggedIn, setIsLoggedIn] = useState(() => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('openpanel_access_token');
    const session = localStorage.getItem('openpanel_session');
    return Boolean(token && session === 'true');
  }
  return false;
});

const handleLogout = () => {
  localStorage.removeItem('openpanel_access_token');
  localStorage.removeItem('openpanel_refresh_token');
  localStorage.removeItem('openpanel_session');
  localStorage.removeItem('openpanel_user');
  setIsLoggedIn(false);
};
```

---

### B. Backend - Criar Usuário de Teste

#### Script para criar usuário padrão

Criar script ou usar endpoint de registro para criar usuário inicial:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@openpanel.dev",
    "password": "admin123"
  }'
```

Ou via Prisma Studio / SQL direto no banco.

---

## Verification Plan

### 1. Testes Automatizados

**Não há testes automatizados existentes para autenticação no frontend.** 

> **Nota**: Considerar adicionar testes E2E no futuro usando Playwright ou Cypress.

### 2. Testes Manuais

#### 2.1. Criar Usuário de Teste

**Objetivo**: Garantir que existe um usuário válido no banco de dados.

**Passos**:
1. Com API rodando (`npm run dev:api`), executar:
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@openpanel.dev","password":"admin123"}'
   ```
2. Verificar resposta com status 201 e dados do usuário

**Resultado Esperado**: Resposta JSON com `user`, `accessToken` e `refreshToken`.

---

#### 2.2. Testar Login no Frontend

**Objetivo**: Verificar se login funciona e tokens são armazenados.

**Passos**:
1. Abrir http://localhost:3000
2. Preencher login:
   - Email: `admin@openpanel.dev`
   - Password: `admin123`
3. Clicar em "Login"
4. Abrir DevTools > Application > Local Storage
5. Verificar presença de:
   - `openpanel_access_token`
   - `openpanel_refresh_token`
   - `openpanel_user`
   - `openpanel_session`

**Resultado Esperado**: 
- Redirecionamento para dashboard
- Tokens armazenados no localStorage
- Sem erros no console

---

#### 2.3. Verificar Requisições Autenticadas

**Objetivo**: Confirmar que dashboard carrega projetos sem erro 401.

**Passos**:
1. Após login, observar dashboard
2. Abrir DevTools > Network
3. Filtrar por requisição a `/api/projects`
4. Verificar:
   - Header `Authorization: Bearer <token>` presente
   - Status 200 (não 401)
   - Lista de projetos retornada

**Resultado Esperado**:
- Dashboard exibe projetos (ou mensagem "No projects" se vazio)
- Console sem erros 401
- Requisição inclui token JWT

---

#### 2.4. Testar Refresh Token

**Objetivo**: Validar renovação automática de token expirado.

**Simulação**:
1. No DevTools > Application > Local Storage, copiar `refresh_token`
2. Deletar `access_token`
3. Recarregar página ou fazer ação que dispare requisição
4. Verificar se novo `access_token` é gerado automaticamente

**Nota**: Como tokens têm validade longa (15min/7d), este teste pode requerer aguardar expiração ou modificar JWT_ACCESS_EXPIRES_IN temporariamente.

---

#### 2.5. Testar Logout

**Objetivo**: Garantir que logout limpa sessão.

**Passos**:
1. Logado no dashboard, clicar em botão de logout
2. Verificar DevTools > Local Storage
3. Tentar acessar rota protegida manualmente (ex: criar projeto)

**Resultado Esperado**:
- Redirecionamento para tela de login
- Todos os tokens removidos do localStorage
- Requisições a recursos protegidos falham (401) até novo login

---

## Riscos e Considerações

1. **Token Expiration**: Access tokens expiram em 15min. Usuário pode perder sessão se inativo.
   - **Mitigação**: Implementado refresh automático em handleResponse

2. **Segurança**: Tokens armazenados em localStorage (vulnerável a XSS).
   - **Alternativa futura**: Considerar httpOnly cookies no backend

3. **Múltiplas Tabs**: Logout em uma tab não invalida tokens em outras.
   - **Solução futura**: Window storage events ou server-side token blacklist

---

## Arquivos a Modificar

- `apps/web/pages/Login.tsx` - Autenticação real via API
- `apps/web/services/api.ts` - Headers com JWT + refresh logic
- `apps/web/App.tsx` - Verificação de token ao carregar

## Novo Arquivo

- Script ou documentação para criar usuário padrão
