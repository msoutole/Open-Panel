// Load environment variables from root .env
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

// Find root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to find root by looking for package.json or .env
let rootDir = process.cwd();
const possibleRoots = [
  resolve(__dirname, '../..'), // scripts/create-admin.ts -> root
  process.cwd(), // fallback to current working directory
];

// Find root directory by checking for .env or package.json
for (const possibleRoot of possibleRoots) {
  if (existsSync(resolve(possibleRoot, '.env')) || existsSync(resolve(possibleRoot, 'package.json'))) {
    rootDir = possibleRoot;
    break;
  }
}

// Load .env from root directory
config({ path: resolve(rootDir, '.env') });

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@openpanel.dev';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    console.log(`Creating admin user: ${email}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: UserRole.ADMIN,
                mustChangePassword: true,
            },
            create: {
                email,
                name: 'Admin User',
                password: hashedPassword,
                role: UserRole.ADMIN,
                mustChangePassword: true,
            },
        });

        console.log(`Admin user created/updated successfully.`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Must Change Password: ${user.mustChangePassword}`);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
