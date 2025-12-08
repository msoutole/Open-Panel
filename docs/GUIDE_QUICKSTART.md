## 🚀 Guia Rápido

Objetivo: levar o SOU+SER by SOULLABS do zero ao painel acessível em poucos passos, em ambiente local ou homelab.

### Pré-requisitos mínimos
- **Sistema:** Ubuntu/Debian ou Windows/macOS com Docker Desktop.
- **Ferramentas:** Node 18+, npm 10+, Docker e Docker Compose.
- **Recursos:** 2 vCPU, 4 GB RAM e 15 GB livres para serviços base.

### Passo a passo (local)
1) Clone e instale dependências:
   - `git clone https://github.com/msoutole/open-panel.git`
   - `cd open-panel && npm install`
2) Gere variáveis padrão: `cp .env.example .env` e ajuste domínios/ports se necessário.
3) Suba serviços base: `docker compose up -d`.
4) Inicie API e Web:
   - `npm run dev:api`
   - `npm run dev:web`
5) Acesse:
   - Painel: `http://localhost:3000`
   - API: `http://localhost:3001`
   - Traefik: `http://localhost:8080`
6) Credenciais iniciais: `admin@admin.com.br` / `admin123` (altere no primeiro login).

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
