import request from 'supertest';
import app from '../../index';
import { testPrisma } from '../setup';
import { createTestUser, createTestOwner } from '../utils/test-helpers';

describe('Auth API Endpoints', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.name).toBe(userData.name);
            expect(response.body.data.token).toBeDefined();

            // Verify user was created in database
            const user = await testPrisma.user.findUnique({
                where: { email: userData.email }
            });
            expect(user).toBeTruthy();
            expect(user?.role).toBe('VISITOR');
        });

        it('should reject registration with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                name: 'Test User',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should reject registration with weak password', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'weak'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should reject registration with duplicate email', async () => {
            await createTestUser({ email: 'existing@example.com' });

            const userData = {
                email: 'existing@example.com',
                name: 'Another User',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('EMAIL_EXISTS');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const user = await createTestUser({
                email: 'login@example.com',
                name: 'Login User'
            });

            const loginData = {
                email: 'login@example.com',
                password: 'testpassword123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(user.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should reject login with invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });

        it('should reject login with wrong password', async () => {
            await createTestUser({ email: 'wrongpass@example.com' });

            const loginData = {
                email: 'wrongpass@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user info with valid token', async () => {
            const user = await createTestUser({ email: 'me@example.com' });
            const token = `Bearer ${user.token}`;

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', token)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(user.email);
            expect(response.body.data.user.id).toBe(user.id);
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_TOKEN');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const user = await createTestUser({ email: 'logout@example.com' });
            const token = `Bearer ${user.token}`;

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', token)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logged out successfully');
        });
    });
});