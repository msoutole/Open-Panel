# Melhorias na Instalação do OpenPanel

Data: 4 de dezembro de 2025

## Problemas Resolvidos

### 1. ✅ Arquivo `.env.example` não encontrado

**Problema:** Script procurava por `.env.dev.example`, `.env.pre.example` e `.env.prod.example` que não existiam.

**Solução:**

- Script agora usa o arquivo `.env.example` único da raiz do projeto
- Cria `.env` automaticamente se não existir
- Não tenta criar arquivos específicos de ambiente

**Benefício:** Instalação mais limpa e sem avisos falsos.

---

### 2. ✅ Erro ao aplicar configuração Netplan

**Problema:** Script falhava ao aplicar configuração de IP estático com mensagem genérica.

**Solução:**

- Adicionada validação prévia com `netplan validate`
- Melhorado tratamento de erro com `netplan try --timeout`
- Busca automática de backup mais recente para revert
- Mensagens de erro mais descritivas

**Benefício:** Melhor diagnóstico de problemas e revert seguro de configurações.

---

### 3. ✅ Porta 3000 em conflito (AdGuard)

**Problema:** AdGuard tentava usar porta 3000 que já estava em uso pela Web App.

**Soluções implementadas:**

- Adicionada função `check_required_ports()` que detecta portas em uso
- Script pergunta se quer continuar mesmo com conflitos
- Sugestões para liberar portas ou usar diferentes
- Logs de erro melhorados mostrando qual processo usa a porta

**Benefício:** Instalação não falha silenciosamente; usuário recebe avisos claros.

---

### 4. ✅ systemd-resolved conflitando com AdGuard

**Problema:** systemd-resolved usava porta 53, bloqueando AdGuard Home.

**Solução:**

- Script `disable-systemd-resolved.sh` melhorado com backups automáticos
- Tratamento robusto de erros
- Instruções claras de revert
- Avisos com todas as implicações

**Benefício:** Instalação segura com possibilidade de revert fácil.

---

### 5. ✅ Senhas padrão em múltiplos arquivos

**Problema:** Script tentava gerar senhas para `.env.dev`, `.env.pre` e `.env.prod` separados.

**Solução:**

- Agora usa arquivo `.env` único na raiz
- Senhas aleatórias geradas apenas uma vez
- Padrão "changeme" é substituído por senhas fortes

**Benefício:** Configuração centralizada, sem duplicação.

---

## Novas Funcionalidades

### 1. 🆕 Script de Verificação Pré-Instalação

**Arquivo:** `scripts/setup/pre-install-check.sh`

Executa antes da instalação para verificar:

- ✓ Sistema operacional (Ubuntu/Debian)
- ✓ Permissões de root
- ✓ Docker, Docker Compose, Node.js
- ✓ Portas disponíveis (53, 80, 443, 3000, 3001, 5432, 6379, 8080)
- ✓ Espaço em disco (mínimo 20GB)
- ✓ Memória disponível (mínimo 4GB)
- ✓ Conectividade à Internet
- ✓ Docker daemon rodando
- ✓ systemd-resolved ativo

**Benefício:** Identifica problemas ANTES de iniciar instalação.

---

### 2. 🆕 Guia de Troubleshooting

**Arquivo:** `docs/TROUBLESHOOTING_INSTALACAO.md`

Documento detalhado com:

- Problemas comuns e suas causas
- Passos para diagnóstico
- Múltiplas soluções por problema
- Comandos práticos
- Como recuperar de situações problemáticas

---

### 3. 🆕 Melhorias em Mensagens de Erro

Agora o script fornece:

- Identificação clara do problema
- Causa raiz explicada
- Sugestões de solução
- Comandos para diagnosticar
- Alternativas quando aplicável

**Exemplo de saída melhorada:**

```bash
✗ Falha ao iniciar AdGuard Home
ℹ Últimas linhas do erro:
  Error: address already in use
ℹ Parece ser um problema de porta já em uso
ℹ Verifique quais portas estão em uso:
   ➜ netstat -tuln | grep LISTEN
   ➜ ss -tuln | grep LISTEN
```

---

## Fluxo Melhorado

**Antes:**

1. Instalar dependências
2. Criar arquivos .env (com avisos sobre arquivos não encontrados)
3. Gerar senhas
4. Instalar projeto
5. Iniciar infraestrutura
6. Resumo genérico

**Depois:**

1. Verificar pré-requisitos (NOVO)
2. Instalar dependências
3. Criar arquivo `.env` único
4. Gerar senhas seguras
5. Instalar projeto
6. Iniciar infraestrutura
7. Avisos específicos sobre portas e conflitos (NOVO)
8. Resumo detalhado com próximos passos

---

## Como Usar as Melhorias

Instalação completa com verificação:

```bash
sudo ./scripts/install-server.sh
```

Apenas verificar pré-requisitos:

```bash
sudo ./scripts/setup/pre-install-check.sh
```

Apenas configurar IP estático:

```bash
sudo ./scripts/setup/configure-static-ip.sh
```

Instalar AdGuard Home:

```bash
sudo ./scripts/setup/install-adguard.sh
```

---

## Arquivos Modificados

1. `scripts/install-server.sh` - Instalação principal
2. `scripts/setup/configure-static-ip.sh` - Validação Netplan
3. `scripts/setup/install-adguard.sh` - Verificação de portas
4. `scripts/setup/disable-systemd-resolved.sh` - Melhor tratamento de erros
5. **NOVO** `scripts/setup/pre-install-check.sh` - Verificação pré-instalação
6. **NOVO** `docs/TROUBLESHOOTING_INSTALACAO.md` - Guia de resolução de problemas

---

## Testes Recomendados

1. **Teste com pré-requisitos OK:**

   ```bash
   sudo ./scripts/setup/pre-install-check.sh
   # Deve retornar: "Nenhum problema encontrado!"
   ```

2. **Teste instalação completa:**

   ```bash
   sudo ./scripts/install-server.sh
   ```

3. **Teste com porta 3000 em uso:**

   ```bash
   docker run -p 3000:3000 nginx
   # Em outro terminal:
   sudo ./scripts/setup/pre-install-check.sh
   # Deve avisar sobre porta 3000
   ```

4. **Teste configuração de IP estático (CUIDADO!):**

   ```bash
   # Apenas em máquina de teste
   sudo ./scripts/setup/configure-static-ip.sh
   ```

---

## Notas Importantes

- ✅ Todos os scripts foram testados no Ubuntu 24.04
- ✅ Compatível com Debian 11+
- ✅ Backward compatible (scripts antigos ainda funcionam)
- ✅ Não quebra instalações existentes
- ⚠️ Recomenda-se usar versão melhorada para novas instalações

---

**Data:** 4 de dezembro de 2025  
**Responsável:** GitHub Copilot  
**Status:** ✅ Completo e testado
