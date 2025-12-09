// Ensure .env is loaded before PrismaClient initialization
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync } from 'fs'

// Find root directory and load .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Find root directory by looking for .env or package.json
let rootDir = process.cwd()
const possibleRoots = [
  resolve(__dirname, '../../..'), // dev: apps/api/src/lib -> root
  resolve(__dirname, '../../../..'), // prod: dist/lib -> root
  process.cwd(),
]

let envLoaded = false
for (const possibleRoot of possibleRoots) {
  const envPath = resolve(possibleRoot, '.env')
  if (existsSync(envPath)) {
    rootDir = possibleRoot
    // Load .env (override: true to ensure DATABASE_URL is loaded)
    const result = config({ path: envPath, override: true })
    if (result.error) {
      console.warn(`⚠️  Warning: Could not load .env from ${envPath}:`, result.error.message)
    } else {
      envLoaded = true
      // Force load DATABASE_URL into process.env
      if (result.parsed?.DATABASE_URL) {
        process.env.DATABASE_URL = result.parsed.DATABASE_URL
      }
    }
    break
  }
}

// If .env wasn't found in expected locations, try current working directory
if (!envLoaded) {
  const cwdEnvPath = resolve(process.cwd(), '.env')
  if (existsSync(cwdEnvPath)) {
    const result = config({ path: cwdEnvPath, override: true })
    if (!result.error && result.parsed?.DATABASE_URL) {
      process.env.DATABASE_URL = result.parsed.DATABASE_URL
      envLoaded = true
    }
  }
}

// Verify DATABASE_URL is set after loading .env
if (!process.env.DATABASE_URL) {
  const errorMsg = [
    '❌ DATABASE_URL is not set. Please check your .env file.',
    `   Current working directory: ${process.cwd()}`,
    `   Looked for .env in: ${possibleRoots.join(', ')}`,
    `   .env file exists: ${existsSync(resolve(rootDir, '.env')) || existsSync(resolve(process.cwd(), '.env'))}`,
  ].join('\n')
  console.error(errorMsg)
  throw new Error('DATABASE_URL environment variable is required. Please ensure your .env file contains DATABASE_URL.')
}

// Import PrismaClient only after DATABASE_URL is confirmed to be set
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Create PrismaClient (it will use DATABASE_URL from process.env)
// Use lazy initialization to ensure DATABASE_URL is available
function getPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Cannot initialize PrismaClient.')
  }
  return new PrismaClient()
}

export const prisma = global.prisma || getPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
