# 📚 SOU+TECH by SOULLABS — Documentação Enxuta

**Última atualização:** 08/12/2025  
Documentação consolidada para reduzir fragmentação e focar nos tópicos essenciais.

## Como navegar
- **[Guia Rápido](./GUIDE_QUICKSTART.md):** instalação e uso imediato (local ou homelab).
- **[Infra/Homelab](./INFRA_HOMELAB.md):** requisitos, rede, DNS/domínios, portas e serviços base.
- **[Manual do Usuário](./MANUAL_USUARIO.md):** login, 2FA, templates, terminal web e bancos.
- **[Manual Técnico](./MANUAL_TECNICO.md):** arquitetura, stack, fluxo de desenvolvimento e segurança.
- **[API REST](./API_REST.md):** principais endpoints e padrões de autenticação.
- **[API WebSocket](./API_WEBSOCKET.md):** canais em tempo real e contratos de mensagem.

## Visão geral do projeto
- Monorepo Node.js/React com backend Hono + Prisma e frontend Vite + Tailwind.
- Orquestração via Docker Compose com Traefik, Postgres, Redis e serviços auxiliares.
- Segurança: JWT + 2FA, rate limiting, headers seguros e logging estruturado.
- Objetivo: painel self-hosted com automação de deploy, bancos e integrações MCP/Hostinger.

## Arranque rápido (local)
- `npm start` na raiz: cria `.env` seguro, instala dependências, sobe Docker (Postgres/Redis/Traefik), roda Prisma (`db:generate` + `db:push`), cria admin padrão e inicia API/Web (3001/3000).
- Alternativa manual detalhada em `docs/GUIDE_QUICKSTART.md`.

## Convenções
- Comandos assumem **Node 18+** e **Docker** instalados.
- Substitua valores sensíveis no `.env`; amostras estão em `.env.example`.
- Use `npm run lint` antes de abrir PRs; avisos de tipo são tolerados, erros não.