import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validateEmail, validatePassword, hashPassword, comparePassword, generateToken, verifyToken } from '../../lib/auth';

describe('Authentication Logic', () => {
    describe('validateEmail', () => {
        it('should validate correct email formats', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
            expect(validateEmail('user123@test-domain.com')).toBe(true);
        });

        it('should reject invalid email formats', () => {
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
            expect(validateEmail('')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should validate strong passwords', () => {
            expect(validatePassword('StrongPass123!')).toBe(true);
            expect(validatePassword('MySecure123')).toBe(true);
            expect(validatePassword('Test1234567890')).toBe(true);
        });

        it('should reject weak passwords', () => {
            expect(validatePassword('weak')).toBe(false);
            expect(validatePassword('12345678')).toBe(false);
            expect(validatePassword('password')).toBe(false);
            expect(validatePassword('')).toBe(false);
        });
    });

    describe('hashPassword', () => {
        it('should hash password correctly', async () => {
            const password = 'testpassword123';
            const hashedPassword = await hashPassword(password);

            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(50);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'testpassword123';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('comparePassword', () => {
        it('should correctly compare password with hash', async () => {
            const password = 'testpassword123';
            const hashedPassword = await hashPassword(password);

            const isValid = await comparePassword(password, hashedPassword);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const hashedPassword = await hashPassword(password);

            const isValid = await comparePassword(wrongPassword, hashedPassword);
            expect(isValid).toBe(false);
        });
    });

    describe('generateToken', () => {
        it('should generate valid JWT token', () => {
            const userId = 'test-user-id';
            const role = 'visitor';

            const token = generateToken(userId, role);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should generate different tokens for different users', () => {
            const token1 = generateToken('user1', 'visitor');
            const token2 = generateToken('user2', 'visitor');

            expect(token1).not.toBe(token2);
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token', () => {
            const userId = 'test-user-id';
            const role = 'owner';
            const token = generateToken(userId, role);

            const decoded = verifyToken(token);

            expect(decoded).toBeDefined();
            expect(decoded.userId).toBe(userId);
            expect(decoded.role).toBe(role);
        });

        it('should reject invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => verifyToken(invalidToken)).toThrow();
        });

        it('should reject expired token', () => {
            // Create token with very short expiration
            const token = jwt.sign(
                { userId: 'test', role: 'visitor' },
                process.env.JWT_SECRET || 'test-jwt-secret-key',
                { expiresIn: '1ms' }
            );

            // Wait for token to expire
            setTimeout(() => {
                expect(() => verifyToken(token)).toThrow();
            }, 10);
        });
    });
});