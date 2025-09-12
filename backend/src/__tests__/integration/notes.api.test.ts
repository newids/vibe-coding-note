import request from 'supertest';
import app from '../../index';
import { testPrisma } from '../setup';
import {
    createTestUser,
    createTestOwner,
    createTestCategory,
    createTestNote,
    createTestTag,
    generateTestToken,
    createAuthHeader
} from '../utils/test-helpers';

describe('Notes API Endpoints', () => {
    let owner: any;
    let visitor: any;
    let category: any;
    let tag: any;

    beforeEach(async () => {
        owner = await createTestOwner();
        visitor = await createTestUser({ email: 'visitor@example.com' });
        category = await createTestCategory();
        tag = await createTestTag();
    });

    describe('GET /api/notes', () => {
        it('should return all published notes', async () => {
            await createTestNote(owner.id, category.id, { title: 'Public Note 1' });
            await createTestNote(owner.id, category.id, { title: 'Public Note 2' });

            const response = await request(app)
                .get('/api/notes')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notes).toHaveLength(2);
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should support pagination', async () => {
            // Create multiple notes
            for (let i = 1; i <= 15; i++) {
                await createTestNote(owner.id, category.id, { title: `Note ${i}` });
            }

            const response = await request(app)
                .get('/api/notes?page=1&limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notes).toHaveLength(10);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.totalPages).toBe(2);
        });

        it('should filter notes by category', async () => {
            const category2 = await createTestCategory({ name: 'Category 2', slug: 'category-2' });

            await createTestNote(owner.id, category.id, { title: 'Note in Category 1' });
            await createTestNote(owner.id, category2.id, { title: 'Note in Category 2' });

            const response = await request(app)
                .get(`/api/notes?category=${category.slug}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notes).toHaveLength(1);
            expect(response.body.data.notes[0].title).toBe('Note in Category 1');
        });

        it('should search notes by title and content', async () => {
            await createTestNote(owner.id, category.id, {
                title: 'React Tutorial',
                content: 'Learn React hooks and components'
            });
            await createTestNote(owner.id, category.id, {
                title: 'Vue Guide',
                content: 'Vue.js fundamentals'
            });

            const response = await request(app)
                .get('/api/notes?search=React')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notes).toHaveLength(1);
            expect(response.body.data.notes[0].title).toBe('React Tutorial');
        });
    });

    describe('GET /api/notes/:id', () => {
        it('should return specific note with comments', async () => {
            const note = await createTestNote(owner.id, category.id, { title: 'Detailed Note' });

            const response = await request(app)
                .get(`/api/notes/${note.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.note.title).toBe('Detailed Note');
            expect(response.body.data.note.comments).toBeDefined();
        });

        it('should return 404 for non-existent note', async () => {
            const response = await request(app)
                .get('/api/notes/non-existent-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
        });
    });

    describe('POST /api/notes', () => {
        it('should create note as owner', async () => {
            const token = generateTestToken(owner.id, 'owner');
            const noteData = {
                title: 'New Note',
                content: 'This is a new note content',
                categoryId: category.id,
                tagIds: [tag.id]
            };

            const response = await request(app)
                .post('/api/notes')
                .set(createAuthHeader(token))
                .send(noteData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.note.title).toBe(noteData.title);
            expect(response.body.data.note.authorId).toBe(owner.id);
        });

        it('should reject note creation by visitor', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const noteData = {
                title: 'Unauthorized Note',
                content: 'This should not be created',
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

        it('should reject note creation without authentication', async () => {
            const noteData = {
                title: 'Unauthenticated Note',
                content: 'This should not be created',
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

    describe('PUT /api/notes/:id', () => {
        it('should update note as owner', async () => {
            const note = await createTestNote(owner.id, category.id, { title: 'Original Title' });
            const token = generateTestToken(owner.id, 'owner');

            const updateData = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const response = await request(app)
                .put(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.note.title).toBe('Updated Title');
        });

        it('should reject update by visitor', async () => {
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
    });

    describe('DELETE /api/notes/:id', () => {
        it('should delete note as owner', async () => {
            const note = await createTestNote(owner.id, category.id);
            const token = generateTestToken(owner.id, 'owner');

            const response = await request(app)
                .delete(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify note was deleted
            const deletedNote = await testPrisma.note.findUnique({
                where: { id: note.id }
            });
            expect(deletedNote).toBeNull();
        });

        it('should reject deletion by visitor', async () => {
            const note = await createTestNote(owner.id, category.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const response = await request(app)
                .delete(`/api/notes/${note.id}`)
                .set(createAuthHeader(token))
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });
    });

    describe('POST /api/notes/:id/like', () => {
        it('should add like to note', async () => {
            const note = await createTestNote(owner.id, category.id);

            const response = await request(app)
                .post(`/api/notes/${note.id}/like`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.likeCount).toBe(1);
        });

        it('should prevent duplicate likes from same IP', async () => {
            const note = await createTestNote(owner.id, category.id);

            // First like
            await request(app)
                .post(`/api/notes/${note.id}/like`)
                .expect(200);

            // Second like from same IP should be rejected
            const response = await request(app)
                .post(`/api/notes/${note.id}/like`)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('ALREADY_LIKED');
        });
    });
});