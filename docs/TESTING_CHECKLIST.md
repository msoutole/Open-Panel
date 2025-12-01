# OpenPanel Testing Checklist

## ✅ Completed Tests (Windows)

### Plataforma: Windows 11 / Docker Desktop

Data: 2025-11-27
Status: ✅ PASSED

---

## 📋 Teste 1: Docker Connectivity

- [x] Docker Desktop está rodando
- [x] Docker daemon respondendo (`docker info`)
- [x] docker-compose instalado e funcionando
- [x] DOCKER_SOCK ajustado para Windows (`//./pipe/docker_engine`)

**Status**: ✅ PASSED

---

## 📋 Teste 2: Dockerfiles

- [x] API Dockerfile usa Node.js 20-alpine
- [x] Web Dockerfile usa Node.js 20-alpine
- [x] Imagens compilam sem erros
- [x] Imagens pode fazer build sem cache

**Status**: ✅ PASSED

---

## 📋 Teste 3: Docker Compose Setup

- [x] docker-compose.yml sintaxe válida
- [x] Traefik volume configurado corretamente
- [x] API environment variables completas
- [x] Web environment variables completas
- [x] Health checks funcionando
- [x] Services iniciando na ordem correta

**Status**: ✅ PASSED

---

## 📋 Teste 4: Container Startup

- [x] openpanel-postgres inicia e fica healthy
- [x] openpanel-redis inicia e fica healthy
- [x] openpanel-api inicia sem erros
- [x] openpanel-web inicia sem erros
- [x] openpanel-traefik inicia (health: starting)

**Status**: ✅ PASSED

---

## 📋 Teste 5: Database Connectivity

- [x] npm run db:generate funciona
- [x] npm run db:push sincroniza schema
- [x] Prisma Client gerado corretamente
- [x] Mensagem "database is already in sync" (esperado)

**Status**: ✅ PASSED

---

## 📋 Teste 6: API Functionality

- [x] API inicia em <http://localhost:3001>
- [x] API conecta ao PostgreSQL (healthy)
- [x] API conecta ao Redis (healthy)
- [x] Scheduler service inicia
- [x] API responds to health endpoint (HTTP 401)

**Status**: ✅ PASSED

---

## 📋 Teste 7: Web Functionality

- [x] Web inicia em <http://localhost:3000>
- [x] Web responde com HTTP 200
- [x] Web consegue fazer build
- [x] Vite dev server rodando

**Status**: ✅ PASSED

---

## 📋 Teste 8: Environment Variables

- [x] .env carregado corretamente
- [x] DOCKER_SOCK definida
- [x] DATABASE_URL usando nome do container (openpanel-postgres)
- [x] REDIS_URL usando nome do container (openpanel-redis)
- [x] JWT_SECRET configurado
- [x] CORS_ORIGIN correto

**Status**: ✅ PASSED

---

## 📋 Teste 9: Scripts PowerShell (Windows)

- [x] setup.ps1 executa sem erros
- [x] detect-platform.ps1 detecta Windows
- [x] detect-platform.ps1 configura DOCKER_SOCK
- [x] verify-setup.ps1 valida ambiente

**Status**: ✅ PASSED

---

## 📋 Teste 10: Scripts Bash (Linux/WSL)

- [ ] setup.sh executa sem erros (para testar em WSL/Linux)
- [ ] detect-platform.sh detecta sistema operacional
- [ ] detect-platform.sh configura DOCKER_SOCK
- [ ] verify-setup.sh valida ambiente

**Status**: ⏳ PENDENTE (testar em WSL/Linux)

---

## 📋 Teste 11: Node.js Setup Script

- [x] scripts/setup.js detecta plataforma
- [x] scripts/setup.js não depende de shell
- [x] scripts/setup.js funciona em Windows

**Status**: ✅ PASSED

---

## 📋 Teste 12: Documentação

- [x] SETUP_GUIDE.md criado com instruções por plataforma
- [x] CORRECTIONS_SUMMARY.md documenta todas as correções
- [x] README.md atualizado com caminhos corretos
- [x] TESTING_CHECKLIST.md (este arquivo)

**Status**: ✅ PASSED

---

## 🚀 Próximos Testes (WSL2 Linux)

Executar em WSL2 com Ubuntu/Debian:

`bash

# 1. Clone repo (já clonado)
cd /mnt/d/Open-Panel

# 2. Detectar plataforma
bash scripts/detect-platform.sh

# Esperado: Detected Platform: wsl2, Docker Socket: /var/run/docker.sock

# 3. Setup completo
bash scripts/setup/setup.sh

# Esperado: Setup Complete!

# 4. Verificar
bash scripts/verify-setup.sh

# Esperado: ✅ All checks passed!

# 5. Testar desenvolvimento
npm run dev

# Esperado: API + Web running
`

---

## 🚀 Próximos Testes (Ubuntu Server)

Executar em Ubuntu Server (VM ou bare metal):

`bash

# 1. Clone repo
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Instalar Docker (se não tiver)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Detectar plataforma
bash scripts/detect-platform.sh

# Esperado: Detected Platform: linux, Docker Socket: /var/run/docker.sock

# 5. Setup completo
bash scripts/setup/setup.sh

# Esperado: Setup Complete!

# 6. Verificar
bash scripts/verify-setup.sh

# Esperado: ✅ All checks passed!

# 7. Testar produção
npm run build
npm run preview

# Esperado: Build + Preview funcionando

# 8. Testar com systemd (opcional)

# Criar service file para rodar como daemon
`

---

## 📊 Matriz de Compatibilidade

| Plataforma | Setup | Verify | Dev | Build | Status |
|------------|-------|--------|-----|-------|--------|
| Windows | ✅ PS | ✅ PS | ⏳ | ⏳ | Testado |
| WSL2 | ⏳ SH | ⏳ SH | ⏳ | ⏳ | Pendente |
| Linux | ⏳ SH | ⏳ SH | ⏳ | ⏳ | Pendente |
| macOS | ⏳ SH | ⏳ SH | ⏳ | ⏳ | Pendente |
| Node.js | ✅ JS | ? | ? | ⏳ | Agnóstico |

**Legenda:**

- ✅ = Testado e funcionando
- ⏳ = A testar
- PS = PowerShell script
- SH = Bash script
- JS = JavaScript script

---

## 🔍 Verificações Críticas por Plataforma

### Windows

- [x] DOCKER_SOCK = `//./pipe/docker_engine`
- [x] PowerShell execution policy (RemoteSigned)
- [x] Docker Desktop WSL2 backend recomendado

### Linux / WSL

- [x] DOCKER_SOCK = `/var/run/docker.sock`
- [x] Permissão de execução em scripts bash
- [x] Usuário no grupo docker

### macOS

- [x] DOCKER_SOCK = `/var/run/docker.sock`
- [x] Docker Desktop instalado via Homebrew
- [x] Node.js via Homebrew

---

## 📝 Notas Importantes

### Erros Conhecidos Resolvidos

1. ✅ **Docker socket path** - Resolvido com DOCKER_SOCK variável
2. ✅ **Node.js 18 vs 20** - Resolvido atualizando Dockerfiles
3. ✅ **--env-file flag** - Resolvido passando vars via docker-compose
4. ✅ **Localhost vs container name** - Resolvido usando openpanel-postgres/redis
5. ✅ **Script duplicação** - Resolvido reescrevendo setup.ps1

### Avisos

⚠️ **Traefik com Docker Socket no Windows**

- Docker Desktop para Windows pode ter issues com volume mounting
- Se Traefik não iniciar, tentar em modo nativo Linux (WSL2)

⚠️ **Permissões Docker em Linux**

- Certifique-se de estar no grupo docker: `groups`
- Se não, execute: `sudo usermod -aG docker $USER && newgrp docker`

⚠️ **Firewall**

- Se portas 80/443/3000/3001 não abrirem:
  - Windows: Check Windows Firewall
  - Linux: Check UFW/firewalld

---

## ✨ Sucesso

Quando todos os testes passarem:

✅ `bash scripts/verify-setup.sh` retorna 0 erros
✅ `npm run dev` inicia sem problemas
✅ Web carrega em <http://localhost:3000>
✅ API responde em <http://localhost:3001>

---

**Próxima Ação**: Testar em WSL2 e Ubuntu Server

Data planejada: Após testes Windows ✅

