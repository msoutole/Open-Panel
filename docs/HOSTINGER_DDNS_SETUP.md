# Setup DDNS Hostinger com ddclient

## 📋 Visão Geral

Este guia configura o **DDNS nativo da Hostinger** (usando `ddnskey.com`) em um Ubuntu Server com o `ddclient`. O `ddclient` roda como daemon em background e verifica seu IP externo a cada 5 minutos, atualizando automaticamente na Hostinger apenas se o IP mudar.

---

## 🔐 Dados Necessários

Você já coletou do painel Hostinger:

- **Host DDNS**: `all.ddnskey.com`
- **Usuário**: `71zkxtb`
- **Senha**: `6BLEeUqYJWGn`
- **Domínio desejado**: `home.soullabs.com.br` (ou qualquer subdomínio)

---

## 🚀 Instalação Automatizada

### Opção 1: Script Bash (Recomendado)

No seu Ubuntu Server, execute:

```bash
wget -O /tmp/setup-ddns-hostinger.sh https://seu-repo/scripts/server/setup-ddns-hostinger.sh
sudo bash /tmp/setup-ddns-hostinger.sh
```

O script vai:

1. Instalar `ddclient`
2. Solicitar suas credenciais de forma segura
3. Configurar `/etc/ddclient.conf`
4. Iniciar o serviço e validar
5. Ativar boot automático

### Opção 2: Configuração Manual

Se preferir configurar manualmente:

```bash
sudo apt update
sudo apt install -y ddclient
```

Editar a configuração:

```bash
sudo nano /etc/ddclient.conf
```

Cole o seguinte conteúdo (substituindo a senha):

```ini
daemon=300
syslog=yes
pid=/var/run/ddclient.pid
ssl=yes

use=web, web=checkip.dyndns.com/, web-skip='IP Address'

protocol=dyndns2
server=all.ddnskey.com
login=71zkxtb
password='6BLEeUqYJWGn'

home.soullabs.com.br
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

Reiniciar e ativar:

```bash
sudo systemctl restart ddclient
sudo systemctl enable ddclient
sudo systemctl status ddclient
```

---

## 🔧 Configuração DNS na Hostinger

Agora o `ddclient` está pronto para atualizar, mas você precisa criar o registro DNS:

### Passo 1: Acessar DNS Zone

1. Acesse [hPanel - Hostinger](https://hpanel.hostinger.com/)
2. Navegue para **Domínios** → Seu domínio (`soullabs.com.br`)
3. Clique em **DNS Zone**

### Passo 2: Criar Registro A

1. Clique em **+ Add Record**
2. Preencha:
   - **Type**: `A`
   - **Name**: `home` (ou deixe vazio para root)
   - **Value**: `1.1.1.1` (valor temporário, será atualizado)
   - **TTL**: `3600` (ou padrão)
3. Salve

### Passo 3: Aguardar e Verificar

O `ddclient` detectará a mudança em até 5 minutos. Verifique os logs:

```bash
sudo tail -f /var/log/syslog | grep ddclient
```

Você deve ver algo como:

```log
ddclient[12345]: SUCCESS: home.soullabs.com.br - Updated Successfully to 189.xxx.xxx.xxx
```

---

## 🧪 Testando e Troubleshooting

### Verificar Status

```bash
sudo systemctl status ddclient
```

Ver últimas linhas do log:

```bash
sudo tail -20 /var/log/syslog | grep ddclient
```

Ver logs completos:

```bash
sudo journalctl -u ddclient -f
```

### Teste Manual com Debug

Se algo não funcionar, force uma atualização manual:

```bash
sudo systemctl stop ddclient
sudo ddclient -daemon=0 -debug -verbose -noquiet
```

Isso vai mostrar:

- Como está descobrindo o IP externo
- Como está autenticando na Hostinger
- Se há erros de credencial ou rede

### Problemas Comuns

#### "Invalid hostname"

**Causa**: O domínio não existe ou não está configurado na Hostinger.

**Solução**: Crie o registro A primeiro (veja Passo 2 acima).

#### "Invalid authentication"

**Causa**: Usuário ou senha incorretos.

**Solução**: Verifique no painel Hostinger que você copiou corretamente.

#### "ddclient is not running"

**Causa**: Pode haver erro na config.

**Solução**: Execute `sudo systemctl restart ddclient` e depois:

```bash
sudo systemctl status ddclient
```

#### "Cannot connect to server"

**Causa**: Firewall bloqueando ou DNS resolvendo incorretamente.

**Solução**: Teste conectividade:

```bash
ping all.ddnskey.com
curl -I https://all.ddnskey.com
```

---

## 🎯 Próximo Passo: Nginx Proxy Manager

Após validar que `home.soullabs.com.br` aponta para seu IP:

1. **Acessar Nginx Proxy Manager** (ex: `http://192.168.1.100:81`)
2. **Criar Proxy Host** com `home.soullabs.com.br`
3. **Criar CNAMEs na Hostinger** para subserviços:
   - `adguard.soullabs.com.br` → CNAME → `home.soullabs.com.br`
   - `openpanel.soullabs.com.br` → CNAME → `home.soullabs.com.br`

---

## 📚 Referências

- [ddclient Documentation](https://github.com/ddclient/ddclient)
- [Hostinger DDNS Guide](https://support.hostinger.com/)
- [Dynamic DNS Explained](https://en.wikipedia.org/wiki/Dynamic_DNS)

---

## 🔒 Segurança

⚠️ **Importante:**

- O arquivo `/etc/ddclient.conf` contém sua senha em **PLAIN TEXT**
- Permissões são automaticamente `600` (somente root)
- **Nunca** compartilhe este arquivo ou commit no Git
- **Considere** usar uma senha específica para DDNS (diferente do painel)

---

## 📝 Logs e Monitoramento

### Monitorar em Tempo Real

```bash
sudo journalctl -u ddclient -f --lines=50
```

### Ver Histórico Completo

```bash
sudo journalctl -u ddclient --since="2 hours ago"
```

### Arquivo de Log Tradicional

```bash
sudo tail -f /var/log/syslog | grep ddclient
```

---

## ✅ Checklist Final

- [ ] Script executado com sucesso
- [ ] Registro A criado na Hostinger
- [ ] IP externo está sendo detectado
- [ ] Domínio resolve para seu IP
- [ ] Nginx Proxy Manager configurado
- [ ] CNAMEs criados para subserviços

---

**Última atualização**: 4 de dezembro de 2025
