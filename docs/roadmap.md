# 🗺️ Roadmap do OpenPanel V2

Este roadmap foi atualizado para alinhar o desenvolvimento com o **Open Panel Design System** e as diretrizes do **AGENT_GUIDE.md** (OpenPanel V2.2.0).

**Meta Principal**: Replicar e aprimorar as funcionalidades do EasyPanel V2.2.0 com uma arquitetura robusta e design premium.

---

## 📅 Visão Geral das Fases

| Fase                              | Foco                                      | Status         | Estimativa |
| :-------------------------------- | :---------------------------------------- | :------------- | :--------- |
| **1. Fundação & Design**          | UI/UX, Design System, Frontend Base       | 🚧 Em Progresso | Sprint 1   |
| **2. Core Backend**               | Auth, Projetos, Serviços, Docker Wrapper  | ⏳ Pendente     | Sprint 2-3 |
| **3. Networking & Monitoramento** | Traefik, Domínios, Métricas em Tempo Real | ⏳ Pendente     | Sprint 4   |
| **4. Funcionalidades Avançadas**  | Backups, Builders, Server Management      | ⏳ Pendente     | Sprint 5   |
| **5. Agentes & IA**               | Integração Gemini, Assistente Inteligente | ⏳ Pendente     | Sprint 6   |

---

## 🏗️ Detalhamento das Fases

### Fase 1: Fundação & Design System (Atual)
**Objetivo**: Estabelecer a identidade visual e a estrutura do frontend conforme `DESING_SYSTEM.md`.

- [x] **Migração de Design**: Incorporar `docs/desing` em `apps/web`.
- [x] **Configuração Base**: React, Vite, Tailwind com variáveis CSS do Design System.
- [ ] **Componentes Core**:
    - [ ] Implementar Botões (Primary, Secondary, Tertiary, Destructive) conforme Design System.
    - [ ] Implementar Inputs (Normal, Focus, Error) e Formulários.
    - [ ] Implementar Cards e Layouts (Sidebar, Header).
- [ ] **Páginas Estáticas**:
    - [ ] Login (Visual final).
    - [ ] Dashboard (Layout com dados mockados).
    - [ ] Project Overview.

### Fase 2: Core Backend & Orquestração
**Objetivo**: Implementar a lógica de negócios descrita no `AGENT_GUIDE.md`.

- [ ] **Módulo de Identidade (Auth & User)**:
    - [ ] Login/Registro com JWT.
    - [ ] RBAC (Admin vs User).
    - [ ] 2FA e Recuperação de Senha.
- [ ] **Gestão de Projetos**:
    - [ ] CRUD de Projetos.
    - [ ] Variáveis de Ambiente Globais.
- [ ] **Gestão de Serviços (Docker Wrapper)**:
    - [ ] Integração com Docker API (via `dockerode` ou similar).
    - [ ] Suporte a Tipos: App, Database (MySQL, Redis, etc).
    - [ ] Marketplace de Templates (One-Click Apps).

### Fase 3: Networking & Monitoramento
**Objetivo**: Expor serviços e garantir observabilidade.

- [ ] **Networking (Traefik)**:
    - [ ] Geração dinâmica de configurações do Traefik.
    - [ ] Gestão de Domínios Customizados e Subdomínios.
    - [ ] SSL Automático (Let's Encrypt).
- [ ] **Monitoramento**:
    - [ ] Coleta de métricas (CPU, RAM, Net) dos containers.
    - [ ] Stream de Logs em tempo real (WebSockets).
    - [ ] Visualização de Eventos do Docker.

### Fase 4: Funcionalidades Avançadas (Server Management)
**Objetivo**: Ferramentas de administração do servidor.

- [ ] **Manutenção**:
    - [ ] Docker GC (Limpeza de imagens/cache).
    - [ ] Gestão de Backups (S3/Local).
- [ ] **Builders**:
    - [ ] Configuração de recursos para builds.
- [ ] **Integrações**:
    - [ ] GitHub (CI/CD).
    - [ ] Cloudflare Tunnel (Experimental).

### Fase 5: Agentes & IA
**Objetivo**: Tornar o painel inteligente.

- [ ] **Assistente Gemini**:
    - [ ] Chat integrado para suporte e operações.
    - [ ] Análise de logs e sugestão de correções.
    - [ ] Geração de configurações (Dockerfiles, Compose).

---

## 📝 Referências

- **Design System**: `docs/DESING_SYSTEM.md` - Cores, Tipografia, Componentes.
- **Guia do Agente**: `docs/agents/AGENT_GUIDE.md` - Especificação funcional completa V2.2.0.
- **Arquitetura**: `docs/architecture.md` - Visão técnica em camadas.
