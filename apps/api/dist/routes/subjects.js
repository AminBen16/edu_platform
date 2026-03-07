"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Uganda default subjects by level type
const DEFAULT_SUBJECTS = {
    PRE_PRIMARY: [
        { name: 'Early Literacy', code: 'EL' },
        { name: 'Early Numeracy', code: 'EN' },
        { name: 'Creative Play', code: 'CP' },
        { name: 'Physical Education', code: 'PE' },
        { name: 'Moral Education', code: 'ME' },
        { name: 'Local Language', code: 'LL' }
    ],
    PRIMARY: [
        { name: 'Literacy', code: 'LIT' },
        { name: 'Numeracy', code: 'NUM' },
        { name: 'English', code: 'ENG' },
        { name: 'Integrated Science', code: 'SCI' },
        { name: 'Social Studies', code: 'SST' },
        { name: 'Religious Education', code: 'RE' },
        { name: 'Physical Education', code: 'PE' },
        { name: 'Creative Arts', code: 'CA' },
        { name: 'Local Language', code: 'LL' }
    ],
    LOWER_SECONDARY: [
        { name: 'English', code: 'ENG' },
        { name: 'Mathematics', code: 'MATH' },
        { name: 'Biology', code: 'BIO' },
        { name: 'Chemistry', code: 'CHEM' },
        { name: 'Physics', code: 'PHY' },
        { name: 'Geography', code: 'GEO' },
        { name: 'History', code: 'HIST' },
        { name: 'Agriculture', code: 'AGR' },
        { name: 'ICT', code: 'ICT' },
        { name: 'Entrepreneurship', code: 'ENT' },
        { name: 'Religious Education', code: 'RE' },
        { name: 'Art and Design', code: 'ART' },
        { name: 'Physical Education', code: 'PE' },
        { name: 'Kiswahili', code: 'KIS' }
    ],
    UPPER_SECONDARY: [
        { name: 'Biology', code: 'BIO' },
        { name: 'Chemistry', code: 'CHEM' },
        { name: 'Physics', code: 'PHY' },
        { name: 'Mathematics', code: 'MATH' },
        { name: 'Further Mathematics', code: 'FMATH' },
        { name: 'Literature in English', code: 'LIT' },
        { name: 'History', code: 'HIST' },
        { name: 'Geography', code: 'GEO' },
        { name: 'Divinity', code: 'DIV' },
        { name: 'Economics', code: 'ECON' },
        { name: 'Commerce', code: 'COMM' },
        { name: 'Accounting', code: 'ACC' },
        { name: 'ICT', code: 'ICT' },
        { name: 'Entrepreneurship', code: 'ENT' },
        { name: 'Fine Art', code: 'FART' },
        { name: 'Physical Education', code: 'PE' },
        { name: 'Kiswahili', code: 'KIS' }
    ],
    TVET: [
        { name: 'Carpentry & Joinery', code: 'CAR' },
        { name: 'Welding & Fabrication', code: 'WELD' },
        { name: 'Tailoring & Dressmaking', code: 'TAIL' },
        { name: 'Motor Vehicle Mechanics', code: 'MVM' },
        { name: 'Electrical Installation', code: 'ELEC' },
        { name: 'ICT & Computer Studies', code: 'ICT' },
        { name: 'Agriculture & Agribusiness', code: 'AGR' },
        { name: 'Hotel & Catering', code: 'HOT' },
        { name: 'Beauty & Hairdressing', code: 'BEA' },
        { name: 'Plumbing', code: 'PLUM' }
    ],
    ADULT: [
        { name: 'Literacy', code: 'LIT' },
        { name: 'Numeracy', code: 'NUM' },
        { name: 'Life Skills', code: 'LIFE' },
        { name: 'Vocational Skills', code: 'VOC' }
    ]
};
// GET /subjects - List subjects for user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const { levelId, levelType, isEnabled } = req.query;
        let subjects;
        if (levelId) {
            // Get subjects for a specific level
            const levelSubjects = await database_1.prisma.levelSubject.findMany({
                where: {
                    levelId: levelId,
                    ...(isEnabled !== undefined ? { isEnabled: isEnabled === 'true' } : {})
                },
                include: { subject: true }
            });
            subjects = levelSubjects.map(ls => ({
                ...ls.subject,
                isEnabled: ls.isEnabled
            }));
        }
        else {
            subjects = await database_1.prisma.subject.findMany({
                where: { schoolId: req.user.schoolId },
                orderBy: { name: 'asc' },
            });
        }
        res.json(subjects);
    }
    catch (error) {
        console.error('Failed to fetch subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects.' });
    }
});
// GET /subjects/uganda-defaults - Get Uganda default subjects
router.get('/uganda-defaults', auth_1.protect, async (req, res) => {
    const { levelType } = req.query;
    if (levelType && DEFAULT_SUBJECTS[levelType]) {
        res.json(DEFAULT_SUBJECTS[levelType]);
    }
    else {
        res.json(DEFAULT_SUBJECTS);
    }
});
// GET /subjects/:id - Get a specific subject
router.get('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const subject = await database_1.prisma.subject.findUnique({
            where: { id, schoolId: req.user.schoolId },
            include: {
                lessons: true,
                quizzes: true,
                topics: {
                    include: { competencies: true }
                }
            },
        });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        res.json(subject);
    }
    catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ error: 'Failed to fetch subject.' });
    }
});
// POST /subjects - Create a subject (only for teachers and admins)
router.post('/', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to create subjects.' });
    }
    const { name, code, description, color } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Subject name is required.' });
    }
    try {
        const newSubject = await database_1.prisma.subject.create({
            data: {
                name,
                code,
                description,
                color,
                schoolId: req.user.schoolId,
            },
        });
        res.status(201).json(newSubject);
    }
    catch (error) {
        console.error('Subject creation error:', error);
        res.status(500).json({ error: 'Failed to create subject.' });
    }
});
// POST /subjects/bulk - Create multiple subjects at once
router.post('/bulk', auth_1.protect, async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only admins can bulk create subjects.' });
    }
    const { subjects, levelId } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
        return res.status(400).json({ error: 'Subjects array is required.' });
    }
    try {
        // Create all subjects
        const createdSubjects = await Promise.all(subjects.map(subjectData => database_1.prisma.subject.create({
            data: {
                name: subjectData.name,
                code: subjectData.code,
                description: subjectData.description,
                color: subjectData.color,
                schoolId: req.user.schoolId,
            }
        })));
        // If levelId provided, map subjects to level
        if (levelId) {
            await Promise.all(createdSubjects.map(subject => database_1.prisma.levelSubject.create({
                data: {
                    levelId,
                    subjectId: subject.id,
                    isEnabled: true
                }
            })));
        }
        res.status(201).json(createdSubjects);
    }
    catch (error) {
        console.error('Bulk subject creation error:', error);
        res.status(500).json({ error: 'Failed to create subjects.' });
    }
});
// PUT /subjects/:id - Update a subject
router.put('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    const { name, code, description, color } = req.body;
    try {
        const subject = await database_1.prisma.subject.findUnique({
            where: { id, schoolId: req.user.schoolId },
        });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        const updatedSubject = await database_1.prisma.subject.update({
            where: { id },
            data: {
                name,
                code,
                description,
                color,
            },
        });
        res.json(updatedSubject);
    }
    catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: 'Failed to update subject.' });
    }
});
// DELETE /subjects/:id - Delete a subject
router.delete('/:id', auth_1.protect, async (req, res) => {
    const { id } = req.params;
    try {
        const subject = await database_1.prisma.subject.findUnique({
            where: { id, schoolId: req.user.schoolId },
        });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        await database_1.prisma.subject.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ error: 'Failed to delete subject.' });
    }
});
exports.default = router;
