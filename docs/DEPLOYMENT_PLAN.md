# 📋 Plano de Implantação - Open Panel
## Automação Completa de Instalação e Experiência de Onboarding

---

## 📌 Visão Geral

Este documento descreve o plano completo de implantação para automatizar 100% a instalação do Open Panel e implementar uma experiência de onboarding intuitiva com configuração de provedores de IA.

### Objetivos Principais

1. **Instalação 100% Automatizada** - Zero interação do usuário durante instalação
2. **Tela de Boas-Vindas** - Configuração inicial pós-login com provedores de IA
3. **Multiplataforma** - Suporte para Linux, macOS e Windows
4. **Resiliência** - Sistema robusto com tratamento de erros e recuperação automática

---

## 📦 FASE 1: Automação Completa do Script de Instalação

### 1.0 - Eliminação de Interação do Usuário

**Objetivo**: Remover todas as opções de escolha do usuário durante instalação.

#### Mudanças no Script `setup.sh`

**Arquivo**: `scripts/setup/setup.sh`

**Alterações**:

1. **Remover prompts interativos**:
   - Linha 194-199: Remover prompt de sobrescrever `.env`
   - Forçar modo silencioso por padrão

2. **Comportamento novo**:
   - Se `.env` existe e já tem credenciais válidas → Manter e usar
   - Se `.env` não existe ou tem credenciais padrão → Gerar novas credenciais automaticamente
   - Sempre fazer backup automático antes de modificar

**Implementação**:
```bash
# Novo fluxo de decisão automática
if [ -f "$ENV_FILE" ]; then
    # Verificar se credenciais já foram geradas (não são mais os valores padrão)
    if grep -q "POSTGRES_PASSWORD=changeme" "$ENV_FILE" || grep -q "JWT_SECRET=your-super-secret" "$ENV_FILE"; then
        log_info "Detectado .env com credenciais padrão. Gerando novas credenciais..."
        BACKUP_FILE=$(backup_file "$ENV_FILE")
        REGENERATE_SECRETS=true
    else
        log_info ".env com credenciais customizadas detectado. Mantendo existente."
        REGENERATE_SECRETS=false
    fi
else
    log_info ".env não encontrado. Criando novo..."
    REGENERATE_SECRETS=true
fi
```

---

### 1.1 - Verificação e Instalação Automática de Dependências

**Objetivo**: Verificar TODAS as dependências antes de iniciar e instalar automaticamente o que estiver faltando.

#### Dependências a Verificar

**Sistema Operacional**:
- ✅ Linux (Ubuntu, Debian, Fedora, CentOS, Arch)
- ✅ macOS (via Homebrew)
- ✅ Windows (via WSL2 ou Git Bash + Docker Desktop)

**Requisitos**:

1. **Node.js** >= 18.0.0
2. **npm** >= 10.0.0
3. **Docker** >= 20.10.0
4. **Docker Compose** >= 2.0.0
5. **Git** (opcional, mas recomendado)
6. **curl** ou **wget** (para downloads)
7. **openssl** (para geração de secrets)
8. **pg_isready** (incluído no PostgreSQL client)

#### Nova Seção no Script: Pre-Installation Check

**Local**: Antes de STEP 1 em `setup.sh`

```bash
# ============================================================================
# STEP 0: PRE-INSTALLATION CHECK E AUTO-INSTALL
# ============================================================================

print_subsection "Verificação e instalação de dependências"

# Array de comandos necessários
REQUIRED_COMMANDS=("node" "npm" "docker" "docker-compose" "curl" "openssl" "git")

# Verificar e instalar cada comando
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists "$cmd"; then
        print_warn "$cmd não encontrado. Tentando instalar automaticamente..."
        install_command "$cmd" || handle_install_failure "$cmd"
    else
        print_success "$cmd detectado"
    fi
done

# Verificar versões mínimas
verify_minimum_versions || handle_version_failure
```

#### Função de Tratamento de Erros

**Adicionar em**: `scripts/lib/common.sh`

```bash
##
# Trata falha de instalação de dependência
# Envia email e exibe instruções ao usuário
#
handle_install_failure() {
    local cmd="$1"
    local error_details="$2"

    log_error "Falha ao instalar: $cmd"
    log_error "Detalhes: $error_details"

    print_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_error "❌ FALHA NA INSTALAÇÃO"
    print_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_error "Não foi possível instalar automaticamente: $cmd"
    echo ""
    print_info "📝 RESOLUÇÃO DO PROBLEMA:"
    echo ""

    # Instruções específicas por comando
    case "$cmd" in
        node)
            echo "  1. Instale Node.js manualmente:"
            echo "     • Ubuntu/Debian: sudo apt-get install -y nodejs npm"
            echo "     • macOS: brew install node"
            echo "     • Windows: Baixe de https://nodejs.org"
            ;;
        docker)
            echo "  1. Instale Docker manualmente:"
            echo "     • Linux: curl -fsSL https://get.docker.com | sh"
            echo "     • macOS: brew install --cask docker"
            echo "     • Windows: Baixe Docker Desktop de https://docker.com"
            ;;
        *)
            echo "  1. Instale $cmd manualmente seguindo a documentação oficial"
            ;;
    esac

    echo ""
    echo "  2. Execute o script novamente após instalar: ./scripts/setup/setup.sh"
    echo ""
    print_info "📧 PRECISA DE AJUDA?"
    echo "  Se o problema persistir, envie um email para: msoutole@hotmail.com"
    echo "  Inclua o arquivo de log: $LOG_FILE"
    echo ""

    # Enviar email de notificação (se configurado)
    send_error_email "$cmd" "$error_details"

    exit 1
}

##
# Envia email de notificação de erro
#
send_error_email() {
    local cmd="$1"
    local error_details="$2"
    local recipient="msoutole@hotmail.com"

    # Verificar se mailx ou sendmail está disponível
    if ! command_exists mailx && ! command_exists sendmail; then
        log_debug "Email não configurado. Pulando notificação."
        return 0
    fi

    local subject="[Open Panel] Falha na Instalação - $cmd"
    local body="
Sistema: $(uname -s) $(uname -m)
Usuário: $(whoami)
Data: $(date)
Comando: $cmd
Erro: $error_details

Log completo anexado.
"

    if command_exists mailx; then
        echo "$body" | mailx -s "$subject" -a "$LOG_FILE" "$recipient" 2>/dev/null || true
    fi

    log_info "Email de notificação enviado para $recipient"
}
```

---

### 1.2 - Geração Automática e Validação de Senhas

**Objetivo**: Gerar credenciais automaticamente, validar se já existem e reutilizá-las de forma inteligente.

#### Implementação: Gerenciamento Inteligente de Credenciais

**Arquivo**: `scripts/setup/setup.sh` (STEP 2)

```bash
# ============================================================================
# STEP 2: GERENCIAMENTO INTELIGENTE DE CREDENCIAIS
# ============================================================================

print_subsection "Configurando credenciais do sistema"

# Arquivo de metadados de credenciais
CREDENTIALS_META_FILE=".env.backups/.credentials.meta"
ensure_dir ".env.backups"

# Função para verificar se credenciais já foram geradas
credentials_already_generated() {
    [ -f "$CREDENTIALS_META_FILE" ] && grep -q "GENERATED=true" "$CREDENTIALS_META_FILE"
}

# Carregar credenciais existentes do .env
if [ -f "$ENV_FILE" ]; then
    EXISTING_POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)
    EXISTING_REDIS_PASSWORD=$(grep "REDIS_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)
    EXISTING_JWT_SECRET=$(grep "JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
fi

# Decidir se precisa gerar novas credenciais
if credentials_already_generated && [ -n "$EXISTING_POSTGRES_PASSWORD" ] && [ "$EXISTING_POSTGRES_PASSWORD" != "changeme" ]; then
    print_success "Credenciais existentes detectadas. Reutilizando..."
    POSTGRES_PASSWORD="$EXISTING_POSTGRES_PASSWORD"
    REDIS_PASSWORD="$EXISTING_REDIS_PASSWORD"
    JWT_SECRET="$EXISTING_JWT_SECRET"
    log_info "Reusing existing credentials"
else
    print_info "Gerando novas credenciais criptográficas..."

    # Gerar credenciais seguras
    POSTGRES_PASSWORD=$(generate_random_string 32)
    REDIS_PASSWORD=$(generate_random_string 32)
    JWT_SECRET=$(generate_random_string 64)

    # Salvar metadata
    cat > "$CREDENTIALS_META_FILE" <<EOF
GENERATED=true
GENERATED_AT=$(date -Iseconds)
POSTGRES_PASSWORD_HASH=$(echo -n "$POSTGRES_PASSWORD" | sha256sum | cut -d' ' -f1)
REDIS_PASSWORD_HASH=$(echo -n "$REDIS_PASSWORD" | sha256sum | cut -d' ' -f1)
JWT_SECRET_HASH=$(echo -n "$JWT_SECRET" | sha256sum | cut -d' ' -f1)
EOF

    print_success "Novas credenciais geradas"
    log_info "Generated new cryptographically secure credentials"
fi

# Criar ou atualizar .env
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
fi

# Atualizar credenciais no .env (uso de sed cross-platform)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" "$ENV_FILE"
    sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" "$ENV_FILE"
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" "$ENV_FILE"
else
    # Linux
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" "$ENV_FILE"
    sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" "$ENV_FILE"
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" "$ENV_FILE"
fi

print_success "Arquivo .env configurado com credenciais"
```

---

### 1.3 - Inteligência para Múltiplas Execuções

**Objetivo**: Script deve ser inteligente para detectar execuções repetidas e agir apropriadamente.

#### Implementação: Sistema de Estado de Instalação

**Novo arquivo**: `scripts/lib/installation-state.sh`

```bash
#!/bin/bash

# ============================================================================
# GERENCIAMENTO DE ESTADO DE INSTALAÇÃO
# ============================================================================

STATE_FILE=".openpanel.state"
STATE_LOCK_FILE=".openpanel.state.lock"

##
# Inicializa arquivo de estado
#
init_installation_state() {
    if [ ! -f "$STATE_FILE" ]; then
        cat > "$STATE_FILE" <<EOF
{
  "installation_started": "$(date -Iseconds)",
  "installation_completed": false,
  "installation_count": 1,
  "last_run": "$(date -Iseconds)",
  "dependencies_installed": false,
  "docker_services_healthy": false,
  "database_initialized": false,
  "admin_created": false
}
EOF
        log_info "Estado de instalação inicializado"
    else
        # Incrementar contador de execuções
        local count=$(jq -r '.installation_count' "$STATE_FILE")
        count=$((count + 1))
        jq ".installation_count = $count | .last_run = \"$(date -Iseconds)\"" "$STATE_FILE" > "$STATE_FILE.tmp"
        mv "$STATE_FILE.tmp" "$STATE_FILE"
        log_info "Execução #$count detectada"
    fi
}

##
# Atualiza estado de uma etapa
#
update_state() {
    local key="$1"
    local value="$2"

    jq ".$key = $value" "$STATE_FILE" > "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"
    log_debug "Estado atualizado: $key = $value"
}

##
# Verifica se etapa já foi concluída
#
is_step_completed() {
    local key="$1"
    local value=$(jq -r ".$key" "$STATE_FILE")

    [ "$value" = "true" ]
}

##
# Marca instalação como concluída
#
mark_installation_complete() {
    update_state "installation_completed" "true"
    update_state "completed_at" "\"$(date -Iseconds)\""
    log_info "Instalação marcada como concluída"
}
```

**Integração no script principal**:

```bash
# No início do setup.sh, após carregar common.sh
source "$SCRIPT_DIR/../lib/installation-state.sh"

# Inicializar estado
init_installation_state

# Antes de cada STEP
if is_step_completed "database_initialized"; then
    print_success "Banco de dados já inicializado. Pulando..."
else
    # Executar STEP
    # ...
    update_state "database_initialized" "true"
fi
```

---

### 1.4 - Verificação de Health dos Containers e Criação de Admin

**Objetivo**: Garantir que TODOS os containers estejam saudáveis antes de concluir e criar usuário admin automaticamente.

#### Implementação: Health Check Abrangente

**Adicionar ao `setup.sh` após STEP 6**:

```bash
# ============================================================================
# STEP 7: VERIFICAÇÃO COMPLETA DE SAÚDE DOS SERVIÇOS
# ============================================================================

print_subsection "Verificação de saúde dos serviços (obrigatória)"

# Lista de todos os containers que devem estar healthy
CRITICAL_CONTAINERS=(
    "openpanel-postgres"
    "openpanel-redis"
    "openpanel-traefik"
)

OPTIONAL_CONTAINERS=(
    "openpanel-ollama"  # Opcional, pode estar no profile
)

# Verificar containers críticos
all_healthy=true
for container in "${CRITICAL_CONTAINERS[@]}"; do
    print_info "Verificando: $container..."

    if ! docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container"; then
        print_error "$container não está rodando!"
        all_healthy=false
        continue
    fi

    if wait_for_container_health "$container" 120; then
        print_success "$container está saudável ✓"
    else
        print_error "$container não ficou saudável"
        all_healthy=false

        # Mostrar logs do container com falha
        print_info "Últimas 20 linhas de log de $container:"
        docker logs --tail 20 "$container" 2>&1 | sed 's/^/  /'
    fi
done

# Verificar containers opcionais (não bloqueia instalação)
for container in "${OPTIONAL_CONTAINERS[@]}"; do
    if docker ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container"; then
        print_info "Verificando (opcional): $container..."

        if wait_for_container_health "$container" 60; then
            print_success "$container está saudável ✓"
        else
            print_warn "$container não está saudável (ignorando, é opcional)"
        fi
    fi
done

if [ "$all_healthy" = false ]; then
    print_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_error "❌ ALGUNS SERVIÇOS CRÍTICOS NÃO ESTÃO SAUDÁVEIS"
    print_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_info "📝 AÇÕES RECOMENDADAS:"
    echo "  1. Verifique os logs acima para identificar o problema"
    echo "  2. Execute: docker-compose logs -f [container-name]"
    echo "  3. Tente reiniciar os serviços: docker-compose restart"
    echo "  4. Se o problema persistir: msoutole@hotmail.com"
    echo ""

    # Enviar email de erro
    send_error_email "docker-services" "Um ou mais containers não ficaram healthy"

    log_fatal "Instalação falhou: Serviços não ficaram saudáveis"
fi

print_success "Todos os serviços críticos estão saudáveis!"
update_state "docker_services_healthy" "true"

# ============================================================================
# STEP 8: CRIAR USUÁRIO ADMINISTRADOR AUTOMATICAMENTE
# ============================================================================

print_subsection "Criando usuário administrador"

if is_step_completed "admin_created"; then
    print_info "Usuário admin já foi criado anteriormente"
else
    print_info "Criando usuário admin padrão..."

    # Definir credenciais padrão
    ADMIN_EMAIL="admin@admin.com.br"
    ADMIN_PASSWORD="admin123"

    # Executar script de criação de admin
    export ADMIN_EMAIL
    export ADMIN_PASSWORD

    if npm run create:admin 2>&1 | tee -a "$LOG_FILE"; then
        print_success "Usuário administrador criado com sucesso!"
        echo ""
        print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_warn "⚠️  IMPORTANTE - CREDENCIAIS PADRÃO"
        print_warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "  Email:    ${COLOR_CYAN}$ADMIN_EMAIL${COLOR_NC}"
        echo "  Senha:    ${COLOR_CYAN}$ADMIN_PASSWORD${COLOR_NC}"
        echo ""
        print_warn "🔒 VOCÊ DEVE ALTERAR A SENHA IMEDIATAMENTE APÓS O LOGIN!"
        print_warn "   A senha será solicitada na tela de boas-vindas."
        echo ""

        update_state "admin_created" "true"
        log_info "Admin user created: $ADMIN_EMAIL"
    else
        print_error "Falha ao criar usuário administrador"
        log_error "Failed to create admin user"
        # Não bloquear instalação, admin pode ser criado manualmente depois
    fi
fi
```

---

## 📱 FASE 2: Tela de Boas-Vindas e Configuração de IA

### 2.0 - Tela de Boas-Vindas com Configuração de Provedores de IA

**Objetivo**: Criar experiência de onboarding intuitiva após primeiro login.

#### Estrutura do Banco de Dados

**Adicionar ao Prisma Schema** (`apps/api/prisma/schema.prisma`):

```prisma
// ============================================
// USER PREFERENCES & ONBOARDING
// ============================================

model UserPreference {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Onboarding
  onboardingCompleted Boolean @default(false)
  onboardingCompletedAt DateTime?

  // Theme
  theme     String   @default("light") // "light" or "dark"

  // AI Provider Preferences
  defaultAIProvider String? // "gemini", "claude", "github", "ollama"

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_preferences")
}

model AIProviderConfig {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider    String   // "gemini", "claude", "github", "ollama"
  apiKey      String?  // Encrypted
  apiUrl      String?  // For Ollama or custom endpoints
  isActive    Boolean  @default(true)

  // Available models (cached from provider)
  availableModels Json? // Array of model objects

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastValidatedAt DateTime?

  @@unique([userId, provider])
  @@index([userId])
  @@map("ai_provider_configs")
}

// Adicionar relações ao modelo User
model User {
  // ... campos existentes ...

  preferences    UserPreference?
  aiProviders    AIProviderConfig[]
}
```

**Migração**:
```bash
npx prisma migrate dev --name add_onboarding_and_ai_config
```

---

#### Backend: Novos Endpoints

**Arquivo**: `apps/api/src/routes/onboarding.ts` (NOVO)

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { encrypt, decrypt } from '../lib/encryption'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../types'

const app = new Hono<{ Variables: Variables }>()

// ============================================================================
// SCHEMAS
// ============================================================================

const aiProviderSchema = z.object({
  provider: z.enum(['gemini', 'claude', 'github', 'ollama']),
  apiKey: z.string().optional(),
  apiUrl: z.string().url().optional(),
})

const onboardingSchema = z.object({
  theme: z.enum(['light', 'dark']),
  newPassword: z.string().min(8).optional(),
  aiProviders: z.array(aiProviderSchema),
  defaultProvider: z.string().optional(),
})

// ============================================================================
// GET /api/onboarding/status
// Verifica se onboarding foi concluído
// ============================================================================

app.get('/status', async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mustChangePassword: true,
    },
  })

  return c.json({
    onboardingCompleted: preference?.onboardingCompleted || false,
    mustChangePassword: user?.mustChangePassword || false,
  })
})

// ============================================================================
// POST /api/onboarding/complete
// Completa o onboarding
// ============================================================================

app.post('/complete', zValidator('json', onboardingSchema), async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const data = c.req.valid('json')

  // 1. Atualizar senha se fornecida
  if (data.newPassword) {
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    })
  }

  // 2. Salvar preferências
  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      theme: data.theme,
      defaultAIProvider: data.defaultProvider,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    },
    update: {
      theme: data.theme,
      defaultAIProvider: data.defaultProvider,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    },
  })

  // 3. Salvar configurações de AI providers
  for (const provider of data.aiProviders) {
    // Validar API key antes de salvar
    const validation = await validateAIProvider(provider.provider, provider.apiKey, provider.apiUrl)

    if (!validation.valid) {
      return c.json({
        error: `Invalid API key for ${provider.provider}`,
        details: validation.error,
      }, 400)
    }

    // Encriptar API key
    const encryptedApiKey = provider.apiKey ? encrypt(provider.apiKey) : null

    await prisma.aIProviderConfig.upsert({
      where: {
        userId_provider: {
          userId,
          provider: provider.provider,
        },
      },
      create: {
        userId,
        provider: provider.provider,
        apiKey: encryptedApiKey,
        apiUrl: provider.apiUrl,
        availableModels: validation.models || [],
        lastValidatedAt: new Date(),
      },
      update: {
        apiKey: encryptedApiKey,
        apiUrl: provider.apiUrl,
        availableModels: validation.models || [],
        lastValidatedAt: new Date(),
      },
    })
  }

  return c.json({
    message: 'Onboarding completed successfully',
    success: true,
  })
})

// ============================================================================
// POST /api/onboarding/validate-provider
// Valida API key de um provedor
// ============================================================================

app.post('/validate-provider', zValidator('json', aiProviderSchema), async (c) => {
  const data = c.req.valid('json')

  const validation = await validateAIProvider(data.provider, data.apiKey, data.apiUrl)

  return c.json(validation)
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function validateAIProvider(
  provider: string,
  apiKey?: string,
  apiUrl?: string
): Promise<{ valid: boolean; models?: any[]; error?: string }> {
  try {
    switch (provider) {
      case 'gemini':
        return await validateGemini(apiKey!)
      case 'claude':
        return await validateClaude(apiKey!)
      case 'github':
        return await validateGitHubCopilot(apiKey!)
      case 'ollama':
        return await validateOllama(apiUrl || 'http://localhost:11434')
      default:
        return { valid: false, error: 'Unknown provider' }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

async function validateGemini(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
  )

  if (!response.ok) {
    return { valid: false, error: 'Invalid API key' }
  }

  const data = await response.json()
  const models = data.models?.map((m: any) => ({
    id: m.name,
    name: m.displayName,
  })) || []

  return { valid: true, models }
}

async function validateClaude(apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  })

  if (!response.ok) {
    return { valid: false, error: 'Invalid API key' }
  }

  const data = await response.json()
  const models = data.data?.map((m: any) => ({
    id: m.id,
    name: m.display_name || m.id,
  })) || []

  return { valid: true, models }
}

async function validateGitHubCopilot(apiKey: string) {
  // GitHub Copilot usa Azure OpenAI ou GitHub Models API
  const response = await fetch('https://api.github.com/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    return { valid: false, error: 'Invalid API key' }
  }

  const data = await response.json()
  const models = data?.map((m: any) => ({
    id: m.name,
    name: m.display_name || m.name,
  })) || []

  return { valid: true, models }
}

async function validateOllama(apiUrl: string) {
  const response = await fetch(`${apiUrl}/api/tags`)

  if (!response.ok) {
    return { valid: false, error: 'Cannot connect to Ollama' }
  }

  const data = await response.json()

  // Filtrar apenas modelos cloud gratuitos
  const cloudModels = [
    'gpt-oss:120b-cloud',
    'qwen3-vl:235b-cloud',
    'qwen3-coder:480b-cloud',
    'glm-4.6:cloud',
    'deepseek-v3.1:671b-cloud',
    'minimax-m2:cloud',
    'kimi-k2:1t-cloud',
    'gemini-3-pro-preview:latest',
    'kimi-k2-thinking:cloud',
    'cogito-2.1:671b-cloud',
  ]

  const models = data.models
    ?.filter((m: any) => cloudModels.includes(m.name))
    .map((m: any) => ({
      id: m.name,
      name: m.name,
    })) || []

  return { valid: true, models }
}

export default app
```

**Registrar rota em** `apps/api/src/index.ts`:
```typescript
import onboarding from './routes/onboarding'

// ... outras rotas ...
app.route('/api/onboarding', onboarding)
```

---

#### Frontend: Tela de Boas-Vindas

**Novo arquivo**: `apps/web/pages/Onboarding.tsx`

```typescript
import React, { useState } from 'react';
import { Sparkles, Key, Palette, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresApiKey: boolean;
  requiresUrl?: boolean;
  helpUrl: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Modelos avançados de IA do Google',
    icon: '🔷',
    requiresApiKey: true,
    helpUrl: 'https://makersuite.google.com/app/apikey',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Assistente de IA conversacional avançado',
    icon: '🤖',
    requiresApiKey: true,
    helpUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'github',
    name: 'GitHub Copilot',
    description: 'Assistente de código da GitHub',
    icon: '🐙',
    requiresApiKey: true,
    helpUrl: 'https://github.com/settings/tokens',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local/Cloud)',
    description: 'Modelos locais e cloud gratuitos',
    icon: '🦙',
    requiresApiKey: false,
    requiresUrl: true,
    helpUrl: 'https://ollama.com/cloud',
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Record<string, { apiKey?: string; apiUrl?: string; validated: boolean }>>({});
  const [defaultProvider, setDefaultProvider] = useState<string>('');
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const validateProvider = async (providerId: string) => {
    setValidating(providerId);
    setError('');

    try {
      const provider = selectedProviders[providerId];
      const response = await fetch(`${API_URL}/api/onboarding/validate-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('openpanel_access_token')}`,
        },
        body: JSON.stringify({
          provider: providerId,
          apiKey: provider.apiKey,
          apiUrl: provider.apiUrl,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setSelectedProviders(prev => ({
          ...prev,
          [providerId]: { ...prev[providerId], validated: true },
        }));
      } else {
        setError(`${providerId}: ${data.error || 'Validação falhou'}`);
      }
    } catch (err) {
      setError(`Erro ao validar ${providerId}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setValidating(null);
    }
  };

  const handleComplete = async () => {
    setError('');

    // Validar senha
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    // Verificar se há pelo menos um provedor validado
    const validatedProviders = Object.entries(selectedProviders).filter(([_, v]) => v.validated);
    if (validatedProviders.length === 0) {
      setError('Configure pelo menos um provedor de IA');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('openpanel_access_token')}`,
        },
        body: JSON.stringify({
          theme,
          newPassword: newPassword || undefined,
          defaultProvider,
          aiProviders: validatedProviders.map(([provider, config]) => ({
            provider,
            apiKey: config.apiKey,
            apiUrl: config.apiUrl,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao completar onboarding');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao completar onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo ao Open Panel! 🎉</h1>
          <p className="text-gray-600">Vamos configurar seu ambiente em poucos passos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              } font-semibold transition-all`}>
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-blue-500' : 'bg-gray-200'} transition-all`} />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Step 1: Tema */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Palette size={24} /> Escolha seu tema
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">☀️</div>
                  <div className="font-semibold">Claro</div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🌙</div>
                  <div className="font-semibold">Escuro</div>
                </button>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
            >
              Próximo
            </button>
          </div>
        )}

        {/* Step 2: Provedores de IA */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Key size={24} /> Configure provedores de IA
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecione e configure pelo menos um provedor. Você pode adicionar mais depois.
              </p>

              <div className="space-y-4">
                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{provider.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                        </div>
                      </div>
                      {selectedProviders[provider.id]?.validated && (
                        <Check size={24} className="text-green-500" />
                      )}
                    </div>

                    {provider.requiresApiKey && (
                      <div className="mt-3">
                        <input
                          type="password"
                          placeholder="API Key"
                          value={selectedProviders[provider.id]?.apiKey || ''}
                          onChange={(e) => setSelectedProviders(prev => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], apiKey: e.target.value, validated: false },
                          }))}
                          className="w-full px-4 py-2 border rounded-lg mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => validateProvider(provider.id)}
                            disabled={!selectedProviders[provider.id]?.apiKey || validating === provider.id}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {validating === provider.id && <Loader2 size={16} className="animate-spin" />}
                            Validar
                          </button>
                          <a
                            href={provider.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Como obter API Key?
                          </a>
                        </div>
                      </div>
                    )}

                    {provider.requiresUrl && (
                      <div className="mt-3">
                        <input
                          type="url"
                          placeholder="URL do Ollama (ex: http://localhost:11434)"
                          value={selectedProviders[provider.id]?.apiUrl || 'http://localhost:11434'}
                          onChange={(e) => setSelectedProviders(prev => ({
                            ...prev,
                            [provider.id]: { ...prev[provider.id], apiUrl: e.target.value, validated: false },
                          }))}
                          className="w-full px-4 py-2 border rounded-lg mb-2"
                        />
                        <button
                          onClick={() => validateProvider(provider.id)}
                          disabled={validating === provider.id}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {validating === provider.id && <Loader2 size={16} className="animate-spin" />}
                          Validar Conexão
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Ollama local é opcional mas recomendado para reduzir custos. Modelos cloud gratuitos serão habilitados automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {Object.keys(selectedProviders).filter(k => selectedProviders[k].validated).length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provedor padrão
                  </label>
                  <select
                    value={defaultProvider}
                    onChange={(e) => setDefaultProvider(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {Object.keys(selectedProviders)
                      .filter(k => selectedProviders[k].validated)
                      .map(k => (
                        <option key={k} value={k}>
                          {AI_PROVIDERS.find(p => p.id === k)?.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={Object.keys(selectedProviders).filter(k => selectedProviders[k].validated).length === 0}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Alterar Senha */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Lock size={24} /> Alterar senha (obrigatório)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Por segurança, você deve alterar a senha padrão agora.
              </p>

              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ A nova senha será utilizada no próximo login. Você não será deslogado agora.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Começar a usar Open Panel
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

**Integrar no App principal**:

```typescript
// Em apps/web/src/App.tsx
import { Onboarding } from './pages/Onboarding';

// ... dentro do componente
const [showOnboarding, setShowOnboarding] = useState(false);

useEffect(() => {
  // Verificar se precisa mostrar onboarding
  const checkOnboarding = async () => {
    if (isAuthenticated) {
      const response = await fetch(`${API_URL}/api/onboarding/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openpanel_access_token')}`,
        },
      });
      const data = await response.json();
      setShowOnboarding(!data.onboardingCompleted);
    }
  };

  checkOnboarding();
}, [isAuthenticated]);

// No render
if (showOnboarding) {
  return <Onboarding onComplete={() => setShowOnboarding(false)} />;
}
```

---

### 2.1 - Ollama: Modelos Cloud Gratuitos

**Objetivo**: Habilitar apenas modelos cloud gratuitos do Ollama e informar ao usuário.

**Implementação**: Já incluída na função `validateOllama` acima, que filtra apenas os modelos cloud especificados.

**Mensagem na UI**: Já incluída no componente de onboarding.

---

### 2.2 - Configuração via Chatbot

**Objetivo**: Permitir alterar provedores e API keys diretamente no chatbot.

**Implementação**: Adicionar comandos especiais no chatbot que direcionam para configurações.

**Arquivo**: `apps/web/components/Chatbot.tsx` (supondo que existe)

```typescript
// Adicionar comandos especiais
const SPECIAL_COMMANDS = {
  '/settings': 'Abre configurações de AI providers',
  '/providers': 'Lista provedores configurados',
  '/change-password': 'Alterar senha',
};

// No handler de mensagens
if (message.startsWith('/settings') || message.startsWith('/providers')) {
  // Abrir modal de configurações
  setShowSettingsModal(true);
  return;
}
```

---

### 2.3 - Campo de Alteração de Senha no Onboarding

**Objetivo**: Já implementado no Step 3 do componente de Onboarding acima.

✅ **Concluído**

---

## 🌍 FASE 3: Compatibilidade Multiplataforma

### 3.0 - Suporte para Linux, macOS e Windows

**Objetivo**: Garantir que o script funcione em todos os sistemas operacionais.

#### Estratégia

1. **Linux**: Suporte completo (já implementado)
2. **macOS**: Suporte via Homebrew e comandos nativos
3. **Windows**: Suporte via WSL2 ou Git Bash + Docker Desktop

#### Implementação: Detecção de SO e Adaptações

**Adicionar em**: `scripts/lib/common.sh`

```bash
# ============================================================================
# DETECÇÃO E SUPORTE MULTIPLATAFORMA
# ============================================================================

##
# Detecta sistema operacional
#
detect_os() {
    case "$OSTYPE" in
        linux-gnu*)
            OS="linux"
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                DISTRO=$ID
                DISTRO_VERSION=$VERSION_ID
            fi
            ;;
        darwin*)
            OS="macos"
            DISTRO="macos"
            DISTRO_VERSION=$(sw_vers -productVersion)
            ;;
        msys*|mingw*|cygwin*)
            OS="windows"
            DISTRO="windows"
            # Verificar se é WSL
            if grep -qi microsoft /proc/version 2>/dev/null; then
                OS="wsl"
                DISTRO="wsl"
            fi
            ;;
        *)
            OS="unknown"
            DISTRO="unknown"
            ;;
    esac

    export OS DISTRO DISTRO_VERSION
    log_info "Sistema operacional detectado: $OS ($DISTRO $DISTRO_VERSION)"
}

##
# Instala comando de forma multiplataforma
#
install_command() {
    local cmd="$1"

    log_info "Instalando $cmd para $OS..."

    case "$OS" in
        linux)
            install_linux "$cmd"
            ;;
        macos)
            install_macos "$cmd"
            ;;
        windows|wsl)
            install_windows "$cmd"
            ;;
        *)
            log_error "Sistema operacional não suportado: $OS"
            return 1
            ;;
    esac
}

##
# Instalação para Linux
#
install_linux() {
    local cmd="$1"

    if command_exists apt-get; then
        # Debian/Ubuntu
        case "$cmd" in
            node) sudo apt-get update && sudo apt-get install -y nodejs npm ;;
            docker) curl -fsSL https://get.docker.com | sh ;;
            docker-compose) sudo apt-get install -y docker-compose ;;
            git) sudo apt-get install -y git ;;
            curl) sudo apt-get install -y curl ;;
            openssl) sudo apt-get install -y openssl ;;
        esac
    elif command_exists dnf; then
        # Fedora/CentOS/RHEL
        case "$cmd" in
            node) sudo dnf install -y nodejs npm ;;
            docker) sudo dnf install -y docker docker-compose ;;
            git) sudo dnf install -y git ;;
            curl) sudo dnf install -y curl ;;
            openssl) sudo dnf install -y openssl ;;
        esac
    elif command_exists pacman; then
        # Arch Linux
        case "$cmd" in
            node) sudo pacman -S --noconfirm nodejs npm ;;
            docker) sudo pacman -S --noconfirm docker docker-compose ;;
            git) sudo pacman -S --noconfirm git ;;
            curl) sudo pacman -S --noconfirm curl ;;
            openssl) sudo pacman -S --noconfirm openssl ;;
        esac
    else
        log_error "Gerenciador de pacotes não suportado"
        return 1
    fi
}

##
# Instalação para macOS
#
install_macos() {
    local cmd="$1"

    if ! command_exists brew; then
        log_info "Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    case "$cmd" in
        node) brew install node ;;
        docker) brew install --cask docker ;;
        docker-compose) brew install docker-compose ;;
        git) brew install git ;;
        curl) brew install curl ;;
        openssl) brew install openssl ;;
    esac
}

##
# Instalação para Windows/WSL
#
install_windows() {
    local cmd="$1"

    if [ "$OS" = "wsl" ]; then
        # WSL usa instalação Linux
        install_linux "$cmd"
    else
        # Git Bash / MSYS2
        print_warn "Instalação automática não disponível no Windows"
        print_info "Por favor, instale manualmente:"
        case "$cmd" in
            node) print_info "  - Baixe de: https://nodejs.org" ;;
            docker) print_info "  - Baixe Docker Desktop de: https://docker.com" ;;
            git) print_info "  - Baixe de: https://git-scm.com" ;;
        esac
        return 1
    fi
}

# Executar detecção no carregamento
detect_os
```

**Adicionar no início de** `setup.sh`:

```bash
# Detectar SO antes de começar
detect_os

# Mostrar informações do sistema
print_info "Sistema: $OS ($DISTRO $DISTRO_VERSION)"
```

---

## 📋 Checklist de Implementação

### Fase 1: Scripts de Instalação

- [ ] 1.0 - Remover interação do usuário do setup.sh
- [ ] 1.1 - Adicionar verificação e instalação automática de todas as dependências
- [ ] 1.2 - Implementar geração inteligente de senhas com validação
- [ ] 1.3 - Adicionar sistema de estado de instalação (installation-state.sh)
- [ ] 1.4 - Implementar health check completo e criação automática de admin
- [ ] Testar script em múltiplas execuções
- [ ] Testar recuperação de falhas

### Fase 2: Backend

- [ ] 2.0 - Atualizar schema do Prisma (UserPreference, AIProviderConfig)
- [ ] 2.0 - Executar migration
- [ ] 2.0 - Criar rota /api/onboarding
- [ ] 2.0 - Implementar validação de API keys para cada provedor
- [ ] 2.0 - Adicionar criptografia para API keys
- [ ] 2.1 - Implementar filtro de modelos cloud do Ollama
- [ ] 2.2 - Adicionar comandos especiais no chatbot
- [ ] Testar todos os endpoints

### Fase 3: Frontend

- [ ] 3.0 - Criar componente Onboarding.tsx
- [ ] 3.0 - Integrar onboarding no fluxo de login
- [ ] 3.0 - Adicionar validação em tempo real de API keys
- [ ] 3.0 - Implementar seleção de tema
- [ ] 3.0 - Implementar alteração de senha obrigatória
- [ ] 3.1 - Adicionar instruções sobre Ollama
- [ ] 3.2 - Criar modal de configurações acessível pelo chatbot
- [ ] Testar fluxo completo de onboarding

### Fase 4: Multiplataforma

- [ ] 4.0 - Adicionar detecção de SO em common.sh
- [ ] 4.0 - Implementar instalação para Linux
- [ ] 4.0 - Implementar instalação para macOS
- [ ] 4.0 - Implementar instalação para Windows/WSL
- [ ] Testar em Ubuntu
- [ ] Testar em Debian
- [ ] Testar em macOS
- [ ] Testar em WSL2
- [ ] Testar em Git Bash (Windows)

### Fase 5: Documentação e Testes

- [ ] Atualizar README.md com novas instruções
- [ ] Criar guia de troubleshooting
- [ ] Testar instalação do zero em ambiente limpo
- [ ] Testar cenários de falha
- [ ] Validar sistema de email de erro
- [ ] Criar vídeo de demonstração

---

## 🚀 Ordem de Implementação Recomendada

### Semana 1: Infraestrutura (Fase 1)

**Dia 1-2**: Scripts de instalação
- Implementar 1.0, 1.1, 1.2
- Testar em ambiente de desenvolvimento

**Dia 3-4**: Sistema de estado e health checks
- Implementar 1.3, 1.4
- Testar recuperação de falhas

**Dia 5**: Testes e ajustes
- Testar múltiplas execuções
- Validar tratamento de erros

### Semana 2: Backend e Database (Fase 2 - Backend)

**Dia 1-2**: Schema e migrations
- Atualizar Prisma schema
- Criar migrations
- Testar em dev

**Dia 3-4**: Rotas de onboarding
- Implementar /api/onboarding
- Implementar validação de providers
- Adicionar criptografia

**Dia 5**: Testes de integração
- Testar todos os endpoints
- Validar segurança

### Semana 3: Frontend (Fase 3)

**Dia 1-3**: Componente de onboarding
- Criar Onboarding.tsx
- Implementar todos os steps
- Integrar com backend

**Dia 4-5**: Polimento e UX
- Melhorar UI/UX
- Adicionar loading states
- Testar fluxo completo

### Semana 4: Multiplataforma e Finalização (Fase 4-5)

**Dia 1-2**: Suporte multiplataforma
- Implementar detecção de SO
- Adicionar instalação para cada plataforma

**Dia 3-4**: Testes em múltiplas plataformas
- Testar em Linux (Ubuntu, Debian)
- Testar em macOS
- Testar em Windows/WSL

**Dia 5**: Documentação e entrega
- Atualizar documentação
- Criar guias
- Deploy final

---

## 📞 Suporte e Contato

**Email para reportar erros**: msoutole@hotmail.com

**Logs**: Sempre salvos em `.logs/` com timestamp

**Estado da instalação**: `.openpanel.state`

---

## ✅ Critérios de Sucesso

### Instalação

- ✅ Script roda do início ao fim sem interação
- ✅ Todas as dependências são instaladas automaticamente
- ✅ Credenciais são geradas e validadas corretamente
- ✅ Todos os containers ficam healthy
- ✅ Usuário admin é criado automaticamente
- ✅ Logs detalhados são gerados
- ✅ Erros são tratados com mensagens claras

### Onboarding

- ✅ Tela aparece no primeiro login
- ✅ Usuário pode configurar múltiplos provedores de IA
- ✅ API keys são validadas em tempo real
- ✅ Modelos disponíveis são listados
- ✅ Senha é alterada obrigatoriamente
- ✅ Tema é aplicado imediatamente
- ✅ Configurações podem ser alteradas depois

### Multiplataforma

- ✅ Funciona em Ubuntu/Debian
- ✅ Funciona em Fedora/CentOS
- ✅ Funciona em macOS
- ✅ Funciona em WSL2
- ✅ Instruções claras para Windows

---

## 🎯 Próximos Passos (Futuro)

1. **Integração com CI/CD**
   - Testes automatizados de instalação
   - Deploy automático

2. **Dashboard de Onboarding**
   - Analytics de adoção
   - Taxa de conclusão

3. **Múltiplos idiomas**
   - Internacionalização do onboarding
   - Suporte a português, inglês, espanhol

4. **Modo offline**
   - Instalação sem internet (packages pré-baixados)

---

**Fim do Plano de Implantação** 🎉
