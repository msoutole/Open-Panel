# 🔧 Usando Hostinger-MCP para Configuração

## 📌 Situação Atual

O **Hostinger-MCP** disponível no Cursor fornece as seguintes ferramentas:

- ✅ `hosting_importWordpressWebsite` - Importar site WordPress
- ✅ `hosting_deployWordpressPlugin` - Deploy de plugins WordPress
- ✅ `hosting_deployWordpressTheme` - Deploy de temas WordPress
- ✅ `hosting_deployJsApplication` - Deploy de aplicações JavaScript
- ✅ `hosting_deployStaticWebsite` - Deploy de sites estáticos

⚠️ **Nota**: Atualmente, o Hostinger-MCP **não possui** uma ferramenta específica para configurar registros DNS.

## 🔄 Alternativas para Configurar DNS

### Opção 1: Configuração Manual via Browser

Você pode usar o browser integrado no Cursor para navegar até o painel da Hostinger e configurar manualmente:

1. **Abrir browser no Cursor**
2. **Navegar até**: https://hpanel.hostinger.com
3. **Fazer login** com suas credenciais
4. **Seguir o guia**: [HOSTINGER_DNS_CONFIG.md](./HOSTINGER_DNS_CONFIG.md)

### Opção 2: Script Auxiliar + Instruções

Use o script que gera instruções detalhadas:

```bash
./scripts/setup/configure-hostinger-dns.sh soullabs.com.br seuusuario.ddns.net adguard traefik
```

O script mostrará exatamente quais registros criar no painel.

### Opção 3: API da Hostinger (Futuro)

Se a Hostinger disponibilizar uma API para gerenciamento de DNS, podemos criar uma integração. Atualmente, a API disponível é focada em deploy de sites.

## 📚 Documentação Disponível

- 📖 **[HOSTINGER_DNS_CONFIG.md](./HOSTINGER_DNS_CONFIG.md)** - Guia completo e detalhado
- ⚡ **[HOSTINGER_DNS_QUICKSTART.md](./HOSTINGER_DNS_QUICKSTART.md)** - Guia rápido de referência
- 🔧 **Script**: `scripts/setup/configure-hostinger-dns.sh` - Gera instruções

## 💡 Recomendação

Para configurar DNS na Hostinger agora:

1. **Use o script auxiliar** para gerar as instruções
2. **Acesse o painel da Hostinger** manualmente (via browser ou manualmente)
3. **Siga as instruções** geradas pelo script ou no guia completo

A configuração manual de DNS é simples e leva apenas alguns minutos. O processo completo está documentado passo a passo.

---

**Última atualização**: 2025-01-15

