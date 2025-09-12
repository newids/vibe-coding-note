import request from 'supertest';
import app from '../../index';
import {
    createTestUser,
    createTestOwner,
    createTestCategory,
    createTestNote,
    createTestComment,
    generateTestToken,
    createAuthHeader
} from '../utils/test-helpers';

describe('Authorization Tests', () => {
    let owner: any;
    let visitor: any;
    let category: any;

    beforeEach(async () => {
        owner = await createTestOwner();
        visitor = await createTestUser({ email: 'visitor@example.com' });
        category = await createTestCategory();
    });

    describe('Owner Role Authorization', () => {
        it('should allow owner to create notes', async () => {
            const token = generateTestToken(owner.id, 'owner');
            const noteData = {
                title: 'Owner Note',
                content: 'Content by owner',
                categoryId: category.id
            };

            const response = await request(app)
                .post('/api/notes')
                .set(createAuthHeader(token))
                .send(noteData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });

        it('should allow owner to update any note', async () => {
            const note = await createTestNote(visitor.id, category.id, { title: 'Visitor Note' });
            const token = generateTestToken(owner.id, 'owner');

            const updateData = { title: 'Updated by Owner' };

            const response = await request(app)
                .put(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.note.title).toBe('Updated by Owner');
        });

        it('should allow owner to delete any note', async () => {
            const note = await createTestNote(visitor.id, category.id);
            const token = generateTestToken(owner.id, 'owner');

            const response = await request(app)
                .delete(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should allow owner to update any comment', async () => {
            const note = await createTestNote(owner.id, category.id);
            const comment = await createTestComment(note.id, visitor.id, { content: 'Visitor comment' });
            const token = generateTestToken(owner.id, 'owner');

            const updateData = { content: 'Updated by owner' };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comment.content).toBe('Updated by owner');
        });

        it('should allow owner to delete any comment', async () => {
            const note = await createTestNote(owner.id, category.id);
            const comment = await createTestComment(note.id, visitor.id);
            const token = generateTestToken(owner.id, 'owner');

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should allow owner to create categories', async () => {
            const token = generateTestToken(owner.id, 'owner');
            const categoryData = {
                name: 'New Category',
                slug: 'new-category',
                color: '#FF5733'
            };

            const response = await request(app)
                .post('/api/categories')
                .set(createAuthHeader(token))
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });

        it('should allow owner to create tags', async () => {
            const token = generateTestToken(owner.id, 'owner');
            const tagData = {
                name: 'New Tag',
                slug: 'new-tag'
            };

            const response = await request(app)
                .post('/api/tags')
                .set(createAuthHeader(token))
                .send(tagData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Visitor Role Authorization', () => {
        it('should deny visitor from creating notes', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const noteData = {
                title: 'Visitor Note',
                content: 'Content by visitor',
                categoryId: category.id
            };

            const response = await request(app)
                .post('/api/notes')
                .set(createAuthHeader(token))
                .send(noteData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should deny visitor from updating notes', async () => {
            const note = await createTestNote(owner.id, category.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const updateData = { title: 'Unauthorized Update' };

            const response = await request(app)
                .put(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should deny visitor from deleting notes', async () => {
            const note = await createTestNote(owner.id, category.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const response = await request(app)
                .delete(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should allow visitor to create comments', async () => {
            const note = await createTestNote(owner.id, category.id);
            const token = generateTestToken(visitor.id, 'visitor');
            const commentData = { content: 'Visitor comment' };

            const response = await request(app)
                .post(`/api/notes/${note.id}/comments`)
                .set(createAuthHeader(token))
                .send(commentData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });

        it('should allow visitor to update their own comments', async () => {
            const note = await createTestNote(owner.id, category.id);
            const comment = await createTestComment(note.id, visitor.id, { content: 'Original comment' });
            const token = generateTestToken(visitor.id, 'visitor');

            const updateData = { content: 'Updated comment' };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should deny visitor from updating others comments', async () => {
            const visitor2 = await createTestUser({ email: 'visitor2@example.com' });
            const note = await createTestNote(owner.id, category.id);
            const comment = await createTestComment(note.id, visitor2.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const updateData = { content: 'Unauthorized update' };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should allow visitor to delete their own comments', async () => {
            const note = await createTestNote(owner.id, category.id);
            const comment = await createTestComment(note.id, visitor.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should deny visitor from deleting others comments', async () => {
            const visitor2 = await createTestUser({ email: 'visitor2@example.com' });
            const note = await createTestNote(owner.id, category.id);
            const comment = await createTestComment(note.id, visitor2.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should deny visitor from creating categories', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const categoryData = {
                name: 'Unauthorized Category',
                slug: 'unauthorized-category',
                color: '#FF5733'
            };

            const response = await request(app)
                .post('/api/categories')
                .set(createAuthHeader(token))
                .send(categoryData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should deny visitor from creating tags', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const tagData = {
                name: 'Unauthorized Tag',
                slug: 'unauthorized-tag'
            };

            const response = await request(app)
                .post('/api/tags')
                .set(createAuthHeader(token))
                .send(tagData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });
    });

    describe('Anonymous User Authorization', () => {
        it('should allow anonymous users to read notes', async () => {
            await createTestNote(owner.id, category.id, { title: 'Public Note' });

            const response = await request(app)
                .get('/api/notes')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notes).toHaveLength(1);
        });

        it('should allow anonymous users to read specific note', async () => {
            const note = await createTestNote(owner.id, category.id, { title: 'Public Note' });

            const response = await request(app)
                .get(`/api/notes/${note.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.note.title).toBe('Public Note');
        });

        it('should allow anonymous users to read comments', async () => {
            const note = await createTestNote(owner.id, category.id);
            await createTestComment(note.id, visitor.id, { content: 'Public comment' });

            const response = await request(app)
                .get(`/api/notes/${note.id}/comments`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comments).toHaveLength(1);
        });

        it('should allow anonymous users to like notes', async () => {
            const note = await createTestNote(owner.id, category.id);

            const response = await request(app)
                .post(`/api/notes/${note.id}/like`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.likeCount).toBe(1);
        });

        it('should deny anonymous users from creating comments', async () => {
            const note = await createTestNote(owner.id, category.id);
            const commentData = { content: 'Anonymous comment' };

            const response = await request(app)
                .post(`/api/notes/${note.id}/comments`)
                .send(commentData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        it('should deny anonymous users from creating notes', async () => {
            const noteData = {
                title: 'Anonymous Note',
                content: 'Content',
                categoryId: category.id
            };

            const response = await request(app)
                .post('/api/notes')
                .send(noteData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });
    });
});