import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../lib/prisma'
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberSchema,
  inviteTeamMemberSchema,
} from '@openpanel/shared'
import type { Variables } from '../types'

const teams = new Hono<{ Variables: Variables }>()

// Get all teams of current user
teams.get('/', async (c) => {
  const user = c.get('user')

  try {
    const userTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.userId,
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: { projects: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({ teams: userTeams })
  } catch (error) {
    throw new HTTPException(500, { message: 'Failed to fetch teams' })
  }
})

// Create new team
teams.post('/', zValidator('json', createTeamSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-')

    // Check if slug is unique
    const existingTeam = await prisma.team.findUnique({
      where: { slug },
    })

    if (existingTeam) {
      throw new HTTPException(400, { message: 'Team slug already exists' })
    }

    const newTeam = await prisma.team.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        avatar: data.avatar,
        members: {
          create: {
            userId: user.userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: { projects: true },
        },
      },
    })

    return c.json({ team: newTeam }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to create team' })
  }
})

// Get single team
teams.get('/:teamId', async (c) => {
  const { teamId } = c.req.param()
  const user = c.get('user')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: { projects: true },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is member of team
    const isMember = team.members.some((m: typeof team.members[0]) => m.userId === user.userId)
    if (!isMember) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    return c.json({ team })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch team' })
  }
})

// Update team
teams.put('/:teamId', zValidator('json', updateTeamSchema), async (c) => {
  const { teamId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.userId },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is owner or admin
    const userRole = team.members[0]?.role
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Check if new slug is unique (if provided)
    if (data.slug) {
      const existingTeam = await prisma.team.findUnique({
        where: { slug: data.slug },
      })
      if (existingTeam && existingTeam.id !== teamId) {
        throw new HTTPException(400, { message: 'Team slug already exists' })
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        avatar: data.avatar,
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: { projects: true },
        },
      },
    })

    return c.json({ team: updatedTeam })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to update team' })
  }
})

// Delete team
teams.delete('/:teamId', async (c) => {
  const { teamId } = c.req.param()
  const user = c.get('user')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.userId },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is owner
    const userRole = team.members[0]?.role
    if (userRole !== 'OWNER') {
      throw new HTTPException(403, { message: 'Only team owner can delete team' })
    }

    await prisma.team.delete({
      where: { id: teamId },
    })

    return c.json({ message: 'Team deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to delete team' })
  }
})

// Get team members
teams.get('/:teamId/members', async (c) => {
  const { teamId } = c.req.param()
  const user = c.get('user')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is member
    const isMember = team.members.some((m: typeof team.members[0]) => m.userId === user.userId)
    if (!isMember) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    const members = team.members.map((m: typeof team.members[0]) => ({
      userId: m.userId,
      name: m.user?.name,
      email: m.user?.email,
      avatar: m.user?.avatar,
      role: m.role,
      joinedAt: m.joinedAt,
    }))

    return c.json({ members })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch team members' })
  }
})

// Add team member
teams.post('/:teamId/members', zValidator('json', addTeamMemberSchema), async (c) => {
  const { teamId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.userId },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is owner or admin
    const userRole = team.members[0]?.role
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Check if user already exists in team
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: data.userId,
          teamId,
        },
      },
    })

    if (existingMember) {
      throw new HTTPException(400, { message: 'User already member of team' })
    }

    await prisma.teamMember.create({
      data: {
        userId: data.userId,
        teamId,
        role: data.role,
      },
    })

    return c.json({ message: 'Member added successfully' }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to add team member' })
  }
})

// Update team member role
teams.put('/:teamId/members/:userId', zValidator('json', updateTeamMemberSchema), async (c) => {
  const { teamId, userId } = c.req.param()
  const user = c.get('user')
  const data = c.req.valid('json')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.userId },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is owner or admin
    const userRole = team.members[0]?.role
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      data: { role: data.role },
    })

    return c.json({ message: 'Member role updated' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to update member role' })
  }
})

// Remove team member
teams.delete('/:teamId/members/:userId', async (c) => {
  const { teamId, userId } = c.req.param()
  const user = c.get('user')

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: user.userId },
        },
      },
    })

    if (!team) {
      throw new HTTPException(404, { message: 'Team not found' })
    }

    // Check if user is owner or admin
    const userRole = team.members[0]?.role
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }

    // Prevent removing the last owner
    if (userId === user.userId && userRole === 'OWNER') {
      const ownerCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: 'OWNER',
        },
      })
      if (ownerCount === 1) {
        throw new HTTPException(400, { message: 'Cannot remove the last owner' })
      }
    }

    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    })

    return c.json({ message: 'Member removed successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to remove member' })
  }
})

export default teams
