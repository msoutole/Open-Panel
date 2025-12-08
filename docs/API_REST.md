## 🌐 API REST (Resumo)

**Base URLs:**  
- Dev: `http://localhost:3001`  
- Prod (exemplo): `https://api.seu-dominio`

**Autenticação:** JWT no header `Authorization: Bearer <token>`.  
Tokens são emitidos em `/api/auth/login` e renovados em `/api/auth/refresh`.

### Padrões gerais
- Conteúdo JSON (`Content-Type: application/json`).
- Erros retornam `{ "error": string, "status": number }`.
- Códigos: 2xx sucesso, 400 validação, 401/403 autenticação/autorização, 404 não encontrado.

### Endpoints principais
- **Auth**
  - `POST /api/auth/register` — cria usuário.
  - `POST /api/auth/login` — autentica (suporta 2FA).
  - `POST /api/auth/refresh` — renova tokens.
- **Usuários**
  - `GET /api/users/me` — perfil atual.
  - `PATCH /api/users/me` — atualiza nome/locale.
  - `POST /api/users/me/2fa/enable|disable` — gerencia 2FA.
- **Projetos & Containers**
  - `GET /api/projects` | `POST /api/projects` — lista/cria projetos.
  - `GET /api/containers` — lista containers.
  - `POST /api/containers/:id/start|stop|restart` — ações básicas.
- **Deploy & Templates**
  - `GET /api/templates` — catálogo.
  - `POST /api/templates/:id/deploy` — cria serviço a partir do template.
  - `POST /api/builds` — dispara build/deploy customizado.
- **Bancos de dados**
  - `POST /api/databases/:id/query` — executa query (usa permissões do usuário).
- **Infra**
  - `GET /api/metrics` — métricas (quando habilitado).
  - `GET /api/health` — health check.

### Exemplo rápido: login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@admin.com.br",
  "password": "admin123",
  "twoFactorCode": "123456" // opcional se 2FA ativo
}
```

Resposta 200:
```json
{
  "user": { "id": "user-123", "email": "admin@admin.com.br" },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

### Boas práticas de uso
- Sempre usar HTTPS em produção.
- Rotacionar tokens ao trocar segredos ou suspeita de vazamento.
- Usar paginadores e filtros fornecidos pelos endpoints de listagem.
- Para integrações MCP/Hostinger, preferir tokens de serviço dedicados.
