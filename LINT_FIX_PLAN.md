# ESLint Fix Plan - 25 Remaining Warnings

## Overview

This document outlines the plan to fix all 25 remaining ESLint warnings in the codebase.

## Warning Categories

### 1. Unused Variables (8 warnings)

**Pattern**: Variables defined but never used (`@typescript-eslint/no-unused-vars`)

#### Files to Fix:

- **src/hooks/useVariableResolution.ts** (lines 105, 132, 170)
  - Line 105: `error` in catch block
  - Line 132: `error` in catch block
  - Line 170: `error` in catch block

- **src/hooks/useSessionRecovery.ts** (line 79)
  - Line 79: `error` in catch block

- **src/components/ui/json-editor.tsx** (lines 33, 70, 86)
  - Line 33: `e` parameter
  - Line 70: `e` parameter
  - Line 86: `e` parameter

- **src/pages/History.tsx** (lines 351, 365)
  - Line 351: `e` in catch block
  - Line 365: `e` in catch block

**Fix Strategy**:

- For catch blocks: Prefix with `_` (e.g., `_error`, `_e`) to indicate intentionally unused
- For parameters: Remove if truly unused, or prefix with `_`

---

### 2. React Hooks Exhaustive Deps (6 warnings)

**Pattern**: Missing dependencies in useEffect/useCallback hooks (`react-hooks/exhaustive-deps`)

#### Files to Fix:

- **src/components/ui/promote-request-dialog.tsx** (lines 62, 65)
  - Line 62: `useEffect` missing `loadData` dependency
  - Line 65: `useEffect` missing `loadData` dependency

- **src/components/ui/resize-handle.tsx** (line 44)
  - Line 44: `useCallback` missing `handleMouseMove` and `handleMouseUp` dependencies
  - **Note**: Already fixed with refs pattern, but warning may persist - verify fix

- **src/hooks/useEnvironmentOperations.ts** (line 143)
  - Line 143: `useCallback` missing `currentEnvironment?.id` dependency

- **src/hooks/useSessionRecovery.ts** (line 50)
  - Line 50: `useEffect` missing dependencies: `activeUnsavedRequestId`, `setCurrentPage`, `setSelectedRequest`, `setUnsavedRequests`

**Fix Strategy**:

- Add dependencies if safe (won't cause infinite loops)
- Add `eslint-disable-next-line react-hooks/exhaustive-deps` if dependencies are intentionally omitted
- Use refs pattern for callbacks that shouldn't be in dependency arrays

---

### 3. TypeScript Explicit Any (11 warnings)

**Pattern**: Using `any` type (`@typescript-eslint/no-explicit-any`)

#### Files to Fix:

- **src/components/ui/json-editor.tsx** (line 25)
  - Line 25: `any` type usage

- **src/hooks/useVariableResolution.ts** (lines 32, 35, 86)
  - Line 32: `any` type usage
  - Line 35: `any` type usage
  - Line 86: `any` type usage

- **src/hooks/useSessionRecovery.ts** (lines 26, 31)
  - Line 26: `any` type usage
  - Line 31: `any` type usage

- **src/hooks/useEnvironmentOperations.ts** (lines 41, 89, 90)
  - Line 41: `any` type usage
  - Line 89: `any` type usage
  - Line 90: `any` type usage

- **src/components/ui/promote-request-dialog.tsx** (line 78)
  - Line 78: `any` type usage

- **electron/services/api.ts** (line 9)
  - Line 9: `any` type usage

**Fix Strategy**:

- Replace with proper types where possible
- Use `unknown` and type guards for error handling
- Add `eslint-disable-next-line @typescript-eslint/no-explicit-any` if `any` is necessary (e.g., external library types)

---

## Detailed Fix Plan by File

### File 1: `src/hooks/useVariableResolution.ts`

**Warnings**: 5 total

- Line 105: Unused `error` variable
- Line 132: Unused `error` variable
- Line 170: Unused `error` variable
- Line 32: `any` type
- Line 35: `any` type
- Line 86: `any` type

**Actions**:

1. Prefix unused `error` variables with `_` in catch blocks
2. Replace `any` types with proper types or add ignore comments

---

### File 2: `src/hooks/useSessionRecovery.ts`

**Warnings**: 4 total

- Line 79: Unused `error` variable
- Line 50: Missing dependencies in useEffect
- Line 26: `any` type
- Line 31: `any` type

**Actions**:

1. Prefix unused `error` with `_`
2. Add missing dependencies or add ignore comment for useEffect
3. Replace `any` types with proper types

---

### File 3: `src/components/ui/json-editor.tsx`

**Warnings**: 4 total

- Line 33: Unused `e` parameter
- Line 70: Unused `e` parameter
- Line 86: Unused `e` parameter
- Line 25: `any` type

**Actions**:

1. Remove unused `e` parameters or prefix with `_`
2. Replace `any` type or add ignore comment

---

### File 4: `src/pages/History.tsx`

**Warnings**: 2 total

- Line 351: Unused `e` variable
- Line 365: Unused `e` variable

**Actions**:

1. Prefix unused `e` variables with `_` in catch blocks

---

### File 5: `src/components/ui/promote-request-dialog.tsx`

**Warnings**: 3 total

- Line 62: Missing `loadData` dependency
- Line 65: Missing `loadData` dependency
- Line 78: `any` type

**Actions**:

1. Add `loadData` to dependency arrays or add ignore comments
2. Replace `any` type or add ignore comment

---

### File 6: `src/components/ui/resize-handle.tsx`

**Warnings**: 1 total

- Line 44: Missing dependencies in useCallback

**Actions**:

1. Verify refs pattern fix is working, add ignore comment if needed

---

### File 7: `src/hooks/useEnvironmentOperations.ts`

**Warnings**: 4 total

- Line 143: Missing `currentEnvironment?.id` dependency
- Line 41: `any` type
- Line 89: `any` type
- Line 90: `any` type

**Actions**:

1. Add dependency or ignore comment for useCallback
2. Replace `any` types or add ignore comments

---

### File 8: `electron/services/api.ts`

**Warnings**: 1 total

- Line 9: `any` type

**Actions**:

1. Replace `any` type or add ignore comment

---

## Implementation Order

1. **Phase 1: Unused Variables** (8 fixes)
   - Quick wins, low risk
   - Files: useVariableResolution.ts, useSessionRecovery.ts, json-editor.tsx, History.tsx

2. **Phase 2: React Hooks Dependencies** (6 fixes)
   - Requires careful testing
   - Files: promote-request-dialog.tsx, resize-handle.tsx, useEnvironmentOperations.ts, useSessionRecovery.ts

3. **Phase 3: TypeScript Any Types** (11 fixes)
   - May require type definitions
   - Files: All files with `any` usage

## Testing Strategy

After each phase:

1. Run `npm run type-check` - ensure no TypeScript errors
2. Run `npm run lint` - verify warnings are reduced
3. Run `npm run electron:dev` - verify app still works
4. Test affected functionality manually

## Success Criteria

- ✅ Zero ESLint warnings (excluding tests, specs, node_modules)
- ✅ Zero TypeScript compilation errors
- ✅ Application runs without errors
- ✅ All functionality works as expected

## Notes

- Some `any` types may be necessary for external library compatibility (e.g., Monaco Editor)
- Some React hooks dependencies may be intentionally omitted to prevent infinite loops
- Use `eslint-disable-next-line` comments sparingly and document why
