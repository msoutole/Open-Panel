import { beforeAll, afterAll, afterEach } from 'vitest'
import { prisma } from '../lib/prisma'

// Setup antes de todos os testes
beforeAll(async () => {
  // Garantir que estamos em ambiente de teste
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in test environment')
  }

  // Limpar banco de dados de teste
  await cleanDatabase()
})

// Limpar após cada teste
afterEach(async () => {
  await cleanDatabase()
})

// Fechar conexões após todos os testes
afterAll(async () => {
  await prisma.$disconnect()
})

// Helper para limpar banco de dados
async function cleanDatabase() {
  const tables = [
    'AuditLog',
    'Notification',
    'ApiKey',
    'Backup',
    'Log',
    'Deployment',
    'Container',
    'EnvVar',
    'Domain',
    'AgentMessage',
    'AgentExecution',
    'AgentTask',
    'AgentCrew',
    'Project',
    'TeamInvite',
    'TeamMember',
    'Team',
    'User',
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    } catch (error) {
      // Tabela pode não existir ainda
      console.warn(`Could not truncate ${table}:`, error)
    }
  }
}
