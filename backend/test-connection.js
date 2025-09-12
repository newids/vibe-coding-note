const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful:", result);

    const userCount = await prisma.user.count();
    console.log("✅ User count:", userCount);

    const noteCount = await prisma.note.count();
    console.log("✅ Note count:", noteCount);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
