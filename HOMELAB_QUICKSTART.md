# 🏠 OpenPanel - Guia Rápido para Homelab

Instale e configure o OpenPanel em seu homelab em menos de 10 minutos!

## ⚡ Instalação Rápida

### Opção 1: Instalação Automatizada (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Execute o script de instalação (Autônomo e à prova de falhas)
sudo bash scripts/install-server.sh

# 3. Acesse o painel
# http://seu-ip:3000
```

**Pronto!** O script instala e configura automaticamente:
- ✅ **Node.js 20 LTS** (Verifica e atualiza se necessário)
- ✅ **Docker e Docker Compose** (Gerencia conflitos)
- ✅ **Todas as dependências** com auto-recuperação de erros
- ✅ **Serviços de Infra:** Postgres, Redis, Traefik (com Health Checks reais)

> **Dica Pro:** Tem pouco hardware? Use `MIN_RAM_MB=1024 sudo bash scripts/install-server.sh` para instalar em máquinas menores sem avisos.

### Opção 2: Instalação Manual (Controle Total)

```bash
# 1. Clone o repositório
git clone https://github.com/msoutole/openpanel.git
cd openpanel

# 2. Configure as variáveis de ambiente
cp .env.example .env
nano .env  # Edite com suas configurações

# 3. Inicie tudo
npm start
```

## 🔧 Configuração Essencial

### Credenciais Padrão

Após a instalação, faça login com:
- **Email:** `admin@admin.com.br`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha imediatamente após o primeiro login!

### Portas Utilizadas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Web UI  | 3000  | Interface web |
| API     | 3001  | API REST |
| PostgreSQL | 5432 | Banco de dados |
| Redis   | 6379  | Cache |
| Traefik | 80/443 | Proxy reverso |
| Traefik Dashboard | 8080 | Dashboard Traefik |
| Ollama  | 11434 | IA local (opcional) |

### Configuração de Firewall

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Web UI (temporário)
sudo ufw enable
```

## 🌐 Configuração de Domínio (Opcional)

### Domínio Local (*.local)

Adicione ao `/etc/hosts` do seu computador:

```
192.168.1.100  openpanel.local
```

### Domínio Externo com SSL

1. **Configure DNS** apontando para seu IP público
2. **Configure port forwarding** no roteador (80 e 443)
3. **Edite .env:**

```bash
DOMAIN=openpanel.seudomain.com
SSL_EMAIL=seu@email.com
NODE_ENV=production
```

4. **Reinicie os serviços:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Acesso Remoto Seguro (Recomendado)

### Via Tailscale (VPN)

```bash
# 1. Instale o Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# 2. Conecte seu servidor
sudo tailscale up

# 3. Acesse de qualquer lugar
# http://100.x.x.x:3000
```

Vantagens:
- ✅ Acesso seguro sem expor portas
- ✅ Criptografia end-to-end
- ✅ Funciona em qualquer rede
- ✅ Gratuito para uso pessoal

## 📊 Primeiros Passos Após Instalação

### 1. Configurar IA (Opcional)

**Via Gemini (Cloud):**
1. Obtenha API key em [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Configure em Settings → AI Provider

**Via Ollama (Local):**
```bash
# Habilite o Ollama
docker-compose --profile ollama up -d

# Baixe um modelo
docker exec openpanel-ollama ollama pull llama2
```

### 2. Criar Primeiro Container

1. Acesse **Containers** → **New Container**
2. Escolha uma imagem (ex: `nginx:latest`)
3. Configure portas e volumes
4. Clique em **Create**

### 3. Configurar Backups

```bash
# Backup manual
npm run backup

# Configurar backup automático (cron)
crontab -e
# Adicione:
0 2 * * * cd /opt/openpanel && npm run backup
```

## 🆘 Problemas Comuns

### Docker não está rodando

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Porta já em uso

```bash
# Encontre o processo
sudo lsof -i :3000

# Mate o processo
sudo kill -9 <PID>
```

### Banco de dados não inicia

```bash
# Verifique logs
docker logs openpanel-postgres

# Remova e recrie
docker-compose down -v
docker-compose up -d
```

### Reset completo

```bash
# ⚠️ CUIDADO: Apaga TODOS os dados
docker-compose down -v
rm -rf postgres-data redis-data
npm run db:push
npm run create:admin
```

## 📚 Próximos Passos

- 📖 [Manual do Usuário](docs/MANUAL_DO_USUARIO.md) - Funcionalidades detalhadas
- 🛠️ [Manual Técnico](docs/MANUAL_TECNICO.md) - Arquitetura e API
- 🤝 [Como Contribuir](CONTRIBUTING.md) - Contribua com o projeto
- 🔐 [Segurança](SECURITY.md) - Melhores práticas

## 💡 Dicas de Performance

### Para servidores com pouca RAM (2GB)

No `.env`:
```bash
POSTGRES_MAX_CONNECTIONS=50
REDIS_MAXMEMORY=256mb
```

### Para servidores potentes (8GB+)

No `.env`:
```bash
POSTGRES_MAX_CONNECTIONS=200
POSTGRES_SHARED_BUFFERS=512MB
REDIS_MAXMEMORY=1024mb
```

## 🎯 Casos de Uso

- **Hosting Pessoal:** Hospede seus projetos web
- **Ambientes de Desenvolvimento:** Crie ambientes isolados
- **Testes de Aplicações:** Deploy rápido para testes
- **Aprendizado:** Experimente com Docker e DevOps
- **Gerenciamento de Containers:** Interface visual para Docker

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/msoutole/openpanel/issues)
- **Email:** msoutole@hotmail.com
- **Documentação:** [docs/README.md](docs/README.md)

---

**Desenvolvido com ❤️ para a comunidade homelab**
