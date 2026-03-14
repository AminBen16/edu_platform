"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.LessonUpdateSchema = exports.LessonCreateSchema = exports.InviteSchema = exports.RegisterSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
// Auth Schemas
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email').min(1),
    password: zod_1.z.string().min(6, 'Password min 6 chars'),
    schoolId: zod_1.z.string().min(1, 'School ID required'),
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password min 8 chars'),
    name: zod_1.z.string().min(2).max(100),
    invitationCode: zod_1.z.string().min(10),
});
exports.InviteSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
    schoolId: zod_1.z.string(),
});
// Lesson Schemas (example)
exports.LessonCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().min(10).max(5000),
    subjectId: zod_1.z.string(),
    classId: zod_1.z.string(),
    content: zod_1.z.string().optional(),
    videoUrl: zod_1.z.string().url().optional(),
    duration: zod_1.z.number().int().min(1).max(300).optional(),
    isPublished: zod_1.z.boolean().optional(),
}).strict(); // Reject unknown fields
exports.LessonUpdateSchema = exports.LessonCreateSchema.partial();
// Utils
const validate = (schema, data) => {
    try {
        return schema.parse(data);
    }
    catch (e) {
        throw new Error(`Validation failed: ${e.message}`);
    }
};
exports.validate = validate;
