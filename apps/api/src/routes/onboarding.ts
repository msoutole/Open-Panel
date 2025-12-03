import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { encrypt } from '../lib/encryption'
import { hashPassword } from '../lib/hash'
import { HTTPException } from 'hono/http-exception'
import type { Variables } from '../types'
import { authRateLimiter } from '../middlewares/rate-limit'

const app = new Hono<{ Variables: Variables }>()

// ============================================================================
// SCHEMAS
// ============================================================================

const aiProviderSchema = z.object({
  provider: z.enum(['gemini', 'claude', 'github', 'ollama']),
  apiKey: z.string().optional(),
  apiUrl: z.string().url().optional(),
})

const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial')

const onboardingSchema = z.object({
  theme: z.enum(['light', 'dark']),
  newPassword: passwordSchema.optional(),
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
    const hashedPassword = await hashPassword(data.newPassword)

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
    const validation = await validateAIProvider(
      provider.provider,
      provider.apiKey,
      provider.apiUrl
    )

    if (!validation.valid) {
      return c.json(
        {
          error: `Invalid API key for ${provider.provider}`,
          details: validation.error,
        },
        400
      )
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
// Valida API key de um provedor (com rate limiting para prevenir abuse)
// ============================================================================

app.post('/validate-provider', authRateLimiter, zValidator('json', aiProviderSchema), async (c) => {
  const data = c.req.valid('json')

  const validation = await validateAIProvider(data.provider, data.apiKey, data.apiUrl)

  return c.json(validation)
})

// ============================================================================
// GET /api/onboarding/providers
// Lista provedores configurados do usuário
// ============================================================================

app.get('/providers', async (c) => {
  const currentUser = c.get('user')
  const userId = currentUser?.userId

  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const providers = await prisma.aIProviderConfig.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      apiUrl: true,
      isActive: true,
      availableModels: true,
      lastValidatedAt: true,
      createdAt: true,
    },
  })

  return c.json({ providers })
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
  if (!apiKey) {
    return { valid: false, error: 'API key is required' }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return { valid: false, error: 'Invalid API key' }
    }

    const data = await response.json() as { models?: Array<{ name: string; displayName?: string }> }
    const models =
      data.models?.map((m) => ({
        id: m.name,
        name: m.displayName || m.name,
      })) || []

    return { valid: true, models }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

async function validateClaude(apiKey: string) {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' }
  }

  try {
    // Verificar API key fazendo uma chamada simples
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    })

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' }
    }

    // Lista de modelos Claude disponíveis (hardcoded, pois API não tem endpoint de listagem)
    const models = [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-2.1', name: 'Claude 2.1' },
      { id: 'claude-2.0', name: 'Claude 2.0' },
    ]

    return { valid: true, models }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

async function validateGitHubCopilot(apiKey: string) {
  if (!apiKey) {
    return { valid: false, error: 'API key (Personal Access Token) is required' }
  }

  try {
    // Verificar se o token é válido fazendo uma chamada à API do GitHub
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!response.ok) {
      return { valid: false, error: 'Invalid GitHub token' }
    }

    // Lista de modelos disponíveis via GitHub Models
    const models = [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ]

    return { valid: true, models }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

async function validateOllama(apiUrl: string) {
  try {
    const response = await fetch(`${apiUrl}/api/tags`, {
      method: 'GET',
    })

    if (!response.ok) {
      return { valid: false, error: 'Cannot connect to Ollama' }
    }

    const data = await response.json() as { models?: Array<{ name: string }> }

    // Filtrar apenas modelos cloud gratuitos conforme especificação
    const cloudModelNames = [
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

    // Obter modelos instalados
    const installedModels = data.models || []

    // Incluir modelos cloud gratuitos (sempre disponíveis) + modelos instalados localmente
    const allModels = [
      ...cloudModelNames.map((name) => ({
        id: name,
        name: name,
        type: 'cloud',
      })),
      ...installedModels
        .filter((m) => !cloudModelNames.includes(m.name))
        .map((m) => ({
          id: m.name,
          name: m.name,
          type: 'local',
        })),
    ]

    return { valid: true, models: allModels }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

export default app
