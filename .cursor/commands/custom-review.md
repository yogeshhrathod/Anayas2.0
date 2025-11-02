# PR Review Guidelines

## Focus on Diff Only
- Review **only** the changed files and lines
- Ignore unrelated code that was already present
- Verify changes address the stated issue/feature

## Solution Analysis

### Correctness
- ✅ Does the solution actually solve the problem?
- ✅ Are edge cases handled appropriately?
- ✅ Are error cases covered?
- ✅ Does it align with existing architecture patterns?
- ✅ Are there any logical flaws or bugs?

### Code Quality
- ✅ Is the code well-written and maintainable?
- ✅ Are functions/classes properly scoped and sized?
- ✅ Is there unnecessary complexity or over-engineering?
- ✅ Are naming conventions clear and consistent?
- ✅ Is the code DRY (Don't Repeat Yourself)?

## Coding Practices Checklist

### TypeScript/Type Safety
- ✅ Types are properly defined and used
- ✅ No `any` types unless absolutely necessary
- ✅ Interfaces/types match actual usage

### Architecture Patterns
- ✅ Follows existing IPC patterns (`electron/preload.ts`, `electron/ipc/handlers.ts`)
- ✅ State management follows Zustand patterns (`src/store/useStore.ts`)
- ✅ Proper separation: UI state vs IPC contracts
- ✅ Uses Winston logger for background services (not `console.log`)

### React/Best Practices
- ✅ Proper hook usage and dependencies
- ✅ No unnecessary re-renders
- ✅ Component composition over duplication
- ✅ Proper error boundaries and handling

### Electron-Specific
- ✅ All renderer-to-main communication via `window.electronAPI`
- ✅ No direct `ipcRenderer` access from React
- ✅ Node integration remains disabled
- ✅ Data persisted through JSON DB helpers when needed

## Documentation Review

- ✅ **README.md** updated if:
  - New features added
  - Workflow changes
  - New dependencies or setup steps
  
- ✅ **Code comments** added for:
  - Complex logic
  - Non-obvious decisions
  - Edge cases handled

- ✅ **Type definitions** updated:
  - `src/types/` files updated if new entities added
  - Preload API types updated in `electron/preload.ts`

## Quick Checklist

```
[ ] Diff only - changes are focused and relevant
[ ] Solution solves the problem correctly
[ ] Code is clean and follows patterns
[ ] Types are properly defined
[ ] IPC/preload patterns followed (Electron)
[ ] State management patterns followed (Zustand)
[ ] Logging uses Winston (not console.log)
[ ] Error handling present
[ ] Documentation updated (if needed)
[ ] Type-check passes (`npm run type-check`)
```

