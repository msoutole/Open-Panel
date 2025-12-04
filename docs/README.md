# 📚 OpenPanel - Documentação

Bem-vindo à documentação oficial do OpenPanel.

**Última atualização**: 03 de Dezembro de 2025

A documentação foi reorganizada para facilitar o acesso. Escolha o guia apropriado para você:

## 🚀 Manuais Principais

### [🏠 Guia Homelab](./GUIA_HOMELAB.md) ⭐ **NOVO**
**Para quem:** Quem quer instalar no servidor homelab.
**Conteúdo:**
- Instalação passo a passo em servidor Ubuntu/Debian
- Configuração de Tailscale para acesso remoto
- Configuração de domínio e SSL
- Comandos úteis e troubleshooting

### [📘 Manual do Usuário](./MANUAL_DO_USUARIO.md)
**Para quem:** Usuários finais e administradores do sistema.
**Conteúdo:**
- Instalação e Início Rápido (`npm start`)
- Autenticação de Dois Fatores (2FA)
- Templates e Marketplace
- Terminal Web e Consoles de Banco
- Solução de Problemas (Troubleshooting)

### [🛠️ Manual Técnico](./MANUAL_TECNICO.md)
**Para quem:** Arquitetos e desenvolvedores que precisam entender o funcionamento interno.
**Conteúdo:**
- Arquitetura do Sistema (Monorepo)
- Referência da API REST e WebSockets
- Banco de Dados (Prisma + PostgreSQL)
- Segurança (JWT, 2FA, RBAC)
- Design System e Performance

### [👨‍💻 Guia de Desenvolvimento](./GUIA_DE_DESENVOLVIMENTO.md)
**Para quem:** Contribuidores e Agentes de IA.
**Conteúdo:**
- Padrões de Código (Backend/Frontend)
- Papéis de Agentes de IA
- Checklist de Testes
- Como criar Templates
- Comandos Úteis

### [📅 Projeto e Roadmap](./PROJETO.md)
**Para quem:** Todos interessados no futuro do projeto.
**Conteúdo:**
- Status atual (Fase 5)
- Roadmap e Próximos Passos
- Métricas de Qualidade
- Histórico de Decisões

---

## 📋 Documentos de Referência

### Configuração de Servidor e Infraestrutura

| Documento | Descrição |
| --------- | --------- |
| [INSTALACAO_SERVIDOR.md](./INSTALACAO_SERVIDOR.md) | Guia de instalação em servidor Ubuntu |
| [TAILSCALE_SETUP.md](./TAILSCALE_SETUP.md) | Configuração do Tailscale para acesso remoto |
| [HOME_LAB_SETUP.md](./HOME_LAB_SETUP.md) | Configuração completa de Home Lab |
| [ADGUARD_HOME.md](./ADGUARD_HOME.md) | Integração com AdGuard Home para DNS e filtros |
| [DOMINIO_EXTERNO.md](./DOMINIO_EXTERNO.md) | Configuração de domínio externo |

### Integração Hostinger

| Documento | Descrição |
| --------- | --------- |
| [HOSTINGER_MCP_INDEX.md](./HOSTINGER_MCP_INDEX.md) | Índice principal da integração Hostinger MCP |
| [HOSTINGER_MCP_QUICKSTART.md](./HOSTINGER_MCP_QUICKSTART.md) | Início rápido com Hostinger MCP |
| [HOSTINGER_MCP_INTEGRATION.md](./HOSTINGER_MCP_INTEGRATION.md) | Guia completo de integração Hostinger MCP |
| [HOSTINGER_MCP_TOOLS_REFERENCE.md](./HOSTINGER_MCP_TOOLS_REFERENCE.md) | Referência de ferramentas MCP |
| [HOSTINGER_MCP_IMPLEMENTATION_SUMMARY.md](./HOSTINGER_MCP_IMPLEMENTATION_SUMMARY.md) | Resumo da implementação |
| [HOSTINGER_MCP_USAGE.md](./HOSTINGER_MCP_USAGE.md) | Como usar as ferramentas MCP |
| [HOSTINGER_DNS_CONFIG.md](./HOSTINGER_DNS_CONFIG.md) | Configuração de DNS na Hostinger |
| [HOSTINGER_DNS_QUICKSTART.md](./HOSTINGER_DNS_QUICKSTART.md) | Início rápido DNS Hostinger |
| [HOSTINGER_DDNS_INDEX.md](./HOSTINGER_DDNS_INDEX.md) | Índice DDNS Hostinger |
| [HOSTINGER_DDNS_SETUP.md](./HOSTINGER_DDNS_SETUP.md) | Configuração de DDNS |
| [HOSTINGER_DDNS_QUICKSTART_INTEGRATION.md](./HOSTINGER_DDNS_QUICKSTART_INTEGRATION.md) | Integração rápida DDNS |
| [HOSTINGER_DDNS_REFERENCE.md](./HOSTINGER_DDNS_REFERENCE.md) | Referência DDNS |
| [HOSTINGER_DDNS_ENTREGA_COMPLETA.md](./HOSTINGER_DDNS_ENTREGA_COMPLETA.md) | Entrega completa DDNS |

### Desenvolvimento e Manutenção

| Documento | Descrição |
| --------- | --------- |
| [PLANO.md](./PLANO.md) | Plano de implementação consolidado (EasyPanel vs OpenPanel) |
| [ERRORS_FOUND.md](./ERRORS_FOUND.md) | Relatório de erros encontrados e status de correção |
| [TYPESCRIPT_FIXES.md](./TYPESCRIPT_FIXES.md) | Detalhes das correções TypeScript no frontend |
| [REVISAO_EXECUCAO.md](./REVISAO_EXECUCAO.md) | Revisão de execução do projeto (Jan 2025) - Correções e validações |

---

## 🆕 Novidades (Dezembro 2025)

- ✅ **2FA Completo**: Autenticação de dois fatores integrada (Backend + Frontend)
- ✅ **Terminal Real**: WebTerminal conectado via WebSocket
- ✅ **Database Clients**: Consoles para PostgreSQL, MySQL, MongoDB e Redis
- ✅ **Template Marketplace**: UI completa para deploy de templates
- ✅ **Zero Downtime**: Estratégia Blue-Green para deploys sem interrupção

---

> *Documentação consolidada em Dezembro de 2025.*
