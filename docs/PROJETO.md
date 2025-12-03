# 📅 OpenPanel - Projeto e Roadmap

Este documento contém o status atual do projeto, planos futuros e histórico de decisões.

---

## 🗺️ Roadmap Atual

**Última atualização**: Janeiro 2025
**Status**: Em desenvolvimento ativo (Fase 4 - Testes)

### ✅ Concluído (Fases 1-3)
- **Infraestrutura**: Dockerfiles otimizados, Logging profissional, Health Checks.
- **Segurança**: Headers de segurança, Rate Limiting, Autenticação JWT robusta, 2FA (TOTP).
- **Qualidade**: CI/CD Pipeline, ESLint/Prettier, 115+ correções TypeScript.
- **Funcionalidades**: 
    - WebSockets para logs e **Terminal Interativo** (Implementado).
    - Deploy de templates (Sistema base pronto, ~5 templates iniciais).
    - Zero Downtime Deployments.

### 🚧 Em Progresso (Fase 4)
- **Testes Automatizados**: Aumentar cobertura para 60% (Unitários e Integração).
- **Documentação**: Consolidação e tradução (Concluído).
- **Templates**: Expandir catálogo de templates de aplicação (Meta: 100+).

### 🔮 Futuro (Fase 5+)
- **Marketplace**: Sistema de plugins e templates da comunidade.
- **Multi-Node**: Suporte a cluster Swarm ou Kubernetes.
- **Billing**: Integração com Stripe/Gateway de pagamentos.
- **Mobile App**: App nativo para monitoramento.

---

## 📋 Status dos Planos de Implementação (.cursor/plans)

Abaixo o status dos planos encontrados na pasta `.cursor/plans`:

| Plano                               | Status       | Notas                                                                                            |
| ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `compara-o-easypanel-vs-open-panel` | 🟡 Parcial    | Terminal e Zero-Downtime implementados. Faltam os 120+ templates (sistema existe, conteúdo não). |
| `executar-corre-es-e-melhorias`     | ✅ Concluído  | Fases 1-3 de correções e melhorias finalizadas.                                                  |
| `limpeza-de-branches-git`           | 🔄 Recorrente | Tarefa de manutenção contínua.                                                                   |
| `melhorias-ui-responsiva`           | ✅ Concluído  | Diretrizes de design e melhorias implementadas.                                                  |
| `refatora-o-frontend-design-system` | ✅ Concluído  | Design System estabelecido.                                                                      |
| `revis-o-e-organiza-o-completa`     | ✅ Concluído  | Documentação consolidada e repositório organizado (Jan 2025).                                    |

---

## 📊 Métricas de Qualidade

| Área            | Nota (0-10) | Meta | Status |
| --------------- | ----------- | ---- | ------ |
| Arquitetura     | 9           | 9    | ✅      |
| Segurança       | 9           | 9    | ✅      |
| Observabilidade | 9           | 9    | ✅      |
| Documentação    | 10          | 10   | ✅      |
| Testes          | 7           | 8    | ⚠️      |
| Cobertura       | 40%         | 60%  | ⚠️      |

---

## 🏛️ Histórico e Arquivo

Para manter a documentação limpa, consolidamos vários documentos antigos.

### Documentos Consolidados (Jan 2025)

Os seguintes documentos foram absorvidos pelos manuais atuais (`MANUAL_DO_USUARIO`, `MANUAL_TECNICO`, `GUIA_DE_DESENVOLVIMENTO`):

- `INSTALL.md`, `QUICK_START.md` -> **Manual do Usuário**
- `architecture/*`, `domains/*`, `API.md` -> **Manual Técnico**
- `AGENTS.md`, `TESTING_CHECKLIST.md` -> **Guia de Desenvolvimento**
- `PLANO-CORRECOES.md`, `AUDITORIA-COMPLETA.md` -> **(Arquivados)**

### Decisões Arquiteturais Passadas

1. **Monorepo**: Adotado para facilitar compartilhamento de tipos entre Frontend e Backend.
2. **Hono vs Express**: Migramos para Hono pela performance e suporte a Edge, mantendo compatibilidade com Node.js.
3. **Prisma Singleton**: Implementado para resolver problemas de conexão em hot-reload e serverless.
4. **WebSocket Auth**: Decidido usar ticket/token na primeira mensagem em vez de query params por segurança (evitar logs de token).

---

> Este documento serve como fonte da verdade para o planejamento estratégico do OpenPanel.
