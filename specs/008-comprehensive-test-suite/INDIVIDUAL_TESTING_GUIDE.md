# Individual Testing Guide

## Overview

This guide explains how to test components, IPC handlers, and features individually without manual intervention. All tests are designed to be independent and runnable in isolation.

## Core Principle: Test Independence

Every test:
- ✅ Has its own isolated test database
- ✅ Sets up its own state
- ✅ Cleans up after itself
- ✅ Can run without other tests
- ✅ Provides detailed debugging information

## Running Individual Tests

### 1. Test a Single IPC Handler

```bash
# Test environment handlers
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts

# Test a specific handler within the file
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts --grep "env:test"

# Test with debugging (opens Playwright Inspector)
npm run test:electron:debug -- tests/integration/ipc-handlers/env-handlers.spec.ts

# Test with visible browser
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts --headed

# Test with slow motion (see each step)
npm run test:electron -- tests/integration/ipc-handlers/env-handlers.spec.ts --headed --slow-mo=1000
```

### 2. Test a Single Component

```bash
# Test CollectionHierarchy component
npm run test:electron -- tests/integration/components/collection-hierarchy.spec.ts

# Test RequestBuilder component
npm run test:electron -- tests/integration/components/request-builder.spec.ts

# Test with specific test case
npm run test:electron -- tests/integration/components/collection-hierarchy.spec.ts --grep "should render collections"
```

### 3. Test a Single Data Flow

```bash
# Test IPC to Database flow
npm run test:electron -- tests/integration/data-flow/ipc-to-db.spec.ts

# Test full cycle (UI → IPC → DB → UI)
npm run test:electron -- tests/integration/data-flow/full-cycle.spec.ts
```

### 4. Test a Single Rendering Scenario

```bash
# Test component rendering
npm run test:electron -- tests/integration/rendering/component-rendering.spec.ts

# Test state updates
npm run test:electron -- tests/integration/rendering/state-updates.spec.ts
```

### 5. Test a Category of Tests

```bash
# All IPC handler tests
npm run test:electron -- tests/integration/ipc-handlers/

# All rendering tests
npm run test:electron -- tests/integration/rendering/

# All data flow tests
npm run test:electron -- tests/integration/data-flow/

# All component tests
npm run test:electron -- tests/integration/components/
```

## Test Structure for Individual Execution

### Example: Testing `env:test` Handler Individually

```typescript
// tests/integration/ipc-handlers/env-handlers.spec.ts

test.describe('Environment IPC Handlers', () => {
  // This test runs independently - no dependencies on other tests
  test('env:test - should test environment connection', async ({ electronPage, testDbPath }) => {
    // 1. SETUP: Create test environment (isolated)
    const env = await electronPage.evaluate(async () => {
      return await window.electronAPI.env.save({
        name: 'test-env',
        displayName: 'Test Environment',
        variables: {
          base_url: 'https://jsonplaceholder.typicode.com'
        }
      });
    });
    
    // 2. EXECUTE: Test the handler
    const result = await electronPage.evaluate(async (envData) => {
      return await window.electronAPI.env.test(envData);
    }, env);
    
    // 3. VERIFY: Check results
    expect(result.success).toBe(true);
    expect(result.message).toContain('Connection');
    
    // 4. DEBUG: Automatic capture (only on failure)
    // Debug artifacts saved to: test-artifacts/env-test-should-test-environment-connection/
  });
  
  // Each test is independent - can run alone
  test('env:test - should handle invalid URL', async ({ electronPage, testDbPath }) => {
    // Independent test - doesn't depend on previous test
  });
});
```

### Example: Testing Component Rendering Individually

```typescript
// tests/integration/rendering/component-rendering.spec.ts

test('should render collection list after save', async ({ electronPage, testDbPath }) => {
  // 1. SETUP: Capture initial state
  const beforeState = await captureComponentState(electronPage, 'CollectionHierarchy');
  
  // 2. EXECUTE: Save collection via IPC
  const result = await electronPage.evaluate(async () => {
    return await window.electronAPI.collection.save({
      name: 'Test Collection',
      description: 'For rendering test',
      environments: []
    });
  });
  
  // 3. VERIFY: Component should re-render
  await electronPage.waitForTimeout(500); // Wait for React to update
  
  const afterState = await captureComponentState(electronPage, 'CollectionHierarchy');
  expect(afterState.collections.length).toBe(beforeState.collections.length + 1);
  
  // 4. VERIFY: DOM should update
  const collectionElement = electronPage.locator('text=Test Collection');
  await expect(collectionElement).toBeVisible();
});
```

## Debugging Individual Tests

### Automatic Debug Capture

When a test fails, debug information is automatically captured:

```
test-artifacts/
└── {test-name}/
    ├── console-logs.txt          # All console output
    ├── network-activity.json     # Network requests
    ├── react-state.json          # React component state
    ├── zustand-state.json        # Zustand store state
    ├── database-state.json       # Database contents
    ├── execution-trace.json      # Step-by-step execution
    ├── error-report.md           # Detailed error report
    └── screenshots/
        ├── 01-initial.png
        ├── 02-after-action.png
        └── 03-final.png
```

### Manual Debug Capture

You can also capture debug info manually in tests:

```typescript
test('my test', async ({ electronPage, testDbPath }) => {
  // ... test code ...
  
  // Capture debug info at any point
  await captureDebugInfo(electronPage, testDbPath, 'my-test-step');
});
```

## Test Development Workflow

### 1. Develop Feature
```bash
# Start dev server
npm run electron:dev
```

### 2. Write Test
```bash
# Create test file
touch tests/integration/ipc-handlers/my-handler.spec.ts
```

### 3. Test Individually
```bash
# Run your test
npm run test:electron -- tests/integration/ipc-handlers/my-handler.spec.ts --headed
```

### 4. Debug if Needed
```bash
# Run with debugger
npm run test:electron:debug -- tests/integration/ipc-handlers/my-handler.spec.ts
```

### 5. Check Debug Artifacts
```bash
# View error report
cat test-artifacts/my-handler-should-test-handler/error-report.md

# View screenshots
open test-artifacts/my-handler-should-test-handler/screenshots/
```

## Best Practices for Individual Testing

### ✅ DO

- Write independent tests (no shared state)
- Use isolated test databases
- Clean up after tests
- Provide clear test names
- Use descriptive error messages
- Capture debug info on failure

### ❌ DON'T

- Share state between tests
- Depend on test execution order
- Require manual setup
- Skip cleanup
- Use hardcoded values that might conflict

## Common Patterns

### Pattern 1: Test IPC Handler

```typescript
test('handler:method - should [description]', async ({ electronPage, testDbPath }) => {
  // Setup
  const setup = await createTestData(electronPage);
  
  // Execute
  const result = await electronPage.evaluate(async (data) => {
    return await window.electronAPI.handler.method(data);
  }, setup);
  
  // Verify
  expect(result).toMatchExpected();
  
  // Verify persistence
  const dbState = getDatabaseContents(testDbPath);
  expect(dbState).toMatchExpected();
});
```

### Pattern 2: Test Component Rendering

```typescript
test('should render [component] after [action]', async ({ electronPage, testDbPath }) => {
  // Capture before
  const before = await captureComponentState(electronPage, 'ComponentName');
  
  // Trigger action
  await triggerAction(electronPage);
  
  // Wait for update
  await waitForRender(electronPage);
  
  // Verify after
  const after = await captureComponentState(electronPage, 'ComponentName');
  expect(after).toMatchExpected(before);
});
```

### Pattern 3: Test Data Flow

```typescript
test('should complete flow: [description]', async ({ electronPage, testDbPath }) => {
  // UI Action
  await performUIAction(electronPage);
  
  // Verify IPC
  const ipcLogs = await captureIPCLogs(electronPage);
  expect(ipcLogs).toContain('expected-handler');
  
  // Verify DB
  const dbState = getDatabaseContents(testDbPath);
  expect(dbState).toMatchExpected();
  
  // Verify UI
  await expect(uiElement).toMatchExpected();
});
```

## Troubleshooting

### Test Fails with "electronAPI not available"

**Solution**: Ensure dev server is running:
```bash
npm run dev
```

### Test Times Out

**Solution**: Increase timeout or check for hanging operations:
```typescript
test.setTimeout(60000); // 60 seconds
```

### Test is Flaky

**Solution**: Add proper waits and ensure state is ready:
```typescript
await electronPage.waitForLoadState('networkidle');
await electronPage.waitForTimeout(500); // Wait for React
```

### Debug Info Not Captured

**Solution**: Check test artifacts directory:
```bash
ls -la test-artifacts/
```

## Summary

- ✅ All tests can run individually
- ✅ No manual setup required
- ✅ Automatic debug capture on failure
- ✅ Isolated test databases
- ✅ Clear error messages
- ✅ Detailed debugging information

This enables fast, confident development with immediate feedback on what's working and what's not.

