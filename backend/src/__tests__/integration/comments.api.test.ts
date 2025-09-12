import request from 'supertest';
import app from '../../index';
import { testPrisma } from '../setup';
import {
    createTestUser,
    createTestOwner,
    createTestCategory,
    createTestNote,
    createTestComment,
    generateTestToken,
    createAuthHeader
} from '../utils/test-helpers';

describe('Comments API Endpoints', () => {
    let owner: any;
    let visitor: any;
    let visitor2: any;
    let category: any;
    let note: any;

    beforeEach(async () => {
        owner = await createTestOwner();
        visitor = await createTestUser({ email: 'visitor@example.com' });
        visitor2 = await createTestUser({ email: 'visitor2@example.com' });
        category = await createTestCategory();
        note = await createTestNote(owner.id, category.id);
    });

    describe('GET /api/notes/:noteId/comments', () => {
        it('should return all comments for a note', async () => {
            await createTestComment(note.id, visitor.id, { content: 'First comment' });
            await createTestComment(note.id, visitor2.id, { content: 'Second comment' });

            const response = await request(app)
                .get(`/api/notes/${note.id}/comments`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comments).toHaveLength(2);
            expect(response.body.data.comments[0].content).toBe('First comment');
            expect(response.body.data.comments[1].content).toBe('Second comment');
        });

        it('should return empty array for note with no comments', async () => {
            const response = await request(app)
                .get(`/api/notes/${note.id}/comments`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comments).toHaveLength(0);
        });

        it('should return 404 for non-existent note', async () => {
            const response = await request(app)
                .get('/api/notes/non-existent-id/comments')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
        });
    });

    describe('POST /api/notes/:noteId/comments', () => {
        it('should create comment as authenticated user', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const commentData = {
                content: 'This is a new comment'
            };

            const response = await request(app)
                .post(`/api/notes/${note.id}/comments`)
                .set(createAuthHeader(token))
                .send(commentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comment.content).toBe(commentData.content);
            expect(response.body.data.comment.authorId).toBe(visitor.id);
            expect(response.body.data.comment.noteId).toBe(note.id);
        });

        it('should reject comment creation without authentication', async () => {
            const commentData = {
                content: 'Unauthorized comment'
            };

            const response = await request(app)
                .post(`/api/notes/${note.id}/comments`)
                .send(commentData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        it('should reject empty comment', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const commentData = {
                content: ''
            };

            const response = await request(app)
                .post(`/api/notes/${note.id}/comments`)
                .set(createAuthHeader(token))
                .send(commentData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should reject comment on non-existent note', async () => {
            const token = generateTestToken(visitor.id, 'visitor');
            const commentData = {
                content: 'Comment on non-existent note'
            };

            const response = await request(app)
                .post('/api/notes/non-existent-id/comments')
                .set(createAuthHeader(token))
                .send(commentData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOTE_NOT_FOUND');
        });
    });

    describe('PUT /api/comments/:id', () => {
        it('should update comment by author', async () => {
            const comment = await createTestComment(note.id, visitor.id, { content: 'Original comment' });
            const token = generateTestToken(visitor.id, 'visitor');

            const updateData = {
                content: 'Updated comment content'
            };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comment.content).toBe('Updated comment content');
        });

        it('should update comment by system owner', async () => {
            const comment = await createTestComment(note.id, visitor.id, { content: 'Original comment' });
            const token = generateTestToken(owner.id, 'owner');

            const updateData = {
                content: 'Owner updated comment'
            };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comment.content).toBe('Owner updated comment');
        });

        it('should reject update by different user', async () => {
            const comment = await createTestComment(note.id, visitor.id, { content: 'Original comment' });
            const token = generateTestToken(visitor2.id, 'visitor');

            const updateData = {
                content: 'Unauthorized update'
            };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should reject update without authentication', async () => {
            const comment = await createTestComment(note.id, visitor.id);

            const updateData = {
                content: 'Unauthenticated update'
            };

            const response = await request(app)
                .put(`/api/comments/${comment.id}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });
    });

    describe('DELETE /api/comments/:id', () => {
        it('should delete comment by author', async () => {
            const comment = await createTestComment(note.id, visitor.id);
            const token = generateTestToken(visitor.id, 'visitor');

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify comment was deleted
            const deletedComment = await testPrisma.comment.findUnique({
                where: { id: comment.id }
            });
            expect(deletedComment).toBeNull();
        });

        it('should delete comment by system owner', async () => {
            const comment = await createTestComment(note.id, visitor.id);
            const token = generateTestToken(owner.id, 'owner');

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify comment was deleted
            const deletedComment = await testPrisma.comment.findUnique({
                where: { id: comment.id }
            });
            expect(deletedComment).toBeNull();
        });

        it('should reject deletion by different user', async () => {
            const comment = await createTestComment(note.id, visitor.id);
            const token = generateTestToken(visitor2.id, 'visitor');

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .set(createAuthHeader(token))
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should reject deletion without authentication', async () => {
            const comment = await createTestComment(note.id, visitor.id);

            const response = await request(app)
                .delete(`/api/comments/${comment.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        it('should return 404 for non-existent comment', async () => {
            const token = generateTestToken(visitor.id, 'visitor');

            const response = await request(app)
                .delete('/api/comments/non-existent-id')
                .set(createAuthHeader(token))
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('COMMENT_NOT_FOUND');
        });
    });
});