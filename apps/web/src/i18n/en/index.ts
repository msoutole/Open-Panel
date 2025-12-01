import type { Translation } from '../i18n-types'

const en = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    logout: 'Logout',
  },

  // Authentication
  auth: {
    login: 'Login',
    loginTitle: 'Welcome back!',
    loginSubtitle: 'Sign in to continue',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: 'Your password',
    invalidCredentials: 'Invalid email or password',
    loginSuccess: 'Login successful!',
    logoutSuccess: 'You have been logged out',
  },

  // Onboarding
  onboarding: {
    title: 'Welcome to Open Panel! 🎉',
    subtitle: "Let's set up your environment in a few steps",

    // Step 1 - Theme
    step1: {
      title: 'Choose your theme',
      light: 'Light',
      dark: 'Dark',
      lightEmoji: '☀️',
      darkEmoji: '🌙',
    },

    // Step 2 - AI Providers
    step2: {
      title: 'Configure AI providers',
      subtitle: 'Select and configure at least one provider. You can add more later in the chatbot.',
      apiKeyPlaceholder: 'API Key',
      urlPlaceholder: 'Ollama URL (e.g., http://localhost:11434)',
      validate: 'Validate',
      validateConnection: 'Validate Connection',
      defaultProvider: 'Default provider',
      selectDefault: 'Select...',
      validating: 'Validating {provider}...',
      validationSuccess: '{provider} validated successfully!',
      validationError: '{provider}: {error}',
      ollamaNote: '💡 <strong>Local Ollama is optional but recommended to reduce costs.</strong> Free cloud models will be enabled automatically. You can remove the Ollama container later if you want.',

      providers: {
        gemini: {
          name: 'Google Gemini',
          description: 'Advanced AI models from Google',
          helpText: 'Get your API key from Google AI Studio',
        },
        claude: {
          name: 'Anthropic Claude',
          description: 'Advanced conversational AI assistant',
          helpText: 'Create an API key in the Anthropic Console',
        },
        github: {
          name: 'GitHub Copilot',
          description: "GitHub's code assistant",
          helpText: 'Use a GitHub Personal Access Token',
        },
        ollama: {
          name: 'Ollama (Local/Cloud)',
          description: 'Local and free cloud models',
          helpText: 'Free cloud models will be enabled automatically',
        },
      },
    },

    // Step 3 - Password
    step3: {
      title: 'Change password (required)',
      subtitle: 'For security, you must change the default password now.',
      newPassword: 'New password',
      newPasswordPlaceholder: 'Minimum 8 characters',
      confirmPassword: 'Confirm new password',
      confirmPasswordPlaceholder: 'Type the password again',
      passwordStrength: 'Password strength:',
      strengthWeak: 'Weak',
      strengthMedium: 'Medium',
      strengthStrong: 'Strong',
      strengthVeryStrong: 'Very Strong',
      requirements: {
        minLength: '8+ characters',
        uppercase: 'Uppercase letter',
        lowercase: 'Lowercase letter',
        number: 'Number',
        special: 'Special character',
      },
      warning: "⚠️ <strong>The new password will be used on next login.</strong> You won't be logged out now, but remember the new password for your next access!",
    },

    // Actions
    complete: 'Start using Open Panel',
    completing: 'Finishing...',

    // Footer
    footer: '💡 You can change these settings anytime in the chatbot or settings',

    // Errors
    errors: {
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordWeak: 'Please use a stronger password (must contain uppercase, lowercase, numbers, and special characters)',
      passwordRequired: 'For security, you must change the default password',
      noProvider: 'Configure at least one AI provider',
      noDefaultProvider: 'Select a default provider',
      completionFailed: 'Failed to complete onboarding',
    },

    // Success
    success: 'Setup completed successfully! 🎉',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome, {name}!',
    projects: 'Projects',
    containers: 'Containers',
    deployments: 'Deployments',
  },

  // Projects
  projects: {
    title: 'Projects',
    create: 'Create Project',
    noProjects: 'No projects found',
    status: {
      active: 'Active',
      paused: 'Paused',
      error: 'Error',
      deploying: 'Deploying',
      stopped: 'Stopped',
    },
  },

  // Settings
  settings: {
    title: 'Settings',
    profile: 'Profile',
    security: 'Security',
    aiProviders: 'AI Providers',
    theme: 'Theme',
    language: 'Language',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    passwordChanged: 'Password changed successfully',
  },

  // Errors
  errors: {
    generic: 'An unexpected error occurred',
    network: 'Connection error. Check your internet.',
    unauthorized: 'You do not have permission for this action',
    notFound: 'Resource not found',
    validation: 'Validation error',
  },

  // Validation
  validation: {
    required: '{field} is required',
    email: 'Invalid email',
    minLength: '{field} must be at least {min} characters',
    maxLength: '{field} must be at most {max} characters',
  },
} satisfies Translation

export default en
