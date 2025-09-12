#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log("\n" + "=".repeat(60), "cyan");
  log(`  ${title}`, "bright");
  log("=".repeat(60), "cyan");
}

function logSubsection(title) {
  log(`\n${"-".repeat(40)}`, "blue");
  log(`  ${title}`, "blue");
  log(`${"-".repeat(40)}`, "blue");
}

async function runCommand(command, args, cwd, description) {
  return new Promise((resolve, reject) => {
    log(`\n🚀 ${description}...`, "yellow");
    log(`Command: ${command} ${args.join(" ")}`, "cyan");

    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        log(`✅ ${description} completed successfully`, "green");
        resolve(code);
      } else {
        log(`❌ ${description} failed with code ${code}`, "red");
        reject(new Error(`${description} failed`));
      }
    });

    child.on("error", (error) => {
      log(`❌ Error running ${description}: ${error.message}`, "red");
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  logSection("CHECKING PREREQUISITES");

  // Check if Docker is running
  try {
    await runCommand(
      "docker",
      ["--version"],
      process.cwd(),
      "Checking Docker installation"
    );
    await runCommand(
      "docker-compose",
      ["--version"],
      process.cwd(),
      "Checking Docker Compose installation"
    );
  } catch (error) {
    log(
      "❌ Docker or Docker Compose not found. Please install Docker first.",
      "red"
    );
    process.exit(1);
  }

  // Check if environment files exist
  const envFiles = [".env", "backend/.env", "frontend/.env"];
  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) {
      log(
        `⚠️  Environment file ${envFile} not found. Creating from example...`,
        "yellow"
      );
      const exampleFile = `${envFile}.example`;
      if (fs.existsSync(exampleFile)) {
        fs.copyFileSync(exampleFile, envFile);
        log(`✅ Created ${envFile} from ${exampleFile}`, "green");
      }
    }
  }
}

async function setupTestEnvironment() {
  logSection("SETTING UP TEST ENVIRONMENT");

  try {
    // Start test environment with Docker Compose
    await runCommand(
      "docker-compose",
      ["-f", "docker-compose.dev.yml", "up", "-d", "postgres", "redis"],
      process.cwd(),
      "Starting test database and cache services"
    );

    // Wait for services to be ready
    log("⏳ Waiting for services to be ready...", "yellow");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Run database migrations
    await runCommand(
      "npm",
      ["run", "db:migrate"],
      path.join(process.cwd(), "backend"),
      "Running database migrations"
    );

    // Seed test data
    await runCommand(
      "npm",
      ["run", "db:seed"],
      path.join(process.cwd(), "backend"),
      "Seeding test database"
    );
  } catch (error) {
    log("❌ Failed to setup test environment", "red");
    throw error;
  }
}

async function runBackendTests() {
  logSubsection("BACKEND INTEGRATION TESTS");

  try {
    // Run unit tests
    await runCommand(
      "npm",
      ["test", "--", "--testPathPattern=unit"],
      path.join(process.cwd(), "backend"),
      "Running backend unit tests"
    );

    // Run integration tests
    await runCommand(
      "npm",
      ["test", "--", "--testPathPattern=integration"],
      path.join(process.cwd(), "backend"),
      "Running backend integration tests"
    );

    // Run API tests
    await runCommand(
      "npm",
      ["test", "--", "--testPathPattern=complete-api"],
      path.join(process.cwd(), "backend"),
      "Running complete API tests"
    );
  } catch (error) {
    log("❌ Backend tests failed", "red");
    throw error;
  }
}

async function runFrontendTests() {
  logSubsection("FRONTEND TESTS");

  try {
    // Run unit tests
    await runCommand(
      "npm",
      ["test", "--", "--run"],
      path.join(process.cwd(), "frontend"),
      "Running frontend unit tests"
    );

    // Run integration tests
    await runCommand(
      "npm",
      ["run", "test:integration"],
      path.join(process.cwd(), "frontend"),
      "Running frontend integration tests"
    );
  } catch (error) {
    log("❌ Frontend tests failed", "red");
    throw error;
  }
}

async function runE2ETests() {
  logSubsection("END-TO-END TESTS");

  try {
    // Start the full application
    await runCommand(
      "docker-compose",
      ["-f", "docker-compose.dev.yml", "up", "-d"],
      process.cwd(),
      "Starting full application stack"
    );

    // Wait for application to be ready
    log("⏳ Waiting for application to be ready...", "yellow");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Check application health
    await runCommand(
      "curl",
      ["-f", "http://localhost:3001/health"],
      process.cwd(),
      "Checking backend health"
    );

    await runCommand(
      "curl",
      ["-f", "http://localhost:5173/"],
      process.cwd(),
      "Checking frontend availability"
    );

    // Run E2E tests
    await runCommand(
      "npm",
      ["run", "test:e2e"],
      path.join(process.cwd(), "frontend"),
      "Running E2E tests"
    );
  } catch (error) {
    log("❌ E2E tests failed", "red");
    throw error;
  }
}

async function runAuthProviderTests() {
  logSubsection("AUTHENTICATION PROVIDER TESTS");

  try {
    // Run OAuth provider tests
    await runCommand(
      "npx",
      ["playwright", "test", "auth-providers.spec.ts"],
      path.join(process.cwd(), "frontend"),
      "Testing OAuth providers"
    );

    // Run role-based access tests
    await runCommand(
      "npx",
      ["playwright", "test", "role-based-access.spec.ts"],
      path.join(process.cwd(), "frontend"),
      "Testing role-based access control"
    );
  } catch (error) {
    log("❌ Authentication provider tests failed", "red");
    throw error;
  }
}

async function runResponsiveDesignTests() {
  logSubsection("RESPONSIVE DESIGN TESTS");

  try {
    // Run responsive design tests
    await runCommand(
      "npx",
      ["playwright", "test", "responsive-design.spec.ts"],
      path.join(process.cwd(), "frontend"),
      "Testing responsive design"
    );
  } catch (error) {
    log("❌ Responsive design tests failed", "red");
    throw error;
  }
}

async function runCompleteWorkflowTests() {
  logSubsection("COMPLETE USER WORKFLOW TESTS");

  try {
    // Run complete workflow tests
    await runCommand(
      "npx",
      ["playwright", "test", "complete-user-workflow.spec.ts"],
      path.join(process.cwd(), "frontend"),
      "Testing complete user workflows"
    );
  } catch (error) {
    log("❌ Complete workflow tests failed", "red");
    throw error;
  }
}

async function generateTestReport() {
  logSection("GENERATING TEST REPORT");

  try {
    // Generate coverage reports
    await runCommand(
      "npm",
      ["run", "test:coverage"],
      path.join(process.cwd(), "backend"),
      "Generating backend coverage report"
    );

    await runCommand(
      "npm",
      ["run", "test:coverage"],
      path.join(process.cwd(), "frontend"),
      "Generating frontend coverage report"
    );

    // Generate Playwright report
    await runCommand(
      "npx",
      ["playwright", "show-report"],
      path.join(process.cwd(), "frontend"),
      "Generating E2E test report"
    );

    log("\n📊 Test reports generated:", "green");
    log(
      "  - Backend coverage: backend/coverage/lcov-report/index.html",
      "cyan"
    );
    log("  - Frontend coverage: frontend/coverage/index.html", "cyan");
    log("  - E2E report: frontend/playwright-report/index.html", "cyan");
  } catch (error) {
    log("⚠️  Failed to generate some test reports", "yellow");
  }
}

async function cleanup() {
  logSection("CLEANUP");

  try {
    // Stop Docker services
    await runCommand(
      "docker-compose",
      ["-f", "docker-compose.dev.yml", "down"],
      process.cwd(),
      "Stopping Docker services"
    );

    // Clean up test data
    log("🧹 Cleaning up test data...", "yellow");
  } catch (error) {
    log(
      "⚠️  Cleanup failed, you may need to manually stop Docker services",
      "yellow"
    );
  }
}

async function main() {
  const startTime = Date.now();

  log("🎯 VIBE CODING NOTES - INTEGRATION TEST SUITE", "bright");
  log("================================================", "bright");

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const skipSetup = args.includes("--skip-setup");
    const skipCleanup = args.includes("--skip-cleanup");
    const testType =
      args.find((arg) => ["unit", "integration", "e2e", "all"].includes(arg)) ||
      "all";

    if (!skipSetup) {
      await checkPrerequisites();
      await setupTestEnvironment();
    }

    // Run tests based on type
    if (testType === "all" || testType === "unit") {
      logSection("RUNNING UNIT TESTS");
      await runBackendTests();
      await runFrontendTests();
    }

    if (testType === "all" || testType === "integration") {
      logSection("RUNNING INTEGRATION TESTS");
      await runAuthProviderTests();
      await runResponsiveDesignTests();
    }

    if (testType === "all" || testType === "e2e") {
      logSection("RUNNING END-TO-END TESTS");
      await runE2ETests();
      await runCompleteWorkflowTests();
    }

    await generateTestReport();

    if (!skipCleanup) {
      await cleanup();
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    logSection("TEST SUITE COMPLETED SUCCESSFULLY");
    log(`🎉 All tests passed in ${duration} seconds!`, "green");
    log("\n📋 Test Summary:", "bright");
    log("  ✅ Backend unit and integration tests", "green");
    log("  ✅ Frontend unit and integration tests", "green");
    log("  ✅ Authentication provider tests", "green");
    log("  ✅ Role-based access control tests", "green");
    log("  ✅ Responsive design tests", "green");
    log("  ✅ Complete user workflow tests", "green");
    log("  ✅ End-to-end functionality tests", "green");
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);

    logSection("TEST SUITE FAILED");
    log(`❌ Tests failed after ${duration} seconds`, "red");
    log(`Error: ${error.message}`, "red");

    if (!skipCleanup) {
      await cleanup();
    }

    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  log("\n🛑 Test suite interrupted by user", "yellow");
  await cleanup();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  log("\n🛑 Test suite terminated", "yellow");
  await cleanup();
  process.exit(1);
});

// Run the test suite
main().catch(async (error) => {
  log(`💥 Unexpected error: ${error.message}`, "red");
  await cleanup();
  process.exit(1);
});
