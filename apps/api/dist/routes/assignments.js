"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Assignment management system
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const notificationService_1 = __importDefault(require("../services/notificationService"));
const router = (0, express_1.Router)();
// GET /assignments - Get assignments for user
router.get('/', auth_1.protect, async (req, res) => {
    const { role, id: userId, schoolId } = req.user;
    try {
        let assignments = [];
        switch (role) {
            case 'STUDENT':
                assignments = await getStudentAssignments(userId);
                break;
            case 'TEACHER':
                assignments = await getTeacherAssignments(userId);
                break;
            case 'ADMIN':
            case 'SCHOOL_ADMIN':
                assignments = await getAdminAssignments(schoolId);
                break;
            default:
                return res.status(403).json({ error: 'Invalid user role for assignments' });
        }
        res.json({
            assignments,
            userRole: role,
            total: assignments.length
        });
    }
    catch (error) {
        console.error('Assignments error:', error);
        res.status(500).json({ error: 'Failed to load assignments' });
    }
});
// POST /assignments - Create new assignment
router.post('/', auth_1.protect, (0, auth_1.authorize)('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), (0, auth_1.requirePermission)('assignments.write'), async (req, res) => {
    try {
        const { title, description, lessonId, dueDate, maxScore } = req.body;
        const assignment = await database_1.prisma.assignment.create({
            data: {
                title,
                description,
                lessonId,
                dueDate: dueDate ? new Date(dueDate) : null,
                maxScore: maxScore || 100,
                teacherId: req.user.id
            }
        });
        // Get students enrolled in the lesson
        const enrollments = await database_1.prisma.enrollment.findMany({
            where: { lessonId, status: 'ACTIVE' },
            include: {
                student: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
        // Send real notifications to enrolled students
        const studentIds = enrollments.map(e => e.studentId);
        if (studentIds.length > 0) {
            const notificationsSent = await notificationService_1.default.sendBulkNotifications(studentIds, {
                type: 'ASSIGNMENT',
                title: `New Assignment: ${title}`,
                message: `A new assignment "${title}" has been created for your class. Due date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}`,
                data: {
                    assignmentId: assignment.id,
                    title: assignment.title,
                    description: assignment.description,
                    dueDate: assignment.dueDate,
                    maxScore: assignment.maxScore
                }
            });
            console.log(`Notifications sent to ${notificationsSent} students`);
        }
        res.status(201).json(assignment);
    }
    catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});
// PUT /assignments/:id - Update assignment
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, maxScore } = req.body;
    try {
        const assignment = await database_1.prisma.assignment.update({
            where: { id },
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                maxScore,
                updatedAt: new Date()
            }
        });
        res.json(assignment);
    }
    catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
});
// DELETE /assignments/:id - Delete assignment
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('TEACHER', 'ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.prisma.assignment.delete({
            where: { id }
        });
        res.json({ message: 'Assignment deleted successfully' });
    }
    catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
});
// GET /assignments/:id - Get single assignment
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const assignment = await database_1.prisma.assignment.findUnique({
            where: { id },
            include: {
                lesson: {
                    select: { id: true, title: true }
                },
                teacher: {
                    select: { id: true, user: { select: { name: true, email: true } } }
                },
                submissions: {
                    include: {
                        student: {
                            include: {
                                user: { select: { name: true, email: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        res.json(assignment);
    }
    catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Failed to load assignment' });
    }
});
// Helper functions
async function getStudentAssignments(studentId) {
    const enrollments = await database_1.prisma.enrollment.findMany({
        where: { studentId, status: 'ACTIVE' },
        include: {
            Lesson: {
                include: {
                    assignments: true
                }
            }
        }
    });
    return enrollments.flatMap(enrollment => enrollment.Lesson?.assignments || []);
}
async function getTeacherAssignments(teacherId) {
    const assignments = await database_1.prisma.assignment.findMany({
        where: { teacherId },
        include: {
            lesson: {
                select: { id: true, title: true }
            },
            submissions: {
                select: { id: true, studentId: true, score: true, submittedAt: true }
            }
        }
    });
    return assignments;
}
async function getAdminAssignments(schoolId) {
    return await database_1.prisma.assignment.findMany({
        where: {
            lesson: {
                schoolId
            }
        },
        include: {
            lesson: {
                select: { id: true, title: true }
            },
            teacher: {
                select: { id: true, user: { select: { name: true, email: true } } }
            },
            submissions: {
                select: { id: true, studentId: true, score: true, submittedAt: true }
            }
        }
    });
}
exports.default = router;
