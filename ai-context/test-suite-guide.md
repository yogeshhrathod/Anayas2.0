# Test Suite Guide

## Overview

This project has a comprehensive test suite with **223+ tests** covering IPC handlers, components, data flows, rendering, and performance. This guide helps you utilize the test suite when implementing new features using **Test-Driven Development (TDD)** and **Behavior-Driven Development (BDD)** principles.

## Test Suite Statistics

- **Total Test Files**: 35
- **Total Test Cases**: 223+
- **IPC Handler Coverage**: 100% (53 handlers, 68 tests)
- **Component Integration**: 100% (4 components, 21 tests)
- **Performance Tests**: 14 tests
- **Data Flow Tests**: Complete coverage
- **Rendering Tests**: Complete coverage

## Test Suite Structure

### 1. IPC Handler Tests (`tests/integration/ipc-handlers/`)

**Purpose**: Test each IPC handler individually with success and error cases

**Files**:

- `env-handlers.spec.ts` - Environment handlers (7 handlers)
- `collection-handlers.spec.ts` - Collection handlers (9 handlers)
- `request-handlers.spec.ts` - Request handlers (7 handlers)
- `folder-handlers.spec.ts` - Folder handlers (3 handlers)
- `unsaved-request-handlers.spec.ts` - Unsaved request handlers (5 handlers)
- `preset-handlers.spec.ts` - Preset handlers (3 handlers)
- `curl-handlers.spec.ts` - cURL handlers (3 handlers)
- `file-handlers.spec.ts` - File handlers (5 handlers)
- `window-handlers.spec.ts` - Window handlers (4 handlers)
- `notification-handlers.spec.ts` - Notification handlers (1 handler)
- `settings-handlers.spec.ts` - Settings handlers (4 handlers)
- `app-handlers.spec.ts` - App handlers (2 handlers)

**Pattern to Follow**:

```typescript
import { test, expect } from '../../helpers/electron-fixtures';
import { assertDataPersisted } from '../../helpers/assertions';

test.describe('Category IPC Handlers', () => {
  test('handler:action - should [expected behavior]', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Setup
    const data = await electronPage.evaluate(async () => {
      return await window.electronAPI.handler.action(/* params */);
    });

    // THEN: Verify
    expect(data.success).toBe(true);
    assertDataPersisted(data, testDbPath, 'collection');
  });
});
```

### 2. Component Integration Tests (`tests/integration/components/`)

**Purpose**: Test React components with IPC integration

**Files**:

- `collection-hierarchy.spec.ts` - CollectionHierarchy component (5 tests)
- `request-builder.spec.ts` - RequestBuilder component (5 tests)
- `environment-switcher.spec.ts` - EnvironmentSwitcher component (5 tests)
- `sidebar.spec.ts` - Sidebar component (6 tests)

**Pattern to Follow**:

```typescript
test.describe('Component Integration', () => {
  test('should render component with data', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Setup data
    await electronPage.evaluate(async () => {
      await window.electronAPI.collection.save({
        /* ... */
      });
    });

    // WHEN: Navigate to component
    await electronPage.goto('/');
    await electronPage.click('text=Collections');

    // THEN: Verify component renders
    const componentVisible = await electronPage
      .locator('text=Collection')
      .isVisible();
    expect(componentVisible).toBe(true);
  });
});
```

### 3. Data Flow Tests (`tests/integration/data-flow/`)

**Purpose**: Verify complete data flow from UI to database and back

**Files**:

- `ipc-to-db.spec.ts` - IPC → Database flow
- `db-to-ui.spec.ts` - Database → UI flow
- `ui-to-ipc.spec.ts` - UI → IPC flow
- `full-cycle.spec.ts` - Complete UI → IPC → DB → UI cycle

### 4. Rendering Tests (`tests/integration/rendering/`)

**Purpose**: Verify UI components render and update correctly

**Files**:

- `component-rendering.spec.ts` - Component rendering
- `state-updates.spec.ts` - State updates
- `loading-states.spec.ts` - Loading states
- `error-states.spec.ts` - Error states

### 5. Performance Tests (`tests/integration/performance/`)

**Purpose**: Test performance with large datasets and concurrent operations

**Files**:

- `large-datasets.spec.ts` - 1000+ items (4 tests)
- `concurrent-ops.spec.ts` - Concurrent operations (5 tests)
- `memory-leaks.spec.ts` - Memory leak detection (5 tests)

## BDD (Behavior-Driven Development) Approach

### Writing BDD Scenarios

When writing feature specs, format acceptance criteria as BDD scenarios:

```markdown
### Scenario: User creates a new collection

**Given** I am on the Collections page
**When** I click "New Collection" button
**And** I fill in the collection name "My API Collection"
**And** I click "Save"
**Then** the collection should be created
**And** it should appear in the collection list
**And** it should be persisted to the database
```

### Converting BDD to Tests

Each BDD scenario becomes a test case:

```typescript
test('should create new collection when form is submitted', async ({
  electronPage,
  testDbPath,
}) => {
  // GIVEN: I am on the Collections page
  await electronPage.goto('/');
  await electronPage.click('text=Collections');
  await electronPage.waitForLoadState('networkidle');

  // WHEN: I click "New Collection" button
  await electronPage.click('button:has-text("New Collection")');
  await electronPage.waitForTimeout(500);

  // AND: I fill in the collection name
  await electronPage.fill('input#name', 'My API Collection');

  // AND: I click "Save"
  await electronPage.click('button:has-text("Save")');
  await electronPage.waitForTimeout(1000);

  // THEN: the collection should be created
  const collectionVisible = await electronPage
    .locator('text=My API Collection')
    .isVisible();
  expect(collectionVisible).toBe(true);

  // AND: it should appear in the collection list
  const collections = await electronPage.evaluate(async () => {
    return await window.electronAPI.collection.list();
  });
  expect(collections.some((c: any) => c.name === 'My API Collection')).toBe(
    true
  );

  // AND: it should be persisted to the database
  const dbContents = getDatabaseContents(testDbPath);
  const collection = dbContents.collections.find(
    (c: any) => c.name === 'My API Collection'
  );
  expect(collection).toBeDefined();
});
```

## Test-Driven Development (TDD) Workflow

### Red-Green-Refactor Cycle

1. **RED**: Write failing test first

   ```typescript
   test('should create new feature', async ({ electronPage, testDbPath }) => {
     // Test for feature that doesn't exist yet
     const result = await electronPage.evaluate(async () => {
       return await window.electronAPI.newFeature.create({
         /* ... */
       });
     });
     expect(result.success).toBe(true);
   });
   ```

2. **GREEN**: Implement feature to make test pass

   ```typescript
   // Implement the feature
   ipcMain.handle('new-feature:create', async (_, data) => {
     // Implementation
     return { success: true };
   });
   ```

3. **REFACTOR**: Improve code while keeping tests green
   ```typescript
   // Refactor implementation
   // Run tests - should still pass
   ```

## Using Test Suite for New Features

### Step 1: During SPEC Phase

1. **Write BDD scenarios** in `spec.md` acceptance criteria
2. **Identify test categories** needed:
   - New IPC handlers? → IPC handler tests
   - New components? → Component integration tests
   - New data flows? → Data flow tests
   - Performance critical? → Performance tests

### Step 2: During PLAN Phase

1. **List test files to create** in `plan.md`
2. **Reference existing test patterns**:
   - Similar IPC handler? → Copy pattern from existing handler test
   - Similar component? → Copy pattern from existing component test
3. **Plan test data setup**:
   - What data needs to be created?
   - What initial state is needed?

### Step 3: During IMPLEMENT Phase

1. **Write tests FIRST** (TDD):

   ```typescript
   // Create test file before implementation
   // Write test for new handler/component
   // Run test - should fail (RED)
   ```

2. **Implement feature**:

   ```typescript
   // Implement handler/component
   // Run test - should pass (GREEN)
   ```

3. **Refactor**:

   ```typescript
   // Improve code
   // Run test - should still pass
   ```

4. **Add edge cases**:
   ```typescript
   // Test error cases
   // Test empty data
   // Test invalid input
   ```

### Step 4: After Implementation

1. **Run all tests**: `npm run test:electron -- tests/integration/`
2. **Verify coverage**: All acceptance criteria have tests
3. **Check for regressions**: Existing tests should still pass
4. **Update documentation**: Add test examples if needed

## Test Helpers Reference

### electron-fixtures.ts

Provides test fixtures:

- `electronPage`: Playwright page with mocked electronAPI
- `testDbPath`: Isolated test database path

```typescript
test('should test feature', async ({ electronPage, testDbPath }) => {
  // electronPage has window.electronAPI available
  // testDbPath is isolated per test
});
```

### assertions.ts

Custom assertions:

- `assertRendered(page, selector)` - Verify element rendered
- `assertDataPersisted(data, dbPath, collection)` - Verify data persisted
- `assertUIUpdated(page, selector, expectedText)` - Verify UI updated
- `assertDatabaseCount(dbPath, collection, expectedCount)` - Verify count

```typescript
import {
  assertDataPersisted,
  assertDatabaseCount,
} from '../../helpers/assertions';

assertDataPersisted(collection, testDbPath, 'collections');
assertDatabaseCount(testDbPath, 'collections', 1);
```

### debug-helpers.ts

Debugging utilities:

- `captureConsoleLogs(page)` - Capture console output
- `captureNetworkActivity(page)` - Track network requests
- `captureZustandState(page)` - Get Zustand store state
- `generateErrorReport(error, context, testName, artifactsDir)` - Generate error report

```typescript
import {
  captureDebugInfo,
  generateErrorReport,
} from '../../helpers/debug-helpers';

const debugInfo = await captureDebugInfo(
  electronPage,
  testDbPath,
  'step-name',
  'artifacts-dir'
);
```

### test-db.ts

Test database utilities:

- `createTestDatabase(options)` - Create isolated test database
- `getDatabaseContents(dbPath)` - Read database contents
- `cleanTestDatabase(dbPath)` - Clean up test database

```typescript
import { getDatabaseContents } from '../../helpers/test-db';

const dbContents = getDatabaseContents(testDbPath);
const collection = dbContents.collections.find((c: any) => c.id === id);
```

### logger.ts

Test logging:

- `logger.init(testName, artifactsDir)` - Initialize logger
- `logger.info(message, metadata)` - Log info
- `logger.logPerformance(operation, duration)` - Log performance
- `logger.logMemory(operation)` - Log memory usage

```typescript
import { logger } from '../../helpers/logger';

logger.init('test-name', 'artifacts-dir');
logger.logPerformance('Create collection', 150);
logger.logMemory('After operation');
```

## Common Test Patterns

### Pattern 1: IPC Handler Test

```typescript
test.describe('NewCategory IPC Handlers', () => {
  test('new-category:action - should perform action', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Setup
    const setup = await electronPage.evaluate(async () => {
      return await window.electronAPI.setup.create({
        /* ... */
      });
    });

    // WHEN: Perform action
    const result = await electronPage.evaluate(async id => {
      return await window.electronAPI.newCategory.action(id, {
        /* ... */
      });
    }, setup.id);

    // THEN: Verify
    expect(result.success).toBe(true);
    assertDataPersisted(result, testDbPath, 'collection');
  });

  test('new-category:action - should handle error', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Invalid input
    // WHEN: Perform action
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.newCategory.action(null, {
        /* invalid */
      });
    });

    // THEN: Should return error
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Pattern 2: Component Integration Test

```typescript
test.describe('NewComponent Component Integration', () => {
  test('should render component with data', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Setup data
    await electronPage.evaluate(async () => {
      await window.electronAPI.data.create({
        /* ... */
      });
    });

    // WHEN: Navigate to component
    await electronPage.goto('/');
    await electronPage.click('text=Page');
    await electronPage.waitForLoadState('networkidle');

    // THEN: Component should render
    const component = electronPage.locator('[data-testid="new-component"]');
    await component.waitFor({ state: 'visible', timeout: 5000 });
    expect(await component.isVisible()).toBe(true);
  });

  test('should handle user interaction', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Component is rendered
    // ... setup ...

    // WHEN: User interacts
    await electronPage.click('button:has-text("Action")');
    await electronPage.waitForTimeout(500);

    // THEN: Component should update
    const updated = await electronPage.locator('text=Updated').isVisible();
    expect(updated).toBe(true);
  });
});
```

### Pattern 3: Data Flow Test

```typescript
test.describe('Data Flow: New Feature', () => {
  test('should complete full cycle: UI → IPC → DB → UI', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Initial state
    await electronPage.goto('/');

    // WHEN: UI action triggers IPC
    await electronPage.click('button:has-text("Create")');
    await electronPage.fill('input#name', 'Test Item');
    await electronPage.click('button:has-text("Save")');
    await electronPage.waitForTimeout(1000);

    // THEN: Data persisted to DB
    const dbContents = getDatabaseContents(testDbPath);
    const item = dbContents.items.find((i: any) => i.name === 'Test Item');
    expect(item).toBeDefined();

    // AND: UI updated
    const itemVisible = await electronPage
      .locator('text=Test Item')
      .isVisible();
    expect(itemVisible).toBe(true);
  });
});
```

### Pattern 4: Performance Test

```typescript
test.describe('Performance: New Feature', () => {
  test('should handle large dataset efficiently', async ({
    electronPage,
    testDbPath,
  }) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    logger.logMemory('Initial state');

    // GIVEN: Create large dataset
    await electronPage.evaluate(async () => {
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(
          window.electronAPI.feature.create({
            /* ... */
          })
        );
      }
      await Promise.all(promises);
    });

    const duration = Date.now() - startTime;
    const memoryDelta =
      (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;
    logger.logPerformance('Create 1000 items', duration);
    logger.logMemory('After operation');

    // THEN: Should complete in reasonable time
    expect(duration).toBeLessThan(30000); // <30s
    expect(memoryDelta).toBeLessThan(500); // <500MB
  });
});
```

## Test Execution Commands

### Run All Tests

```bash
npm run test:electron -- tests/integration/
```

### Run Specific Category

```bash
# IPC handlers
npm run test:electron -- tests/integration/ipc-handlers/

# Components
npm run test:electron -- tests/integration/components/

# Performance
npm run test:electron -- tests/integration/performance/
```

### Run Specific Test File

```bash
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts
```

### Run Single Test

```bash
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts --grep "env:save"
```

### Debug Mode

```bash
# Headed mode (see browser)
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts --headed

# Slow motion (for debugging)
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts --headed --slow-mo=1000

# Playwright Inspector (step through test)
npm run test:electron:debug -- tests/integration/ipc-handlers/env-handlers.spec.ts
```

### Viewing Test Artifacts

#### Screenshots

Screenshots are automatically saved in `test-artifacts/` directory for failed tests:

- `test-failed-1.png` - Screenshot at failure point
- `diagnostics-screenshot.png` - Additional diagnostic screenshot
- Test-specific screenshots in subdirectories

View screenshots:

```bash
open test-artifacts/*.png
```

#### Videos

Videos are recorded for failed tests and saved as `video.webm` files in test artifact directories. These show the full test execution leading to the failure.

#### HTML Report

After running tests, view the comprehensive HTML report:

```bash
npx playwright show-report
```

The report shows:

- Test results summary
- Pass/fail status
- Execution time
- Screenshots and videos
- Error messages and stack traces

#### Test Artifacts Directory Structure

```
test-artifacts/
├── [test-name]-[hash]-electron/
│   ├── test-failed-1.png
│   ├── test-failed-2.png
│   ├── video.webm
│   ├── error-context.md
│   ├── console-logs.txt
│   └── attachments/
│       ├── app-state.json
│       └── console-logs-*.txt
```

### Debugging Tips

1. **Check Screenshots**: View screenshots to see what the UI looked like when the test failed

   ```bash
   open test-artifacts/*.png
   ```

2. **Run with Slower Actions**: Add `--slow-mo=1000` to slow down actions and see each step

   ```bash
   npm run test:electron -- tests/integration/ui-interactions.spec.ts --headed --slow-mo=1000
   ```

3. **Use Playwright Inspector**: Step through the test execution

   ```bash
   npm run test:electron:debug -- tests/integration/ui-interactions.spec.ts
   ```

4. **Check Console Logs**: Test artifacts include console logs showing what happened during execution

5. **View Error Context**: Each failed test creates an `error-context.md` file with detailed debugging information

### Test Independence

Every test is designed to be independent:

- ✅ Has its own isolated test database
- ✅ Sets up its own state
- ✅ Cleans up after itself
- ✅ Can run without other tests
- ✅ Provides detailed debugging information

This means you can run any test individually without dependencies on other tests.

## Completion Requirements

### CRITICAL: No Completion Without Tests

**NO EXCEPTIONS - NO EXCUSES - THIS IS NON-NEGOTIABLE**

Before marking ANY task or feature as `completed`:

1. **MANDATORY**: Run all tests: `npm run test:electron -- tests/integration/`
2. **MANDATORY**: Verify ALL tests pass - no failures allowed
3. **MANDATORY**: Verify no regressions - existing tests must still pass
4. **MANDATORY**: Verify test coverage - all acceptance criteria have tests
5. **MANDATORY**: Fix any failing tests - do not mark complete until fixed

**Completion Checklist (ALL must be checked):**

- [ ] All tests written for the feature/task
- [ ] All tests passing: `npm run test:electron -- tests/integration/`
- [ ] No test regressions (existing tests still pass)
- [ ] Test coverage verified (100% for IPC handlers, integration tests for components)
- [ ] All acceptance criteria have corresponding tests
- [ ] Performance tests pass (if applicable)
- [ ] Only then mark task/feature as `completed`

**If tests fail:**

- **DO NOT** mark as complete
- **DO NOT** update status to `completed`
- **FIX THE TESTS** or fix the implementation
- **RE-RUN TESTS** until all pass
- **THEN** mark as complete

**If tests are not written:**

- **DO NOT** mark as complete
- **WRITE THE TESTS FIRST**
- **RUN THE TESTS**
- **VERIFY THEY PASS**
- **THEN** mark as complete

## Best Practices

1. **Write tests first** (TDD) - Red-Green-Refactor
2. **Use BDD format** - Given-When-Then structure
3. **Follow existing patterns** - Reference similar tests
4. **Test independently** - No shared state
5. **Test edge cases** - Empty, invalid, error cases
6. **Verify persistence** - Check database
7. **Test UI updates** - Verify components update
8. **Keep tests fast** - <30s per test
9. **Use descriptive names** - Clear test names
10. **Run tests frequently** - Before and after changes
11. **NEVER mark complete without tests** - This is non-negotiable

## References

- Test Suite Spec: `specs/008-comprehensive-test-suite/spec.md`
- Test Helpers: `tests/helpers/`
- Test Utilities: `tests/utils/`
- Existing Tests: `tests/integration/`
- Cursor Rules: `.cursor/rules/test-driven-development.mdc`
- Test Review: `tests/INTEGRATION_TEST_REVIEW.md` - Known issues, fixes, and missing coverage
- Performance Testing: `specs/003-performance-optimization-lazy-loading/TESTING_GUIDE.md` - Performance-specific testing guide
