// prisma/seed.ts

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const schoolName = 'Kavuma Education Platform';
  let school = await prisma.school.findUnique({
    where: { name: schoolName },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: schoolName,
        logoUrl: '', // Add a default logo URL if you have one
      },
    });
    console.log(`Created school: ${school.name}`);
  } else {
    console.log(`School "${school.name}" already exists.`);
  }

  const adminEmail = 'admin@kavuma.com';
  const userExists = await prisma.user.findUnique({
    where: {
      email_schoolId: {
        email: adminEmail,
        schoolId: school.id,
      }
    },
  });

  if (!userExists) {
    const passwordHash = await bcrypt.hash('password', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        passwordHash,
        role: Role.SUPER_ADMIN,
        schoolId: school.id,
        emailVerified: new Date(),
      },
    });
    console.log(`Created SUPER_ADMIN user: ${admin.email}`);
  } else {
    console.log(`User with email "${adminEmail}" already exists for this school.`);
  }
  
  // You can add more seed data here, for example, a TEACHER and a STUDENT for testing.

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * To run this seed script:
 * 1. Make sure your .env file in `packages/db` is configured correctly.
 * 2. Run `npm install` in `packages/db` to install dependencies.
 * 3. Run `npx prisma db push` to sync your schema with the database.
 * 4. Run `npx prisma db seed` to execute this script.
 */