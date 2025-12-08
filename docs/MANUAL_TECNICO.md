## 🛠️ Manual Técnico

Referência enxuta para arquitetura, desenvolvimento e operações avançadas.

### Arquitetura e stack
- **Backend:** Node.js 18+, Hono, Prisma, Postgres + pgvector, Redis/BullMQ.
- **Frontend:** React 19, Vite, TailwindCSS, i18n.
- **Infra:** Traefik (proxy/TLS), Docker Compose, métricas e health checks.
- **Monorepo:** `apps/api`, `apps/web`, `packages/shared` para tipos/validação.

### Layout do repositório
```
apps/
  api/        # REST + WebSocket, Prisma, serviços
  web/        # SPA React, componentes e páginas
packages/
  shared/     # Tipos comuns e utilitários
scripts/      # Automação (install, deploy, lint)
docker-compose*.yml
```

### Fluxo de desenvolvimento
- Instalação: `npm install`.
- Execução: `npm run dev:api` e `npm run dev:web`.
- Lint: `npm run lint` (avisos de tipo são tolerados; erros não).
- Build: `npm run build` ou `npm run build:api` / `npm run build:web`.
- Testes: em `apps/api/src/__tests__`; use Jest/Vitest conforme configurado.

### API e contratos
- Endpoints e autenticação: `API_REST.md`.
- Canais em tempo real: `API_WEBSOCKET.md`.
- Swagger: `http://localhost:3001/api/docs` quando a API estiver ativa.

### Segurança e conformidade
- Autenticação: JWT + 2FA; invalide tokens ao rotacionar segredos.
- Proteções: rate limiting, headers seguros, sanitização de entrada.
- Segredos: mantenha `.env` fora do repositório; gire credenciais com `scripts/rotate-credentials.sh`.
- Logs estruturados: use `requestId` e níveis info/warn/error; evite dados sensíveis.

### Dados e resiliência
- Prisma com Postgres; migrations em `apps/api/prisma`.
- Backups: `pg_dump` + retenção; restaure com `psql`/`pg_restore`.
- Zero downtime: blue/green via Traefik quando health checks estiverem corretos.

### Deploy
- Produção: `docker compose -f docker-compose.prod.yml up -d --build`.
- Observabilidade e portas: ver `INFRA_HOMELAB.md`.
- Usuário admin extra: `npm run create:admin`.

### Boas práticas
- Commits pequenos e frequentes; execute lint antes de PR.
- Prefira tipos explícitos em serviços críticos e registre decisões arquiteturais.
- Atualize dependências e imagens Docker regularmente; monitore CVEs.
