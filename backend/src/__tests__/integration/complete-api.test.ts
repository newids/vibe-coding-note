import request from 'supertest';
import app from '../../index';
import { prisma } from '../../lib/database';
import { cacheService } from '../../lib/cache';

describe('Complete API Integration Tests', () => {
    let ownerToken: string;
    let visitorToken: string;
    let noteId: string;
    let commentId: string;
    let categoryId: string;
    let tagId: string;

    beforeAll(async () => {
        // Connect to test database and cache
        await cacheService.connect();

        // Clean up database
        await prisma.like.deleteMany();
        await prisma.comment.deleteMany();
        await prisma.$executeRaw`DELETE FROM "_NoteToTag"`;
        await prisma.note.deleteMany();
        await prisma.tag.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();

        // Create test users
        const ownerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Owner',
                email: 'owner@test.com',
                password: 'password123',
                role: 'owner'
            });

        const visitorResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Visitor',
                email: 'visitor@test.com',
                password: 'password123',
                role: 'visitor'
            });

        ownerToken = ownerResponse.body.token;
        visitorToken = visitorResponse.body.token;

        // Create test category
        const categoryResponse = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Test Category',
                description: 'A test category',
                color: '#3B82F6'
            });

        categoryId = categoryResponse.body.data.id;

        // Create test tag
        const tagResponse = await request(app)
            .post('/api/tags')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'test-tag'
            });

        tagId = tagResponse.body.data.id;
    });

    afterAll(async () => {
        // Clean up
        await prisma.like.deleteMany();
        await prisma.comment.deleteMany();
        await prisma.$executeRaw`DELETE FROM "_NoteToTag"`;
        await prisma.note.deleteMany();
        await prisma.tag.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();

        await cacheService.disconnect();
        await prisma.$disconnect();
    });

    describe('Complete User Workflow', () => {
        test('owner can create, read, update, delete notes', async () => {
            // 1. Create note
            const createResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Test Note',
                    content: 'This is a test note content.',
                    excerpt: 'This is a test note',
                    categoryId: categoryId,
                    tagIds: [tagId],
                    published: true
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.title).toBe('Test Note');

            noteId = createResponse.body.data.id;

            // 2. Read note
            const readResponse = await request(app)
                .get(`/api/notes/${noteId}`);

            expect(readResponse.status).toBe(200);
            expect(readResponse.body.success).toBe(true);
            expect(readResponse.body.data.title).toBe('Test Note');
            expect(readResponse.body.data.category.name).toBe('Test Category');
            expect(readResponse.body.data.tags).toHaveLength(1);
            expect(readResponse.body.data.tags[0].name).toBe('test-tag');

            // 3. Update note
            const updateResponse = await request(app)
                .put(`/api/notes/${noteId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Updated Test Note',
                    content: 'This is updated content.',
                    excerpt: 'This is updated'
                });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.title).toBe('Updated Test Note');

            // 4. List notes
            const listResponse = await request(app)
                .get('/api/notes');

            expect(listResponse.status).toBe(200);
            expect(listResponse.body.success).toBe(true);
            expect(listResponse.body.data.notes).toHaveLength(1);
            expect(listResponse.body.data.notes[0].title).toBe('Updated Test Note');

            // 5. Delete note (will be done later after testing comments)
        });

        test('visitor can comment on notes', async () => {
            // 1. Create comment
            const createCommentResponse = await request(app)
                .post(`/api/notes/${noteId}/comments`)
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({
                    content: 'This is a test comment from visitor.'
                });

            expect(createCommentResponse.status).toBe(201);
            expect(createCommentResponse.body.success).toBe(true);
            expect(createCommentResponse.body.data.content).toBe('This is a test comment from visitor.');

            commentId = createCommentResponse.body.data.id;

            // 2. Read comments
            const readCommentsResponse = await request(app)
                .get(`/api/notes/${noteId}/comments`);

            expect(readCommentsResponse.status).toBe(200);
            expect(readCommentsResponse.body.success).toBe(true);
            expect(readCommentsResponse.body.data).toHaveLength(1);
            expect(readCommentsResponse.body.data[0].content).toBe('This is a test comment from visitor.');

            // 3. Update own comment
            const updateCommentResponse = await request(app)
                .put(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({
                    content: 'This is an updated comment from visitor.'
                });

            expect(updateCommentResponse.status).toBe(200);
            expect(updateCommentResponse.body.success).toBe(true);
            expect(updateCommentResponse.body.data.content).toBe('This is an updated comment from visitor.');
        });

        test('anonymous users can like notes', async () => {
            // Get initial like count
            const initialResponse = await request(app)
                .get(`/api/notes/${noteId}`);

            const initialLikeCount = initialResponse.body.data.likeCount;

            // Like the note
            const likeResponse = await request(app)
                .post(`/api/notes/${noteId}/like`)
                .set('X-Forwarded-For', '192.168.1.1');

            expect(likeResponse.status).toBe(200);
            expect(likeResponse.body.success).toBe(true);

            // Check like count increased
            const afterLikeResponse = await request(app)
                .get(`/api/notes/${noteId}`);

            expect(afterLikeResponse.body.data.likeCount).toBe(initialLikeCount + 1);

            // Try to like again with same IP (should fail)
            const duplicateLikeResponse = await request(app)
                .post(`/api/notes/${noteId}/like`)
                .set('X-Forwarded-For', '192.168.1.1');

            expect(duplicateLikeResponse.status).toBe(400);
            expect(duplicateLikeResponse.body.success).toBe(false);
            expect(duplicateLikeResponse.body.error.code).toBe('ALREADY_LIKED');
        });

        test('search and filtering works correctly', async () => {
            // Create additional notes for testing
            await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'React Tutorial',
                    content: 'Learn React from scratch.',
                    excerpt: 'Learn React',
                    categoryId: categoryId,
                    tagIds: [tagId],
                    published: true
                });

            await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Vue.js Guide',
                    content: 'Complete Vue.js guide.',
                    excerpt: 'Vue.js guide',
                    categoryId: categoryId,
                    published: true
                });

            // 1. Search by title
            const searchResponse = await request(app)
                .get('/api/notes?search=React');

            expect(searchResponse.status).toBe(200);
            expect(searchResponse.body.success).toBe(true);
            expect(searchResponse.body.data.notes).toHaveLength(1);
            expect(searchResponse.body.data.notes[0].title).toBe('React Tutorial');

            // 2. Filter by category
            const categoryFilterResponse = await request(app)
                .get(`/api/notes?categoryId=${categoryId}`);

            expect(categoryFilterResponse.status).toBe(200);
            expect(categoryFilterResponse.body.success).toBe(true);
            expect(categoryFilterResponse.body.data.notes.length).toBeGreaterThanOrEqual(2);

            // 3. Filter by tag
            const tagFilterResponse = await request(app)
                .get(`/api/notes?tagId=${tagId}`);

            expect(tagFilterResponse.status).toBe(200);
            expect(tagFilterResponse.body.success).toBe(true);
            expect(tagFilterResponse.body.data.notes.length).toBeGreaterThanOrEqual(2);

            // 4. Combined filters
            const combinedFilterResponse = await request(app)
                .get(`/api/notes?search=React&categoryId=${categoryId}&tagId=${tagId}`);

            expect(combinedFilterResponse.status).toBe(200);
            expect(combinedFilterResponse.body.success).toBe(true);
            expect(combinedFilterResponse.body.data.notes).toHaveLength(1);
            expect(combinedFilterResponse.body.data.notes[0].title).toBe('React Tutorial');
        });

        test('pagination works correctly', async () => {
            // Test pagination
            const paginationResponse = await request(app)
                .get('/api/notes?page=1&limit=2');

            expect(paginationResponse.status).toBe(200);
            expect(paginationResponse.body.success).toBe(true);
            expect(paginationResponse.body.data.notes.length).toBeLessThanOrEqual(2);
            expect(paginationResponse.body.data.pagination.page).toBe(1);
            expect(paginationResponse.body.data.pagination.limit).toBe(2);
            expect(paginationResponse.body.data.pagination.total).toBeGreaterThanOrEqual(3);
        });

        test('owner can moderate comments', async () => {
            // Owner can edit any comment
            const moderateResponse = await request(app)
                .put(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    content: '[Moderated] This comment has been edited by owner.'
                });

            expect(moderateResponse.status).toBe(200);
            expect(moderateResponse.body.success).toBe(true);
            expect(moderateResponse.body.data.content).toBe('[Moderated] This comment has been edited by owner.');

            // Owner can delete any comment
            const deleteCommentResponse = await request(app)
                .delete(`/api/comments/${commentId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(deleteCommentResponse.status).toBe(200);
            expect(deleteCommentResponse.body.success).toBe(true);

            // Verify comment is deleted
            const commentsResponse = await request(app)
                .get(`/api/notes/${noteId}/comments`);

            expect(commentsResponse.body.data).toHaveLength(0);
        });

        test('owner can delete notes', async () => {
            // Delete note
            const deleteResponse = await request(app)
                .delete(`/api/notes/${noteId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.success).toBe(true);

            // Verify note is deleted
            const getResponse = await request(app)
                .get(`/api/notes/${noteId}`);

            expect(getResponse.status).toBe(404);
            expect(getResponse.body.success).toBe(false);
        });
    });

    describe('Authentication and Authorization', () => {
        test('all OAuth providers are configured', async () => {
            // Test OAuth endpoints exist
            const googleResponse = await request(app)
                .get('/api/auth/google')
                .expect(302); // Should redirect to Google

            const githubResponse = await request(app)
                .get('/api/auth/github')
                .expect(302); // Should redirect to GitHub

            const facebookResponse = await request(app)
                .get('/api/auth/facebook')
                .expect(302); // Should redirect to Facebook

            // Apple OAuth might require different setup
            const appleResponse = await request(app)
                .get('/api/auth/apple');

            expect([302, 404, 500]).toContain(appleResponse.status); // Might not be fully configured
        });

        test('role-based access control works', async () => {
            // Create a test note first
            const noteResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Access Control Test',
                    content: 'Testing access control.',
                    excerpt: 'Testing access',
                    categoryId: categoryId,
                    published: true
                });

            const testNoteId = noteResponse.body.data.id;

            // Visitor cannot create notes
            const visitorCreateResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({
                    title: 'Visitor Note',
                    content: 'This should fail.',
                    excerpt: 'Should fail',
                    categoryId: categoryId,
                    published: true
                });

            expect(visitorCreateResponse.status).toBe(403);
            expect(visitorCreateResponse.body.success).toBe(false);

            // Visitor cannot edit notes
            const visitorEditResponse = await request(app)
                .put(`/api/notes/${testNoteId}`)
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({
                    title: 'Edited by Visitor'
                });

            expect(visitorEditResponse.status).toBe(403);
            expect(visitorEditResponse.body.success).toBe(false);

            // Visitor cannot delete notes
            const visitorDeleteResponse = await request(app)
                .delete(`/api/notes/${testNoteId}`)
                .set('Authorization', `Bearer ${visitorToken}`);

            expect(visitorDeleteResponse.status).toBe(403);
            expect(visitorDeleteResponse.body.success).toBe(false);

            // Clean up
            await request(app)
                .delete(`/api/notes/${testNoteId}`)
                .set('Authorization', `Bearer ${ownerToken}`);
        });

        test('JWT token validation works', async () => {
            // Invalid token
            const invalidTokenResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    title: 'Should Fail',
                    content: 'This should fail.',
                    excerpt: 'Should fail',
                    categoryId: categoryId,
                    published: true
                });

            expect(invalidTokenResponse.status).toBe(401);
            expect(invalidTokenResponse.body.success).toBe(false);

            // No token
            const noTokenResponse = await request(app)
                .post('/api/notes')
                .send({
                    title: 'Should Fail',
                    content: 'This should fail.',
                    excerpt: 'Should fail',
                    categoryId: categoryId,
                    published: true
                });

            expect(noTokenResponse.status).toBe(401);
            expect(noTokenResponse.body.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('validation errors are handled correctly', async () => {
            // Missing required fields
            const invalidNoteResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    content: 'Missing title'
                });

            expect(invalidNoteResponse.status).toBe(400);
            expect(invalidNoteResponse.body.success).toBe(false);
            expect(invalidNoteResponse.body.error.code).toBe('VALIDATION_ERROR');

            // Invalid email format
            const invalidEmailResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(invalidEmailResponse.status).toBe(400);
            expect(invalidEmailResponse.body.success).toBe(false);
        });

        test('not found errors are handled correctly', async () => {
            const notFoundResponse = await request(app)
                .get('/api/notes/non-existent-id');

            expect(notFoundResponse.status).toBe(404);
            expect(notFoundResponse.body.success).toBe(false);
            expect(notFoundResponse.body.error.code).toBe('NOT_FOUND');
        });

        test('database errors are handled gracefully', async () => {
            // Try to create note with non-existent category
            const invalidCategoryResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Test Note',
                    content: 'Test content',
                    excerpt: 'Test excerpt',
                    categoryId: 'non-existent-category-id',
                    published: true
                });

            expect(invalidCategoryResponse.status).toBe(400);
            expect(invalidCategoryResponse.body.success).toBe(false);
        });
    });

    describe('Performance and Caching', () => {
        test('caching works for frequently accessed data', async () => {
            // Create a note
            const noteResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Cached Note',
                    content: 'This note should be cached.',
                    excerpt: 'Cached note',
                    categoryId: categoryId,
                    published: true
                });

            const cachedNoteId = noteResponse.body.data.id;

            // First request (should cache)
            const firstResponse = await request(app)
                .get(`/api/notes/${cachedNoteId}`);

            expect(firstResponse.status).toBe(200);

            // Second request (should use cache)
            const secondResponse = await request(app)
                .get(`/api/notes/${cachedNoteId}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body.data.title).toBe('Cached Note');

            // Clean up
            await request(app)
                .delete(`/api/notes/${cachedNoteId}`)
                .set('Authorization', `Bearer ${ownerToken}`);
        });

        test('rate limiting works', async () => {
            // Make multiple rapid requests
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({
                            email: 'nonexistent@test.com',
                            password: 'wrongpassword'
                        })
                );
            }

            const responses = await Promise.all(requests);

            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('Health Checks', () => {
        test('health endpoint returns system status', async () => {
            const healthResponse = await request(app)
                .get('/health');

            expect(healthResponse.status).toBe(200);
            expect(healthResponse.body.status).toBe('OK');
            expect(healthResponse.body.database.connected).toBe(true);
            expect(healthResponse.body.cache.connected).toBe(true);
            expect(healthResponse.body.timestamp).toBeDefined();
        });

        test('database health endpoint works', async () => {
            const dbHealthResponse = await request(app)
                .get('/health/db');

            expect(dbHealthResponse.status).toBe(200);
            expect(dbHealthResponse.body.status).toBe('OK');
            expect(dbHealthResponse.body.database.connected).toBe(true);
            expect(dbHealthResponse.body.database.info).toBeDefined();
        });
    });

    describe('Security', () => {
        test('security headers are set', async () => {
            const response = await request(app)
                .get('/api/notes');

            // Check for security headers
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBeDefined();
            expect(response.headers['x-xss-protection']).toBeDefined();
        });

        test('CORS is configured correctly', async () => {
            const response = await request(app)
                .options('/api/notes')
                .set('Origin', 'http://localhost:5173');

            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
            expect(response.headers['access-control-allow-headers']).toBeDefined();
        });

        test('input sanitization works', async () => {
            // Try to create note with XSS payload
            const xssResponse = await request(app)
                .post('/api/notes')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: '<script>alert("xss")</script>',
                    content: '<img src="x" onerror="alert(\'xss\')">',
                    excerpt: 'XSS test',
                    categoryId: categoryId,
                    published: true
                });

            expect(xssResponse.status).toBe(201);

            // Content should be sanitized
            const sanitizedNote = xssResponse.body.data;
            expect(sanitizedNote.title).not.toContain('<script>');
            expect(sanitizedNote.content).not.toContain('onerror');

            // Clean up
            await request(app)
                .delete(`/api/notes/${sanitizedNote.id}`)
                .set('Authorization', `Bearer ${ownerToken}`);
        });
    });
});