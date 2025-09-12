import express from 'express';
import { prisma } from '../lib/database';
import { authenticateToken, requireOwner, AuthenticatedRequest } from '../lib/auth';
import {
    validate,
    sanitizeInput,
    tagSchema,
    bulkTagsSchema
} from '../lib/validation';
import { cacheMiddleware, cacheInvalidationMiddleware, generateCacheKey } from '../lib/cache-middleware';
import { CacheService } from '../lib/cache';

const router = express.Router();

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// GET /api/tags - Get all tags with optional search for suggestions
router.get('/',
    cacheMiddleware('tags:list', {
        ttl: CacheService.TTL.LONG,
        keyGenerator: (req) => {
            const { search = '', limit = '' } = req.query;
            return generateCacheKey('tags:list', { search, limit });
        }
    }),
    async (req, res) => {
        try {
            const search = req.query.search as string;
            const limit = parseInt(req.query.limit as string) || undefined;

            // Build where clause for search
            const where: any = {};
            if (search) {
                where.name = {
                    contains: search,
                    mode: 'insensitive'
                };
            }

            const tags = await prisma.tag.findMany({
                where,
                include: {
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
                orderBy: [
                    // If searching, order by relevance (exact matches first)
                    ...(search ? [{ name: 'asc' as const }] : []),
                    // Then by usage count (most used first)
                    { notes: { _count: 'desc' as const } },
                    // Finally by name
                    { name: 'asc' as const }
                ],
                ...(limit && { take: limit })
            });

            // Transform the response to include note count
            const transformedTags = tags.map(tag => ({
                ...tag,
                noteCount: tag._count.notes
            }));

            res.json({
                success: true,
                data: transformedTags
            });
        } catch (error) {
            console.error('Error fetching tags:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_TAGS_ERROR',
                    message: 'Failed to fetch tags'
                }
            });
        }
    });

// GET /api/tags/suggestions - Get tag suggestions for autocomplete
router.get('/suggestions',
    cacheMiddleware('tags:suggestions', {
        ttl: CacheService.TTL.SHORT,
        keyGenerator: (req) => {
            const { q = '', limit = '10' } = req.query;
            return generateCacheKey('tags:suggestions', { q, limit });
        }
    }),
    async (req, res) => {
        try {
            const query = req.query.q as string;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!query || query.trim().length < 1) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const suggestions = await prisma.tag.findMany({
                where: {
                    name: {
                        contains: query.trim(),
                        mode: 'insensitive'
                    }
                },
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
                orderBy: [
                    // Exact matches first
                    { name: 'asc' },
                    // Then by usage count
                    { notes: { _count: 'desc' } }
                ],
                take: limit
            });

            // Transform the response
            const transformedSuggestions = suggestions.map(tag => ({
                ...tag,
                noteCount: tag._count.notes
            }));

            res.json({
                success: true,
                data: transformedSuggestions
            });
        } catch (error) {
            console.error('Error fetching tag suggestions:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_TAG_SUGGESTIONS_ERROR',
                    message: 'Failed to fetch tag suggestions'
                }
            });
        }
    });

// GET /api/tags/:id - Get specific tag
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const tag = await prisma.tag.findUnique({
            where: { id },
            include: {
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
            }
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TAG_NOT_FOUND',
                    message: 'Tag not found'
                }
            });
        }

        // Transform the response
        const transformedTag = {
            ...tag,
            noteCount: tag._count.notes
        };

        res.json({
            success: true,
            data: transformedTag
        });
    } catch (error) {
        console.error('Error fetching tag:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_TAG_ERROR',
                message: 'Failed to fetch tag'
            }
        });
    }
});

// POST /api/tags - Create new tag (owner only)
router.post('/',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['tags:*', 'filters:*']),
    sanitizeInput,
    validate(tagSchema),
    async (req, res) => {
        try {
            const { name } = req.body;

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Tag name is required'
                    }
                });
            }

            const trimmedName = name.trim();

            // Check if tag already exists (case-insensitive)
            const existingTag = await prisma.tag.findFirst({
                where: {
                    name: {
                        equals: trimmedName,
                        mode: 'insensitive'
                    }
                }
            });

            if (existingTag) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'TAG_EXISTS',
                        message: 'Tag with this name already exists'
                    }
                });
            }

            // Generate slug
            let slug = generateSlug(trimmedName);

            // Ensure slug is unique
            let slugCounter = 1;
            let originalSlug = slug;
            while (await prisma.tag.findUnique({ where: { slug } })) {
                slug = `${originalSlug}-${slugCounter}`;
                slugCounter++;
            }

            // Create tag
            const tag = await prisma.tag.create({
                data: {
                    name: trimmedName,
                    slug
                }
            });

            res.status(201).json({
                success: true,
                data: tag,
                message: 'Tag created successfully'
            });
        } catch (error) {
            console.error('Error creating tag:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CREATE_TAG_ERROR',
                    message: 'Failed to create tag'
                }
            });
        }
    });

// POST /api/tags/bulk - Create multiple tags (owner only)
router.post('/bulk',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['tags:*', 'filters:*']),
    sanitizeInput,
    validate(bulkTagsSchema),
    async (req, res) => {
        try {
            const { names } = req.body;

            // Validate input
            if (!Array.isArray(names) || names.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Names array is required and must not be empty'
                    }
                });
            }

            // Clean and validate names
            const cleanNames = names
                .map(name => typeof name === 'string' ? name.trim() : '')
                .filter(name => name.length > 0);

            if (cleanNames.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'At least one valid tag name is required'
                    }
                });
            }

            // Check for existing tags
            const existingTags = await prisma.tag.findMany({
                where: {
                    name: {
                        in: cleanNames,
                        mode: 'insensitive'
                    }
                }
            });

            const existingNames = existingTags.map(tag => tag.name.toLowerCase());
            const newNames = cleanNames.filter(name =>
                !existingNames.includes(name.toLowerCase())
            );

            const createdTags = [];
            const skippedTags = [];

            // Create new tags
            for (const name of newNames) {
                try {
                    let slug = generateSlug(name);

                    // Ensure slug is unique
                    let slugCounter = 1;
                    let originalSlug = slug;
                    while (await prisma.tag.findUnique({ where: { slug } })) {
                        slug = `${originalSlug}-${slugCounter}`;
                        slugCounter++;
                    }

                    const tag = await prisma.tag.create({
                        data: {
                            name,
                            slug
                        }
                    });

                    createdTags.push(tag);
                } catch (error) {
                    console.error(`Error creating tag "${name}":`, error);
                    skippedTags.push({ name, reason: 'Creation failed' });
                }
            }

            // Add existing tags to skipped list
            existingTags.forEach(tag => {
                skippedTags.push({ name: tag.name, reason: 'Already exists' });
            });

            res.status(201).json({
                success: true,
                data: {
                    created: createdTags,
                    skipped: skippedTags,
                    summary: {
                        totalRequested: cleanNames.length,
                        created: createdTags.length,
                        skipped: skippedTags.length
                    }
                },
                message: `Created ${createdTags.length} tags, skipped ${skippedTags.length}`
            });
        } catch (error) {
            console.error('Error creating tags in bulk:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'BULK_CREATE_TAGS_ERROR',
                    message: 'Failed to create tags in bulk'
                }
            });
        }
    });

// PUT /api/tags/:id - Update tag (owner only)
router.put('/:id',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['tags:*', 'filters:*']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            // Check if tag exists
            const existingTag = await prisma.tag.findUnique({
                where: { id }
            });

            if (!existingTag) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'TAG_NOT_FOUND',
                        message: 'Tag not found'
                    }
                });
            }

            // Validate name if provided
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Tag name is required'
                    }
                });
            }

            const trimmedName = name.trim();

            // Check if new name conflicts with existing tag
            if (trimmedName !== existingTag.name) {
                const nameConflict = await prisma.tag.findFirst({
                    where: {
                        name: {
                            equals: trimmedName,
                            mode: 'insensitive'
                        },
                        id: { not: id }
                    }
                });

                if (nameConflict) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'TAG_EXISTS',
                            message: 'Tag with this name already exists'
                        }
                    });
                }
            }

            // Generate new slug if name changed
            let slug = existingTag.slug;
            if (trimmedName !== existingTag.name) {
                slug = generateSlug(trimmedName);

                // Ensure slug is unique (excluding current tag)
                let slugCounter = 1;
                let originalSlug = slug;
                while (await prisma.tag.findFirst({
                    where: {
                        slug,
                        id: { not: id }
                    }
                })) {
                    slug = `${originalSlug}-${slugCounter}`;
                    slugCounter++;
                }
            }

            // Update tag
            const updatedTag = await prisma.tag.update({
                where: { id },
                data: {
                    name: trimmedName,
                    slug
                }
            });

            res.json({
                success: true,
                data: updatedTag,
                message: 'Tag updated successfully'
            });
        } catch (error) {
            console.error('Error updating tag:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_TAG_ERROR',
                    message: 'Failed to update tag'
                }
            });
        }
    });

// DELETE /api/tags/:id - Delete tag (owner only)
router.delete('/:id',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['tags:*', 'filters:*']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if tag exists
            const existingTag = await prisma.tag.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            notes: true
                        }
                    }
                }
            });

            if (!existingTag) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'TAG_NOT_FOUND',
                        message: 'Tag not found'
                    }
                });
            }

            // Check if tag has associated notes
            if (existingTag._count.notes > 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'TAG_IN_USE',
                        message: 'Cannot delete tag that is associated with notes'
                    }
                });
            }

            // Delete tag
            await prisma.tag.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Tag deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting tag:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETE_TAG_ERROR',
                    message: 'Failed to delete tag'
                }
            });
        }
    });

export default router;