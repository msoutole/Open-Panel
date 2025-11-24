# Walkthrough: Guia de Primeiros Passos

Este guia te ajudará a configurar o OpenPanel localmente e fazer seu primeiro login.

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm >= 10.0.0
- Docker e Docker Compose instalados
- Git instalado
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🚀 Setup Inicial (5-10 minutos)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/msoutole/openpanel.git
cd openpanel
```

### Passo 2: Instalar Dependências

```bash
npm install
```

Isso instalará as dependências de todos os workspaces (api, web, shared).

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com seus valores
# Variáveis obrigatórias:
# - DATABASE_URL: postgresql://postgres:postgres@localhost:5432/openpanel
# - REDIS_URL: redis://localhost:6379
# - JWT_SECRET: gerar um hash seguro (mínimo 32 caracteres)
# - CORS_ORIGIN: http://localhost:3000
```

### Passo 4: Iniciar Infraestrutura (Docker Compose)

```bash
docker-compose up -d
```

Isso iniciará:
- **PostgreSQL** (porta 5432) - Banco de dados principal
- **Redis** (porta 6379) - Cache e filas de jobs
- **Ollama** (porta 11434) - LLM local (opcional para IA)
- **Traefik** (portas 80/443/8080) - Reverse proxy

### Passo 5: Setup do Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema
npm run db:push

# Abrir Prisma Studio (opcional - para ver dados)
npm run db:studio
```

### Passo 6: Iniciar Aplicação

```bash
# Iniciar tanto API quanto Web (em paralelo)
npm run dev

# Ou, em terminais separados:
# Terminal 1:
npm run dev:api    # API rodará em http://localhost:8000

# Terminal 2:
npm run dev:web    # Web rodará em http://localhost:3000
```

## 🔐 Primeiro Acesso

### Passo 1: Acessar a Aplicação

Abra seu navegador e vá para:
```
http://localhost:3000
```

Você verá a página de login.

### Passo 2: Registrar Primeira Conta

1. Clique em **"Register"** (se disponível) ou **"Sign Up"**
2. Preencha os campos:
   - **Email**: seu.email@exemplo.com
   - **Nome**: Seu Nome
   - **Senha**: Senha forte (mínimo 8 caracteres)
3. Clique em **"Register"**

Alternativa: Se a rota de registro estiver protegida, faça requisição direta:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu.email@exemplo.com",
    "name": "Seu Nome",
    "password": "SenhaForte123!"
  }'
```

### Passo 3: Fazer Login

1. Preencha email e senha
2. Clique em **"Login"**
3. Você será redirecionado para o **Dashboard**

## 📊 Dashboard Principal

Após o login, você verá o Dashboard com:

### Seções Principais

1. **Visão Geral** (Overview)
   - Status geral do sistema
   - Projetos ativos
   - Containers rodando
   - Alertas (se houver)

2. **Projetos** (Projects)
   - Lista de seus projetos
   - Status de cada projeto
   - Links rápidos para gerenciar

3. **Containers** (Containers)
   - Containers em execução
   - Métricas (CPU, memória)
   - Controles de start/stop/restart

4. **Estatísticas** (Statistics)
   - Gráficos de CPU e memória
   - Histórico de deployments
   - Alertas de saúde

## 🏗️ Criar Seu Primeiro Projeto

Siga o guia completo em [02-project-management.md](./02-project-management.md), mas resumidamente:

### Quick Start

1. Clique em **"New Project"** (botão verde)
2. Preencha os campos:
   - **Nome**: meu-primeiro-projeto
   - **Descrição**: Projeto de teste
   - **Tipo**: Web (React, Vue, Next.js, etc.)
3. Clique em **"Create Project"**

Você será levado aos detalhes do projeto onde pode:
- Configurar variáveis de ambiente
- Conectar repositório Git
- Definir recursos (CPU, memória)
- Deployar

## 🐳 Gerenciar um Container

Para entender melhor, você pode listar containers existentes:

```bash
# Via API
curl http://localhost:8000/api/containers \
  -H "Authorization: Bearer {seu_token_jwt}"

# Via Terminal
npm run dev  # Acessar http://localhost:3000
# Ir para seção "Containers" no dashboard
```

## 📡 Verificar Status da API

Faça um health check da API:

```bash
curl http://localhost:8000/health
# Resposta esperada: {"status": "ok"}
```

## 🔧 Troubleshooting

### A API não está rodando

```bash
# Verificar se porta 8000 está em uso
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Rodar API em porta diferente
PORT=8001 npm run dev:api
```

### Docker Compose falha ao iniciar

```bash
# Ver logs dos containers
docker-compose logs -f

# Remover containers e volumes antigos
docker-compose down -v

# Iniciar novamente
docker-compose up -d
```

### Banco de dados não sincroniza

```bash
# Verificar conexão do Prisma
npm run db:push

# Se falhar, resetar (CUIDADO: perde dados)
npm run db:push -- --skip-validation --force-reset
```

### Web não conecta à API

```bash
# Verificar CORS_ORIGIN em .env.local
# Deve ser exatamente: http://localhost:3000

# Verificar se API está rodando
curl http://localhost:8000/health

# Limpar cache do navegador (Ctrl+Shift+Delete)
```

## ✅ Verificar Setup Completo

Execute este checklist:

- [ ] Node.js e npm instalados (`npm -v`)
- [ ] Docker Compose rodando (`docker-compose ps`)
- [ ] PostgreSQL respondendo (`docker-compose exec postgres psql -U postgres -c "SELECT 1"`)
- [ ] Redis respondendo (`docker-compose exec redis redis-cli ping`)
- [ ] API rodando (`curl http://localhost:8000/health`)
- [ ] Web acessível (`http://localhost:3000`)
- [ ] Conseguiu registrar usuário
- [ ] Conseguiu fazer login

## 🎓 Próximos Passos

Após confirmar que tudo está funcionando:

1. **[Gerenciar Projetos](./02-project-management.md)** - Crie e configure projetos
2. **[Deploy e Builds](./03-deployments.md)** - Configure builds automáticos
3. **[Gerenciar Containers](./04-container-management.md)** - Controle containers Docker
4. **[Domínios e SSL](./05-domains-ssl.md)** - Configure domínios e HTTPS

## 📚 Recursos Adicionais

- **[CLAUDE.md](../../CLAUDE.md)** - Informações técnicas da arquitetura
- **[Architecture](../architecture/)** - Documentação técnica detalhada
- **[API Reference](../api-reference/)** - Documentação de endpoints
- **[GitHub](https://github.com/msoutole/openpanel)** - Repositório oficial

---

**Tempo estimado**: 10-15 minutos para completar
**Último update**: 2024-11-24
