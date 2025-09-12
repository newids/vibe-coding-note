import { prisma } from './database';
import { Prisma } from '@prisma/client';

/**
 * Database utility functions for common operations
 */

export class DatabaseUtils {
    /**
     * Generate a unique slug from a title
     */
    static async generateUniqueSlug(title: string, model: 'note' | 'category' | 'tag'): Promise<string> {
        const baseSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let slug = baseSlug;
        let counter = 1;

        while (await this.slugExists(slug, model)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    /**
     * Check if a slug already exists
     */
    private static async slugExists(slug: string, model: 'note' | 'category' | 'tag'): Promise<boolean> {
        try {
            let result;

            switch (model) {
                case 'note':
                    result = await prisma.note.findUnique({ where: { slug } });
                    break;
                case 'category':
                    result = await prisma.category.findUnique({ where: { slug } });
                    break;
                case 'tag':
                    result = await prisma.tag.findUnique({ where: { slug } });
                    break;
            }

            return result !== null;
        } catch (error) {
            console.error(`Error checking slug existence for ${model}:`, error);
            return false;
        }
    }

    /**
     * Get paginated results with metadata
     */
    static async paginate<T>(
        model: any,
        page: number = 1,
        limit: number = 10,
        where?: any,
        orderBy?: any,
        include?: any
    ): Promise<{
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            model.findMany({
                skip,
                take: limit,
                where,
                orderBy,
                include
            }),
            model.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Create excerpt from content
     */
    static createExcerpt(content: string, maxLength: number = 200): string {
        // Remove markdown formatting
        const plainText = content
            .replace(/#{1,6}\s+/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove inline code
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();

        if (plainText.length <= maxLength) {
            return plainText;
        }

        // Find the last complete word within the limit
        const truncated = plainText.substring(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');

        if (lastSpaceIndex > 0) {
            return truncated.substring(0, lastSpaceIndex) + '...';
        }

        return truncated + '...';
    }

    /**
     * Safely handle database transactions
     */
    static async transaction<T>(
        callback: (prisma: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return await prisma.$transaction(callback);
    }

    /**
     * Get database statistics
     */
    static async getStats() {
        try {
            const [
                userCount,
                noteCount,
                commentCount,
                categoryCount,
                tagCount,
                likeCount
            ] = await Promise.all([
                prisma.user.count(),
                prisma.note.count(),
                prisma.comment.count(),
                prisma.category.count(),
                prisma.tag.count(),
                prisma.like.count()
            ]);

            return {
                users: userCount,
                notes: noteCount,
                comments: commentCount,
                categories: categoryCount,
                tags: tagCount,
                likes: likeCount
            };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return null;
        }
    }
}