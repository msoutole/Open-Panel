import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number'),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2).max(255).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional().default('MEMBER'),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
