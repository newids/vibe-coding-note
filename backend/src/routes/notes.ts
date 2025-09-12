import express from 'express';
import { prisma } from '../lib/database';
import { authenticateToken, requireOwner, optionalAuth, AuthenticatedRequest } from '../lib/auth';
import {
    validate,
    sanitizeInput,
    validateRateLimit,
    noteSchema,
    updateNoteSchema,
    paginationSchema
} from '../lib/validation';
import { cacheMiddleware, cacheInvalidationMiddleware, generateCacheKey } from '../lib/cache-middleware';
import { CacheService } from '../lib/cache';

const router = express.Router();

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Helper function to generate excerpt from content
const generateExcerpt = (content: string, maxLength: number = 150): string => {
    const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return plainText.length > maxLength
        ? plainText.substring(0, maxLength).trim() + '...'
        : plainText;
};

// GET /api/notes - Get all notes with pagination and filtering
router.get('/',
    optionalAuth,
    validate(paginationSchema, 'query'),
    cacheMiddleware('notes:list', {
        ttl: CacheService.TTL.MEDIUM,
        keyGenerator: (req) => {
            const { page = '1', limit = '10', search = '', categoryId = '', tagIds = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            return generateCacheKey('notes:list', {
                page,
                limit,
                search,
                categoryId,
                tagIds,
                sortBy,
                sortOrder
            });
        }
    }),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string;
            const categoryId = req.query.categoryId as string;
            const tagIds = req.query.tagIds as string;
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = req.query.sortOrder as string || 'desc';
            const skip = (page - 1) * limit;

            // Build where clause with AND logic for filters
            const where: any = {
                published: true
            };

            const andConditions: any[] = [];

            // Add full-text search filter
            if (search && search.trim()) {
                const searchTerms = search.trim().split(/\s+/);
                const searchConditions = searchTerms.map(term => ({
                    OR: [
                        { title: { contains: term, mode: 'insensitive' } },
                        { content: { contains: term, mode: 'insensitive' } },
                        { excerpt: { contains: term, mode: 'insensitive' } }
                    ]
                }));

                // All search terms must match (AND logic)
                andConditions.push(...searchConditions);
            }

            // Add category filter
            if (categoryId && categoryId.trim()) {
                andConditions.push({ categoryId });
            }

            // Add tag filter with AND logic for multiple tags
            if (tagIds && tagIds.trim()) {
                const tagIdArray = tagIds.split(',').filter(id => id.trim());
                if (tagIdArray.length > 0) {
                    // For multiple tags, require ALL tags to be present (AND logic)
                    tagIdArray.forEach(tagId => {
                        andConditions.push({
                            tags: {
                                some: {
                                    tagId: tagId.trim()
                                }
                            }
                        });
                    });
                }
            }

            // Apply AND conditions if any exist
            if (andConditions.length > 0) {
                where.AND = andConditions;
            }

            // Build order by clause
            const orderBy: any = {};
            switch (sortBy) {
                case 'title':
                    orderBy.title = sortOrder;
                    break;
                case 'likeCount':
                    orderBy.likeCount = sortOrder;
                    break;
                case 'updatedAt':
                    orderBy.updatedAt = sortOrder;
                    break;
                default:
                    orderBy.createdAt = sortOrder;
            }

            // Get notes with relations
            const [notes, totalCount] = await Promise.all([
                prisma.note.findMany({
                    where,
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                color: true
                            }
                        },
                        tags: {
                            include: {
                                tag: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true
                                    }
                                }
                            }
                        },
                        _count: {
                            select: {
                                comments: true,
                                likes: true
                            }
                        }
                    },
                    orderBy,
                    skip,
                    take: limit
                }),
                prisma.note.count({ where })
            ]);

            // Transform the response to flatten tag structure
            const transformedNotes = notes.map(note => ({
                ...note,
                tags: note.tags.map(nt => nt.tag),
                commentCount: note._count.comments,
                likeCount: note._count.likes
            }));

            res.json({
                success: true,
                data: {
                    notes: transformedNotes,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        hasNext: page * limit < totalCount,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching notes:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_NOTES_ERROR',
                    message: 'Failed to fetch notes'
                }
            });
        }
    });

// GET /api/notes/:id - Get specific note with comments
router.get('/:id',
    optionalAuth,
    cacheMiddleware('note:detail', {
        ttl: CacheService.TTL.MEDIUM,
        keyGenerator: (req) => `note:${req.params.id}:detail`
    }),
    async (req, res) => {
        try {
            const { id } = req.params;

            const note = await prisma.note.findUnique({
                where: { id },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            color: true,
                            description: true
                        }
                    },
                    tags: {
                        include: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    },
                    comments: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                    avatar: true
                                }
                            },
                            replies: {
                                include: {
                                    author: {
                                        select: {
                                            id: true,
                                            name: true,
                                            avatar: true
                                        }
                                    }
                                }
                            }
                        },
                        where: {
                            parentId: null // Only get top-level comments
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    },
                    _count: {
                        select: {
                            likes: true
                        }
                    }
                }
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

            // Check if note is published or user is owner
            const authReq = req as AuthenticatedRequest;
            if (!note.published && (!authReq.user || authReq.user.role !== 'OWNER')) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOTE_NOT_FOUND',
                        message: 'Note not found'
                    }
                });
            }

            // Transform the response
            const transformedNote = {
                ...note,
                tags: note.tags.map(nt => nt.tag),
                likeCount: note._count.likes
            };

            res.json({
                success: true,
                data: transformedNote
            });
        } catch (error) {
            console.error('Error fetching note:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_NOTE_ERROR',
                    message: 'Failed to fetch note'
                }
            });
        }
    });

// POST /api/notes - Create new note (owner only)
router.post('/',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['notes:*', 'filters:*', 'search:*']),
    sanitizeInput,
    validate(noteSchema),
    async (req, res) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const { title, content, categoryId, tags, published = true } = req.body;

            // Verify category exists
            const category = await prisma.category.findUnique({
                where: { id: categoryId }
            });

            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CATEGORY',
                        message: 'Category not found'
                    }
                });
            }

            // Generate slug and excerpt
            let slug = generateSlug(title);

            // Ensure slug is unique
            let slugCounter = 1;
            let originalSlug = slug;
            while (await prisma.note.findUnique({ where: { slug } })) {
                slug = `${originalSlug}-${slugCounter}`;
                slugCounter++;
            }

            const excerpt = generateExcerpt(content);

            // Create note
            const note = await prisma.note.create({
                data: {
                    title,
                    content,
                    excerpt,
                    slug,
                    authorId: authReq.user!.id,
                    categoryId,
                    published,
                    tags: tagIds && tagIds.length > 0 ? {
                        create: tagIds.map((tagId: string) => ({
                            tagId
                        }))
                    } : undefined
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            color: true
                        }
                    },
                    tags: {
                        include: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    }
                }
            });

            // Transform the response
            const transformedNote = {
                ...note,
                tags: note.tags.map(nt => nt.tag)
            };

            res.status(201).json({
                success: true,
                data: transformedNote,
                message: 'Note created successfully'
            });
        } catch (error) {
            console.error('Error creating note:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CREATE_NOTE_ERROR',
                    message: 'Failed to create note'
                }
            });
        }
    });

// PUT /api/notes/:id - Update note (owner only)
router.put('/:id',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['notes:*', 'note:*', 'filters:*', 'search:*']),
    sanitizeInput,
    validate(updateNoteSchema),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { title, content, categoryId, tagIds, published } = req.body;

            // Check if note exists
            const existingNote = await prisma.note.findUnique({
                where: { id }
            });

            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOTE_NOT_FOUND',
                        message: 'Note not found'
                    }
                });
            }

            // Validate category if provided
            if (categoryId) {
                const category = await prisma.category.findUnique({
                    where: { id: categoryId }
                });

                if (!category) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_CATEGORY',
                            message: 'Category not found'
                        }
                    });
                }
            }

            // Generate new slug if title changed
            let slug = existingNote.slug;
            if (title && title !== existingNote.title) {
                slug = generateSlug(title);

                // Ensure slug is unique (excluding current note)
                let slugCounter = 1;
                let originalSlug = slug;
                while (await prisma.note.findFirst({
                    where: {
                        slug,
                        id: { not: id }
                    }
                })) {
                    slug = `${originalSlug}-${slugCounter}`;
                    slugCounter++;
                }
            }

            // Generate new excerpt if content changed
            let excerpt = existingNote.excerpt;
            if (content && content !== existingNote.content) {
                excerpt = generateExcerpt(content);
            }

            // Update note with transaction to handle tags
            const updatedNote = await prisma.$transaction(async (tx) => {
                // Delete existing tag relationships if tagIds provided
                if (tagIds !== undefined) {
                    await tx.noteTags.deleteMany({
                        where: { noteId: id }
                    });
                }

                // Update note
                const note = await tx.note.update({
                    where: { id },
                    data: {
                        ...(title && { title }),
                        ...(content && { content }),
                        ...(excerpt && { excerpt }),
                        ...(slug && { slug }),
                        ...(categoryId && { categoryId }),
                        ...(published !== undefined && { published }),
                        ...(tagIds !== undefined && tagIds.length > 0 && {
                            tags: {
                                create: tagIds.map((tagId: string) => ({
                                    tagId
                                }))
                            }
                        })
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                color: true
                            }
                        },
                        tags: {
                            include: {
                                tag: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true
                                    }
                                }
                            }
                        }
                    }
                });

                return note;
            });

            // Transform the response
            const transformedNote = {
                ...updatedNote,
                tags: updatedNote.tags.map(nt => nt.tag)
            };

            res.json({
                success: true,
                data: transformedNote,
                message: 'Note updated successfully'
            });
        } catch (error) {
            console.error('Error updating note:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_NOTE_ERROR',
                    message: 'Failed to update note'
                }
            });
        }
    });

// DELETE /api/notes/:id - Delete note (owner only)
router.delete('/:id',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['notes:*', 'note:*', 'filters:*', 'search:*']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if note exists
            const existingNote = await prisma.note.findUnique({
                where: { id }
            });

            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOTE_NOT_FOUND',
                        message: 'Note not found'
                    }
                });
            }

            // Delete note (cascade will handle related records)
            await prisma.note.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Note deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting note:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETE_NOTE_ERROR',
                    message: 'Failed to delete note'
                }
            });
        }
    });

// GET /api/notes/:id/like-status - Check if IP has already liked the note
router.get('/:id/like-status', async (req, res) => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

        // Check if note exists
        const note = await prisma.note.findUnique({
            where: { id },
            select: {
                id: true,
                likeCount: true
            }
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

        // Check if this IP has already liked the note
        const existingLike = await prisma.like.findUnique({
            where: {
                noteId_ipAddress: {
                    noteId: id,
                    ipAddress
                }
            }
        });

        res.json({
            success: true,
            data: {
                noteId: id,
                likeCount: note.likeCount,
                liked: !!existingLike
            }
        });
    } catch (error) {
        console.error('Error checking like status:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LIKE_STATUS_ERROR',
                message: 'Failed to check like status'
            }
        });
    }
});

// POST /api/notes/:id/like - Add anonymous like
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

        // Check if note exists
        const note = await prisma.note.findUnique({
            where: { id }
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

        try {
            // Try to create like (will fail if duplicate due to unique constraint)
            await prisma.like.create({
                data: {
                    noteId: id,
                    ipAddress
                }
            });

            // Update like count
            const updatedNote = await prisma.note.update({
                where: { id },
                data: {
                    likeCount: {
                        increment: 1
                    }
                },
                select: {
                    id: true,
                    likeCount: true
                }
            });

            res.json({
                success: true,
                data: {
                    noteId: id,
                    likeCount: updatedNote.likeCount,
                    liked: true
                },
                message: 'Like added successfully'
            });
        } catch (error: any) {
            // Check if it's a duplicate like error
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_LIKE',
                        message: 'You have already liked this note'
                    }
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error adding like:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LIKE_ERROR',
                message: 'Failed to add like'
            }
        });
    }
});

// GET /api/notes/search - Advanced search with suggestions
router.get('/search',
    optionalAuth,
    cacheMiddleware('search:results', {
        ttl: CacheService.TTL.SHORT,
        keyGenerator: (req) => {
            const { q = '', limit = '5' } = req.query;
            return generateCacheKey('search:results', { q, limit });
        }
    }),
    async (req, res) => {
        try {
            const query = req.query.q as string;
            const limit = parseInt(req.query.limit as string) || 5;

            if (!query || query.trim().length < 2) {
                return res.json({
                    success: true,
                    data: {
                        suggestions: [],
                        notes: []
                    }
                });
            }

            const searchTerm = query.trim();

            // Get search suggestions from titles and tags
            const [titleSuggestions, tagSuggestions] = await Promise.all([
                // Title suggestions
                prisma.note.findMany({
                    where: {
                        published: true,
                        title: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    select: {
                        title: true
                    },
                    take: 3
                }),
                // Tag suggestions
                prisma.tag.findMany({
                    where: {
                        name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    select: {
                        name: true
                    },
                    take: 3
                })
            ]);

            // Get matching notes
            const notes = await prisma.note.findMany({
                where: {
                    published: true,
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { content: { contains: searchTerm, mode: 'insensitive' } },
                        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
                        {
                            tags: {
                                some: {
                                    tag: {
                                        name: { contains: searchTerm, mode: 'insensitive' }
                                    }
                                }
                            }
                        }
                    ]
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            color: true
                        }
                    },
                    tags: {
                        include: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    }
                },
                orderBy: [
                    // Prioritize title matches
                    { title: 'asc' },
                    { createdAt: 'desc' }
                ],
                take: limit
            });

            // Transform notes
            const transformedNotes = notes.map(note => ({
                ...note,
                tags: note.tags.map(nt => nt.tag),
                commentCount: note._count.comments,
                likeCount: note._count.likes
            }));

            // Combine suggestions
            const suggestions = [
                ...titleSuggestions.map(n => n.title),
                ...tagSuggestions.map(t => t.name)
            ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

            res.json({
                success: true,
                data: {
                    query: searchTerm,
                    suggestions,
                    notes: transformedNotes,
                    totalFound: notes.length
                }
            });
        } catch (error) {
            console.error('Error performing search:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'SEARCH_ERROR',
                    message: 'Failed to perform search'
                }
            });
        }
    });

// GET /api/notes/filters - Get available filter options
router.get('/filters',
    cacheMiddleware('filters:all', {
        ttl: CacheService.TTL.LONG
    }),
    async (req, res) => {
        try {
            const [categories, tags] = await Promise.all([
                prisma.category.findMany({
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true,
                        _count: {
                            select: {
                                notes: {
                                    where: {
                                        published: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        name: 'asc'
                    }
                }),
                prisma.tag.findMany({
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        _count: {
                            select: {
                                notes: {
                                    where: {
                                        note: {
                                            published: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        name: 'asc'
                    }
                })
            ]);

            // Filter out categories and tags with no published notes
            const activeCategories = categories.filter(cat => cat._count.notes > 0);
            const activeTags = tags.filter(tag => tag._count.notes > 0);

            res.json({
                success: true,
                data: {
                    categories: activeCategories.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        color: cat.color,
                        noteCount: cat._count.notes
                    })),
                    tags: activeTags.map(tag => ({
                        id: tag.id,
                        name: tag.name,
                        slug: tag.slug,
                        noteCount: tag._count.notes
                    }))
                }
            });
        } catch (error) {
            console.error('Error fetching filter options:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FILTERS_ERROR',
                    message: 'Failed to fetch filter options'
                }
            });
        }
    });

export default router;