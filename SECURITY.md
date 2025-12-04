# Política de Segurança

## Versões Suportadas

Apenas a versão mais recente do OpenPanel recebe atualizações de segurança.

| Versão | Suportada          |
| ------ | ------------------ |
| 0.3.x  | :white_check_mark: |
| < 0.3  | :x:                |

## Reportando uma Vulnerabilidade

A segurança do OpenPanel é uma prioridade máxima. Se você descobrir uma vulnerabilidade de segurança, por favor, siga estas diretrizes:

### 🔒 Reporte de Forma Responsável

**NÃO** crie uma issue pública no GitHub para vulnerabilidades de segurança.

### 📧 Como Reportar

1. **Envie um email para:** msoutole@hotmail.com
2. **Assunto:** [SECURITY] Descrição breve da vulnerabilidade
3. **Inclua:**
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Versão afetada
   - Sugestões de correção (se houver)

### ⏱️ Tempo de Resposta

- **Reconhecimento inicial:** 48 horas
- **Avaliação da vulnerabilidade:** 7 dias
- **Plano de correção:** 14 dias
- **Lançamento da correção:** Conforme a gravidade

### 🏆 Reconhecimento

Contribuidores que reportarem vulnerabilidades de segurança serão reconhecidos em:
- Arquivo CHANGELOG.md
- Release notes
- Hall of Fame de Segurança (se aplicável)

## 🛡️ Práticas de Segurança do OpenPanel

### Autenticação e Autorização

- ✅ JWT com tokens de acesso e refresh
- ✅ Autenticação de dois fatores (2FA)
- ✅ RBAC (Role-Based Access Control)
- ✅ Rate limiting para prevenir brute force
- ✅ Password hashing com bcrypt

### Criptografia

- ✅ AES-256-GCM para dados sensíveis em repouso
- ✅ HTTPS/TLS para comunicação
- ✅ Secrets nunca armazenados em texto plano
- ✅ Variáveis de ambiente para configurações sensíveis

### Validação de Dados

- ✅ Validação de entrada com Zod
- ✅ Sanitização de dados do usuário
- ✅ Proteção contra SQL injection (Prisma)
- ✅ Proteção contra XSS
- ✅ Proteção contra CSRF

### Logs e Auditoria

- ✅ Audit logging de ações sensíveis
- ✅ Logs estruturados com Winston
- ✅ Monitoramento de tentativas de login falhas
- ✅ Rastreamento de mudanças críticas

### Docker e Infraestrutura

- ✅ Containers com least privilege
- ✅ Redes isoladas no Docker
- ✅ Imagens base seguras e atualizadas
- ✅ Secrets management via Docker secrets

## 🔍 Verificações de Segurança

### Antes de Fazer Deploy

```bash
# Verificar credenciais expostas
npm run check-secrets

# Rotacionar credenciais (se necessário)
npm run rotate-credentials

# Executar testes de segurança
npm run test

# Verificar dependências vulneráveis
npm audit

# Corrigir vulnerabilidades automáticas
npm audit fix
```

### Configurações Importantes

#### Ambiente de Produção

No `.env`:

```bash
# Use NODE_ENV=production
NODE_ENV=production

# Desabilite debug em produção
DEBUG=false

# Use senhas fortes e únicas
JWT_SECRET=<use-openssl-rand-hex-64>
POSTGRES_PASSWORD=<senha-forte-unica>
REDIS_PASSWORD=<senha-forte-unica>

# Configure CORS apropriadamente
CORS_ORIGIN=https://seu-dominio.com

# Use HTTPS em produção
APP_URL=https://seu-dominio.com
```

#### Docker em Produção

- Configure Traefik com SSL/TLS automático
- Use Docker secrets para credenciais
- Habilite HTTPS/TLS entre serviços
- Configure firewall apropriadamente

## 🚨 Vulnerabilidades Conhecidas

Manteremos esta seção atualizada com vulnerabilidades conhecidas e suas correções.

**Atualmente:** Nenhuma vulnerabilidade crítica conhecida.

### Histórico de Vulnerabilidades

| Data | Gravidade | Descrição | Status | Versão Corrigida |
|------|-----------|-----------|--------|------------------|
| -    | -         | -         | -      | -                |

## 📋 Checklist de Segurança para Contribuidores

Ao contribuir com código, certifique-se de:

- [ ] Nunca commitar senhas, tokens ou secrets
- [ ] Validar toda entrada de usuário
- [ ] Usar queries parametrizadas (Prisma faz isso automaticamente)
- [ ] Sanitizar dados antes de renderizar no frontend
- [ ] Verificar permissões antes de operações sensíveis
- [ ] Logar ações de segurança relevantes
- [ ] Usar HTTPS para todas as comunicações externas
- [ ] Não expor stack traces ou erros detalhados para usuários
- [ ] Manter dependências atualizadas

## 🔐 Melhores Práticas para Usuários

### Instalação

1. **Sempre use senhas fortes**
   ```bash
   # Gere senhas seguras
   openssl rand -hex 32
   ```

2. **Nunca use credenciais padrão em produção**
   - Mude `admin@admin.com.br` e `admin123` imediatamente
   - Configure 2FA para todos os usuários

3. **Mantenha o sistema atualizado**
   ```bash
   git pull
   npm install
   docker-compose pull
   ```

4. **Configure firewall**
   ```bash
   # Exemplo com ufw (Ubuntu)
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

### Monitoramento

- Revise logs regularmente em `.logs/`
- Configure alertas para tentativas de login falhas
- Monitore uso de recursos
- Faça backups regulares

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## ⚖️ Divulgação Responsável

Seguimos os princípios de divulgação responsável:

1. **Reportar** a vulnerabilidade em privado
2. **Aguardar** a correção ser desenvolvida
3. **Coordenar** o anúncio público
4. **Publicar** após a correção estar disponível

Agradecemos pesquisadores de segurança que seguem estas práticas e ajudam a tornar o OpenPanel mais seguro para todos.

---

**Última atualização:** Dezembro 2025
