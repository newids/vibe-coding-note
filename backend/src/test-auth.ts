import { hashPassword, verifyPassword, generateToken, verifyToken } from './lib/auth';

async function testAuth() {
    console.log('🧪 Testing authentication utilities...\n');

    // Test password hashing and verification
    console.log('1. Testing password hashing and verification:');
    const password = 'testpassword123';
    const hashedPassword = await hashPassword(password);
    console.log(`   Original password: ${password}`);
    console.log(`   Hashed password: ${hashedPassword}`);

    const isValid = await verifyPassword(password, hashedPassword);
    console.log(`   Password verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);

    const isInvalid = await verifyPassword('wrongpassword', hashedPassword);
    console.log(`   Wrong password verification: ${!isInvalid ? '✅ PASS' : '❌ FAIL'}`);

    // Test JWT token generation and verification
    console.log('\n2. Testing JWT token generation and verification:');
    const userId = 'test-user-id-123';
    const token = generateToken(userId);
    console.log(`   Generated token: ${token.substring(0, 50)}...`);

    const decoded = verifyToken(token);
    console.log(`   Decoded user ID: ${decoded?.userId}`);
    console.log(`   Token verification: ${decoded?.userId === userId ? '✅ PASS' : '❌ FAIL'}`);

    const invalidToken = verifyToken('invalid.token.here');
    console.log(`   Invalid token verification: ${invalidToken === null ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n✅ Authentication utilities test completed!');
}

testAuth().catch(console.error);