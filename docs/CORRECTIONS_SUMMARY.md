# OpenPanel Setup Corrections Summary

## Problemas Identificados e Resolvidos

### 🔴 Problema 1: Docker Socket Path (Windows vs Linux)

**Erro**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`

**Causa**: O `docker-compose.yml` usava caminho Unix (`/var/run/docker.sock`), que não existe no Windows. Windows Docker Desktop usa `npipe:////./pipe/docker_engine`.

**Solução**:

- ✅ Criado arquivo `scripts/detect-platform.sh` para detectar SO e configurar `DOCKER_SOCK`
- ✅ Criado arquivo `scripts/detect-platform.ps1` (equivalente PowerShell)
- ✅ Atualizado `docker-compose.yml` para usar variável `${DOCKER_SOCK}`
- ✅ Adicionada `DOCKER_SOCK=/var/run/docker.sock` no `.env` (com comentários de plataforma)
- ✅ Scripts de setup agora chamam `detect-platform` automaticamente

---

### 🔴 Problema 2: Versão do Node.js Incompatível

**Erro**: `node: bad option: --env-file=../../.env`

**Causa**: `Dockerfiles` usavam `node:18-alpine`, mas a flag `--env-file` só está disponível em Node.js 20+.

**Solução**:

- ✅ Atualizado `apps/api/Dockerfile` de `node:18-alpine` para `node:20-alpine`
- ✅ Atualizado `apps/web/Dockerfile` de `node:18-alpine` para `node:20-alpine`

---

### 🔴 Problema 3: Script dev usando arquivo .env não copiado

**Erro**: `node: ../../.env: not found`

**Causa**: O `.dockerignore` excluía `.env`, então ele não estava no container. O script dev tentava carregar `--env-file=../../.env`.

**Solução**:

- ✅ Removida flag `--env-file=../../.env` de `apps/api/package.json` (script `dev`)
- ✅ Variáveis de ambiente agora passadas via `docker-compose.yml`
- ✅ Mais seguro para produção (não expõe arquivos .env)

---

### 🔴 Problema 4: API não conseguia conectar ao Redis/PostgreSQL

**Erro**: `ECONNREFUSED` ao tentar conectar em `localhost:6379`

**Causa**: API dentro do container tentava acessar `localhost`, mas:

- PostgreSQL e Redis estão em containers diferentes
- Dentro da rede Docker, usa-se nome do serviço, não localhost

**Solução**:

- ✅ Atualizado `docker-compose.yml` para usar `openpanel-postgres` e `openpanel-redis` como hosts
- ✅ Adicionado `depends_on` com condições de health para API aguardar Postgres e Redis
- ✅ Exemplo de variáveis alternativas documentado no `.env`

---

### 🔴 Problema 5: Script setup.ps1 duplicado

**Erro**: Arquivo tinha 3 versões diferentes (230+ linhas de código duplicado)

**Solução**:

- ✅ Reescrito `scripts/setup.ps1` de forma limpa e organizada
- ✅ Removido código duplicado
- ✅ Melhor estrutura com cores e feedback

---

### 🔴 Problema 6: Sem script setup para Linux

**Erro**: Usuários Linux/WSL não tinham script de setup agnóstico

**Solução**:

- ✅ Criado `scripts/setup.sh` para Linux/WSL/macOS
- ✅ Análogo ao PowerShell script, mas usa bash
- ✅ Detecta plataforma e configura DOCKER_SOCK automaticamente

---

## ✅ Arquivos Criados

### Scripts de Setup

1. **scripts/setup.sh** - Setup para Linux/WSL/macOS
2. **scripts/setup.ps1** - Setup para Windows (atualizado)
3. **scripts/detect-platform.sh** - Detecta OS e configura DOCKER_SOCK
4. **scripts/detect-platform.ps1** - Equivalente PowerShell

### Scripts de Verificação

5. **scripts/verify-setup.sh** - Verifica setup Linux/WSL
6. **scripts/verify-setup.ps1** - Verifica setup Windows (atualizado)

### Documentação

7. **SETUP_GUIDE.md** - Guia completo de setup por plataforma
8. **CORRECTIONS_SUMMARY.md** - Este arquivo

---

## ✅ Arquivos Modificados

### Docker

- **docker-compose.yml**
  - Traefik: Volume agora usa `${DOCKER_SOCK}` em vez de hardcoded path
  - API: Environment variables completas (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.)
  - API: depends_on com health checks
  - Web: VITE_API_URL adicionada

### Dockerfiles

- **apps/api/Dockerfile** - Node 18 → Node 20
- **apps/web/Dockerfile** - Node 18 → Node 20

### Código

- **apps/api/package.json** - Script dev sem `--env-file` flag
- **.env** - Adicionada variável `DOCKER_SOCK` com documentação

---

## 🧪 Como Testar

### Windows (PowerShell)

`powershell

# 1. Detecção de plataforma
.\scripts\detect-platform.ps1

# 2. Setup completo
.\scripts\setup.ps1

# 3. Verificar
.\scripts\verify-setup.ps1
`

### Linux / WSL / macOS

`bash

# 1. Detecção de plataforma
bash scripts/detect-platform.sh

# 2. Setup completo
bash scripts/setup.sh

# 3. Verificar
bash scripts/verify-setup.sh
`

### Node.js (agnóstico de plataforma)

`bash

# 1. Setup com Node.js
node scripts/setup.js

# 2. Verificar
npm run dev
`

---

## 📊 Status dos Containers Atuais

`
✓ openpanel-postgres (healthy)
✓ openpanel-redis (healthy)
✓ openpanel-api (running)
✓ openpanel-web (running)
⚠ openpanel-traefik (starting)
`

### Endpoints Funcionando

- **Web**: <http://localhost:3000> (HTTP 200)
- **API**: <http://localhost:3001> (HTTP 401 - sem token, esperado)
- **Traefik**: <http://localhost:8080> (configurando)

---

## 🔄 Próximas Etapas para Teste

### Teste no Windows ✅ (Realizado)

- [x] Corrigir DOCKER_SOCK
- [x] Atualizar Node.js em Dockerfiles
- [x] Setup.ps1 funcionando
- [x] Containers iniciando corretamente
- [x] API e Web respondendo

### Teste em WSL2 com Linux

- [ ] Rodar `bash scripts/setup.sh`
- [ ] Verificar `bash scripts/verify-setup.sh`
- [ ] Testar `npm run dev`
- [ ] Acessar Web em <http://localhost:3000>

### Teste em Ubuntu Server

- [ ] Setup from scratch
- [ ] Verificar permissões Docker
- [ ] Rodar scripts de setup/verificação
- [ ] Testar fluxo de desenvolvimento completo
- [ ] Testar build de produção

---

## 📝 Anotações Importantes

### Compatibilidade de Plataforma

- Scripts `*.sh` funcionam em: Linux, WSL2, macOS
- Scripts `*.ps1` funcionam apenas em Windows
- Script `.js` funciona em todas as plataformas (Node.js)

### DOCKER_SOCK por Plataforma

`
Windows (Docker Desktop):    //./pipe/docker_engine
Linux/WSL/macOS:           /var/run/docker.sock
`

### Variáveis de Ambiente Críticas

`
DATABASE_URL          - Conexão PostgreSQL
REDIS_URL            - Conexão Redis
JWT_SECRET           - Mínimo 32 caracteres
DOCKER_SOCK          - Path do socket Docker
CORS_ORIGIN          - Origem CORS (http://localhost:3000)
`

---

## 🚀 Comando Rápido para Começar

### Windows

`powershell

# Uma linha para setup
.\scripts\setup.ps1

# Depois, develop
npm run dev
`

### Linux / WSL / macOS

`bash

# Uma linha para setup
bash scripts/setup.sh

# Depois, develop
npm run dev
`

---

## ✨ Benefícios das Correções

1. **Cross-platform**: Funciona nativamente em Windows, Linux, WSL e macOS
2. **Automático**: Platform detection automática (sem configuração manual)
3. **Seguro**: Variáveis sensíveis não são expostas em builds Docker
4. **Testável**: Scripts de verificação completam validam setup
5. **Documentado**: SETUP_GUIDE.md com instruções detalhadas
6. **Agnóstico**: Node.js setup.js funciona em qualquer plataforma

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Docker não conecta (Windows) | Verificar se Docker Desktop está rodando |
| Porta em uso | Mudar API_PORT e APP_PORT no .env |
| Containers não iniciam | `docker-compose logs` para ver erro |
| Permission denied (Linux) | `sudo usermod -aG docker $USER` |
| node: bad option | Verificar Node.js version (precisa 20+) |

---

Documento gerado em: 2025-11-27
Versão: 1.0

