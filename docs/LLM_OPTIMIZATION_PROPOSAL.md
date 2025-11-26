# Proposta: Estrutura de Documentação Otimizada para LLMs

## 🧐 Análise da Estrutura Atual

A estrutura atual (`user-stories/`, `features/`, `architecture/`) é **Funcional**. Ela separa os documentos pelo *tipo* de informação.

### O Problema (Para LLMs)
Para entender uma única feature (ex: "Autenticação"), a LLM precisa ler 3-4 arquivos diferentes espalhados por pastas diferentes:
1. `docs/user-stories/authentication.md` (O que fazer)
2. `docs/features/01-authentication.md` (Como fazer)
3. `docs/api-reference/01-authentication.md` (Endpoints)
4. `docs/architecture/01-system-architecture.md` (Contexto global)

Isso gera **Fragmentação de Contexto**. A LLM gasta mais tokens e mais chamadas de ferramentas (`view_file`) para "montar" o quebra-cabeça na memória.

## 🚀 A Solução "Infinitamente Melhor": Domain-Driven Documentation

Em vez de separar por *tipo de documento*, separamos por **Domínio/Módulo**. Tudo sobre uma feature fica em um **único arquivo denso**.

### Nova Estrutura Proposta

```
docs/
├── KNOWLEDGE.md             ← (Mantido) Fonte da verdade global e rápida.
├── ARCHITECTURE.md          ← (Consolidado) Visão macro do sistema.
├── modules/                 ← A MÁGICA ACONTECE AQUI
│   ├── authentication.md    ← TUDO sobre Auth (Story + Tech Spec + API + Tasks)
│   ├── projects.md          ← TUDO sobre Projetos
│   ├── containers.md        ← TUDO sobre Docker/Containers
│   └── ...
└── guides/                  ← Walkthroughs para humanos (setup, deploy)
```

### Exemplo de um Arquivo de Módulo (`docs/modules/authentication.md`)

Este arquivo único conteria:

1.  **Contexto**: "Sistema de login JWT com Refresh Token e RBAC."
2.  **User Stories**: Lista de requisitos (ex: "Usuário deve poder resetar senha").
3.  **Tech Spec**:
    *   Schema do Banco (`model User`, `model Session`)
    *   Endpoints (`POST /auth/login`, `POST /auth/refresh`)
    *   Lógica Chave (ex: "Refresh token rotation strategy")
4.  **Arquivos Relacionados**: Mapa de onde está o código (`apps/api/src/services/auth.service.ts`).
5.  **Status**: Checklist de implementação.

## 🏆 Benefícios para LLMs

1.  **Leitura Única**: Com um único `view_file docs/modules/auth.md`, a LLM tem 100% do contexto necessário para trabalhar naquela feature.
2.  **Menor Alucinação**: As regras de negócio e a especificação técnica estão vizinhas, reduzindo a chance de implementar algo que contradiz o requisito.
3.  **Manutenção Fácil**: Alterou a feature? Atualiza um arquivo só.

## Plano de Migração (Sugestão)

1.  Criar a pasta `docs/modules/`.
2.  Fundir `user-stories/authentication.md` + `features/01-authentication.md` -> `docs/modules/authentication.md`.
3.  Repetir para outros domínios.
4.  Manter `walkthroughs` separados (pois são para humanos).
