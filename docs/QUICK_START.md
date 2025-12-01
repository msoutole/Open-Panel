# 🚀 Guia de Início Rápido

## Para Iniciar em Segundos

### ⚡ Um Único Comando

```bash
npm start
```

**Pronto!** Isso é tudo que você precisa. O script faz automaticamente:

1. ✅ Verifica pré-requisitos (Node.js 18+, Docker)
2. ✅ Cria arquivo `.env` na raiz com valores seguros
3. ✅ Sincroniza configurações com subprojetos (API e Web)
4. ✅ Instala dependências npm
5. ✅ Inicia containers Docker (PostgreSQL, Redis, Traefik)
6. ✅ Configura banco de dados
7. ✅ Cria usuário administrador
8. ✅ Inicia API e Web

> 💡 **Todas as configurações estão centralizadas no `.env` da raiz!**  
> Os arquivos `apps/api/.env` e `apps/web/.env.local` são sincronizados automaticamente.

### 📋 Pré-requisitos

Antes de executar `npm start`, certifique-se de ter:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
  - Certifique-se de que o Docker está rodando

### 🔑 Credenciais Padrão

Após a inicialização, use estas credenciais para fazer login:

- **Email**: `admin@admin.com.br`
- **Senha**: `admin123`

> ⚠️ **IMPORTANTE**: Você será solicitado a alterar a senha no primeiro login!

### 🌐 Acessar a Aplicação

Após `npm start` completar, acesse:

| Serviço | URL |
|---------|-----|
| 🌐 Web Interface | http://localhost:3000 |
| 🔌 API | http://localhost:3001 |
| 📊 Traefik Dashboard | http://localhost:8080 |

---

## ⚙️ Configuração Centralizada

### ⚠️ Regra de Ouro: Um Único Arquivo de Configuração

**TODAS as configurações estão centralizadas no arquivo `.env` na raiz do projeto.**

- ✅ **Um único arquivo** para todas as configurações
- ✅ **Sincronização automática** com subprojetos (API e Web)
- ✅ **Geração automática** de senhas seguras
- ✅ **Zero confusão** - não há múltiplos arquivos para editar

### Estrutura de Configuração

```
Open-Panel/
├── .env                    ← ✅ EDITE APENAS ESTE ARQUIVO
├── apps/
│   ├── api/
│   │   └── .env           ← ⚠️  Gerado automaticamente (NÃO editar)
│   └── web/
│       └── .env.local     ← ⚠️  Gerado automaticamente (NÃO editar)
```

### Como Configurar

1. **Edite apenas o `.env` na raiz do projeto**
2. **Execute `npm start`** - a sincronização é automática
3. **Pronto!** As mudanças serão aplicadas em todos os subprojetos

### ⚠️ Avisos Importantes

- ❌ **NÃO edite** `apps/api/.env` ou `apps/web/.env.local` manualmente
- ❌ **NÃO crie** arquivos `.env` adicionais nos subprojetos
- ✅ **SEMPRE edite** apenas o `.env` da raiz
- ✅ Os arquivos dos subprojetos são **gerados automaticamente** e serão **sobrescritos**

---

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Iniciar tudo (recomendado)
npm start

# Modo desenvolvimento (após primeira inicialização)
npm run dev              # API + Web em paralelo
npm run dev:api         # Apenas API
npm run dev:web         # Apenas Web
```

### Banco de Dados

```bash
npm run db:generate      # Gera Prisma Client
npm run db:push          # Sincroniza schema
npm run db:studio        # Abre Prisma Studio (GUI)
npm run db:migrate       # Executa migrações
```

### Docker

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Ver logs
docker-compose logs -f

# Ver status
docker-compose ps
```

### Build

```bash
npm run build            # Build completo
npm run build:api        # Build apenas API
npm run build:web        # Build apenas Web
```

---

## ⚠️ Solução de Problemas

### Docker não está rodando

**Erro**: `Cannot connect to Docker daemon`

**Solução**:
- **Windows/macOS**: Abra o Docker Desktop
- **Linux**: Execute `sudo systemctl start docker`

### Porta já em uso

**Erro**: `EADDRINUSE: address already in use`

**Solução**:
1. Encontre o processo usando a porta:
   ```bash
   # Linux/macOS
   lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```
2. Pare o processo ou altere a porta no `.env`

### Containers não iniciam

**Solução**:
```bash
# Ver logs dos containers
docker-compose logs

# Reiniciar tudo
docker-compose down -v
docker-compose up -d
```

### Erro de permissão (Linux)

**Solução**:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Banco de dados não conecta

**Solução**:
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Ver logs
docker logs openpanel-postgres

# Reiniciar
docker-compose restart postgres
```

---

## 📚 Próximos Passos

Após a inicialização bem-sucedida:

1. **Faça login** em http://localhost:3000
2. **Complete o onboarding** (tema, IA, senha)
3. **Explore o dashboard**
4. **Crie seu primeiro projeto**

---

## 📖 Documentação Completa

- **[INSTALL.md](./INSTALL.md)** - Guia completo de instalação
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Guia detalhado de configuração
- **[API.md](./API.md)** - Documentação da API
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solução de problemas

---

**Precisa de ajuda?** Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) ou abra uma issue no GitHub.
