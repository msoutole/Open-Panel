## 🏠 Infra & Homelab

Guia condensado para preparar infraestrutura, rede e serviços base em ambiente doméstico ou servidor dedicado.

### Requisitos e baseline
- **SO recomendado:** Ubuntu 22.04 LTS ou Debian 12.
- **Pacotes:** `curl`, `git`, `docker`, `docker-compose-plugin`, `net-tools`.
- **Recursos mínimos:** 2 vCPU, 4 GB RAM, SSD preferencial; para múltiplos containers, priorize 4+ vCPU e 8+ GB.
- **Usuário sudo sem senha interativa** para scripts de automação.

### Rede, DNS e certificados
- **IP estático**: configure Netplan (`/etc/netplan/*.yaml`) e aplique com `netplan apply`.
- **Portas obrigatórias**: 80/443 (HTTP/HTTPS), 8080 (Traefik dashboard opcional), 3000 (web), 3001 (API). Ajuste no `.env` se houver conflito.
- **Roteador/firewall**: encaminhe 80/443 para o host; desabilite NAT loopback apenas se usar split DNS.
- **Domínios**: crie registros A/AAAA apontando para o IP público; para IP dinâmico, ative DDNS (No-IP/Tailscale/Cloudflare).
- **TLS**: Traefik emite certificados Let’s Encrypt automaticamente quando `APP_DOMAIN` e email estão definidos.

### Serviços base (Docker Compose)
- **Stack principal**: Traefik (proxy), Postgres + pgvector, Redis, API, Web.
- **Comando**: `docker compose -f docker-compose.prod.yml up -d --build`.
- **Validação**:
  - `docker compose ps` (containers saudáveis)
  - `curl -I https://SEU_DOMINIO/health` (API responde)
  - Traefik em `https://traefik.SEU_DOMINIO` (se habilitado)

### Integração Hostinger (DDNS/DNS/VPS)
- Gere token API na Hostinger e exporte em `.env` (ex.: `HOSTINGER_API_TOKEN`).
- Configure zona DNS: registros A/AAAA para painel e serviços auxiliares.
- DDNS: crie cron job ou use script MCP para atualizar IP periodicamente.
- VPS: acione APIs de snapshot/reboot via MCP quando aplicável.

### Observabilidade e manutenção
- **Logs**: `docker compose logs -f api web traefik`.
- **Saúde**: endpoints `/health` (API) e `/metrics` conforme configuração.
- **Backups**: volume do Postgres via `pg_dump` + retenção; para Redis, snapshots periódicos.
- **Recriação segura**: `docker compose down && docker compose up -d --build` preserva volumes; para reset total, remova volumes explicitamente.

### Segurança prática
- Alterar senha do admin após o primeiro acesso e ativar 2FA.
- Restringir Traefik dashboard por IP ou autenticação básica.
- Manter sistema e imagens Docker atualizados (`docker compose pull && docker compose up -d`).
- Aplicar regras de firewall (ufw/nftables) permitindo apenas portas necessárias.
