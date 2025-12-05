# OpenPanel - Guia de Resolução de Problemas na Instalação

## Problemas Comuns e Soluções

### 🔴 Problema: "Porta 3000 está em uso"

**Sintomas:**

`
Error response from daemon: failed to set up container networking:
driver failed programming external connectivity on endpoint openpanel-adguard:
failed to bind host port 0.0.0.0:3000/tcp: address already in use
`

**Causa:**
A porta 3000 está sendo usada pela aplicação Web do OpenPanel ou outro serviço.

**Soluções:**

1. **Verificar qual processo está usando a porta:**

`bash
sudo lsof -i :3000

# ou

sudo netstat -tulpn | grep :3000
`

2. **Parar o processo (se for da Web):**

`bash
docker compose down

# ou para o serviço específico

docker stop openpanel-web
`

3. **Mudar porta do AdGuard (alternativa):**
   - Edite `.env` e procure por `ADGUARD_PORT`
   - Mude para uma porta disponível (ex: 8001)
   - Rode: `docker compose --profile adguard restart adguard`

---

### 🔴 Problema: "Erro na configuração Netplan"

**Sintomas:**

`
✗ Erro na configuração Netplan. Revertendo...
`

**Causa:**
Sintaxe incorreta no arquivo Netplan ou rede inacessível após aplicação.

**Soluções:**

1. **Validar arquivo Netplan:**

`bash
sudo netplan validate
`

2. **Ver arquivo criado:**

`bash
cat /etc/netplan/01-static-ip.yaml
`

3. **Reverter para configuração anterior:**

`bash
sudo cp /etc/netplan/01-static-ip.yaml.backup.* /etc/netplan/01-static-ip.yaml
sudo netplan apply
`

4. **Se perder conexão:**
   - Conecte com o IP antigo via SSH
   - Restaure a configuração Netplan
   - Reinicie a rede: `sudo netplan apply`

---

### 🔴 Problema: "Arquivo .env.example não encontrado"

**Sintomas:**

`
⚠ Arquivo .env.dev.example não encontrado
⚠ Arquivo .env.pre.example não encontrado
⚠ Arquivo .env.prod.example não encontrado
`

**Causa:**
O repositório não contém arquivos `.env.example` separados. O projeto usa um único `.env.example` na raiz.

**Solução:**
O script foi corrigido para usar `.env.example` da raiz automaticamente. Se estiver usando versão antiga:

`bash

# Copiar arquivo exemplo

cp .env.example .env

# Editar com suas configurações

nano .env
`

---

### 🔴 Problema: "systemd-resolved conflita com AdGuard"

**Sintomas:**

`
✗ Porta 53 está em uso
⚠ systemd-resolved está ativo e pode conflitar com AdGuard Home
`

**Causa:**
O serviço de DNS do sistema está usando a porta 53, que é necessária para o AdGuard Home.

**Soluções:**

1. **Desabilitar systemd-resolved (recomendado para AdGuard):**

`bash
sudo scripts/setup/disable-systemd-resolved.sh
`

2. **Verificar status:**

`bash
systemctl status systemd-resolved
`

3. **Reativar systemd-resolved depois:**

`bash
sudo chattr -i /etc/resolv.conf
sudo systemctl enable systemd-resolved
sudo systemctl start systemd-resolved
sudo rm /etc/resolv.conf
`

---

### 🟡 Problema: "PostgreSQL demorando para iniciar"

**Sintomas:**

`
ℹ Aguardando PostgreSQL estar pronto...
.....  (demora longa)
`

**Causa:**
Container PostgreSQL demora para iniciar na primeira execução ou o sistema está lento.

**Soluções:**

1. **Verificar logs do PostgreSQL:**

`bash
docker compose logs postgres
`

2. **Aumentar timeout (editar script):**
   - No `install-server.sh`, procure por `timeout=60`
   - Mude para `timeout=120` (2 minutos)

3. **Verificar recursos:**

`bash
docker ps
docker stats
`

---

### 🟡 Problema: "Sem permissão (sudo não funciona)"

**Sintomas:**

`
✗ Este script precisa ser executado como root (use sudo)
`

**Solução:**

`bash

# Execute com sudo

sudo ./scripts/install-server.sh

# Ou se sudo pedir senha

sudo -S ./scripts/install-server.sh
`

---

### 🟡 Problema: "Node.js versão muito antiga"

**Sintomas:**

`
Node.js 16.x - Versão muito antiga
`

**Solução:**

`bash

# Atualizar Node.js para v20

curl -fsSL <https://deb.nodesource.com/setup_20.x> | sudo -E bash -
sudo apt-get install -y nodejs
`

---

### 🟡 Problema: "Docker não está rodando"

**Sintomas:**

`
✗ Docker não está rodando
`

**Soluções:**

1. **Iniciar Docker:**

`bash
sudo systemctl start docker
sudo systemctl enable docker  # Iniciar no boot
`

2. **Verificar status:**

`bash
sudo systemctl status docker
`

3. **Verificar permissões do usuário:**

`bash
sudo usermod -aG docker $USER

# Faça logout e login novamente

`

---

### 🟡 Problema: "Firewall bloqueando portas"

**Sintomas:**

`
Conexão recusada ao acessar localhost:3001
`

**Soluções:**

1. **Verificar UFW (firewall):**

`bash
sudo ufw status
`

2. **Permitir portas necessárias:**

`bash
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Web
sudo ufw allow 3001/tcp # API
`

3. **Desabilitar temporariamente (não recomendado):**

`bash
sudo ufw disable
`

---

## Verificação Pré-Instalação

Antes de instalar, execute o script de verificação:

`bash
sudo ./scripts/setup/pre-install-check.sh
`

Isso verificará:

- ✓ Sistema operacional
- ✓ Docker e Node.js
- ✓ Portas disponíveis
- ✓ Espaço em disco
- ✓ Memória disponível
- ✓ Conectividade
- ✓ Permissões

---

## Logs de Instalação

O script gera logs em:

`bash
./install-server.log
`

Para visualizar:

`bash
tail -f install-server.log
`

---

## Reexecução da Instalação

Se algo der errado, você pode reexecutar:

`bash

# Completa novamente

sudo ./scripts/install-server.sh

# Apenas partes específicas

sudo scripts/setup/configure-static-ip.sh
sudo scripts/setup/install-adguard.sh
sudo scripts/setup/disable-systemd-resolved.sh
`

---

## Suporte Adicional

Para mais informações, consulte:

- `docs/INSTALACAO_SERVIDOR.md` - Instalação detalhada
- `docs/HOME_LAB_SETUP.md` - Configuração de Home Lab
- `docs/DESENVOLVIMENTO_REMOTO.md` - Acesso remoto
- Logs do projeto em `./install-server.log`

---

## Status do Sistema

Verifique o status de todos os serviços:

`bash
docker compose ps                    # Todos os containers
docker compose logs postgres         # Logs do PostgreSQL
docker compose logs redis            # Logs do Redis
docker compose logs traefik          # Logs do Traefik
npm run dev                          # Status da aplicação
`

---

**Última atualização:** 4 de dezembro de 2025
