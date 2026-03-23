// Support tickets management
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';

const router = Router();

// GET /tickets - Get all tickets for a school
router.get('/', protect, async (req, res) => {
    try {
        const { schoolId, role, id: userId } = req.user!;
        
        const where = role === 'ADMIN' || role === 'TEACHER' 
            ? { schoolId }
            : { schoolId, userId };

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                // @ts-ignore
                assignedTo: { select: { name: true, email: true } }
            }
        });
        res.json(tickets);
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets.' });
    }
});

// GET /tickets/:id - Get a specific ticket
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id, schoolId: req.user!.schoolId },
            include: {
                user: { select: { name: true, email: true } },
                // @ts-ignore
                assignedTo: { select: { name: true, email: true } },
                comments: {
                    include: {
                        user: { select: { name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json(ticket);
    } catch (error) {
        console.error('Failed to fetch ticket:', error);
        res.status(500).json({ error: 'Failed to fetch ticket.' });
    }
});

// POST /tickets - Create a new ticket
router.post('/', protect, async (req, res) => {
    const { title, description, priority, category } = req.body;
    
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required.' });
    }

    try {
        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                category: category || 'GENERAL',
                status: 'OPEN',
                userId: req.user!.id,
                schoolId: req.user!.schoolId
            },
            include: {
                user: { select: { name: true, email: true } }
            }
        });
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Failed to create ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket.' });
    }
});

// PUT /tickets/:id - Update a ticket
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status, assignedToId } = req.body;

    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id, schoolId: req.user!.schoolId }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Only admin/teacher can assign or change status
        const canModify = req.user!.role === 'ADMIN' || req.user!.role === 'TEACHER';
        
        const updateData: any = {};
        if (canModify && title) updateData.title = title;
        if (canModify && description) updateData.description = description;
        if (canModify && priority) updateData.priority = priority;
        if (canModify && status) updateData.status = status;
        if (canModify && assignedToId) updateData.assignedToId = assignedToId;

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { name: true, email: true } },
                // @ts-ignore
                assignedTo: { select: { name: true, email: true } }
            }
        });
        res.json(updatedTicket);
    } catch (error) {
        console.error('Failed to update ticket:', error);
        res.status(500).json({ error: 'Failed to update ticket.' });
    }
});

// DELETE /tickets/:id - Delete a ticket
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id, schoolId: req.user!.schoolId }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        await prisma.ticket.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete ticket:', error);
        res.status(500).json({ error: 'Failed to delete ticket.' });
    }
});

// POST /tickets/:id/comments - Add a comment to a ticket
router.post('/:id/comments', protect, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Comment content is required.' });
    }

    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id, schoolId: req.user!.schoolId }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const comment = await prisma.ticketComment.create({
            data: {
                content,
                ticketId: id,
                userId: req.user!.id,
                schoolId: req.user!.schoolId
            },
            include: {
                user: { select: { name: true, email: true } }
            }
        });
        res.status(201).json(comment);
    } catch (error) {
        console.error('Failed to add comment:', error);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});

export default router;

