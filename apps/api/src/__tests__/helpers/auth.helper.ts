import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/hash'
import { generateAccessToken } from '../../lib/jwt'
import type { User, UserRole } from '@prisma/client'

export interface TestUser {
  id: string
  email: string
  password: string
  name: string
  role?: UserRole
}

/**
 * Cria um usuário de teste no banco
 */
export async function createTestUser(
  data: Partial<TestUser> = {}
): Promise<User> {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User',
    ...data,
  }

  const hashedPassword = await hashPassword(defaultData.password)

  return await prisma.user.create({
    data: {
      email: defaultData.email,
      password: hashedPassword,
      name: defaultData.name,
      status: 'ACTIVE',
    },
  })
}

/**
 * Gera token JWT para usuário de teste
 */
export function generateTestToken(userId: string, email: string): string {
  return generateAccessToken({ userId, email })
}

/**
 * Cria headers de autenticação para requests de teste
 */
export function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Cria um time de teste
 */
export async function createTestTeam(ownerId: string, name?: string) {
  return await prisma.team.create({
    data: {
      name: name || `Test Team ${Date.now()}`,
      slug: `test-team-${Date.now()}`,
      members: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
  })
}

/**
 * Adiciona membro a um time
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER'
) {
  return await prisma.teamMember.create({
    data: {
      teamId,
      userId,
      role,
    },
  })
}
