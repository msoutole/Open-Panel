# 🔐 OpenPanel - Configuração Tailscale

Este guia explica como configurar o Tailscale para acesso remoto seguro ao OpenPanel.

## 📋 O que é Tailscale?

Tailscale é uma VPN mesh baseada em WireGuard que permite acesso seguro e fácil aos seus serviços sem expor portas publicamente. Com Tailscale, você pode:

- Acessar o OpenPanel de qualquer lugar de forma segura
- Conectar múltiplos servidores em uma rede privada
- Não precisa abrir portas no firewall público
- Acesso automático via DNS

## 🚀 Instalação

### Passo 1: Criar Conta Tailscale

1. Acesse https://tailscale.com
2. Crie uma conta gratuita
3. Faça login no painel

### Passo 2: Gerar Auth Key

1. Acesse: https://login.tailscale.com/admin/settings/keys
2. Clique em "Generate auth key"
3. Configure:
   - **Reusable**: Marque se quiser usar a mesma key em múltiplos dispositivos
   - **Ephemeral**: Desmarque (queremos que o servidor seja permanente)
   - **Tags**: Opcional, para organização
4. Copie a auth key gerada

### Passo 3: Configurar no OpenPanel

Você tem 3 opções para configurar a auth key:

#### Opção 1: Durante a Instalação (Recomendado)

Quando executar `./scripts/install-server.sh`, o script perguntará se você quer configurar o Tailscale. Basta colar sua auth key quando solicitado.

#### Opção 2: Script Rápido

```bash
# No servidor, após a instalação
cd /opt/openpanel  # ou onde você instalou

# Executar script auxiliar
chmod +x scripts/setup-tailscale.sh
./scripts/setup-tailscale.sh tskey-auth-kTHccyuPc111CNTRL-TLFqyZessMMT7iKc7Zt7NMbFbXMBFyEvQ

# Ou executar interativamente (sem argumento)
./scripts/setup-tailscale.sh
```

#### Opção 3: Manualmente

```bash
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
# Substitua pela sua auth key real
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

### Passo 4: Reiniciar Containers

```bash
# Reiniciar Tailscale
docker restart openpanel-tailscale

# Ou reiniciar todo o ambiente
./scripts/server/restart-dev.sh
```

## 🔍 Verificar Status

### Verificar se Tailscale está rodando

```bash
# Ver logs do Tailscale
docker logs openpanel-tailscale

# Ver status do Tailscale
docker exec openpanel-tailscale tailscale status
```

### Verificar IP Tailscale do servidor

```bash
docker exec openpanel-tailscale tailscale ip
```

## 🌐 Acessar via Tailscale

### Opção 1: Usar IP Tailscale

Após configurar, você receberá um IP Tailscale (ex: `100.x.x.x`). Acesse:

```
http://100.x.x.x:3000  # DEV
http://100.x.x.x:3001  # PRE
http://100.x.x.x:3002  # PROD
```

### Opção 2: Usar MagicDNS

O Tailscale fornece DNS automático. Se seu servidor se chama `openpanel-server`, você pode acessar:

```
http://openpanel-server:3000  # DEV
http://openpanel-server:3001  # PRE
http://openpanel-server:3002  # PROD
```

### Opção 3: Configurar DNS Personalizado

No painel do Tailscale:
1. Acesse: https://login.tailscale.com/admin/dns
2. Configure um nome personalizado (ex: `openpanel.local`)
3. Acesse via: `http://openpanel.local:3000`

## 📱 Conectar Dispositivos

### Instalar Tailscale no seu computador

**Windows/macOS:**
1. Baixe em: https://tailscale.com/download
2. Instale e faça login com a mesma conta
3. Seu computador aparecerá automaticamente na rede

**Linux:**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

**Mobile (iOS/Android):**
1. Instale o app Tailscale
2. Faça login com a mesma conta
3. Conecte automaticamente

## 🔒 Segurança

### Vantagens do Tailscale

- ✅ **Criptografia end-to-end**: Todo tráfego é criptografado
- ✅ **Sem portas abertas**: Não precisa abrir portas no firewall público
- ✅ **Controle de acesso**: Gerencie quem pode acessar via painel Tailscale
- ✅ **Auditoria**: Veja quem acessou e quando

### Configurar Acesso Restrito

No painel Tailscale:
1. Acesse: https://login.tailscale.com/admin/machines
2. Clique no servidor
3. Configure **Access Controls** para restringir acesso

## 🐛 Troubleshooting

### Tailscale não conecta

```bash
# Ver logs
docker logs openpanel-tailscale -f

# Verificar se auth key está correta
docker exec openpanel-tailscale tailscale status
```

### Não consigo acessar via Tailscale

1. **Verificar se dispositivo está conectado**:
   ```bash
   # No seu computador
   tailscale status
   ```

2. **Verificar firewall**:
   ```bash
   # No servidor
   sudo ufw status
   ```

3. **Verificar se containers estão rodando**:
   ```bash
   docker ps | grep openpanel
   ```

### Regenerar Auth Key

Se a auth key expirar ou for comprometida:

1. Gere uma nova auth key no painel Tailscale
2. Atualize nos arquivos `.env`
3. Reinicie o container:
   ```bash
   docker restart openpanel-tailscale
   ```

## 📚 Recursos Adicionais

- **Documentação Tailscale**: https://tailscale.com/kb/
- **Painel Admin**: https://login.tailscale.com/admin
- **Status da Rede**: https://login.tailscale.com/admin/machines

## 💡 Dicas

1. **Use MagicDNS**: Facilita muito o acesso sem precisar lembrar IPs
2. **Configure Tags**: Organize seus servidores com tags no Tailscale
3. **Use Subnet Router**: Se quiser que outros dispositivos na sua rede local acessem via Tailscale
4. **Backup da Auth Key**: Guarde a auth key em local seguro (gerenciador de senhas)

