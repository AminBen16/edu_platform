import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // Test School
  const school = await prisma.school.upsert({
    where: { id: 'test-school-1' },
    update: {},
    create: {
      id: 'test-school-1',
      name: 'Test Academy',
    },
  });

  // Test Admin
  const admin = await prisma.user.upsert({
    where: { id: 'test-admin-1' },
    update: {},
    create: {
      id: 'test-admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      password: '$2a$12$examplehash', // bcrypt 'password123'
      schoolId: school.id,
      role: 'ADMIN',
    },
  });

  // Test Teacher
  const teacher = await prisma.user.upsert({
    where: { id: 'test-teacher-1' },
    update: {},
    create: {
      id: 'test-teacher-1',
      email: 'teacher@test.com',
      name: 'Test Teacher',
      password: '$2a$12$examplehash',
      schoolId: school.id,
      role: 'TEACHER',
    },
  });

  await prisma.teacher.upsert({
    where: { userId: 'test-teacher-1' },
    update: {},
    create: { userId: 'test-teacher-1', schoolId: school.id },
  });

  // Test Student
  const studentUser = await prisma.user.upsert({
    where: { id: 'test-student-1' },
    update: {},
    create: {
      id: 'test-student-1',
      email: 'student@test.com',
      name: 'Test Student',
      password: '$2a$12$examplehash',
      schoolId: school.id,
      role: 'STUDENT',
    },
  });

  await prisma.student.upsert({
    where: { userId: 'test-student-1' },
    update: {},
    create: { userId: 'test-student-1', schoolId: school.id },
  });

  // Test Class
  const testClass = await prisma['class'].upsert({
    where: { id: 'test-class-1' },
    update: {},
    create: {
      id: 'test-class-1',
      name: 'Test Math Class',
      schoolId: school.id,
      teacherId: teacher.id,
    },
  });

  // Test Lesson/Quiz/Assignment
  await prisma.lesson.create({
    data: {
      id: 'test-lesson-1',
      title: 'Test Lesson',
      schoolId: school.id,
      teacherId: teacher.id,
      classId: testClass.id,
    },
  });

  await prisma.quiz.create({
    data: {
      id: 'test-quiz-1',
      title: 'Test Quiz',
      schoolId: school.id,
      teacherId: teacher.id,
    },
  });

  await prisma.assignment.create({
    data: {
      id: 'test-assignment-1',
      title: 'Test Assignment',
      schoolId: school.id,
      teacherId: teacher.id,
    },
  });

  console.log('✅ Test data seeded! Use admin@test.com / password123');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
