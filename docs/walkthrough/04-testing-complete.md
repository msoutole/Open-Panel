# Walkthrough: Teste Completo do Projeto

Este documento descreve o processo de inicialização e teste completo do OpenPanel, incluindo todos os componentes (infraestrutura, backend e frontend).

## 📋 Pré-requisitos

- Node.js v20.18.0+
- Docker Desktop (Windows) ou Docker Engine (Linux)
- npm 10.0.0+

## 🚀 Iniciando o Projeto

### 1. Preparar Infraestrutura Docker

Os seguintes serviços são necessários e gerenciados via Docker Compose:

- **PostgreSQL**: Banco de dados principal (porta 5432)
- **Redis**: Cache e filas (porta 6379)
- **Ollama**: Servidor de IA local (porta 11434)
- **Traefik**: Proxy reverso (portas 80, 443, 8080)

**Comando:**
```bash
docker-compose down  # Limpar containers antigos
docker-compose up -d # Iniciar em background
```

**Verificar status:**
```bash
docker-compose ps
```

Todos os containers devem estar com status `Up`.

### 2. Aplicar Schema do Banco de Dados

```bash
npm run db:push
```

Este comando usa Prisma para sincronizar o schema com o banco PostgreSQL.

**Saída esperada:**
```
✔ Generated Prisma Client
```

### 3. Iniciar Servidores de Desenvolvimento

```bash
npm run dev
```

Este comando inicia:
- **Backend API** (porta 3001): `http://localhost:3001`
- **Frontend Web** (porta 3000): `http://localhost:3000`

**Logs esperados:**
```
Server running at http://localhost:3001
Container WebSocket gateway: ws://localhost:3001/ws/containers
```

## ⚠️ Problemas Conhecidos (Windows)

### Docker Socket não acessível
**Erro:** `connect ENOENT /var/run/docker.sock`

**Solução:** No Windows, o Docker Desktop expõe o socket em `npipe:////./pipe/docker_engine`. Atualize o `.env`:
```env
DOCKER_HOST=npipe:////./pipe/docker_engine
```

### Redis requer autenticação
**Erro:** `NOAUTH Authentication required`

**Solução:** O `docker-compose.yml` define `REDIS_PASSWORD=changeme`. Certifique-se de que o `.env` possui:
```env
REDIS_PASSWORD=changeme
```

### Comando `df` não encontrado
**Erro:** `'df' não é reconhecido...`

**Causa:** O backend tenta executar comandos Unix no Windows.

**Impacto:** Health checks de disco falham, mas não afetam a funcionalidade principal.

## 🧪 Validação Passo a Passo

### 1. Backend API
- [ ] API rodando em `http://localhost:3001`
- [ ] WebSocket gateway em `ws://localhost:3001/ws/containers`
- [ ] Prisma conectado ao Postgres
- [ ] Logs indicam "Server running"

### 2. Frontend Web
- [ ] Interface acessível em `http://localhost:3000`
- [ ] Página de login carrega
- [ ] Console do navegador sem erros fatais

### 3. Infraestrutura
- [ ] Postgres acessível (teste: `docker exec -it openpanel-postgres psql -U openpanel`)
- [ ] Redis acessível (teste: `docker exec -it openpanel-redis redis-cli -a changeme ping`)
- [ ] Traefik dashboard em `http://localhost:8080`

## 🔍 Testes Funcionais

### Criar um Projeto
1. Acesse `http://localhost:3000`
2. Faça login (usuário padrão: verificar seed do banco)
3. Clique em "New Project"
4. Preencha nome e tipo
5. Verifique se o projeto aparece na lista

### Gerenciar Serviço
1. Selecione um projeto
2. Clique em um serviço
3. Navegue pelas abas (Overview, Environment, Networking, etc.)
4. Teste adicionar uma variável de ambiente
5. Clique em "Save Variables"

### Verificar Logs em Tempo Real
1. Na aba "Overview" de um serviço
2. Verifique se os logs aparecem
3. Teste o botão "Console" para abrir terminal interativo

## 📊 Métricas de Sucesso

- ✅ Todos os containers Docker rodando
- ✅ Backend API sem crashes
- ✅ Frontend carrega e é interativo
- ✅ Conexão com Postgres funcional
- ✅ WebSocket de logs operacional

## 🐛 Debugging

### Ver logs do backend
```bash
# Os logs aparecem no terminal onde executou `npm run dev`
# Ou verifique individualmente:
npm run dev:api
```

### Ver logs do frontend
```bash
npm run dev:web
```

### Ver logs dos containers
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Verificar conectividade do Prisma
```bash
npm run db:studio
```

Isso abre o Prisma Studio em `http://localhost:5555` para visualizar o banco de dados.

## 🔄 Recomeçar do Zero

Se precisar limpar tudo e recomeçar:

```bash
# Parar e remover containers
docker-compose down -v

# Limpar node_modules (opcional, se houver problemas)
rm -rf node_modules apps/*/node_modules
npm install

# Reiniciar
docker-compose up -d
npm run db:push
npm run dev
```

---

**Última atualização**: 2025-11-24  
**Ambiente testado**: Windows 11, Docker Desktop, Node.js v20.18.0
