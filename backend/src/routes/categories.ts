import express from 'express';
import { prisma } from '../lib/database';
import { authenticateToken, requireOwner, AuthenticatedRequest } from '../lib/auth';
import {
    validate,
    sanitizeInput,
    categorySchema
} from '../lib/validation';
import { cacheMiddleware, cacheInvalidationMiddleware } from '../lib/cache-middleware';
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

// GET /api/categories - Get all categories
router.get('/',
    cacheMiddleware('categories:all', {
        ttl: CacheService.TTL.LONG
    }),
    async (req, res) => {
        try {
            const categories = await prisma.category.findMany({
                include: {
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
            });

            // Transform the response to include note count
            const transformedCategories = categories.map(category => ({
                ...category,
                noteCount: category._count.notes
            }));

            res.json({
                success: true,
                data: transformedCategories
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_CATEGORIES_ERROR',
                    message: 'Failed to fetch categories'
                }
            });
        }
    });

// GET /api/categories/:id - Get specific category
router.get('/:id',
    cacheMiddleware('category:detail', {
        ttl: CacheService.TTL.LONG,
        keyGenerator: (req) => `category:${req.params.id}`
    }),
    async (req, res) => {
        try {
            const { id } = req.params;

            const category = await prisma.category.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            notes: {
                                where: {
                                    published: true
                                }
                            }
                        }
                    }
                }
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'CATEGORY_NOT_FOUND',
                        message: 'Category not found'
                    }
                });
            }

            // Transform the response
            const transformedCategory = {
                ...category,
                noteCount: category._count.notes
            };

            res.json({
                success: true,
                data: transformedCategory
            });
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_CATEGORY_ERROR',
                    message: 'Failed to fetch category'
                }
            });
        }
    });

// POST /api/categories - Create new category (owner only)
router.post('/',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['categories:*', 'filters:*']),
    sanitizeInput,
    validate(categorySchema),
    async (req, res) => {
        try {
            const { name, description, color } = req.body;

            // Validate required fields
            if (!name || !color) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Name and color are required'
                    }
                });
            }

            // Generate slug
            let slug = generateSlug(name);

            // Ensure slug is unique
            let slugCounter = 1;
            let originalSlug = slug;
            while (await prisma.category.findUnique({ where: { slug } })) {
                slug = `${originalSlug}-${slugCounter}`;
                slugCounter++;
            }

            // Check if category name already exists
            const existingCategory = await prisma.category.findUnique({
                where: { name }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'CATEGORY_EXISTS',
                        message: 'Category with this name already exists'
                    }
                });
            }

            // Create category
            const category = await prisma.category.create({
                data: {
                    name,
                    slug,
                    description,
                    color
                }
            });

            res.status(201).json({
                success: true,
                data: category,
                message: 'Category created successfully'
            });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CREATE_CATEGORY_ERROR',
                    message: 'Failed to create category'
                }
            });
        }
    });

// PUT /api/categories/:id - Update category (owner only)
router.put('/:id',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['categories:*', 'category:*', 'filters:*']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, color } = req.body;

            // Check if category exists
            const existingCategory = await prisma.category.findUnique({
                where: { id }
            });

            if (!existingCategory) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'CATEGORY_NOT_FOUND',
                        message: 'Category not found'
                    }
                });
            }

            // Check if new name conflicts with existing category
            if (name && name !== existingCategory.name) {
                const nameConflict = await prisma.category.findFirst({
                    where: {
                        name,
                        id: { not: id }
                    }
                });

                if (nameConflict) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'CATEGORY_EXISTS',
                            message: 'Category with this name already exists'
                        }
                    });
                }
            }

            // Generate new slug if name changed
            let slug = existingCategory.slug;
            if (name && name !== existingCategory.name) {
                slug = generateSlug(name);

                // Ensure slug is unique (excluding current category)
                let slugCounter = 1;
                let originalSlug = slug;
                while (await prisma.category.findFirst({
                    where: {
                        slug,
                        id: { not: id }
                    }
                })) {
                    slug = `${originalSlug}-${slugCounter}`;
                    slugCounter++;
                }
            }

            // Update category
            const updatedCategory = await prisma.category.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(slug && { slug }),
                    ...(description !== undefined && { description }),
                    ...(color && { color })
                }
            });

            res.json({
                success: true,
                data: updatedCategory,
                message: 'Category updated successfully'
            });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_CATEGORY_ERROR',
                    message: 'Failed to update category'
                }
            });
        }
    });

// DELETE /api/categories/:id - Delete category (owner only)
router.delete('/:id',
    authenticateToken,
    requireOwner,
    cacheInvalidationMiddleware(['categories:*', 'category:*', 'filters:*']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if category exists
            const existingCategory = await prisma.category.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            notes: true
                        }
                    }
                }
            });

            if (!existingCategory) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'CATEGORY_NOT_FOUND',
                        message: 'Category not found'
                    }
                });
            }

            // Check if category has associated notes
            if (existingCategory._count.notes > 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'CATEGORY_IN_USE',
                        message: 'Cannot delete category that has associated notes'
                    }
                });
            }

            // Delete category
            await prisma.category.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETE_CATEGORY_ERROR',
                    message: 'Failed to delete category'
                }
            });
        }
    });

export default router;