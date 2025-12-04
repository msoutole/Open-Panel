# 🚀 Guia Rápido - Configuração DNS Hostinger

Este é um guia rápido para configurar DNS na Hostinger usando o Hostinger-MCP.

## 📋 Pré-requisitos

- ✅ Domínio registrado na Hostinger (ex: `soullabs.com.br`)
- ✅ Conta No-IP configurada com hostname (ex: `seuusuario.ddns.net`)
- ✅ No-IP DUC instalado e funcionando

## ⚡ Configuração Rápida

### Passo 1: Preparar Informações

Anote os seguintes dados:
- **Domínio**: `soullabs.com.br`
- **No-IP Hostname**: `seuusuario.ddns.net`
- **Subdomínios desejados**: `adguard`, `traefik`, `panel`, etc.

### Passo 2: Usar Script Auxiliar

Execute o script para gerar as instruções:

```bash
./scripts/setup/configure-hostinger-dns.sh soullabs.com.br seuusuario.ddns.net adguard traefik panel
```

### Passo 3: Acessar Painel Hostinger

1. Acesse: https://hpanel.hostinger.com
2. Faça login
3. Navegue: **Domains** → Seu domínio → **DNS / Nameservers** → **Gerenciar Zona DNS**

### Passo 4: Criar Registros CNAME

Para cada subdomínio, crie um registro CNAME:

| Campo | Valor |
|-------|-------|
| **Tipo** | CNAME |
| **Host** | `adguard` (ou outro subdomínio) |
| **Aponta para** | `seuusuario.ddns.net` |
| **TTL** | 3600 (ou Automático) |

### Exemplo Completo: AdGuard

1. Clique em **Adicionar Registro**
2. Tipo: **CNAME**
3. Host: `adguard`
4. Valor: `seuusuario.ddns.net`
5. TTL: `3600`
6. Salvar

Resultado: `adguard.soullabs.com.br` → `seuusuario.ddns.net` → Seu IP atual

## 🔍 Verificar Configuração

Após criar os registros, aguarde 5-15 minutos e verifique:

```bash
# Linux/macOS
dig adguard.soullabs.com.br

# Windows
nslookup adguard.soullabs.com.br
```

Ou online: https://dnschecker.org/

## ⏱️ Tempo de Propagação

- **Local**: 5-15 minutos
- **Global**: 2-24 horas
- **Máximo**: Até 48 horas

## 📖 Documentação Completa

Para detalhes completos, consulte: [HOSTINGER_DNS_CONFIG.md](./HOSTINGER_DNS_CONFIG.md)

## 🔧 Usando Hostinger-MCP

O Hostinger-MCP atualmente não possui ferramenta específica para configuração de DNS. Para configurar:

1. **Opção 1**: Use o script auxiliar e siga as instruções manuais no painel
2. **Opção 2**: Use o browser integrado no Cursor para navegar até o painel da Hostinger
3. **Opção 3**: Configure via API da Hostinger (se disponível)

---

**Última atualização**: 2025-01-15

