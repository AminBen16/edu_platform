// prisma/seed.ts

import { PrismaClient, Role, AuditLogAction } from '@prisma/client';
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
  let admin = await prisma.user.findUnique({
    where: {
      email_schoolId: {
        email: adminEmail,
        schoolId: school.id,
      }
    },
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash('password', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        passwordHash,
        role: Role.SUPER_ADMIN,
        schoolId: school.id,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
    });
    console.log(`Created SUPER_ADMIN user: ${admin.email}`);
  } else {
    console.log(`User with email "${adminEmail}" already exists for this school.`);
  }

  // Seed Teacher
  const teacherEmail = 'teacher@kavuma.com';
  let teacher = await prisma.user.findUnique({
    where: { email_schoolId: { email: teacherEmail, schoolId: school.id } },
  });
  if (!teacher) {
    const passwordHash = await bcrypt.hash('password', 10);
    teacher = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: teacherEmail,
        passwordHash,
        role: Role.TEACHER,
        schoolId: school.id,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
    });
    console.log(`Created TEACHER user: ${teacher.email}`);
  }

  // Seed Student
  const studentEmail = 'student@kavuma.com';
  let student = await prisma.user.findUnique({
    where: { email_schoolId: { email: studentEmail, schoolId: school.id } },
  });
  if (!student) {
    const passwordHash = await bcrypt.hash('password', 10);
    student = await prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: studentEmail,
        passwordHash,
        role: Role.STUDENT,
        schoolId: school.id,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
    });
    console.log(`Created STUDENT user: ${student.email}`);

    // Create a student profile
    await prisma.studentProfile.create({
      data: {
        userId: student.id,
      },
    });
    console.log(`Created StudentProfile for ${student.email}`);
  }

  // Ensure student profile exists for the following steps
  const studentProfile = await prisma.studentProfile.findFirst({
    where: { userId: student.id },
  });

  if (studentProfile) {
    // Seed Content
    let subject = await prisma.subject.create({
      data: { name: 'Mathematics', schoolId: school.id, authorId: teacher.id },
    });
    let level = await prisma.level.create({
      data: { name: 'Beginner', schoolId: school.id, subjectId: subject.id, authorId: teacher.id },
    });
    let topic = await prisma.topic.create({
      data: { name: 'Algebra Basics', schoolId: school.id, levelId: level.id, authorId: teacher.id },
    });
    let lesson1 = await prisma.lesson.create({
      data: { title: 'Introduction to Variables', topicId: topic.id, schoolId: school.id, authorId: teacher.id, isPublished: true },
    });
    let lesson2 = await prisma.lesson.create({
      data: { title: 'Solving Equations', topicId: topic.id, schoolId: school.id, authorId: teacher.id, isPublished: true },
    });
    let quiz = await prisma.quiz.create({
      data: { title: 'Algebra Quiz', lessonId: lesson1.id, schoolId: school.id, authorId: teacher.id, isPublished: true },
    });

    // Seed Enrollment
    await prisma.enrollment.create({
      data: {
        studentProfileId: studentProfile.id,
        Lesson: { connect: [{ id: lesson1.id }] },
      },
    });
    console.log('Created Enrollment');

    // Seed Quiz Attempt
    await prisma.quizAttempt.create({
      data: {
        score: 85.5,
        answers: {},
        quizId: quiz.id,
        studentProfileId: studentProfile.id,
        schoolId: school.id,
      },
    });
    console.log('Created QuizAttempt');

    // Seed Class
    await prisma.class.create({
        data: {
            name: 'Math 101',
            schoolId: school.id,
            teacherId: teacher.id,
            students: {
                connect: [{id: student.id}]
            }
        }
    });
    console.log('Created Class');

    // Seed Audit Logs
    await prisma.auditLog.createMany({
        data: [
            { schoolId: school.id, userId: student.id, action: AuditLogAction.USER_LOGIN },
            { schoolId: school.id, userId: student.id, action: AuditLogAction.LESSON_VIEWED, details: { lessonId: lesson1.id} },
            { schoolId: school.id, userId: student.id, action: AuditLogAction.QUIZ_ATTEMPTED, details: { quizId: quiz.id} },
            { schoolId: school.id, userId: teacher.id, action: AuditLogAction.USER_LOGIN },
        ]
    });
    console.log('Created AuditLog entries');
  }

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
 * 3. Run `npx prisma migrate dev` to create and apply migrations.
 * 4. Run `npx prisma db seed` to execute this script.
 */