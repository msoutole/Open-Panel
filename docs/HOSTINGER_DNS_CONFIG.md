# 🌐 Configuração de DNS na Hostinger

Este guia detalha como configurar registros DNS na Hostinger para criar subdomínios que apontam para serviços através do No-IP.

## 📋 Visão Geral

Quando você configura um subdomínio (ex: `adguard.soullabs.com.br`), o fluxo de requisição funciona da seguinte forma:

```
Cliente → adguard.soullabs.com.br
    ↓
Hostinger DNS (resolução CNAME)
    ↓
No-IP (ddns.net) → Resolve para IP público atual
    ↓
Seu Roteador (port forwarding)
    ↓
Nginx/Traefik (porta 80/443)
    ↓
Serviço (AdGuard na porta configurada)
```

## 🔧 Pré-requisitos

Antes de configurar o DNS na Hostinger, você precisa ter:

1. ✅ **Domínio registrado na Hostinger** (ex: `soullabs.com.br`)
2. ✅ **Conta No-IP configurada** com hostname criado (ex: `seuusuario.ddns.net`)
3. ✅ **No-IP DUC instalado e funcionando** no seu servidor (atualizando o IP automaticamente)
4. ✅ **Port forwarding configurado no roteador** (portas 80 e 443)
5. ✅ **Nginx ou Traefik configurado** como reverse proxy

## 📝 Configuração Passo a Passo

### Passo 1: Acessar o Painel da Hostinger

1. Acesse: https://hpanel.hostinger.com
2. Faça login com suas credenciais
3. Navegue até: **Domains** → **Gerenciar Domínio**

### Passo 2: Acessar Zona DNS

1. No painel do domínio, localize a seção **DNS / Nameservers**
2. Clique em **Gerenciar Zona DNS** ou **DNS Zone**

### Passo 3: Criar Registro CNAME

Para cada serviço que você quiser expor, crie um registro CNAME:

#### Exemplo: AdGuard Home

1. Clique em **Adicionar Registro** ou **+ Novo Registro**
2. Selecione o tipo: **CNAME**
3. Preencha os campos:
   - **Host (Nome)**: `adguard`
   - **Aponta para (Target/Value)**: `seuusuario.ddns.net` (seu endereço No-IP)
   - **TTL**: `3600` (padrão, ou deixe em "Automático")
4. Clique em **Salvar** ou **Adicionar**

#### Exemplo: Traefik Dashboard

1. Clique em **Adicionar Registro** ou **+ Novo Registro**
2. Selecione o tipo: **CNAME**
3. Preencha os campos:
   - **Host (Nome)**: `traefik`
   - **Aponta para (Target/Value)**: `seuusuario.ddns.net`
   - **TTL**: `3600`
4. Clique em **Salvar** ou **Adicionar**

#### Exemplo: OpenPanel

1. Clique em **Adicionar Registro** ou **+ Novo Registro**
2. Selecione o tipo: **CNAME**
3. Preencha os campos:
   - **Host (Nome)**: `panel` ou `www`
   - **Aponta para (Target/Value)**: `seuusuario.ddns.net`
   - **TTL**: `3600`
4. Clique em **Salvar** ou **Adicionar**

### Passo 4: Verificar Configuração

Após adicionar os registros, você pode verificar:

1. Na lista de registros DNS, você verá algo como:
   ```
   Tipo    Nome          Valor
   CNAME   adguard       seuusuario.ddns.net
   CNAME   traefik       seuusuario.ddns.net
   CNAME   www           seuusuario.ddns.net
   ```

## 🔍 Validação da Configuração

### Método 1: Usando dig (Linux/macOS)

```bash
# Verificar resolução do subdomínio
dig adguard.soullabs.com.br

# Verificar resolução do domínio principal
dig soullabs.com.br
```

### Método 2: Usando nslookup (Windows)

```powershell
# Verificar resolução do subdomínio
nslookup adguard.soullabs.com.br

# Verificar resolução do domínio principal
nslookup soullabs.com.br
```

### Método 3: Online Tools

- **DNS Checker**: https://dnschecker.org/
- **MXToolbox**: https://mxtoolbox.com/DNSLookup.aspx

### Resultado Esperado

Quando você executar `dig adguard.soullabs.com.br`, deve ver algo como:

```
adguard.soullabs.com.br. 3600 IN CNAME seuusuario.ddns.net.
seuusuario.ddns.net. 60 IN A SEU_IP_PUBLICO_ATUAL
```

## ⏱️ Propagação DNS

**IMPORTANTE**: A propagação DNS pode levar de alguns minutos até 48 horas. Normalmente:
- **Propagação local**: 5-15 minutos
- **Propagação global**: 2-24 horas
- **Máximo**: Até 48 horas

### Verificar Propagação Global

1. Acesse: https://dnschecker.org/
2. Digite o subdomínio (ex: `adguard.soullabs.com.br`)
3. Selecione o tipo: **CNAME**
4. Clique em **Search**
5. Verifique se os servidores DNS ao redor do mundo já estão resolvendo

## 🔧 Configuração Adicional

### Registro A para Domínio Principal (Opcional)

Se você também quiser que o domínio principal aponte diretamente, você pode criar um registro A:

1. Tipo: **A**
2. Host: `@` (representa o domínio raiz)
3. Valor: Seu IP público atual (ou use CNAME também)

⚠️ **Nota**: Se você usa IP dinâmico, é melhor usar CNAME apontando para o No-IP.

### Registro MX para Email (Opcional)

Se você quiser usar email no domínio:

1. Tipo: **MX**
2. Host: `@` ou vazio
3. Valor: Servidor de email (ex: `mail.soullabs.com.br`)
4. Prioridade: `10`

### Registros TXT (Opcional)

Para verificações de domínio (Google, Microsoft, etc.):

1. Tipo: **TXT**
2. Host: `@` ou específico
3. Valor: String de verificação fornecida

## 🛠️ Troubleshooting

### Problema: Subdomínio não resolve

**Soluções:**
1. Verifique se o registro CNAME foi salvo corretamente
2. Aguarde a propagação DNS (pode levar até 48h)
3. Limpe o cache DNS local:
   ```bash
   # Linux/macOS
   sudo systemd-resolve --flush-caches
   
   # Windows
   ipconfig /flushdns
   ```
4. Verifique se o No-IP está atualizado com seu IP atual

### Problema: CNAME aponta para endereço incorreto

**Solução:**
1. Edite o registro CNAME no painel da Hostinger
2. Verifique se o valor está exatamente como `seuusuario.ddns.net` (sem `http://` ou `/`)
3. Aguarde alguns minutos após a alteração

### Problema: Serviço não acessível mesmo com DNS correto

**Verificar:**
1. ✅ No-IP DUC está rodando e atualizado?
2. ✅ Port forwarding no roteador (80 e 443)?
3. ✅ Nginx/Traefik está configurado para o subdomínio?
4. ✅ Firewall do servidor permite as portas?

## 📚 Subdomínios Comuns

Aqui estão alguns subdomínios comuns que você pode querer configurar:

| Subdomínio | Serviço | Porta Interna |
|------------|---------|---------------|
| `adguard` | AdGuard Home | 3000 |
| `traefik` | Traefik Dashboard | 8080 |
| `panel` ou `www` | OpenPanel | 80/443 |
| `api` | API do OpenPanel | 3001 |
| `grafana` | Grafana | 3000 |
| `portainer` | Portainer | 9000 |

## 🔐 Segurança

### Recomendações

1. **Use HTTPS**: Configure SSL/TLS no Traefik com Let's Encrypt
2. **Autenticação**: Proteja dashboards com autenticação
3. **Firewall**: Mantenha apenas portas necessárias abertas
4. **Atualizações**: Mantenha No-IP DUC sempre atualizado

### Configuração SSL Automática com Traefik

Se você usar Traefik, o SSL será configurado automaticamente quando:
1. ✅ DNS está resolvendo corretamente
2. ✅ Porta 80 está acessível publicamente
3. ✅ Traefik está configurado com Let's Encrypt
4. ✅ Email de contato configurado (`SSL_EMAIL`)

## 📖 Referências

- [Documentação da Hostinger - DNS](https://support.hostinger.com/pt-br/articles/11772750757017-como-adicionar-registros-dns-no-hpanel)
- [No-IP DUC Setup](./INSTALACAO_SERVIDOR.md#no-ip-duc)
- [Configuração Traefik](../config/traefik/)

## 🔄 Próximos Passos

Após configurar o DNS:

1. ✅ Aguardar propagação DNS (verificar com dnschecker.org)
2. ✅ Configurar Traefik para reconhecer o subdomínio
3. ✅ Testar acesso ao serviço via subdomínio
4. ✅ Verificar SSL automático (se configurado)
5. ✅ Documentar configuração no projeto

---

**Última atualização**: 2025-01-15

