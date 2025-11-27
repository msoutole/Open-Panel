# 📚 OpenPanel - Documentação

Documentação completa do OpenPanel - painel de controle self-hosted moderno com IA integrada.

---

## 🚀 Início Rápido

### Para Usuários
- **[README Principal](../README.md)** - Instalação e guia rápido
- **[Guia de Setup](./SETUP_GUIDE.md)** - Instalação detalhada por plataforma
- **[Quick Start](./QUICK_START.md)** - Primeiros passos
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Solução de problemas

### Para Desenvolvedores
- **[CLAUDE.md](../.claude/CLAUDE.md)** - Guia técnico completo
- **[Domain Docs](./domains/)** - Documentação por domínio (otimizada para LLMs)
- **[API Reference](./API.md)** - Documentação da API REST
- **[Arquitetura](./architecture/)** - Design do sistema

---

## 📂 Estrutura da Documentação

```
docs/
├── README.md                    # Este arquivo
├── SETUP_GUIDE.md              # Guia de instalação (todas as plataformas)
├── QUICK_START.md              # Início rápido
├── TROUBLESHOOTING.md          # Solução de problemas
├── API.md                      # Documentação da API
├── NEXT_STEPS.md               # Roadmap e próximos passos
├── TESTING_CHECKLIST.md        # Checklist de testes
│
├── domains/                    # Documentação por domínio
│   ├── INDEX.md               # Índice de todos os domínios
│   ├── authentication.md      # Autenticação e autorização
│   ├── projects-teams.md      # Projetos e colaboração
│   ├── containers.md          # Docker e deployments
│   ├── networking.md          # Domínios, SSL, Traefik
│   └── storage.md             # Backups e databases
│
└── architecture/              # Arquitetura do sistema
    └── 01-system-architecture.md
```

---

## 🎯 Documentação por Domínio (Recomendado)

A abordagem **Domain-Driven** concentra 100% do contexto de cada feature em um único arquivo:

**Por que usar?**
- ✅ Contexto completo em um só lugar
- ✅ Perfeito para LLMs (Claude, ChatGPT)
- ✅ Reduz fragmentação de informação
- ✅ Business rules + código juntos

**Domínios Disponíveis**:
- **[authentication.md](./domains/authentication.md)** - Login, JWT, users, API keys
- **[projects-teams.md](./domains/projects-teams.md)** - Projetos e times
- **[containers.md](./domains/containers.md)** - Docker, builds, deployments
- **[networking.md](./domains/networking.md)** - Domínios, SSL, proxy reverso
- **[storage.md](./domains/storage.md)** - Backups e bancos de dados

→ **[Ver índice completo](./domains/INDEX.md)**

---

## 🧭 Guia de Navegação

**Se você quer...**

| Objetivo | Documento |
|----------|-----------|
| Instalar o projeto | [SETUP_GUIDE.md](./SETUP_GUIDE.md) |
| Começar rapidamente | [QUICK_START.md](./QUICK_START.md) |
| Resolver problemas | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| Consultar API | [API.md](./API.md) |
| Entender uma feature | [Domain Docs](./domains/) |
| Desenvolver nova feature | [CLAUDE.md](../.claude/CLAUDE.md) + [Domain Docs](./domains/) |
| Entender arquitetura | [System Architecture](./architecture/01-system-architecture.md) |
| Ver roadmap | [NEXT_STEPS.md](./NEXT_STEPS.md) |

---

## 📊 Status do Projeto

| Aspecto | Status |
|---------|--------|
| Core Features | ✅ 85% |
| Documentação | ✅ Atualizada |
| Testes | 🔄 Em progresso |
| Produção-Ready | ⚠️ 80% |

---

## 🔗 Links Importantes

- **[Repositório GitHub](https://github.com/msoutole/openpanel)**
- **[README Principal](../README.md)**
- **[Guia de Desenvolvimento](../.claude/CLAUDE.md)**
- **[Review Geral do Projeto](../REVIEW_GERAL.md)**

---

**Última atualização**: 2025-11-27
**Versão**: 1.0

