import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create School
  const school = await prisma.school.upsert({
    where: { domain: 'eduplatform.local' },
    update: {},
    create: {
      name: 'Education Platform',
      domain: 'eduplatform.local',
      logoUrl: '',
    },
  });
  console.log(`Created school: ${school.name}`);

  // Create Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email_schoolId: { email: 'admin@eduplatform.local', schoolId: school.id } },
    update: {},
    create: {
      email: 'admin@eduplatform.local',
      name: 'Super Admin',
      password: adminPassword,
      role: 'ADMIN',
      schoolId: school.id,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  console.log(`Created admin: ${admin.email} | Password: Admin@123`);

  // Create Teacher User and Profile
  const teacherPassword = await bcrypt.hash('Teacher@123', 10);
  const teacherUser = await prisma.user.upsert({
    where: { email_schoolId: { email: 'teacher@eduplatform.local', schoolId: school.id } },
    update: {},
    create: {
      email: 'teacher@eduplatform.local',
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
  console.log(`Created teacher: ${teacherUser.email} | Password: Teacher@123`);

  // Create Student User and Profile
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const studentUser = await prisma.user.upsert({
    where: { email_schoolId: { email: 'student@eduplatform.local', schoolId: school.id } },
    update: {},
    create: {
      email: 'student@eduplatform.local',
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
      grade: 'P5',
      section: 'A',
      parentEmail: 'parent@eduplatform.local', // Link to parent
    },
  });
  console.log(`Created student: ${studentUser.email} | Password: Student@123`);

  // Create Parent User and Profile
  const parentPassword = await bcrypt.hash('Parent@123', 10);
  const parentUser = await prisma.user.upsert({
    where: { email_schoolId: { email: 'parent@eduplatform.local', schoolId: school.id } },
    update: {},
    create: {
      email: 'parent@eduplatform.local',
      name: 'Parent Guardian',
      password: parentPassword,
      role: 'PARENT',
      schoolId: school.id,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });
  // Parent doesn't need a separate profile, uses parentEmail to link to students
  console.log(`Created parent: ${parentUser.email} | Password: Parent@123`);

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
        schoolId: school.id,
      },
    });
  }
  console.log('Enrollment created');

  // Create Quiz Attempts with scores
  const quizAttempts = [
    { score: 85, maxScore: 100 },
    { score: 92, maxScore: 100 },
    { score: 78, maxScore: 100 },
  ];
  
  for (const attemptData of quizAttempts) {
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { studentId: student.id, quizId: quiz.id },
    });
    if (!existingAttempt) {
      await prisma.quizAttempt.create({
        data: {
          maxScore: attemptData.maxScore,
          score: attemptData.score,
          completedAt: new Date(),
          studentId: student.id,
          quizId: quiz.id,
          userId: studentUser.id,
          schoolId: school.id,
        },
      });
    }
  }
  console.log('Quiz attempts created');

  // Create Attendance Records
  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT'];
  for (let i = 0; i < attendanceStatuses.length; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        classId: classEntity.id,
      },
    });
    
    if (!existingAttendance) {
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: classEntity.id,
          lessonId: lesson1.id,
          status: attendanceStatuses[i],
          date: date,
          schoolId: school.id,
        },
      });
    }
  }
  console.log('Attendance records created');

  // Create Live Session
  const liveSession = await prisma.liveSession.findFirst({
    where: { title: 'Live Math Class', schoolId: school.id },
  });
  if (!liveSession) {
    await prisma.liveSession.create({
      data: {
        title: 'Live Math Class',
        description: 'Interactive math session',
        roomCode: 'LIVE-MATH-001',
        schoolId: school.id,
        teacherId: teacher.id,
        classId: classEntity.id,
        isActive: true,
        startTime: new Date(),
      },
    });
  }
  console.log('Live session created');

  // Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'USER_LOGIN', schoolId: school.id },
      { userId: teacherUser.id, action: 'USER_LOGIN', schoolId: school.id },
      { userId: studentUser.id, action: 'USER_LOGIN', schoolId: school.id },
      { userId: studentUser.id, action: 'LESSON_VIEWED', resource: lesson1.id.toString(), schoolId: school.id },
      { userId: studentUser.id, action: 'QUIZ_ATTEMPTED', resource: quiz.id.toString(), schoolId: school.id },
    ],
  });
  console.log('Created audit logs');

  // Create Term for assessments
  const term = await prisma.term.findFirst({
    where: { name: 'Term 1', schoolId: school.id },
  });
  if (!term) {
    await prisma.term.create({
      data: {
        name: 'Term 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-04-01'),
        academicYear: '2024',
        schoolId: school.id,
        isActive: true,
      },
    });
  }
  console.log('Term created');

  console.log('');
  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('Test Accounts:');
  console.log('  Admin:    admin@eduplatform.local / Admin@123');
  console.log('  Teacher:  teacher@eduplatform.local / Teacher@123');
  console.log('  Student:  student@eduplatform.local / Student@123');
  console.log('  Parent:   parent@eduplatform.local / Parent@123');
  console.log('');
  console.log('Parent can view student progress via parentEmail link');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
