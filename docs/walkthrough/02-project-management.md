# Walkthrough: Gerenciamento de Projetos

Guia completo para criar, configurar e gerenciar projetos no OpenPanel.

## 📚 Visão Geral

Um **Projeto** no OpenPanel é uma aplicação containerizada que você deseja executar. Pode ser:
- Aplicação Web (React, Vue, Next.js, etc.)
- API backend (Node.js, Python, Go, etc.)
- Worker (processamento em background)
- Job/Cron (tarefas agendadas)
- Database (PostgreSQL, MongoDB, etc.)
- Redis ou outros serviços

## 🆕 Criar um Novo Projeto

### Via Interface Web

1. **Acesse o Dashboard**
   - Abra http://localhost:3000
   - Faça login

2. **Clique em "New Project"**
   - Botão verde no canto superior direito
   - Ou menu "Projects" → "Create New"

3. **Preencha o Formulário**

   ```
   Nome do Projeto *
   └─ Exemplo: meu-app-web
      Requisitos: 3-50 caracteres, sem caracteres especiais

   Descrição
   └─ Exemplo: Aplicação web principal do sistema
      Requisitos: até 500 caracteres

   Tipo de Projeto *
   └─ Opções:
      - WEB: Aplicação web frontend (React, Vue, Next.js, etc.)
      - API: Backend API (Express, Hono, FastAPI, etc.)
      - WORKER: Processamento em background (Bull, Celery, etc.)
      - CRON: Jobs agendados (node-schedule, APScheduler, etc.)
      - DATABASE: Banco de dados (PostgreSQL, MySQL, MongoDB, Redis, etc.)
   ```

4. **Clique em "Create Project"**

### Via API REST

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer {seu_token_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "meu-app-web",
    "description": "Aplicação web principal",
    "type": "WEB"
  }'
```

## ⚙️ Configurar Projeto

Após criar, você será levado à página de detalhes do projeto. Configure:

### 1. Configuração Docker

No tab **"Docker"** ou **"Container Config"**:

```yaml
Docker Image *
└─ Exemplo: node:20-alpine
   Formato: [registry/]image:tag
   Formatos suportados:
   - image:tag (busca no Docker Hub)
   - registry.exemplo.com/image:tag (registry customizado)

Dockerfile
└─ Padrão: Dockerfile na raiz do repo
   Ou: ./docker/Dockerfile
   Deixe em branco para usar arquivo padrão

Build Context
└─ Diretório para build
   Padrão: . (raiz do repositório)

Docker Ports
└─ Portas que o container expõe
   Formato: 8000, 3000, 5432:5432
   Requisito: Mínimo uma porta (para roteamento Traefik)
```

### 2. Configuração de Recursos

No tab **"Resources"**:

```yaml
CPU Request
└─ Padrão: 100m (0.1 CPU)
   Valores: 100m, 250m, 500m, 1000m, 2000m
   Equivale a: 10%, 25%, 50%, 100%, 200% de 1 CPU

CPU Limit
└─ Padrão: 1000m (1 CPU)
   Máximo que o container pode usar

Memory Request
└─ Padrão: 128Mi
   Valores: 128Mi, 256Mi, 512Mi, 1Gi, 2Gi

Memory Limit
└─ Padrão: 512Mi
   Máximo de memória
```

### 3. Variáveis de Ambiente

No tab **"Environment"**:

1. **Adicionar Variável**
   - Clique em "Add Environment Variable"

   ```
   Nome *
   └─ Exemplo: DATABASE_URL
      Formato: UPPERCASE_WITH_UNDERSCORES

   Valor *
   └─ Exemplo: postgresql://user:pass@host:5432/db
      Confidencialidade: Marque como "Secret" se sensível
   ```

2. **Editar/Deletar**
   - Clique no ícone de edit (lápis) para editar
   - Clique no ícone de delete (lixo) para remover

**Exemplo de variáveis comuns:**

```env
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
API_KEY=seu-api-key-secreto
LOG_LEVEL=info
```

### 4. Configuração Git (Opcional)

No tab **"Git Repository"**:

```yaml
Repository URL *
└─ Exemplo: https://github.com/usuario/repo.git
   Formatos suportados:
   - HTTPS: https://github.com/usuario/repo.git
   - SSH: git@github.com:usuario/repo.git (requer SSH key)

Branch *
└─ Padrão: main
   Pode ser: main, develop, staging, etc.

Clone Depth
└─ Padrão: 50 (últimos 50 commits)
   Valores maiores = clone mais rápido
   Valores menores = mais histórico
```

**Se usando SSH:**

```bash
# Gerar chave SSH (na máquina do OpenPanel)
ssh-keygen -t ed25519 -f ~/.ssh/openpanel_deploy

# Copiar chave pública e adicionar no GitHub/GitLab/Bitbucket
cat ~/.ssh/openpanel_deploy.pub
```

### 5. Configuração de Build

No tab **"Build"**:

```yaml
Build Method *
└─ Opções:
   - dockerfile: Usar Dockerfile
   - nixpacks: Auto-detecção (recomendado)
   - paketo: Cloud Native Buildpacks
   - heroku: Heroku Buildpacks
   - docker-image: Usar imagem pronta (sem build)

Build Args
└─ Argumentos para passar ao build
   Formato: KEY=value,KEY2=value2
   Exemplo: NPM_ENV=production,REGISTRY_TOKEN=abc123
```

## 🚀 Deploy (Primeiras Etapas)

Após configurar, você pode fazer o primeiro deploy:

### Via Interface

1. **Abra o Projeto**
   - Dashboard → Projects → Seu projeto

2. **Clique em "Deploy"**
   - Botão verde "Deploy" ou "Start Build"
   - Sistema iniciará o build

3. **Acompanhe o Build**
   - Log de build em tempo real
   - Status: Building → Deploying → Success/Failed

### Via API

```bash
curl -X POST http://localhost:8000/api/builds \
  -H "Authorization: Bearer {seu_token_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "uuid-do-projeto"
  }'
```

## 📊 Visualizar Detalhes do Projeto

### Abas de Informação

**Overview**
- Status geral
- Última build
- Containers associados
- Domínios

**Deployments**
- Histórico de deployments
- Status de cada um
- Links para rollback

**Logs**
- Build logs (últimas 100 linhas)
- Deploy logs
- Container logs

**Environment**
- Variáveis de ambiente
- Modificar valores

**Containers**
- Containers associados
- Métricas
- Controles (start, stop, restart)

**Domains**
- Domínios configurados
- Status de SSL
- Link para gerenciar

**Settings**
- Editar projeto
- Configurações avançadas
- Deletar projeto

## 🔄 Atualizar Projeto

### Editar Configuração

1. Abra o projeto
2. Clique em **"Settings"** tab
3. Modifique os campos
4. Clique em **"Save"**

### Redeploy com Nova Configuração

```bash
# A nova configuração é aplicada no próximo deploy
# Clique em "Deploy" novamente
```

## 📋 Listar Projetos

### Via Interface

- Dashboard → Projects
- Mostra lista de todos os projetos
- Filtrar por status, tipo, etc.

### Via API

```bash
# Listar todos os projetos
curl http://localhost:8000/api/projects \
  -H "Authorization: Bearer {seu_token_jwt}"

# Resposta esperada:
{
  "projects": [
    {
      "id": "uuid",
      "name": "meu-app-web",
      "type": "WEB",
      "status": "ACTIVE",
      "createdAt": "2024-11-24T10:00:00Z",
      ...
    }
  ]
}
```

## ❌ Deletar Projeto

**⚠️ Aviso: Isso deletará o projeto e todos os seus dados!**

### Via Interface

1. Abra o projeto
2. Clique em **"Settings"** tab
3. Scroll para baixo até "Danger Zone"
4. Clique em **"Delete Project"**
5. Confirme digitando o nome do projeto

### Via API

```bash
curl -X DELETE http://localhost:8000/api/projects/{projectId} \
  -H "Authorization: Bearer {seu_token_jwt}"
```

## 🎯 Casos de Uso Comuns

### Caso 1: Deploying a Node.js Web App

```yaml
# Configuração mínima
Nome: meu-app-web
Tipo: WEB
Docker Image: node:20-alpine
Dockerfile: Dockerfile (padrão)
Port: 3000
Environment:
  - NODE_ENV=production
  - PORT=3000
```

**Dockerfile exemplo:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

### Caso 2: Python FastAPI

```yaml
Nome: python-api
Tipo: API
Docker Image: python:3.11-slim
Environment:
  - PORT=8000
Build Method: dockerfile
```

**Dockerfile exemplo:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

### Caso 3: PostgreSQL Database

```yaml
Nome: postgres-main
Tipo: DATABASE
Docker Image: postgres:15-alpine
Environment:
  - POSTGRES_PASSWORD=senhaSegura123
  - POSTGRES_DB=app_database
Port: 5432
```

## 📈 Monitoramento

Cada projeto tem métricas disponíveis:

- **CPU Usage**: Uso de CPU em %
- **Memory Usage**: Uso de memória em MB
- **Network**: Tráfego de rede (RX/TX)
- **Restarts**: Quantas vezes reiniciou
- **Last Updated**: Últimas alterações

## 🔐 Permissões e Colaboração

Por padrão, apenas o criador pode modificar o projeto.

Para compartilhar, veja [07-teams-collaboration.md](./07-teams-collaboration.md)

---

**Tempo estimado**: 15-20 minutos
**Último update**: 2024-11-24
