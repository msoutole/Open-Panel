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
git clone https://github.com/msoutole/Open-Panel.git .

# Ou se preferir outro local:
git clone https://github.com/msoutole/Open-Panel.git /opt/openpanel
cd /opt/openpanel
```

---

### **Passo 4: Executar Instalação Automática**

#### Opção 1: Script Universal (Recomendado)

```bash
# Dar permissão de execução
chmod +x scripts/install.sh

# Executar instalação
sudo ./scripts/install.sh
```

#### Opção 2: Script Específico para Servidor

```bash
# Para instalação otimizada em servidor Ubuntu
chmod +x scripts/install-server.sh
sudo ./scripts/install-server.sh
```

**O script irá:**
1. ✅ Detectar sistema operacional (Ubuntu/Debian)
2. ✅ Instalar Node.js 20.x LTS
3. ✅ Instalar Docker Engine + Docker Compose v2
4. ✅ Configurar firewall (UFW) com regras seguras
5. ✅ Criar arquivo `.env` na raiz com valores seguros
6. ✅ Instalar todas as dependências npm
7. ✅ Iniciar infraestrutura Docker (PostgreSQL, Redis, Traefik)
8. ✅ Executar migrations do banco de dados
9. ✅ Criar usuário administrador padrão
10. ✅ Verificar e testar todos os serviços

⏱️ **Tempo estimado**: 5-15 minutos (dependendo da conexão)

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

#### Inicialização Automática (Recomendado)

```bash
# No servidor
cd /opt/openpanel

# Iniciar tudo automaticamente
npm start
```

O comando `npm start` faz:
- ✅ Verifica pré-requisitos
- ✅ Cria/atualiza `.env` se necessário
- ✅ Instala dependências
- ✅ Inicia containers Docker
- ✅ Configura banco de dados
- ✅ Cria admin (se não existir)
- ✅ Inicia API e Web em dev mode

#### Comandos Alternativos

```bash
# Apenas desenvolvimento (API + Web)
npm run dev

# Apenas API
npm run dev:api

# Apenas Web
npm run dev:web

# Modo produção (somente infra)
docker compose up -d
```

---

### **Passo 7: Acessar OpenPanel**

O OpenPanel estará disponível em:

#### 🌐 URLs Padrão

- **Frontend (Web)**: `http://localhost:3000` ou `http://IP_SERVIDOR:3000`
- **Backend (API)**: `http://localhost:3001` ou `http://IP_SERVIDOR:3001`
- **Traefik Dashboard**: `http://localhost:8080` (se habilitado)

#### Opção 1: Acesso Local (no próprio servidor)

```bash
# Testar API
curl http://localhost:3001/health

# Testar Web
curl http://localhost:3000

# Abrir navegador (se tiver GUI)
xdg-open http://localhost:3000  # Linux
open http://localhost:3000      # macOS
```

#### Opção 2: Acesso via Rede Local

```bash
# Descobrir IP do servidor
ip addr show | grep inet
# ou
hostname -I

# Acessar do seu computador
http://192.168.1.100:3000  # Substitua pelo IP real
```

#### Opção 3: Acesso via Tailscale (Recomendado para acesso remoto)

1. **Instale Tailscale no seu computador:**
   - Windows/macOS: https://tailscale.com/download
   - Linux: `curl -fsSL https://tailscale.com/install.sh | sh`

2. **Faça login** com a mesma conta do Tailscale

3. **Obtenha o IP Tailscale do servidor:**
   ```bash
   # No servidor
   docker exec openpanel-tailscale tailscale ip -4
   ```

4. **Acesse via IP Tailscale:**
   ```
   http://100.x.x.x:3000  # Substitua pelo IP obtido
   ```

5. **Ou use MagicDNS** (mais fácil):
   ```
   http://nome-do-servidor:3000
   ```

---

### **Passo 8: Primeiro Login**

**Credenciais Padrão:**
- 📧 **Email**: `admin@admin.com.br`
- 🔑 **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha imediatamente após o primeiro login!

#### Criar Novo Admin (Opcional)

Se precisar criar um novo usuário administrador:

```bash
cd /opt/openpanel
npm run create:admin

# Ou manualmente com script
node scripts/create-admin.ts
```

Siga as instruções interativas para definir email e senha.

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

# Status completo do sistema
npm run status

# Ver logs em tempo real
docker compose logs -f

# Logs específicos
docker logs openpanel-postgres -f
docker logs openpanel-redis -f
docker logs openpanel-traefik -f
```

### Desenvolvimento

```bash
# Iniciar tudo (infra + dev)
npm start

# Apenas desenvolvimento (assume infra rodando)
npm run dev

# Apenas API
npm run dev:api

# Apenas Web
npm run dev:web

# Verificar tipos TypeScript
npm run type-check

# Executar testes
npm run test -w apps/api
```

### Gerenciar Containers

```bash
# Parar tudo
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose down -v

# Iniciar apenas infraestrutura
docker compose up -d postgres redis traefik

# Reiniciar serviço específico
docker restart openpanel-postgres
docker restart openpanel-redis
docker restart openpanel-traefik

# Ver uso de recursos
docker stats
```

### Gerenciar Banco de Dados

```bash
# Conectar ao PostgreSQL (psql)
docker exec -it openpanel-postgres psql -U openpanel -d openpanel

# Prisma Studio (GUI para banco de dados)
npm run db:studio

# Migrations
npm run db:generate      # Gerar client Prisma
npm run db:push          # Aplicar schema sem migrations
npm run db:migrate       # Criar e aplicar migration

# Backup manual
docker exec openpanel-postgres pg_dump -U openpanel openpanel > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i openpanel-postgres psql -U openpanel openpanel < backup.sql

# Ver tamanho do banco
docker exec openpanel-postgres psql -U openpanel -d openpanel -c "SELECT pg_size_pretty(pg_database_size('openpanel'));"
```

---

## 🔐 Segurança

### Alterar Senhas Padrão

⚠️ **CRÍTICO**: Altere todas as senhas antes de usar em produção!

```bash
# Editar arquivo .env na raiz do projeto
nano .env

# Gerar senhas seguras
openssl rand -hex 32  # Para PostgreSQL
openssl rand -hex 32  # Para Redis
openssl rand -hex 64  # Para JWT_SECRET

# Atualizar no .env (na raiz do projeto):
POSTGRES_PASSWORD=nova_senha_segura_aqui
REDIS_PASSWORD=nova_senha_segura_aqui
JWT_SECRET=nova_chave_jwt_64_caracteres_aqui
JWT_REFRESH_SECRET=outra_chave_jwt_64_caracteres_aqui
```

⚠️ **IMPORTANTE**: Edite apenas o `.env` da **raiz do projeto**!

Após alterar, recrie os containers:

```bash
# Parar containers
docker compose down

# Remover volumes (CUIDADO: apaga dados do banco)
docker volume rm openpanel_postgres-data openpanel_redis-data

# Recriar tudo
npm start
```

**Ou use o script de rotação de credenciais:**

```bash
chmod +x scripts/rotate-credentials.sh
./scripts/rotate-credentials.sh
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
- **Issues**: [GitHub Issues](https://github.com/msoutole/Open-Panel/issues)
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
