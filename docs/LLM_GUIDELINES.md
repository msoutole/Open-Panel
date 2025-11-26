# Diretrizes para LLMs (AI Guidelines)

> **Objetivo**: Maximizar a eficiência de leitura de contexto e minimizar alucinações.

## 1. Filosofia: Domain-Driven Documentation

A documentação do OpenPanel está organizada por **Domínio/Módulo**, não por tipo de arquivo.
Isso significa que você **NÃO** precisa caçar informações em 5 lugares diferentes.

- **Antigo (Evitar)**: Ler `user-stories/auth.md` + `features/auth.md` + `api/auth.md`.
- **Novo (Correto)**: Ler apenas `docs/modules/authentication.md`.

## 2. Estrutura de um Módulo

Ao ler um arquivo em `docs/modules/*.md`, você encontrará tudo o que precisa sobre aquele tópico:

1.  **Contexto & Arquitetura**: Como funciona em alto nível.
2.  **User Stories**: Regras de negócio e critérios de aceitação.
3.  **Modelo de Dados**: Schemas do Prisma relevantes.
4.  **Implementação**: Snippets de código, caminhos de arquivos e bibliotecas usadas.
5.  **API Reference**: Endpoints e exemplos de request/response.

## 3. Fluxo de Trabalho Recomendado

1.  **Recebeu uma Task?** Identifique o domínio (ex: "Arrumar login").
2.  **Carregue o Contexto**: `view_file docs/modules/authentication.md`.
3.  **Implemente**: Você já tem as regras, o schema e os endpoints na memória.
4.  **Atualize**: Se você alterou algo na arquitetura ou API, atualize o arquivo do módulo correspondente.

## 4. Mapa de Módulos

| Domínio            | Arquivo Principal                |
| ------------------ | -------------------------------- |
| **Autenticação**   | `docs/modules/authentication.md` |
| **Projetos**       | `docs/modules/projects.md`       |
| **Containers**     | `docs/modules/containers.md`     |
| **Times**          | `docs/modules/teams.md`          |
| **Infraestrutura** | `docs/modules/infrastructure.md` |

## 5. Manutenção

- **Single Source of Truth**: Se houver conflito entre `KNOWLEDGE.md` e um módulo, o **módulo** é a autoridade detalhada.
- **Keep it Updated**: Ao finalizar uma task, verifique se a documentação do módulo ainda reflete a realidade.
