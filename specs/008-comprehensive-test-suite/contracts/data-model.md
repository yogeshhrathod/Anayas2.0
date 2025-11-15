# Test Suite Data Models

## Test Database Structure

Test databases use the same schema as production:

```typescript
interface TestDatabase {
  environments: Environment[];
  collections: Collection[];
  folders: Folder[];
  requests: Request[];
  request_history: RequestHistory[];
  unsaved_requests: UnsavedRequest[];
  presets: Preset[];
  settings: Settings;
}
```

## Debug Artifact Structure

```typescript
interface DebugArtifacts {
  testName: string;
  timestamp: string;
  duration: number;
  status: 'passed' | 'failed';
  consoleLogs: ConsoleLog[];
  networkActivity: NetworkRequest[];
  reactState: Record<string, any>;
  zustandState: Record<string, any>;
  databaseState: TestDatabase;
  executionTrace: ExecutionStep[];
  screenshots: string[];
  errorReport?: ErrorReport;
}

interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
  source: 'renderer' | 'main';
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: string;
}

interface ExecutionStep {
  step: string;
  timestamp: string;
  data?: any;
}

interface ErrorReport {
  error: {
    message: string;
    stack: string;
  };
  context: {
    testName: string;
    step: string;
    state: DebugArtifacts;
  };
  rootCauseAnalysis: string;
  suggestedFixes: string[];
}
```

## Test Fixture Structure

```typescript
interface ElectronFixtures {
  electronPage: Page;
  testDbPath: string;
  debugHelpers: DebugHelpers;
  logger: TestLogger;
}
```

## Test Organization Structure

```
tests/integration/
├── ipc-handlers/          # IPC handler tests
│   ├── env-handlers.spec.ts
│   ├── collection-handlers.spec.ts
│   └── ...
├── rendering/            # Rendering verification
│   ├── component-rendering.spec.ts
│   └── ...
├── data-flow/            # Data flow tests
│   ├── ipc-to-db.spec.ts
│   └── ...
├── components/           # Component integration
│   ├── collection-hierarchy.spec.ts
│   └── ...
└── performance/          # Performance tests
    ├── large-datasets.spec.ts
    └── ...
```

## Test Execution Flow

```
1. Test Setup
   ├── Create isolated test database
   ├── Initialize mock electronAPI
   ├── Navigate to app
   └── Setup debug capture

2. Test Execution
   ├── Execute test steps
   ├── Capture state at each step
   ├── Verify assertions
   └── Log execution trace

3. Test Teardown
   ├── Capture final state
   ├── Generate debug artifacts (if failed)
   ├── Clean up test database
   └── Clean up resources
```

## IPC Handler Test Structure

Each IPC handler test follows this pattern:

```typescript
test('handler-name - should [description]', async ({ electronPage, testDbPath }) => {
  // 1. Setup
  const beforeState = await captureState(electronPage, testDbPath);
  
  // 2. Execute
  const result = await electronPage.evaluate(async () => {
    return await window.electronAPI.handler.method(...args);
  });
  
  // 3. Verify
  expect(result).toMatchExpected();
  const afterState = await captureState(electronPage, testDbPath);
  expect(afterState).toMatchExpected();
  
  // 4. Debug (automatic on failure)
  await captureDebugInfo(electronPage, testDbPath, 'handler-name');
});
```

## Rendering Test Structure

Each rendering test follows this pattern:

```typescript
test('should render [component] after [action]', async ({ electronPage, testDbPath }) => {
  // 1. Capture initial render state
  const beforeRender = await captureComponentState(electronPage, 'ComponentName');
  
  // 2. Trigger action (IPC call or UI interaction)
  await triggerAction(electronPage);
  
  // 3. Wait for re-render
  await waitForRender(electronPage);
  
  // 4. Verify render updated
  const afterRender = await captureComponentState(electronPage, 'ComponentName');
  expect(afterRender).toMatchExpected();
  
  // 5. Verify DOM updated
  await expect(element).toBeVisible();
  
  // 6. Debug (automatic on failure)
  await captureDebugInfo(electronPage, testDbPath, 'rendering');
});
```

## Data Flow Test Structure

Each data flow test follows this pattern:

```typescript
test('should complete flow: [description]', async ({ electronPage, testDbPath }) => {
  // 1. UI Action
  await performUIAction(electronPage);
  
  // 2. Verify IPC called
  const ipcLogs = await captureIPCLogs(electronPage);
  expect(ipcLogs).toContain('expected-handler');
  
  // 3. Verify database updated
  const dbState = getDatabaseContents(testDbPath);
  expect(dbState).toMatchExpected();
  
  // 4. Verify UI updated
  await expect(uiElement).toMatchExpected();
  
  // 5. Verify store updated
  const storeState = await captureZustandState(electronPage);
  expect(storeState).toMatchExpected();
  
  // 6. Debug (automatic on failure)
  await generateFullCycleReport(electronPage, testDbPath);
});
```
