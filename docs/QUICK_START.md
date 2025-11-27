# 🚀 Quick Start Guide

## Para Iniciar Rapidinho

### Windows (PowerShell)
```powershell
.\scripts\setup.ps1
npm run dev
```

### Linux / WSL / macOS
```bash
bash scripts/setup.sh
npm run dev
```

### Qualquer Plataforma (Node.js)
```bash
node scripts/setup.js
npm run dev
```

---

## ✅ Verificar Setup

### Windows
```powershell
.\scripts\verify-setup.ps1
```

### Linux / WSL / macOS
```bash
bash scripts/verify-setup.sh
```

---

## 🌐 Acessar

| Serviço | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Traefik | http://localhost:8080 |

---

## 📚 Documentação Completa

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Guia detalhado por plataforma
- **[CORRECTIONS_SUMMARY.md](CORRECTIONS_SUMMARY.md)** - Problemas resolvidos
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Status de testes
- **[README.md](README.md)** - Visão geral do projeto

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # API + Web em paralelo
npm run dev:api         # Apenas API
npm run dev:web         # Apenas Web

# Build
npm run build            # Build completo
npm run build:api        # Build apenas API
npm run build:web        # Build apenas Web

# Database
npm run db:generate      # Gera Prisma Client
npm run db:push          # Sincroniza schema
npm run db:studio        # GUI do Prisma

# Docker
docker-compose up -d     # Inicia containers
docker-compose down      # Para containers
docker logs openpanel-api -f  # Ver logs

# Type checking
npm run type-check       # TypeScript validation
```

---

## ⚠️ Solução de Problemas

### Docker não conecta (Windows)
- Abrir Docker Desktop
- Verificar se WSL2 está ativado

### Porta em uso
- Mudar no `.env`: `API_PORT=3002`, `APP_PORT=3001`

### Containers não iniciam
```bash
docker-compose logs        # Ver todos os logs
docker-compose logs api    # Ver logs da API
docker-compose down -v     # Resetar tudo
docker-compose up -d       # Iniciar novamente
```

### Permission denied (Linux)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📊 Status Atual (Windows)

✅ Containers rodando
✅ API conectada ao PostgreSQL e Redis
✅ Web servindo
✅ Scripts de setup e verificação funcionando

**Próximo**: Testar em WSL2 e Ubuntu Server

---

## 🎯 Próximas Etapas

1. ✅ Setup concluído no Windows
2. ⏳ Testar em WSL2 Linux
3. ⏳ Testar em Ubuntu Server
4. ⏳ Build de produção

---

**Precisa de ajuda?** Veja [SETUP_GUIDE.md](SETUP_GUIDE.md)
