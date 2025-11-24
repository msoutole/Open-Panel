import { Context } from 'hono'

export interface User {
  userId: string
  email: string
  name?: string
  role?: string
}

export type Variables = {
  user: User
}

export type AppContext = Context<{ Variables: Variables }>
