import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create School
  const school = await prisma.school.upsert({
    where: { domain: 'kavuma.com' },
    update: {},
    create: {
      name: 'Kavuma Education Platform',
      domain: 'kavuma.com',
      logoUrl: '',
    },
  });
  console.log(`Created school: ${school.name}`);

  // Create Admin User
  const adminPassword = await bcrypt.hash('password', 10);
  const admin = await prisma.user.upsert({
    where: { email_schoolId: { email: 'admin@kavuma.com', schoolId: school.id } },
    update: {},
    create: {
      email: 'admin@kavuma.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
      schoolId: school.id,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create Teacher User and Profile
  const teacherPassword = await bcrypt.hash('password', 10);
  const teacherUser = await prisma.user.upsert({
    where: { email_schoolId: { email: 'teacher@kavuma.com', schoolId: school.id } },
    update: {},
    create: {
      email: 'teacher@kavuma.com',
      name: 'John Doe',
      password: teacherPassword,
      role: 'TEACHER',
      schoolId: school.id,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      schoolId: school.id,
    },
  });
  console.log(`Created teacher: ${teacherUser.email}`);

  // Create Student User and Profile
  const studentPassword = await bcrypt.hash('password', 10);
  const studentUser = await prisma.user.upsert({
    where: { email_schoolId: { email: 'student@kavuma.com', schoolId: school.id } },
    update: {},
    create: {
      email: 'student@kavuma.com',
      name: 'Jane Smith',
      password: studentPassword,
      role: 'STUDENT',
      schoolId: school.id,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      schoolId: school.id,
    },
  });
  console.log(`Created student: ${studentUser.email}`);

  // Create Subject
  let subject = await prisma.subject.findFirst({
    where: { name: 'Mathematics', schoolId: school.id },
  });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        name: 'Mathematics',
        schoolId: school.id,
      },
    });
  }
  console.log(`Subject: ${subject.name}`);

  // Create Class
  let classEntity = await prisma.class.findFirst({
    where: { name: 'Math 101', schoolId: school.id },
  });
  if (!classEntity) {
    classEntity = await prisma.class.create({
      data: {
        name: 'Math 101',
        schoolId: school.id,
        teacherId: teacher.id,
      },
    });
  }
  console.log(`Class: ${classEntity.name}`);

  // Create Lessons
  let lesson1 = await prisma.lesson.findFirst({
    where: { title: 'Introduction to Variables', schoolId: school.id },
  });
  if (!lesson1) {
    lesson1 = await prisma.lesson.create({
      data: {
        title: 'Introduction to Variables',
        schoolId: school.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        classId: classEntity.id,
        isPublished: true,
      },
    });
  }
  let lesson2 = await prisma.lesson.findFirst({
    where: { title: 'Solving Equations', schoolId: school.id },
  });
  if (!lesson2) {
    lesson2 = await prisma.lesson.create({
      data: {
        title: 'Solving Equations',
        schoolId: school.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        classId: classEntity.id,
        isPublished: true,
      },
    });
  }
  console.log(`Lessons: ${lesson1.title}, ${lesson2.title}`);

  // Create Quiz
  let quiz = await prisma.quiz.findFirst({
    where: { title: 'Algebra Quiz', schoolId: school.id },
  });
  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: {
        title: 'Algebra Quiz',
        schoolId: school.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        isPublished: true,
      },
    });
  }
  console.log(`Quiz: ${quiz.title}`);

  // Create Enrollment
  let enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      classId: classEntity.id,
      lessonId: lesson1.id,
    },
  });
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: classEntity.id,
        lessonId: lesson1.id,
        userId: studentUser.id,
      },
    });
  }
  console.log('Enrollment created');

  // Create Quiz Attempt
  let quizAttempt = await prisma.quizAttempt.findFirst({
    where: { studentId: student.id, quizId: quiz.id },
  });
  if (!quizAttempt) {
    quizAttempt = await prisma.quizAttempt.create({
      data: {
        maxScore: 100,
        studentId: student.id,
        quizId: quiz.id,
        userId: studentUser.id,
      },
    });
  }
  console.log('Quiz attempt created');

  // Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'USER_LOGIN' },
      { userId: teacherUser.id, action: 'USER_LOGIN' },
      { userId: studentUser.id, action: 'USER_LOGIN' },
      { userId: studentUser.id, action: 'LESSON_VIEWED', resource: lesson1.id.toString() },
      { userId: studentUser.id, action: 'QUIZ_ATTEMPTED', resource: quiz.id.toString() },
    ],
  });
  console.log('Created audit logs');

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
