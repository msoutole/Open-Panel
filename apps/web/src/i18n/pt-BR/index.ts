import type { BaseTranslation } from '../i18n-types'

const pt_BR = {
  // Common
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    finish: 'Concluir',
    email: 'Email',
    password: 'Senha',
    name: 'Nome',
    logout: 'Sair',
  },

  // Authentication
  auth: {
    login: 'Entrar',
    loginTitle: 'Bem-vindo de volta!',
    loginSubtitle: 'Faça login para continuar',
    emailPlaceholder: 'seu@email.com',
    passwordPlaceholder: 'Sua senha',
    invalidCredentials: 'Email ou senha inválidos',
    loginSuccess: 'Login realizado com sucesso!',
    logoutSuccess: 'Você saiu da sua conta',
  },

  // Onboarding
  onboarding: {
    title: 'Bem-vindo ao Open Panel! 🎉',
    subtitle: 'Vamos configurar seu ambiente em poucos passos',

    // Step 1 - Theme
    step1: {
      title: 'Escolha seu tema',
      light: 'Claro',
      dark: 'Escuro',
      lightEmoji: '☀️',
      darkEmoji: '🌙',
    },

    // Step 2 - AI Providers
    step2: {
      title: 'Configure provedores de IA',
      subtitle: 'Selecione e configure pelo menos um provedor. Você pode adicionar mais depois no chatbot.',
      apiKeyPlaceholder: 'API Key',
      urlPlaceholder: 'URL do Ollama (ex: http://localhost:11434)',
      validate: 'Validar',
      validateConnection: 'Validar Conexão',
      defaultProvider: 'Provedor padrão',
      selectDefault: 'Selecione...',
      validating: 'Validando {provider:string}...',
      validationSuccess: '{provider:string} validado com sucesso!',
      validationError: '{provider:string}: {error:string}',
      ollamaNote: '💡 <strong>Ollama local é opcional mas recomendado para reduzir custos.</strong> Modelos cloud gratuitos serão habilitados automaticamente. Você pode remover o container do Ollama depois se quiser.',

      providers: {
        gemini: {
          name: 'Google Gemini',
          description: 'Modelos avançados de IA do Google',
          helpText: 'Obtenha sua API key no Google AI Studio',
        },
        claude: {
          name: 'Anthropic Claude',
          description: 'Assistente de IA conversacional avançado',
          helpText: 'Crie uma API key no Anthropic Console',
        },
        github: {
          name: 'GitHub Copilot',
          description: 'Assistente de código da GitHub',
          helpText: 'Use um Personal Access Token do GitHub',
        },
        ollama: {
          name: 'Ollama (Local/Cloud)',
          description: 'Modelos locais e cloud gratuitos',
          helpText: 'Modelos cloud gratuitos serão habilitados automaticamente',
        },
      },
    },

    // Step 3 - Password
    step3: {
      title: 'Alterar senha (obrigatório)',
      subtitle: 'Por segurança, você deve alterar a senha padrão agora.',
      newPassword: 'Nova senha',
      newPasswordPlaceholder: 'Mínimo 8 caracteres',
      confirmPassword: 'Confirmar nova senha',
      confirmPasswordPlaceholder: 'Digite a senha novamente',
      passwordStrength: 'Força da senha:',
      strengthWeak: 'Fraca',
      strengthMedium: 'Média',
      strengthStrong: 'Forte',
      strengthVeryStrong: 'Muito Forte',
      requirements: {
        length: '8+ caracteres',
        uppercase: 'Letra maiúscula',
        lowercase: 'Letra minúscula',
        number: 'Número',
        special: 'Caractere especial',
      },
      warning: '⚠️ <strong>A nova senha será utilizada no próximo login.</strong> Você não será deslogado agora, mas lembre-se da nova senha para o próximo acesso!',
    },

    // Actions
    complete: 'Começar a usar Open Panel',
    completing: 'Finalizando...',

    // Footer
    footer: '💡 Você pode alterar essas configurações a qualquer momento no chatbot ou nas configurações',

    // Errors
    errors: {
      passwordMismatch: 'As senhas não coincidem',
      passwordTooShort: 'A senha deve ter pelo menos 8 caracteres',
      passwordWeak: 'Por favor, use uma senha mais forte (deve conter maiúsculas, minúsculas, números e caracteres especiais)',
      passwordRequired: 'Por segurança, você deve alterar a senha padrão',
      noProvider: 'Configure pelo menos um provedor de IA',
      noDefaultProvider: 'Selecione um provedor padrão',
      completionFailed: 'Falha ao completar onboarding',
    },

    // Success
    success: 'Configuração concluída com sucesso! 🎉',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Bem-vindo, {name:string}!',
    projects: 'Projetos',
    containers: 'Containers',
    deployments: 'Deployments',
  },

  // Projects
  projects: {
    title: 'Projetos',
    create: 'Criar Projeto',
    noProjects: 'Nenhum projeto encontrado',
    status: {
      active: 'Ativo',
      paused: 'Pausado',
      error: 'Erro',
      deploying: 'Implantando',
      stopped: 'Parado',
    },
  },

  // Settings
  settings: {
    title: 'Configurações',
    profile: 'Perfil',
    security: 'Segurança',
    aiProviders: 'Provedores de IA',
    theme: 'Tema',
    language: 'Idioma',
    changePassword: 'Alterar Senha',
    currentPassword: 'Senha Atual',
    passwordChanged: 'Senha alterada com sucesso',
  },

  // Errors
  errors: {
    generic: 'Ocorreu um erro inesperado',
    network: 'Erro de conexão. Verifique sua internet.',
    unauthorized: 'Você não tem permissão para esta ação',
    notFound: 'Recurso não encontrado',
    validation: 'Erro de validação',
  },

  // Validation
  validation: {
    required: '{field:string} é obrigatório',
    email: 'Email inválido',
    minLength: '{field:string} deve ter pelo menos {min:number} caracteres',
    maxLength: '{field:string} deve ter no máximo {max:number} caracteres',
  },
} satisfies BaseTranslation

export default pt_BR
