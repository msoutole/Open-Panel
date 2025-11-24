import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../lib/prisma'
import type { Variables } from '../types'

export type Permission = 'read' | 'write' | 'admin' | 'owner'
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: ['read', 'write', 'admin', 'owner'],
  ADMIN: ['read', 'write', 'admin'],
  MEMBER: ['read', 'write'],
  VIEWER: ['read'],
}

export const requirePermission = (permission: Permission) => {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const user = c.get('user')
    const teamId = c.req.param('teamId')

    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    // Get user's role in the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.userId,
          teamId: teamId,
        },
      },
    })

    if (!teamMember) {
      throw new HTTPException(403, { message: 'Not a member of this team' })
    }

    const userPermissions = rolePermissions[teamMember.role as Role] || []

    if (!userPermissions.includes(permission)) {
      throw new HTTPException(403, { message: 'Insufficient permissions' })
    }

    await next()
  }
}

export const requireOwner = () => requirePermission('owner')
export const requireAdmin = () => requirePermission('admin')
export const requireWrite = () => requirePermission('write')
export const requireRead = () => requirePermission('read')
