# Testing Guide

This document provides comprehensive information about testing the Vibe Coding Notes application.

## Test Suite Overview

The application includes multiple layers of testing to ensure reliability and functionality:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions and API endpoints
- **End-to-End Tests**: Test complete user workflows
- **Authentication Tests**: Test all OAuth providers and role-based access
- **Responsive Design Tests**: Test UI across different screen sizes
- **Performance Tests**: Test loading states and optimization

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Quick test (skip setup/cleanup)
npm run test:quick
```

## Test Structure

### Backend Tests (`backend/src/__tests__/`)

```
__tests__/
├── unit/
│   └── auth.test.ts                    # Authentication logic tests
├── integration/
│   ├── auth.api.test.ts               # Authentication API tests
│   ├── notes.api.test.ts              # Notes API tests
│   ├── comments.api.test.ts           # Comments API tests
│   ├── authorization.test.ts          # Role-based access tests
│   └── complete-api.test.ts           # Comprehensive API tests
├── database/
│   └── models.test.ts                 # Database model tests
└── utils/
    └── test-helpers.ts                # Test utilities
```

### Frontend Tests (`frontend/src/test/`)

```
test/
├── unit/
│   └── components/                    # Component unit tests
├── integration/
│   └── auth-flow.test.tsx            # Authentication flow tests
├── e2e/
│   ├── auth.spec.ts                  # Authentication E2E tests
│   ├── notes.spec.ts                 # Notes functionality E2E tests
│   ├── auth-providers.spec.ts        # OAuth providers tests
│   ├── role-based-access.spec.ts     # Role-based access tests
│   ├── responsive-design.spec.ts     # Responsive design tests
│   └── complete-user-workflow.spec.ts # Complete user journey tests
├── mocks/
│   ├── handlers.ts                   # MSW request handlers
│   └── server.ts                     # Mock server setup
└── utils.tsx                         # Test utilities
```

## Test Categories

### 1. Authentication Tests

**Coverage:**

- Email/password authentication
- OAuth providers (Google, GitHub, Facebook, Apple, Naver, Kakao)
- JWT token validation
- Session management
- Password reset functionality

**Key Test Files:**

- `backend/src/__tests__/integration/auth.api.test.ts`
- `frontend/src/test/e2e/auth.spec.ts`
- `frontend/src/test/e2e/auth-providers.spec.ts`

### 2. Role-Based Access Control Tests

**Coverage:**

- Owner permissions (create, edit, delete notes)
- Visitor permissions (read, comment)
- Anonymous user permissions (read, like)
- Permission enforcement across all endpoints
- UI element visibility based on roles

**Key Test Files:**

- `backend/src/__tests__/integration/authorization.test.ts`
- `frontend/src/test/e2e/role-based-access.spec.ts`

### 3. Notes Management Tests

**Coverage:**

- CRUD operations for notes
- Search and filtering functionality
- Pagination and infinite scroll
- Tag and category management
- Content validation and sanitization

**Key Test Files:**

- `backend/src/__tests__/integration/notes.api.test.ts`
- `frontend/src/test/e2e/notes.spec.ts`

### 4. Comments System Tests

**Coverage:**

- Comment creation and editing
- Comment moderation (owner capabilities)
- Comment deletion
- Nested comments (if implemented)
- Comment validation

**Key Test Files:**

- `backend/src/__tests__/integration/comments.api.test.ts`
- Tests integrated in workflow tests

### 5. Anonymous Like System Tests

**Coverage:**

- Like functionality without authentication
- IP-based duplicate prevention
- Like count accuracy
- Like button state management

**Key Test Files:**

- Integrated in complete workflow tests
- Backend API tests include like endpoints

### 6. Responsive Design Tests

**Coverage:**

- Mobile viewport (375px)
- Tablet viewport (768px)
- Desktop viewport (1280px)
- Large desktop viewport (1920px)
- Touch interactions
- Keyboard navigation
- Accessibility compliance

**Key Test Files:**

- `frontend/src/test/e2e/responsive-design.spec.ts`

### 7. Complete User Workflow Tests

**Coverage:**

- End-to-end user journeys
- Registration → Login → Browse → Interact → Logout
- Owner workflow: Create → Edit → Moderate → Delete
- Error handling and edge cases
- Performance and loading states

**Key Test Files:**

- `frontend/src/test/e2e/complete-user-workflow.spec.ts`
- `backend/src/__tests__/integration/complete-api.test.ts`

## Test Environment Setup

### Prerequisites

1. **Docker & Docker Compose**

   ```bash
   docker --version
   docker-compose --version
   ```

2. **Node.js & npm**

   ```bash
   node --version
   npm --version
   ```

3. **Environment Files**
   - Copy `.env.example` to `.env`
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

### Automated Setup

The test runner automatically:

1. Checks prerequisites
2. Starts test database and cache services
3. Runs database migrations
4. Seeds test data
5. Executes tests
6. Generates reports
7. Cleans up resources

### Manual Setup

If you need to set up the test environment manually:

```bash
# Start test services
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Install dependencies
npm run install:all

# Run database migrations
cd backend && npm run db:migrate

# Seed test data
cd backend && npm run db:seed
```

## Running Tests

### Using Test Runner (Recommended)

```bash
# Run all tests with full setup
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Skip setup/cleanup for faster iteration
npm run test:quick
```

### Manual Test Execution

**Backend Tests:**

```bash
cd backend

# Unit tests
npm test -- --testPathPattern=unit

# Integration tests
npm test -- --testPathPattern=integration

# Specific test file
npm test -- auth.api.test.ts

# With coverage
npm run test:coverage
```

**Frontend Tests:**

```bash
cd frontend

# Unit tests
npm test -- --run

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Specific E2E test
npx playwright test auth.spec.ts

# With UI mode
npm run test:e2e:ui
```

## Test Configuration

### Backend Test Configuration

**Jest Configuration** (`backend/jest.config.js`):

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/__tests__/**"],
};
```

### Frontend Test Configuration

**Vitest Configuration** (`frontend/vitest.config.ts`):

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

**Playwright Configuration** (`frontend/playwright.config.ts`):

```typescript
export default defineConfig({
  testDir: "./src/test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
});
```

## Test Data Management

### Database Seeding

Test data is automatically seeded before tests run:

- Test users (owner and visitor roles)
- Sample notes with various categories and tags
- Sample comments
- Test categories and tags

### Test Isolation

Each test suite:

- Uses isolated test database
- Cleans up data after execution
- Uses transactions for data consistency
- Mocks external services

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: |
            backend/coverage/
            frontend/coverage/
            frontend/playwright-report/
```

## Test Reports

After running tests, reports are generated:

### Coverage Reports

- **Backend**: `backend/coverage/lcov-report/index.html`
- **Frontend**: `frontend/coverage/index.html`

### E2E Test Reports

- **Playwright**: `frontend/playwright-report/index.html`

### Viewing Reports

```bash
# Open backend coverage
open backend/coverage/lcov-report/index.html

# Open frontend coverage
open frontend/coverage/index.html

# Open E2E report
npx playwright show-report
```

## Debugging Tests

### Backend Test Debugging

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with debugging
npm test -- --testNamePattern="should authenticate user" --verbose

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend Test Debugging

```bash
# Run tests in watch mode
npm run test:watch

# Debug E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npx playwright test --headed

# Debug specific test
npx playwright test --debug auth.spec.ts
```

## Common Issues and Solutions

### 1. Port Conflicts

```bash
# Check what's using ports
lsof -i :3001
lsof -i :5173
lsof -i :5432

# Kill processes if needed
kill -9 <PID>
```

### 2. Database Connection Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && npm run db:migrate
```

### 3. Cache Issues

```bash
# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# Restart Redis
docker-compose restart redis
```

### 4. Test Timeouts

- Increase timeout in test configuration
- Check if services are running
- Verify network connectivity

### 5. Authentication Test Failures

- Verify OAuth provider configuration
- Check environment variables
- Ensure test users exist in database

## Performance Testing

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

### Memory Leak Detection

```bash
# Run tests with memory monitoring
node --inspect --expose-gc node_modules/.bin/jest --runInBand --logHeapUsage
```

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should explain what they test
3. **Test One Thing**: Each test should verify one specific behavior
4. **Use Test Data Builders**: Create reusable test data factories
5. **Mock External Dependencies**: Don't rely on external services

### Test Organization

1. **Group Related Tests**: Use `describe` blocks effectively
2. **Setup and Teardown**: Use `beforeEach`/`afterEach` for common setup
3. **Shared Utilities**: Extract common test utilities
4. **Test Categories**: Organize tests by feature/component

### Maintenance

1. **Keep Tests Updated**: Update tests when features change
2. **Remove Obsolete Tests**: Delete tests for removed features
3. **Monitor Test Performance**: Keep test execution time reasonable
4. **Review Test Coverage**: Aim for meaningful coverage, not just high percentages

## Contributing to Tests

When adding new features:

1. **Write Tests First**: Consider TDD approach
2. **Cover Happy Path**: Test the main functionality
3. **Cover Edge Cases**: Test error conditions and boundaries
4. **Test User Interactions**: Include E2E tests for user-facing features
5. **Update Documentation**: Keep this guide updated

## Support

For testing-related issues:

1. Check this documentation
2. Review existing test examples
3. Check CI/CD logs for failures
4. Create an issue with test failure details

## Test Metrics

Target metrics for the test suite:

- **Code Coverage**: >80% for critical paths
- **Test Execution Time**: <10 minutes for full suite
- **Test Reliability**: <1% flaky test rate
- **E2E Coverage**: All critical user journeys tested
