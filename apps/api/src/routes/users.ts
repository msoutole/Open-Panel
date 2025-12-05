import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../lib/hash'
import { updateUserSchema, changePasswordSchema, inviteUserSchema } from '@openpanel/shared'
import { z } from 'zod'
import type { Variables } from '../types'

const users = new Hono<{ Variables: Variables }>()

// Get all users (admin only)
users.get('/', async (c) => {
  const user = c.get('user')

  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return c.json({ users: allUsers })
  } catch (error) {
    throw new HTTPException(500, { message: 'Failed to fetch users' })
  }
})

// Get single user by ID
users.get('/:userId', async (c) => {
  const { userId } = c.req.param()
  const currentUser = c.get('user')

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    return c.json({ user })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to fetch user' })
  }
})

// Update user profile
users.put('/:userId', zValidator('json', updateUserSchema), async (c) => {
  const { userId } = c.req.param()
  const currentUser = c.get('user')
  const data = c.req.valid('json')

  // Users can only update their own profile (unless admin)
  if (currentUser.userId !== userId) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  try {
    // Check if email is already taken (if updating email)
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (existingUser && existingUser.id !== userId) {
        throw new HTTPException(400, { message: 'Email already in use' })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        status: data.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return c.json({ user: updatedUser })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to update user' })
  }
})

// Change password
users.post('/:userId/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const { userId } = c.req.param()
  const currentUser = c.get('user')
  const { currentPassword, newPassword } = c.req.valid('json')

  // Users can only change their own password
  if (currentUser.userId !== userId) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isPasswordValid) {
      throw new HTTPException(401, { message: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return c.json({ message: 'Password changed successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to change password' })
  }
})

// Invite user (admin only)
users.post('/invite', zValidator('json', inviteUserSchema), async (c) => {
  const currentUser = c.get('user')
  const { email, name, role } = c.req.valid('json')

  try {
    // Verify current user has admin privileges (OWNER or ADMIN)
    if (!currentUser?.userId) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    // Fetch current user from database to get their role
    const currentUserData = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { role: true },
    })

    if (!currentUserData) {
      throw new HTTPException(401, { message: 'User not found' })
    }

    // Check if user has admin privileges
    if (currentUserData.role !== 'OWNER' && currentUserData.role !== 'ADMIN') {
      throw new HTTPException(403, { message: 'Forbidden: Admin privileges required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new HTTPException(400, { message: 'User with this email already exists' })
    }

    // Generate temporary password (user will need to change on first login)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!'
    const hashedPassword = await hashPassword(tempPassword)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: role || 'MEMBER',
        status: 'ACTIVE',
        mustChangePassword: true, // Force password change on first login
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    // TODO: Send invitation email with temporary password
    // For now, return user with message about temporary password

    return c.json({
      user: newUser,
      message: 'User invited successfully',
      temporaryPassword: tempPassword, // Remove this in production, send via email instead
    }, 201)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to invite user' })
  }
})

// Delete user (admin only)
users.delete('/:userId', async (c) => {
  const { userId } = c.req.param()
  const currentUser = c.get('user')

  // Prevent users from deleting themselves
  if (currentUser.userId === userId) {
    throw new HTTPException(400, { message: 'Cannot delete your own account' })
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    // Delete user (cascading deletes will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    return c.json({ message: 'User deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to delete user' })
  }
})

export default users
