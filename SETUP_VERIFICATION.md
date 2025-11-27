# ✅ Verificação de Setup do OpenPanel

Use este checklist para confirmar que seu setup está funcionando corretamente.

## 🔍 Pré-Requisitos

- [ ] Node.js instalado (v18+): `node --version`
- [ ] npm instalado (v10+): `npm --version`
- [ ] Docker Desktop instalado e rodando: `docker --version`
- [ ] docker-compose instalado: `docker-compose --version`

## 🐳 Containers

Execute os comandos abaixo para verificar o status:

```bash
# Ver status de todos os containers
docker-compose ps
```

**Esperado:**
- [ ] `openpanel-postgres` - **healthy** ✅
- [ ] `openpanel-redis` - **healthy** ✅
- [ ] `openpanel-traefik` - **healthy** ou **starting** ✅
- [ ] `openpanel-api` - **running** (será iniciado com `npm run dev`)
- [ ] `openpanel-web` - **running** (será iniciado com `npm run dev`)

## 🗄️ PostgreSQL

```bash
# Verificar logs
docker-compose logs postgres

# Testar conexão (opcional)
docker-compose exec postgres psql -U openpanel -d openpanel -c "SELECT 1;"
```

**Esperado:**
- [ ] Container está rodando
- [ ] Porta 5432 exposée
- [ ] Status: healthy
- [ ] Mensagem: `(1 row)` ao testar conexão

## 🔴 Redis

```bash
# Verificar logs
docker-compose logs redis

# Testar conexão (opcional)
docker-compose exec redis redis-cli -a changeme ping
```

**Esperado:**
- [ ] Container está rodando
- [ ] Porta 6379 exposta
- [ ] Status: healthy
- [ ] Resposta: `PONG`

## 🔀 Traefik (Reverse Proxy)

```bash
# Verificar logs
docker-compose logs traefik

# Acessar dashboard
# Navegue para: http://localhost:8080
```

**Esperado:**
- [ ] Container está rodando
- [ ] Portas 80, 443, 8080 expostas
- [ ] Dashboard acessível em http://localhost:8080

**Nota Windows:** Traefik pode ter erros de "Failed to retrieve Docker client". Veja `SETUP_WINDOWS.md` para instruções. Isso não afeta funcionamento básico.

## 🌍 Variáveis de Ambiente

```bash
# Verificar arquivo .env
cat .env | grep -E "DOCKER_SOCK|DATABASE_URL|REDIS_URL"
```

**Esperado:**
- [ ] `DOCKER_SOCK=//./pipe/docker_engine` (Windows) ou `/var/run/docker.sock` (Linux/macOS)
- [ ] `DATABASE_URL=postgresql://openpanel:changeme@localhost:5432/openpanel`
- [ ] `REDIS_URL=redis://:changeme@localhost:6379`

## 📦 Dependências

```bash
# Verificar instalação
npm list --depth=0

# Ou reinstalar se necessário
npm install
```

**Esperado:**
- [ ] Sem erros de dependência
- [ ] Pacotes instalados em node_modules/

## 🔄 Database Setup

```bash
# Gerar Prisma client
npm run db:generate

# Sincronizar schema
npm run db:push
```

**Esperado:**
- [ ] Ambos os comandos executam sem erros
- [ ] Arquivo .prisma/client/ criado

## 🚀 Iniciar Development

```bash
# Iniciar todos os serviços
npm run dev
```

**Esperado:**
- [ ] API rodando em http://localhost:3001
- [ ] Web rodando em http://localhost:3000
- [ ] Sem erros de conexão com banco de dados

## 🧪 Testes Finais

```bash
# Testar API (após npm run dev)
curl http://localhost:3001/health

# Testar Web
# Abra http://localhost:3000 no navegador
```

**Esperado:**
- [ ] API responde com status 200
- [ ] Web carrega interface normalmente
- [ ] Navegador sem erros de console

## 📋 Checklist Completo

- [ ] Node.js, npm, Docker instalados
- [ ] Todos containers rodando
- [ ] PostgreSQL healthy e acessível
- [ ] Redis healthy e respondendo
- [ ] Traefik rodando
- [ ] .env configurado corretamente
- [ ] Dependências instaladas
- [ ] Database sincronizado
- [ ] `npm run dev` funcionando
- [ ] API e Web acessíveis

## ❌ Troubleshooting

### Problema: "Cannot connect to Docker daemon"
- **Para Windows:** Leia `SETUP_WINDOWS.md` - use WSL2 ou TCP socket
- **Para Linux/macOS:** Verifique se Docker está rodando: `systemctl start docker`

### Problema: PostgreSQL connection refused
```bash
# Verificar se PostgreSQL está saudável
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Problema: Porta 5432/3000/3001 já em uso
```bash
# Encontrar processo usando porta
lsof -i :5432  # Para Linux/macOS
netstat -ano | findstr :5432  # Para Windows

# Ou usar portas diferentes em docker-compose.yml
```

### Problema: Permissões negadas em volumes
```bash
# Para Linux/macOS
sudo chown -R $USER:$USER .

# Para Windows (WSL2)
sudo chown -R $USER:$USER /mnt/d/Open-Panel
```

## 📞 Suporte

Se algo não funciona:
1. Verifique todos os pontos do checklist
2. Consulte `SETUP_WINDOWS.md` (se usando Windows)
3. Verifique logs: `docker-compose logs [service]`
4. Abra uma issue no GitHub com:
   - Seu SO
   - Output de `docker --version`
   - Output de `npm --version`
   - Logs relevantes

---

**Última atualização:** 27 de Novembro de 2025
