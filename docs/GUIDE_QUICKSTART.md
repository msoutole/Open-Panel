## 🚀 Guia Rápido

Objetivo: levar o SOU+TECH by SOULLABS do zero ao painel acessível em poucos passos, em ambiente local ou homelab.

### Pré-requisitos mínimos
- **Sistema:** Ubuntu/Debian ou Windows/macOS com Docker Desktop.
- **Ferramentas:** Node 18+, npm 10+, Docker e Docker Compose.
- **Recursos:** 2 vCPU, 4 GB RAM e 15 GB livres para serviços base.

### Passo a passo (local) — recomendado
1) Clone o repositório:
   - `git clone https://github.com/msoutole/open-panel.git`
2) Rode o orquestrador único:
   - `cd open-panel && npm start`
   - O que ele faz automaticamente:
     - Cria um `.env` seguro e sincroniza com `apps/api/.env` e `apps/web/.env.local`.
     - Instala dependências (`npm install`), sobe infraestrutura Docker (Postgres, Redis, Traefik).
     - Executa Prisma (`db:generate` + `db:push`) e cria usuário admin padrão.
     - Sobe API (3001) e Web (3000) em modo desenvolvimento.
3) Acesse:
   - Painel: `http://localhost:3000`
   - API: `http://localhost:3001`
   - Traefik: `http://localhost:8080`
4) Credenciais iniciais: `admin@admin.com.br` / `admin123` (altere no primeiro login).

### Fluxo manual (alternativo)
Use apenas se preferir controlar cada etapa:
- `npm install`
- `cp .env.example .env` (ou ajuste manualmente)
- `docker compose up -d`
- `npm run db:push` e `npm run create:admin`
- `npm run dev:api` e `npm run dev:web`

### Passo a passo (homelab/servidor)
1) Atualize o sistema e instale Docker + Compose.
2) Configure IP estático (Netplan) e abra portas 80/443 no roteador/firewall.
3) Aponte seu domínio/subdomínio para o IP público (A/AAAA) ou configure DDNS.
4) Exporte variáveis no `.env` para domínio (`APP_DOMAIN`) e email de certificado.
5) Execute: `docker compose -f docker-compose.prod.yml up -d --build`.
6) Valide:
   - `curl -I https://SEU_DOMINIO/health` (API responde 200/204).
   - Traefik em `https://traefik.SEU_DOMINIO` se configurado.

### Operação básica
- **Reiniciar stack:** `docker compose restart`
- **Atualizar dependências JS:** `npm install && npm run lint`
- **Logs rápidos:** `docker compose logs -f api web`
- **Usuário admin extra:** `npm run create:admin`

### Checklist pós-instalação
- Alterou senha padrão do admin.
- Ativou 2FA na conta administrativa.
- Guardou códigos de recuperação em local seguro.
- Ajustou domínios e certificados no Traefik.
- Confirmou acesso ao painel, API e serviços auxiliares.
