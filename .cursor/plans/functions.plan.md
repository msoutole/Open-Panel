<!-- 22a5ba0a-0b31-4499-8259-377e38d3cd89 a94c800e-8b9f-4ef4-a63f-a3285d4aa49e -->
# Implementação de Funcionalidades Faltantes do EasyPanel

## Análise Comparativa

### ✅ Funcionalidades já implementadas no Open-Panel

- ✅ Instalação de aplicações (via Templates/Marketplace)
- ✅ Configuração de domínios
- ✅ Gerenciamento de bancos de dados (PostgreSQL, MySQL, MongoDB, Redis)
- ✅ Monitoramento de desempenho (métricas, logs, WebSocket)
- ✅ Configuração de DNS (Cloudflare, AWS Route53, DigitalOcean)
- ✅ Gestão de certificados SSL (Let's Encrypt via Traefik)
- ✅ Buildpacks automáticos (Nixpacks, Paketo para múltiplas linguagens)
- ✅ Terminal Web
- ✅ Autenticação 2FA
- ✅ Sistema de backups

### ❌ Funcionalidades faltantes

1. **Gerenciamento de Contas de E-mail** - Sistema completo para criar, editar e gerenciar contas de e-mail
2. **Administrador de Arquivos** - Interface web para navegação e gerenciamento de arquivos no servidor
3. **Servidor de E-mail** - Infraestrutura de servidor de e-mail (não apenas SMTP de saída)

---

## Tarefas de Implementação

### 1. Sistema de Gerenciamento de Contas de E-mail

**Objetivo**: Criar sistema completo para gerenciar contas de e-mail associadas a domínios.

**Arquivos a criar/modificar**:

- `apps/api/prisma/schema.prisma` - Adicionar modelos `EmailAccount`, `EmailDomain`, `EmailAlias`
- `apps/api/src/routes/emails.ts` - Rotas CRUD para contas de e-mail
- `apps/api/src/services/email.service.ts` - Lógica de negócio para gerenciamento de e-mail
- `apps/web/components/EmailManagement.tsx` - Interface de gerenciamento de e-mails
- `apps/web/components/EmailAccountForm.tsx` - Formulário para criar/editar contas

**Funcionalidades**:

- Criar contas de e-mail por domínio
- Listar contas de e-mail
- Editar senhas e configurações
- Criar aliases de e-mail
- Deletar contas
- Integração com servidor de e-mail (Postfix/Dovecot ou similar)

**Dependências**:

- Servidor de e-mail Docker (Postfix + Dovecot ou Mailcow)
- Integração com DNS para registros MX

---

### 2. Administrador de Arquivos (File Manager)

**Objetivo**: Interface web para navegar e gerenciar arquivos em containers e volumes Docker.

**Arquivos a criar/modificar**:

- `apps/api/src/routes/files.ts` - Rotas para operações de arquivos
- `apps/api/src/services/file-manager.service.ts` - Serviço de gerenciamento de arquivos
- `apps/web/components/FileManager.tsx` - Componente principal do file manager
- `apps/web/components/FileBrowser.tsx` - Navegador de arquivos
- `apps/web/components/FileUpload.tsx` - Upload de arquivos
- `apps/web/components/FileEditor.tsx` - Editor de arquivos de texto

**Funcionalidades**:

- Navegação de diretórios
- Visualização de arquivos (texto, imagem, etc.)
- Upload de arquivos
- Download de arquivos
- Edição de arquivos de texto
- Criar/renomear/deletar arquivos e pastas
- Gerenciar permissões (chmod)
- Integração com containers Docker (acesso via exec)

**Dependências**:

- Acesso ao sistema de arquivos do host ou volumes Docker
- WebSocket para operações assíncronas

---

### 3. Servidor de E-mail (Infraestrutura)

**Objetivo**: Configurar servidor de e-mail completo para receber e enviar e-mails.

**Arquivos a criar/modificar**:

- `docker-compose.yml` - Adicionar serviços de e-mail (Postfix/Dovecot ou Mailcow)
- `apps/api/src/services/email-server.service.ts` - Integração com servidor de e-mail
- `apps/api/src/routes/emails/server.ts` - Rotas para configuração do servidor
- Documentação em `docs/EMAIL_SETUP.md`

**Funcionalidades**:

- Servidor SMTP para envio
- Servidor IMAP/POP3 para recebimento
- Webmail opcional (Roundcube ou similar)
- Configuração automática de DNS (registros MX, SPF, DKIM, DMARC)
- Quotas de armazenamento por conta
- Filtros de spam

**Dependências**:

- Container Docker com servidor de e-mail completo
- Integração com DNS providers para registros MX

---

### 4. Melhorias Adicionais

**4.1. Interface de Gerenciamento de E-mail na UI**

- Adicionar seção "E-mail" no menu lateral (`apps/web/components/Sidebar.tsx`)
- Criar view `EmailView.tsx` para gerenciar contas
- Integrar com sistema de domínios existente

**4.2. Integração File Manager com Containers**

- Permitir acesso a volumes Docker específicos
- Suporte para múltiplos containers
- Segurança: validar permissões do usuário

**4.3. Documentação**

- Atualizar `docs/MANUAL_DO_USUARIO.md` com seção de e-mail
- Atualizar `docs/MANUAL_TECNICO.md` com arquitetura de e-mail
- Criar `docs/EMAIL_SETUP.md` com guia de configuração

---

## Ordem de Implementação Recomendada

1. **Fase 1**: Administrador de Arquivos (mais simples, não requer infraestrutura externa)
2. **Fase 2**: Sistema de Gerenciamento de Contas de E-mail (requer integração com servidor)
3. **Fase 3**: Servidor de E-mail completo (requer configuração de infraestrutura)

---

## Considerações Técnicas

### Segurança

- Validar permissões de acesso a arquivos
- Sanitizar caminhos de arquivos para prevenir path traversal
- Criptografar senhas de contas de e-mail
- Rate limiting em operações de arquivo

### Performance

- Lazy loading para listagem de arquivos grandes
- WebSocket para operações assíncronas
- Cache de metadados de arquivos

### Compatibilidade

- Suporte para Windows, Linux e macOS
- Suporte para diferentes servidores de e-mail (Postfix, Mailcow, etc.)