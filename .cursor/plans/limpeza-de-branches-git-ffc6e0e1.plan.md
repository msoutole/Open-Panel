<!-- ffc6e0e1-3c43-4a6f-af29-afb366652307 7a42f15a-d9d8-41e4-820b-1ce6507dd786 -->
# Organização Completa do Projeto OpenPanel

## Objetivo

Realizar uma revisão completa, validação de sintaxe, síntese de documentação, reorganização de estrutura de diretórios e remoção de código legado, garantindo uma organização profissional e manutenível do projeto.

## Situação Atual Identificada

### Problemas Críticos

1. **Documentação Duplicada e Desorganizada**

   - `README.md` na raiz e `docs/README.md` (conteúdo diferente)
   - `QUICKSTART.md` na raiz e `docs/QUICK_START.md` (conteúdo diferente)
   - `SETUP_GUIDE.md` na raiz e `docs/SETUP_GUIDE.md` (conteúdo diferente)
   - `INSTALL.md` na raiz (deveria estar em `docs/`)

2. **Arquivos Legados/Históricos**

   - `PLANO_IMPLEMENTACAO.md` - histórico de implementação
   - `REVIEW_GERAL.md` - review antigo
   - `test-user.json` - arquivo de teste temporário
   - `metadata.json` - metadata não utilizada

3. **Scripts na Raiz (deveriam estar em `scripts/`)**

   - `install.sh`, `install.ps1`, `install.py`
   - `check-services.sh`

4. **Arquivos de Log**

   - `apps/api/*.log` (api-errors.log, api-errors-2.log, api-errors-3.log, error.log)
   - `apps/web/*.log` (web-errors.log, web-errors-2.log, web-errors-3.log)
   - Devem estar em `logs/` ou `.gitignore`

5. **Arquivos Build/Dist**

   - `apps/api/dist/` e `apps/web/dist/` (já no `.gitignore`, mas existem)

6. **Código Legado**

   - Referências a `legacy` em `apps/web/constants.ts`
   - Suporte a dados não criptografados legados em `apps/api/src/middlewares/encryption.ts`

## Plano de Execução

### Fase 1: Validação de Sintaxe e Erros

#### 1.1 Validação TypeScript

- Executar `npm run type-check` em todos os workspaces
- Corrigir erros de tipo encontrados
- Validar imports e exports

#### 1.2 Validação de Lint

- Executar linter em todos os arquivos
- Corrigir problemas de formatação
- Aplicar regras de estilo consistentes

#### 1.3 Validação de JSON

- Validar todos os arquivos JSON (package.json, tsconfig.json, etc.)
- Verificar sintaxe correta
- Corrigir erros de formatação

#### 1.4 Validação de Markdown

- Verificar sintaxe de todos os arquivos `.md`
- Corrigir links quebrados
- Validar estrutura de headers

### Fase 2: Síntese e Consolidação de Documentação

#### 2.1 Consolidar Documentação de Setup

- **Manter**: `docs/SETUP_GUIDE.md` (versão completa e atualizada)
- **Remover**: `SETUP_GUIDE.md` da raiz (duplicado)
- **Sintetizar**: Consolidar informações de `INSTALL.md` em `docs/SETUP_GUIDE.md`
- **Mover**: `INSTALL.md` → `docs/INSTALL.md` (como referência histórica) ou remover se totalmente consolidado

#### 2.2 Consolidar Quick Start

- **Manter**: `docs/QUICK_START.md` (versão mais completa)
- **Remover**: `QUICKSTART.md` da raiz (duplicado)
- **Atualizar**: Garantir que `docs/QUICK_START.md` tenha todas as informações relevantes

#### 2.3 Consolidar README

- **Manter**: `README.md` na raiz (principal, focado em instalação rápida)
- **Manter**: `docs/README.md` (índice de documentação)
- **Atualizar**: Garantir que ambos estejam sincronizados e não duplicados

#### 2.4 Remover Documentação Histórica

- **Mover para `docs/archive/`** (criar pasta):
  - `PLANO_IMPLEMENTACAO.md` → `docs/archive/PLANO_IMPLEMENTACAO.md`
  - `REVIEW_GERAL.md` → `docs/archive/REVIEW_GERAL.md`
- **Justificativa**: Manter histórico mas não poluir raiz

### Fase 3: Reorganização de Arquivos

#### 3.1 Mover Scripts para `scripts/`

- **Mover**:
  - `install.sh` → `scripts/install/install.sh`
  - `install.ps1` → `scripts/install/install.ps1`
  - `install.py` → `scripts/install/install.py`
  - `check-services.sh` → `scripts/utils/check-services.sh`
- **Atualizar**: Referências nos documentos e `package.json`

#### 3.2 Organizar Arquivos de Log

- **Criar estrutura**:
  - `apps/api/logs/` (se não existir)
  - `apps/web/logs/` (se não existir)
- **Mover logs**:
  - `apps/api/*.log` → `apps/api/logs/`
  - `apps/web/*.log` → `apps/web/logs/`
- **Atualizar `.gitignore`**: Garantir que `*.log` esteja ignorado

#### 3.3 Limpar Arquivos Build

- **Remover**: `apps/api/dist/` e `apps/web/dist/` (serão regenerados)
- **Verificar**: `.gitignore` já ignora `dist/`

#### 3.4 Organizar Arquivos de Teste

- **Mover**: `test-user.json` → `apps/api/__tests__/fixtures/test-user.json`
- **Remover**: `metadata.json` (não utilizado) ou mover para `docs/archive/`

### Fase 4: Remoção de Código Legado

#### 4.1 Remover Referências Legacy no Frontend

- **Arquivo**: `apps/web/constants.ts`
- **Ação**: Remover ou atualizar referência a `proj_legacy`

#### 4.2 Revisar Suporte Legacy no Backend

- **Arquivo**: `apps/api/src/middlewares/encryption.ts`
- **Ação**: Avaliar se suporte a dados não criptografados legados ainda é necessário
- **Decisão**: Manter com comentário claro sobre deprecação ou remover se não usado

#### 4.3 Limpar TODOs e FIXMEs

- **Buscar**: Todos os `TODO`, `FIXME`, `DEPRECATED` no código
- **Ação**: Resolver ou documentar adequadamente
- **Arquivos identificados**:
  - `apps/api/src/routes/settings.ts` (2 TODOs)
  - `docs/domains/projects-teams.md` (1 TODO)
  - `docs/domains/authentication.md` (1 TODO)

### Fase 5: Validação Final e Estrutura

#### 5.1 Validar Estrutura de Diretórios

```
Open-Panel/
├── apps/
│   ├── api/
│   │   ├── logs/              # Logs organizados
│   │   ├── src/
│   │   └── ...
│   └── web/
│       ├── logs/              # Logs organizados
│       └── ...
├── docs/
│   ├── archive/               # Documentação histórica
│   ├── domains/               # Documentação por domínio
│   ├── architecture/          # Arquitetura
│   └── *.md                   # Documentação principal
├── scripts/
│   ├── install/               # Scripts de instalação
│   ├── setup/                 # Scripts de setup
│   ├── start/                 # Scripts de inicialização
│   ├── status/                # Scripts de status
│   └── utils/                 # Utilitários
└── packages/
    └── shared/                # Código compartilhado
```

#### 5.2 Atualizar Referências

- Atualizar links em todos os documentos
- Atualizar `package.json` scripts se necessário
- Atualizar `README.md` com nova estrutura

#### 5.3 Validação Final

- Executar `npm run type-check`
- Executar linter
- Verificar que todos os arquivos estão em seus lugares corretos
- Confirmar que não há arquivos órfãos

## Ferramentas e Comandos

### Validação

```bash
# TypeScript
npm run type-check

# Lint (se configurado)
npm run lint

# Testes (se existirem)
npm test
```

### Organização

```bash
# Criar diretórios necessários
mkdir -p docs/archive
mkdir -p scripts/install
mkdir -p apps/api/logs
mkdir -p apps/web/logs
mkdir -p apps/api/__tests__/fixtures
```

## Resultado Esperado

- ✅ Todos os arquivos validados sem erros de sintaxe
- ✅ Documentação consolidada e sem duplicações
- ✅ Estrutura de diretórios organizada e lógica
- ✅ Código legado removido ou documentado
- ✅ Arquivos temporários e logs organizados
- ✅ Referências atualizadas em toda a documentação
- ✅ Projeto pronto para manutenção e desenvolvimento contínuo

### To-dos

- [ ] Validar sintaxe TypeScript, JSON e Markdown em todos os arquivos
- [ ] Consolidar e sintetizar documentação duplicada, mover arquivos históricos para docs/archive/
- [ ] Mover scripts para scripts/, organizar logs em apps/*/logs/, limpar arquivos build
- [ ] Remover código legado, limpar TODOs/FIXMEs, atualizar referências legacy
- [ ] Atualizar todas as referências em documentos e código para nova estrutura
- [ ] Validação final: type-check, lint, verificar estrutura completa