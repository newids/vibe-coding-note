import { testPrisma } from '../setup';
import { createTestUser, createTestOwner, createTestCategory, createTestTag } from '../utils/test-helpers';

describe('Database Models', () => {
    describe('User Model', () => {
        it('should create user with required fields', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedpassword',
                role: 'VISITOR' as const,
                provider: 'email'
            };

            const user = await testPrisma.user.create({
                data: userData
            });

            expect(user.id).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
            expect(user.role).toBe(userData.role);
            expect(user.provider).toBe(userData.provider);
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
        });

        it('should enforce unique email constraint', async () => {
            const userData = {
                email: 'unique@example.com',
                name: 'First User',
                password: 'hashedpassword',
                role: 'VISITOR' as const,
                provider: 'email'
            };

            await testPrisma.user.create({ data: userData });

            // Try to create another user with same email
            await expect(
                testPrisma.user.create({
                    data: { ...userData, name: 'Second User' }
                })
            ).rejects.toThrow();
        });

        it('should set default role to VISITOR', async () => {
            const user = await testPrisma.user.create({
                data: {
                    email: 'default@example.com',
                    name: 'Default User',
                    password: 'hashedpassword',
                    provider: 'email'
                }
            });

            expect(user.role).toBe('VISITOR');
        });
    });

    describe('Note Model', () => {
        it('should create note with all relationships', async () => {
            const owner = await createTestOwner();
            const category = await createTestCategory();
            const tag = await createTestTag();

            const noteData = {
                title: 'Test Note',
                content: 'This is test content',
                excerpt: 'Test excerpt',
                slug: 'test-note',
                authorId: owner.id,
                categoryId: category.id,
                published: true
            };

            const note = await testPrisma.note.create({
                data: {
                    ...noteData,
                    tags: {
                        connect: [{ id: tag.id }]
                    }
                },
                include: {
                    author: true,
                    category: true,
                    tags: true
                }
            });

            expect(note.id).toBeDefined();
            expect(note.title).toBe(noteData.title);
            expect(note.author.id).toBe(owner.id);
            expect(note.category.id).toBe(category.id);
            expect(note.tags).toHaveLength(1);
            expect(note.tags[0].id).toBe(tag.id);
            expect(note.likeCount).toBe(0);
            expect(note.createdAt).toBeDefined();
        });

        it('should enforce required fields', async () => {
            await expect(
                testPrisma.note.create({
                    data: {
                        // Missing required fields
                        content: 'Content without title'
                    }
                })
            ).rejects.toThrow();
        });

        it('should cascade delete comments when note is deleted', async () => {
            const owner = await createTestOwner();
            const visitor = await createTestUser();
            const category = await createTestCategory();

            const note = await testPrisma.note.create({
                data: {
                    title: 'Note to Delete',
                    content: 'Content',
                    excerpt: 'Excerpt',
                    slug: 'note-to-delete',
                    authorId: owner.id,
                    categoryId: category.id
                }
            });

            const comment = await testPrisma.comment.create({
                data: {
                    content: 'Test comment',
                    noteId: note.id,
                    authorId: visitor.id
                }
            });

            // Delete the note
            await testPrisma.note.delete({
                where: { id: note.id }
            });

            // Comment should be deleted too
            const deletedComment = await testPrisma.comment.findUnique({
                where: { id: comment.id }
            });
            expect(deletedComment).toBeNull();
        });
    });

    describe('Comment Model', () => {
        it('should create comment with required relationships', async () => {
            const owner = await createTestOwner();
            const visitor = await createTestUser();
            const category = await createTestCategory();

            const note = await testPrisma.note.create({
                data: {
                    title: 'Note for Comment',
                    content: 'Content',
                    excerpt: 'Excerpt',
                    slug: 'note-for-comment',
                    authorId: owner.id,
                    categoryId: category.id
                }
            });

            const comment = await testPrisma.comment.create({
                data: {
                    content: 'Test comment content',
                    noteId: note.id,
                    authorId: visitor.id
                },
                include: {
                    author: true,
                    note: true
                }
            });

            expect(comment.id).toBeDefined();
            expect(comment.content).toBe('Test comment content');
            expect(comment.author.id).toBe(visitor.id);
            expect(comment.note.id).toBe(note.id);
            expect(comment.createdAt).toBeDefined();
        });

        it('should support nested comments', async () => {
            const owner = await createTestOwner();
            const visitor = await createTestUser();
            const category = await createTestCategory();

            const note = await testPrisma.note.create({
                data: {
                    title: 'Note for Nested Comments',
                    content: 'Content',
                    excerpt: 'Excerpt',
                    slug: 'note-for-nested-comments',
                    authorId: owner.id,
                    categoryId: category.id
                }
            });

            const parentComment = await testPrisma.comment.create({
                data: {
                    content: 'Parent comment',
                    noteId: note.id,
                    authorId: visitor.id
                }
            });

            const childComment = await testPrisma.comment.create({
                data: {
                    content: 'Child comment',
                    noteId: note.id,
                    authorId: owner.id,
                    parentId: parentComment.id
                },
                include: {
                    parent: true
                }
            });

            expect(childComment.parent?.id).toBe(parentComment.id);
            expect(childComment.parent?.content).toBe('Parent comment');
        });
    });

    describe('Category Model', () => {
        it('should create category with unique slug', async () => {
            const category = await testPrisma.category.create({
                data: {
                    name: 'JavaScript',
                    slug: 'javascript',
                    description: 'JavaScript related tools',
                    color: '#F7DF1E'
                }
            });

            expect(category.id).toBeDefined();
            expect(category.name).toBe('JavaScript');
            expect(category.slug).toBe('javascript');
            expect(category.color).toBe('#F7DF1E');
        });

        it('should enforce unique slug constraint', async () => {
            await testPrisma.category.create({
                data: {
                    name: 'React',
                    slug: 'react',
                    color: '#61DAFB'
                }
            });

            await expect(
                testPrisma.category.create({
                    data: {
                        name: 'React Native',
                        slug: 'react', // Same slug
                        color: '#61DAFB'
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Tag Model', () => {
        it('should create tag with unique slug', async () => {
            const tag = await testPrisma.tag.create({
                data: {
                    name: 'Frontend',
                    slug: 'frontend'
                }
            });

            expect(tag.id).toBeDefined();
            expect(tag.name).toBe('Frontend');
            expect(tag.slug).toBe('frontend');
        });

        it('should support many-to-many relationship with notes', async () => {
            const owner = await createTestOwner();
            const category = await createTestCategory();

            const tag1 = await testPrisma.tag.create({
                data: { name: 'React', slug: 'react' }
            });

            const tag2 = await testPrisma.tag.create({
                data: { name: 'TypeScript', slug: 'typescript' }
            });

            const note = await testPrisma.note.create({
                data: {
                    title: 'React with TypeScript',
                    content: 'Content',
                    excerpt: 'Excerpt',
                    slug: 'react-with-typescript',
                    authorId: owner.id,
                    categoryId: category.id,
                    tags: {
                        connect: [{ id: tag1.id }, { id: tag2.id }]
                    }
                },
                include: {
                    tags: true
                }
            });

            expect(note.tags).toHaveLength(2);
            expect(note.tags.map(t => t.name)).toContain('React');
            expect(note.tags.map(t => t.name)).toContain('TypeScript');
        });
    });

    describe('Like Model', () => {
        it('should create like with IP tracking', async () => {
            const owner = await createTestOwner();
            const category = await createTestCategory();

            const note = await testPrisma.note.create({
                data: {
                    title: 'Likeable Note',
                    content: 'Content',
                    excerpt: 'Excerpt',
                    slug: 'likeable-note',
                    authorId: owner.id,
                    categoryId: category.id
                }
            });

            const like = await testPrisma.like.create({
                data: {
                    noteId: note.id,
                    ipAddress: '192.168.1.1'
                }
            });

            expect(like.id).toBeDefined();
            expect(like.noteId).toBe(note.id);
            expect(like.ipAddress).toBe('192.168.1.1');
            expect(like.createdAt).toBeDefined();
        });

        it('should enforce unique constraint on note and IP', async () => {
            const owner = await createTestOwner();
            const category = await createTestCategory();

            const note = await testPrisma.note.create({
                data: {
                    title: 'Note for Duplicate Like Test',
                    content: 'Content',
                    excerpt: 'Excerpt',
                    slug: 'note-for-duplicate-like',
                    authorId: owner.id,
                    categoryId: category.id
                }
            });

            await testPrisma.like.create({
                data: {
                    noteId: note.id,
                    ipAddress: '192.168.1.1'
                }
            });

            // Try to create duplicate like
            await expect(
                testPrisma.like.create({
                    data: {
                        noteId: note.id,
                        ipAddress: '192.168.1.1'
                    }
                })
            ).rejects.toThrow();
        });
    });
});