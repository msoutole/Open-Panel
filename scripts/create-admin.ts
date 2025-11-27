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
