import { z } from 'zod';

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email').min(1),
  password: z.string().min(6, 'Password min 6 chars'),
  schoolId: z.string().min(1, 'School ID required').optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password min 8 chars'),
  name: z.string().min(2).max(100),
  invitationCode: z.string().min(10),
});

export const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  schoolId: z.string(),
});

// Lesson Schemas (example)
export const LessonCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  content: z.string().optional(),
  type: z.string().optional(),
  videoUrl: z.string().url().optional(),
  documentUrl: z.string().url().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
  isPublished: z.boolean().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).strict();

export const LessonUpdateSchema = LessonCreateSchema.partial();

// Utils
export const validate = <T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> => {
  try {
    return schema.parse(data);
  } catch (e) {
    throw new Error(`Validation failed: ${(e as z.ZodError).message}`);
  }
};

export type ValidatedLogin = z.infer<typeof LoginSchema>;

