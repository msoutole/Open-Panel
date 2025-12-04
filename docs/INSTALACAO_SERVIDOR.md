# 🚀 OpenPanel - Guia de Instalação em Servidor Ubuntu

Este guia detalha como instalar o OpenPanel em um servidor Ubuntu caseiro com suporte a múltiplos ambientes (dev, pre, prod).

## 📋 Pré-requisitos

### Requisitos do Servidor

- **Sistema Operacional**: Ubuntu Server 20.04+ ou Ubuntu Server 22.04+ (recomendado)
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Disco**: Mínimo 20GB de espaço livre
- **Rede**: Acesso à internet para download de dependências
- **Acesso**: SSH ou acesso direto ao servidor com privilégios sudo

### Requisitos de Software

O script de instalação instalará automaticamente:
- Node.js 20.x
- Docker Engine 20.10+
- Docker Compose v2
- Git
- UFW (firewall)
- Tailscale (VPN - opcional)

## 🔧 Instalação

### Passo 1: Conectar ao Servidor

```bash
ssh usuario@seu-servidor
```

### Passo 2: Clonar o Repositório

```bash
cd /opt  # ou outro diretório de sua preferência
git clone https://github.com/msoutole/openpanel.git
cd openpanel
```

### Passo 3: Executar Script de Instalação

```bash
chmod +x scripts/install-server.sh
./scripts/install-server.sh
```

O script irá:
1. ✅ Detectar o sistema operacional
2. ✅ Instalar dependências do sistema
3. ✅ Instalar Tailscale (VPN - opcional)
4. ✅ Instalar Node.js e Docker
5. ✅ Configurar firewall (UFW)
6. ✅ Criar arquivos de ambiente (.env.dev, .env.pre, .env.prod)
7. ✅ Gerar senhas seguras automaticamente
8. ✅ Instalar dependências do projeto
9. ✅ Iniciar infraestrutura compartilhada (PostgreSQL, Redis, Traefik)
10. ✅ Configurar domínios locais no /etc/hosts

⚠️ **Nota**: PostgreSQL e Redis são compartilhados entre todos os ambientes (dev, pre, prod).

### Passo 4: Configurar Tailscale (Opcional)

Durante a instalação, o script perguntará se você quer configurar o Tailscale. Você pode:

**Opção 1: Configurar durante a instalação**
- Quando o script perguntar, cole sua auth key do Tailscale
- A auth key será adicionada automaticamente em todos os arquivos `.env`

**Opção 2: Configurar depois da instalação**

```bash
# Obter auth key em: https://login.tailscale.com/admin/settings/keys
# Adicionar nos arquivos .env:

# Editar .env.dev
nano .env.dev
# Adicionar: TAILSCALE_AUTHKEY=tskey-auth-kTHccyuPc111CNTRL-TLFqyZessMMT7iKc7Zt7NMbFbXMBFyEvQ

# Editar .env.pre
nano .env.pre
# Adicionar: TAILSCALE_AUTHKEY=tskey-auth-kTHccyuPc111CNTRL-TLFqyZessMMT7iKc7Zt7NMbFbXMBFyEvQ

# Editar .env.prod
nano .env.prod
# Adicionar: TAILSCALE_AUTHKEY=tskey-auth-kTHccyuPc111CNTRL-TLFqyZessMMT7iKc7Zt7NMbFbXMBFyEvQ
```

**Ou usar um comando rápido:**
```bash
# Substitua SUA_AUTH_KEY pela sua auth key real
AUTH_KEY="tskey-auth-kTHccyuPc111CNTRL-TLFqyZessMMT7iKc7Zt7NMbFbXMBFyEvQ"

# Adicionar em todos os arquivos .env
for file in .env.dev .env.pre .env.prod; do
    if [ -f "$file" ]; then
        if grep -q "^TAILSCALE_AUTHKEY=" "$file"; then
            sed -i "s|^TAILSCALE_AUTHKEY=.*|TAILSCALE_AUTHKEY=$AUTH_KEY|" "$file"
        else
            echo "" >> "$file"
            echo "# Tailscale (VPN)" >> "$file"
            echo "TAILSCALE_AUTHKEY=$AUTH_KEY" >> "$file"
        fi
        echo "✅ Adicionado em $file"
    fi
done
```

### Passo 5: Configurar Outras Variáveis de Ambiente

⚠️ **IMPORTANTE**: Antes de iniciar os ambientes, configure as variáveis de ambiente:

```bash
# Editar ambiente DEV
nano .env.dev

# Editar ambiente PRE
nano .env.pre

# Editar ambiente PROD (⚠️ ALTERE TODAS AS SENHAS!)
nano .env.prod
```

**Variáveis importantes a configurar:**

- `POSTGRES_PASSWORD`: Senha forte para PostgreSQL (compartilhado entre ambientes)
- `REDIS_PASSWORD`: Senha forte para Redis (compartilhado entre ambientes)
- `JWT_SECRET`: Chave secreta JWT (mínimo 32 caracteres)
- `APP_URL`: URL do ambiente (ex: `http://dev.openpanel.local`)
- `DOMAIN`: Domínio principal (ex: `openpanel.local`)
- `TAILSCALE_AUTHKEY`: Auth key do Tailscale (se não configurado durante instalação)

**Gerar JWT_SECRET seguro:**
```bash
openssl rand -hex 64
```

## 🚀 Iniciar Ambientes

### Ambiente DEV (Desenvolvimento)

```bash
./scripts/server/start-dev.sh
```

Acesse: http://dev.openpanel.local

### Ambiente PRE (Staging/Preview)

```bash
./scripts/server/start-pre.sh
```

Acesse: http://pre.openpanel.local

### Ambiente PROD (Produção)

⚠️ **Certifique-se de ter alterado todas as senhas em `.env.prod`!**

```bash
./scripts/server/start-prod.sh
```

Acesse: https://openpanel.local

### Iniciar Todos os Ambientes

```bash
./scripts/server/start-all.sh
```

## 📊 Verificar Status

```bash
./scripts/server/status.sh
```

## 📝 Ver Logs

```bash
# Logs do ambiente DEV
./scripts/server/logs-dev.sh

# Logs do ambiente PRE
./scripts/server/logs-pre.sh

# Logs do ambiente PROD
./scripts/server/logs-prod.sh

# Seguir logs em tempo real
./scripts/server/logs-dev.sh -f
```

## 🛑 Parar Ambientes

```bash
# Parar DEV
./scripts/server/stop-dev.sh

# Parar PRE
./scripts/server/stop-pre.sh

# Parar PROD
./scripts/server/stop-prod.sh
```

## 🔄 Reiniciar Ambientes

```bash
# Reiniciar DEV
./scripts/server/restart-dev.sh

# Reiniciar PRE
./scripts/server/restart-pre.sh

# Reiniciar PROD
./scripts/server/restart-prod.sh
```

## 🌐 Configuração de Domínios

### Domínios Locais

O script de instalação configura automaticamente os seguintes domínios no `/etc/hosts`:

```
127.0.0.1  dev.openpanel.local
127.0.0.1  pre.openpanel.local
127.0.0.1  openpanel.local
```

### Domínios Reais (Produção)

Para usar domínios reais em produção:

1. **Configurar DNS**: Aponte seu domínio para o IP do servidor
   ```
   A     openpanel.local        -> IP_DO_SERVIDOR
   A     dev.openpanel.local    -> IP_DO_SERVIDOR
   A     pre.openpanel.local    -> IP_DO_SERVIDOR
   ```

2. **Atualizar .env.prod**:
   ```bash
   APP_URL=https://openpanel.local
   DOMAIN=openpanel.local
   SSL_EMAIL=seu-email@exemplo.com
   ```

3. **Traefik configurará SSL automaticamente** via Let's Encrypt

## 🔒 Segurança

### Firewall (UFW)

O script configura automaticamente o firewall com as seguintes portas abertas:

- **22**: SSH
- **80**: HTTP
- **443**: HTTPS
- **8080**: Traefik Dashboard (opcional)

Para fechar o Traefik Dashboard:
```bash
sudo ufw delete allow 8080/tcp
```

### Senhas Padrão

⚠️ **CRÍTICO**: Altere todas as senhas padrão antes de usar em produção!

1. Edite `.env.prod`
2. Altere `POSTGRES_PASSWORD`
3. Altere `REDIS_PASSWORD`
4. Altere `JWT_SECRET` (gere com `openssl rand -hex 64`)

### Traefik Dashboard

Por padrão, o Traefik Dashboard está desabilitado em produção. Para habilitar com autenticação, consulte a [documentação do Traefik](https://doc.traefik.io/traefik/operations/dashboard/).

## 🗄️ Banco de Dados

### Banco Compartilhado

⚠️ **IMPORTANTE**: Todos os ambientes (dev, pre, prod) compartilham o **mesmo banco de dados PostgreSQL** (`openpanel`) e o **mesmo Redis** (database 0).

Isso significa que:
- Dados são compartilhados entre ambientes
- Mudanças em um ambiente afetam os outros
- Use com cuidado em desenvolvimento

### Acessar Banco de Dados

```bash
# Conectar ao PostgreSQL (banco compartilhado)
docker exec -it openpanel-postgres psql -U openpanel -d openpanel

# Listar bancos de dados
docker exec -it openpanel-postgres psql -U openpanel -c "\l"

# Backup do banco compartilhado
docker exec openpanel-postgres pg_dump -U openpanel openpanel > backup.sql

# Restaurar backup
docker exec -i openpanel-postgres psql -U openpanel openpanel < backup.sql
```

### Redis Compartilhado

O Redis também é compartilhado (database 0) entre todos os ambientes:

```bash
# Conectar ao Redis
docker exec -it openpanel-redis redis-cli -a sua_senha

# Verificar database atual
SELECT 0

# Limpar cache (cuidado!)
FLUSHDB
```

## 🔄 Deploy Entre Ambientes

### Deploy DEV → PRE

```bash
./scripts/server/deploy-pre.sh
```

Este script:
1. Rebuilda os containers PRE
2. Reinicia os serviços PRE
3. Verifica a saúde dos serviços

### Deploy PRE → PROD

⚠️ **ATENÇÃO**: Este comando faz deploy em produção!

```bash
./scripts/server/deploy-prod.sh
```

Este script:
1. Cria backup do ambiente PROD atual
2. Rebuilda os containers PROD
3. Reinicia os serviços PROD
4. Verifica a saúde dos serviços
5. Faz rollback automático se houver falha

## 🐛 Troubleshooting

### Problema: Containers não iniciam

```bash
# Verificar logs
docker compose logs

# Verificar status
docker compose ps

# Reiniciar infraestrutura
docker compose restart postgres redis traefik
```

### Problema: PostgreSQL não está pronto

```bash
# Verificar logs do PostgreSQL
docker logs openpanel-postgres

# Verificar se está rodando
docker exec openpanel-postgres pg_isready -U openpanel
```

### Problema: Porta já em uso

```bash
# Verificar qual processo está usando a porta
sudo lsof -i :3001

# Parar processo ou alterar porta no .env
```

### Problema: Permissões Docker

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
```

### Problema: Domínios não resolvem

```bash
# Verificar /etc/hosts
cat /etc/hosts

# Adicionar manualmente se necessário
sudo nano /etc/hosts
```

## 🔐 Tailscale (VPN)

Para acesso remoto seguro, configure o Tailscale:

### Método 1: Durante a Instalação

O script de instalação perguntará se você quer configurar o Tailscale. Basta colar sua auth key quando solicitado.

### Método 2: Após a Instalação (Script Rápido)

```bash
# Usar o script auxiliar
./scripts/setup-tailscale.sh tskey-auth-kTHccyuPc111CNTRL-TLFqyZessMMT7iKc7Zt7NMbFbXMBFyEvQ

# Ou executar sem argumento para inserir interativamente
./scripts/setup-tailscale.sh
```

### Método 3: Manualmente

1. **Obtenha uma auth key**: https://login.tailscale.com/admin/settings/keys
2. **Adicione nos arquivos .env**: `TAILSCALE_AUTHKEY=tskey-auth-xxxxx`
3. **Inicie Tailscale**: `docker compose --profile tailscale up -d tailscale`

Veja o [Guia Completo do Tailscale](./TAILSCALE_SETUP.md) para mais detalhes.

## 📚 Próximos Passos

1. ✅ Configure Tailscale para acesso remoto (opcional)
2. ✅ Configure domínios e SSL para produção
3. ✅ Crie usuário administrador em cada ambiente
4. ✅ Configure backups automáticos
5. ✅ Configure monitoramento (opcional)
6. ✅ Leia o [Guia de Desenvolvimento Remoto](./DESENVOLVIMENTO_REMOTO.md)
7. ✅ Leia o [Workflow Multi-Ambiente](./WORKFLOW_MULTI_AMBIENTE.md)
8. ✅ Leia o [Guia do Tailscale](./TAILSCALE_SETUP.md)

## 📞 Suporte

- **Documentação**: Veja outros arquivos em `docs/`
- **Issues**: [GitHub Issues](https://github.com/msoutole/openpanel/issues)
- **Email**: msoutole@hotmail.com

