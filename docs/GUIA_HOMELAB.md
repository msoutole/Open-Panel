# 🏠 OpenPanel - Guia de Instalação em Homelab

Guia passo a passo para instalar o OpenPanel no seu servidor homelab (Ubuntu/Debian).

## 📋 Pré-requisitos

### Requisitos do Servidor
- **Sistema Operacional**: Ubuntu Server 20.04+ ou 22.04+ (recomendado)
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Disco**: Mínimo 20GB de espaço livre
- **Rede**: Acesso à internet e IP estático (recomendado)
- **Acesso**: SSH habilitado ou acesso direto ao servidor

### O que será instalado automaticamente
- ✅ Node.js 20.x
- ✅ Docker Engine + Docker Compose
- ✅ Git
- ✅ UFW (Firewall)
- ✅ Tailscale (VPN - opcional)

---

## 🚀 Passo a Passo Completo

### **Passo 1: Conectar ao Servidor**

```bash
# Do seu computador local
ssh usuario@ip-do-servidor

# Exemplo:
ssh ubuntu@192.168.1.100
```

> 💡 **Dica**: Se ainda não tem acesso SSH configurado, veja [Configuração SSH](#configuração-ssh-opcional)

---

### **Passo 2: Preparar Diretório**

```bash
# Criar diretório para o OpenPanel
sudo mkdir -p /opt/openpanel
sudo chown $USER:$USER /opt/openpanel
cd /opt/openpanel
```

---

### **Passo 3: Clonar o Repositório**

```bash
# Clonar repositório
git clone https://github.com/msoutole/openpanel.git .

# Ou se preferir outro local:
# git clone https://github.com/msoutole/openpanel.git ~/openpanel
# cd ~/openpanel
```

---

### **Passo 4: Executar Instalação Automática**

```bash
# Dar permissão de execução
chmod +x scripts/install-server.sh

# Executar instalação
./scripts/install-server.sh
```

**O script irá:**
1. ✅ Detectar sistema operacional
2. ✅ Instalar Node.js 20.x
3. ✅ Instalar Docker Engine + Docker Compose
4. ✅ Configurar firewall (UFW)
5. ✅ Criar arquivo `.env` com valores seguros
6. ✅ Instalar dependências npm
7. ✅ Iniciar infraestrutura (PostgreSQL, Redis, Traefik)
8. ✅ Configurar domínios locais no `/etc/hosts`

⏱️ **Tempo estimado**: 5-10 minutos

---

### **Passo 5: Configurar Tailscale (Opcional - Recomendado)**

O Tailscale permite acessar seu OpenPanel de qualquer lugar de forma segura, sem abrir portas no firewall.

#### 5.1. Obter Auth Key do Tailscale

1. Acesse: https://login.tailscale.com/admin/settings/keys
2. Clique em **"Generate auth key"**
3. Configure:
   - **Reusable**: ✅ Marque (para usar em múltiplos dispositivos)
   - **Ephemeral**: ❌ Desmarque (servidor deve ser permanente)
4. **Copie a auth key** gerada

#### 5.2. Configurar no OpenPanel

```bash
# No servidor, após instalação
cd /opt/openpanel

# Executar script de configuração
chmod +x scripts/setup-tailscale.sh
./scripts/setup-tailscale.sh

# Quando solicitado, cole sua auth key
```

**Ou manualmente:**

```bash
# Editar .env
nano .env

# Adicionar linha:
TAILSCALE_AUTHKEY=tskey-auth-SUA_KEY_AQUI

# Salvar (Ctrl+O, Enter, Ctrl+X)
```

#### 5.3. Iniciar Tailscale

```bash
# Iniciar container Tailscale
docker compose --profile tailscale up -d tailscale

# Verificar status
docker logs openpanel-tailscale
```

#### 5.4. Obter IP Tailscale do Servidor

```bash
docker exec openpanel-tailscale tailscale ip
```

Você receberá um IP como `100.x.x.x` - use este IP para acessar remotamente.

---

### **Passo 6: Iniciar OpenPanel**

```bash
# No servidor
cd /opt/openpanel

# Iniciar ambiente de desenvolvimento
npm start
```

**Ou usar scripts de servidor:**

```bash
# Ambiente DEV (desenvolvimento)
./scripts/server/start-dev.sh

# Ambiente PROD (produção)
./scripts/server/start-prod.sh
```

---

### **Passo 7: Acessar OpenPanel**

#### Opção 1: Acesso Local (no servidor)

```bash
# No servidor, abra navegador (se tiver interface gráfica)
# Ou use curl para testar
curl http://localhost:3000
```

#### Opção 2: Acesso via Tailscale (Recomendado)

1. **Instale Tailscale no seu computador:**
   - Windows/macOS: https://tailscale.com/download
   - Linux: `curl -fsSL https://tailscale.com/install.sh | sh`

2. **Faça login** com a mesma conta do Tailscale

3. **Acesse via IP Tailscale:**
   ```
   http://100.x.x.x:3000  # Substitua pelo IP do seu servidor
   ```

4. **Ou use MagicDNS** (se configurado):
   ```
   http://nome-do-servidor:3000
   ```

#### Opção 3: Acesso via IP Local (Rede Local)

Se estiver na mesma rede local:

```
http://192.168.1.100:3000  # Substitua pelo IP do servidor
```

---

### **Passo 8: Primeiro Login**

**Credenciais Padrão:**
- 📧 **Email**: `admin@admin.com.br`
- 🔑 **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha imediatamente após o primeiro login!

---

## 🔧 Configurações Adicionais

### Configurar Domínio Próprio (Opcional)

Se você tem um domínio próprio (ex: `openpanel.seudominio.com`):

#### 1. Configurar DNS

No seu provedor de DNS, adicione:

```
A     openpanel.seudominio.com    -> IP_DO_SERVIDOR
```

#### 2. Atualizar .env

```bash
nano .env

# Alterar:
APP_URL=https://openpanel.seudominio.com
DOMAIN=openpanel.seudominio.com
SSL_EMAIL=seu-email@exemplo.com
```

#### 3. Reiniciar Traefik

O Traefik configurará SSL automaticamente via Let's Encrypt:

```bash
docker restart openpanel-traefik
```

Aguarde alguns minutos para o certificado SSL ser gerado.

---

### Configurar Firewall (UFW)

O script já configura o firewall, mas você pode ajustar:

```bash
# Ver regras ativas
sudo ufw status

# Permitir porta específica
sudo ufw allow 3000/tcp

# Bloquear Traefik Dashboard (recomendado em produção)
sudo ufw delete allow 8080/tcp
```

---

### Configurar Backups Automáticos

```bash
# Criar script de backup
nano ~/backup-openpanel.sh
```

Cole o seguinte conteúdo:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/openpanel"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec openpanel-postgres pg_dump -U openpanel openpanel > $BACKUP_DIR/db_$DATE.sql

# Backup dos volumes Docker
docker run --rm -v openpanel_postgres-data:/data -v $BACKUP_DIR:/backup ubuntu tar czf /backup/volumes_$DATE.tar.gz /data

# Manter apenas últimos 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup concluído: $BACKUP_DIR"
```

```bash
# Dar permissão
chmod +x ~/backup-openpanel.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
crontab -e

# Adicionar linha:
0 2 * * * /home/usuario/backup-openpanel.sh
```

---

## 📊 Comandos Úteis

### Verificar Status

```bash
# Status de todos os containers
docker ps

# Status específico do OpenPanel
./scripts/server/status.sh

# Ver logs
./scripts/server/logs-dev.sh -f
```

### Reiniciar Serviços

```bash
# Reiniciar tudo
docker compose restart

# Reiniciar apenas API
docker restart openpanel-api-dev

# Reiniciar apenas banco
docker restart openpanel-postgres
```

### Parar/Iniciar

```bash
# Parar tudo
docker compose down

# Iniciar tudo
docker compose up -d

# Parar apenas ambiente DEV
./scripts/server/stop-dev.sh

# Iniciar apenas ambiente DEV
./scripts/server/start-dev.sh
```

### Acessar Banco de Dados

```bash
# Conectar ao PostgreSQL
docker exec -it openpanel-postgres psql -U openpanel -d openpanel

# Backup manual
docker exec openpanel-postgres pg_dump -U openpanel openpanel > backup.sql

# Restaurar backup
docker exec -i openpanel-postgres psql -U openpanel openpanel < backup.sql
```

---

## 🔐 Segurança

### Alterar Senhas Padrão

⚠️ **CRÍTICO**: Altere todas as senhas antes de usar em produção!

```bash
# Editar .env
nano .env

# Gerar senha segura para PostgreSQL
openssl rand -hex 32

# Gerar senha segura para Redis
openssl rand -hex 32

# Gerar JWT_SECRET (mínimo 32 caracteres)
openssl rand -hex 64

# Atualizar no .env:
POSTGRES_PASSWORD=nova_senha_segura
REDIS_PASSWORD=nova_senha_segura
JWT_SECRET=nova_chave_secreta_64_chars
```

Após alterar, reinicie os containers:

```bash
docker compose down
docker compose up -d
```

### Desabilitar Traefik Dashboard

```bash
# Editar .env
nano .env

# Alterar:
TRAEFIK_DASHBOARD=false

# Reiniciar
docker restart openpanel-traefik

# Bloquear porta no firewall
sudo ufw delete allow 8080/tcp
```

---

## 🐛 Solução de Problemas

### Containers não iniciam

```bash
# Ver logs detalhados
docker compose logs

# Verificar se Docker está rodando
sudo systemctl status docker

# Reiniciar Docker
sudo systemctl restart docker
```

### PostgreSQL não conecta

```bash
# Ver logs
docker logs openpanel-postgres

# Verificar se está rodando
docker exec openpanel-postgres pg_isready -U openpanel

# Verificar credenciais no .env
cat .env | grep DATABASE_URL
```

### Porta já em uso

```bash
# Ver qual processo está usando a porta
sudo lsof -i :3000
sudo lsof -i :3001

# Parar processo ou alterar porta no .env
```

### Tailscale não conecta

```bash
# Ver logs
docker logs openpanel-tailscale -f

# Verificar status
docker exec openpanel-tailscale tailscale status

# Regenerar auth key e atualizar .env
```

### Permissões Docker

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
# Ou executar:
newgrp docker
```

---

## 📱 Acesso Remoto

### Via Tailscale (Recomendado)

1. Instale Tailscale no seu computador/mobile
2. Faça login com a mesma conta
3. Acesse via IP Tailscale: `http://100.x.x.x:3000`

### Via Port Forwarding (Não Recomendado)

⚠️ **Atenção**: Abrir portas no firewall público é menos seguro.

```bash
# No roteador, configurar port forwarding:
# Porta Externa 3000 -> IP_SERVIDOR:3000
# Porta Externa 3001 -> IP_SERVIDOR:3001
```

Depois acesse: `http://seu-ip-publico:3000`

---

## 📚 Próximos Passos

1. ✅ Configure Tailscale para acesso remoto seguro
2. ✅ Altere todas as senhas padrão
3. ✅ Configure backups automáticos
4. ✅ Configure domínio próprio (opcional)
5. ✅ Leia [Manual do Usuário](./MANUAL_DO_USUARIO.md)
6. ✅ Explore templates e marketplace

---

## 🔗 Referências

- [Manual do Usuário](./MANUAL_DO_USUARIO.md) - Guia completo de uso
- [Manual Técnico](./MANUAL_TECNICO.md) - Detalhes técnicos
- [Guia Tailscale](./TAILSCALE_SETUP.md) - Configuração detalhada do Tailscale
- [Instalação em Servidor](./INSTALACAO_SERVIDOR.md) - Guia avançado

---

## 📞 Suporte

- **Documentação**: Veja outros arquivos em `docs/`
- **Issues**: [GitHub Issues](https://github.com/msoutole/openpanel/issues)
- **Email**: msoutole@hotmail.com

---

## ✅ Checklist Rápido

- [ ] Servidor Ubuntu/Debian configurado
- [ ] Acesso SSH funcionando
- [ ] Repositório clonado
- [ ] Script de instalação executado
- [ ] Tailscale configurado (opcional)
- [ ] OpenPanel iniciado
- [ ] Acesso funcionando
- [ ] Senhas alteradas
- [ ] Backups configurados

**Pronto! Seu OpenPanel está rodando no homelab! 🎉**
