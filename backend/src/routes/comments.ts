import express from 'express';
import { prisma } from '../lib/database';
import { authenticateToken, requireVisitor, requireOwnership, AuthenticatedRequest } from '../lib/auth';
import {
    validate,
    sanitizeInput,
    validateRateLimit,
    commentSchema
} from '../lib/validation';
import { cacheMiddleware, cacheInvalidationMiddleware } from '../lib/cache-middleware';
import { CacheService } from '../lib/cache';

const router = express.Router();

// GET /api/notes/:noteId/comments - Get comments for a specific note
router.get('/:noteId/comments',
    cacheMiddleware('note:comments', {
        ttl: CacheService.TTL.SHORT,
        keyGenerator: (req) => `note:${req.params.noteId}:comments`
    }),
    async (req, res) => {
        try {
            const { noteId } = req.params;

            // Check if note exists
            const note = await prisma.note.findUnique({
                where: { id: noteId }
            });

            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOTE_NOT_FOUND',
                        message: 'Note not found'
                    }
                });
            }

            // Get comments with nested replies
            const comments = await prisma.comment.findMany({
                where: {
                    noteId,
                    parentId: null // Only get top-level comments
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true
                        }
                    },
                    replies: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    avatar: true,
                                    role: true
                                }
                            }
                        },
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.json({
                success: true,
                data: comments
            });
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_COMMENTS_ERROR',
                    message: 'Failed to fetch comments'
                }
            });
        }
    });

// POST /api/notes/:noteId/comments - Create a new comment (authenticated users only)
router.post('/:noteId/comments',
    authenticateToken,
    requireVisitor,
    cacheInvalidationMiddleware(['note:*:comments', 'note:*:detail']),
    validateRateLimit(10, 60 * 1000), // 10 comments per minute
    sanitizeInput,
    validate(commentSchema),
    async (req, res) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const { noteId } = req.params;
            const { content, parentId } = req.body;

            // Validate required fields
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Comment content is required'
                    }
                });
            }

            // Check if note exists
            const note = await prisma.note.findUnique({
                where: { id: noteId }
            });

            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOTE_NOT_FOUND',
                        message: 'Note not found'
                    }
                });
            }

            // If parentId is provided, check if parent comment exists and belongs to the same note
            if (parentId) {
                const parentComment = await prisma.comment.findUnique({
                    where: { id: parentId }
                });

                if (!parentComment) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'PARENT_COMMENT_NOT_FOUND',
                            message: 'Parent comment not found'
                        }
                    });
                }

                if (parentComment.noteId !== noteId) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PARENT_COMMENT',
                            message: 'Parent comment does not belong to this note'
                        }
                    });
                }
            }

            // Create comment
            const comment = await prisma.comment.create({
                data: {
                    content: content.trim(),
                    noteId,
                    authorId: authReq.user!.id,
                    parentId: parentId || null
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                data: comment,
                message: 'Comment created successfully'
            });
        } catch (error) {
            console.error('Error creating comment:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CREATE_COMMENT_ERROR',
                    message: 'Failed to create comment'
                }
            });
        }
    });

// PUT /api/comments/:id - Update comment (author or owner only)
router.put('/:id',
    authenticateToken,
    requireOwnership('comment'),
    cacheInvalidationMiddleware(['note:*:comments', 'note:*:detail']),
    sanitizeInput,
    validate(commentSchema),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { content } = req.body;

            // Validate required fields
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Comment content is required'
                    }
                });
            }

            // Update comment (ownership already verified by middleware)
            const updatedComment = await prisma.comment.update({
                where: { id },
                data: {
                    content: content.trim()
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                data: updatedComment,
                message: 'Comment updated successfully'
            });
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_COMMENT_ERROR',
                    message: 'Failed to update comment'
                }
            });
        }
    });

// DELETE /api/comments/:id - Delete comment (author or owner only)
router.delete('/:id',
    authenticateToken,
    requireOwnership('comment'),
    cacheInvalidationMiddleware(['note:*:comments', 'note:*:detail']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Delete comment (ownership already verified by middleware, cascade will handle replies)
            await prisma.comment.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETE_COMMENT_ERROR',
                    message: 'Failed to delete comment'
                }
            });
        }
    });

export default router;