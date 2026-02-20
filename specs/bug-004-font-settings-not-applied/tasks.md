# Task Breakdown: Fix Font Settings Not Applied

**Bug ID**: `bug-004-font-settings-not-applied`  
**Status**: `resolved`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks organized by implementation phase.

---

## Phase 1: Enhance FontProvider

### Task 1.1: Add Font Constants File

- **File**: `src/constants/fonts.ts` (new)
- **Description**: Create centralized font defaults:
  - `export const DEFAULT_UI_FONT_STACK = 'system-ui, sans-serif'`
  - `export const DEFAULT_CODE_FONT_STACK = 'Menlo, Monaco, Courier New, monospace'`
- **Dependencies**: None
- **Acceptance**: Constants file created and exported
- **Status**: `completed`

### Task 1.2: Add Robust Value Validation

- **File**: `src/components/providers/FontProvider.tsx`
- **Description**: Add proper validation:
  - Check if value is string
  - Trim whitespace
  - Check length > 0
  - Fallback to defaults if invalid
- **Dependencies**: Task 1.1
- **Acceptance**: All edge cases handled
- **Status**: `completed`

### Task 1.3: Add CSS Variable Updates

- **File**: `src/components/providers/FontProvider.tsx`
- **Description**: Update CSS variables:
  - `document.documentElement.style.setProperty('--font-ui', ...)`
  - `document.documentElement.style.setProperty('--font-code', ...)`
  - Apply to body element
- **Dependencies**: Task 1.2
- **Acceptance**: CSS variables update correctly
- **Status**: `completed`

### Task 1.4: Add Dynamic Style Injection

- **File**: `src/components/providers/FontProvider.tsx`
- **Description**: Inject dynamic styles:
  - Create/update style element
  - Add !important rules for font families
  - Target body, .font-sans, .font-mono, Monaco editor
- **Dependencies**: Task 1.3
- **Acceptance**: Fonts applied with !important
- **Status**: `completed`

### Task 1.5: Test FontProvider

- **Description**: Test all scenarios:
  - Valid font string
  - Empty string
  - Undefined/null
  - Whitespace only
  - Special characters
- **Dependencies**: Tasks 1.1-1.4
- **Acceptance**: All scenarios work correctly
- **Status**: `completed`

**Checkpoint**: FontProvider robust and working

---

## Phase 2: Implement Live Preview

### Task 2.1: Update Settings State Management

- **File**: `src/pages/Settings.tsx`
- **Description**: Update `updateSetting` function:
  - Keep local state for form
  - For font settings, update Zustand store immediately
  - Trim values before updating
  - Handle empty values
- **Dependencies**: Phase 1
- **Acceptance**: Live preview works
- **Status**: `completed`

### Task 2.2: Add Debounced Database Save

- **File**: `src/pages/Settings.tsx`
- **Description**: Debounce saves:
  - Auto-save after 500ms of inactivity
  - Don't save on every keystroke
  - Show save status
- **Dependencies**: Task 2.1
- **Acceptance**: Saves happen efficiently
- **Status**: `completed`

### Task 2.3: Test Live Preview

- **Description**: Test immediate updates:
  - Type in font input → UI updates immediately
  - Change UI font → see changes in real-time
  - Change code font → see changes in real-time
  - Empty input → revert to defaults
- **Dependencies**: Tasks 2.1-2.2
- **Acceptance**: Live preview works perfectly
- **Status**: `completed`

**Checkpoint**: Live preview working

---

## Phase 3: Add Database Defaults

### Task 3.1: Create ensureFontSettingsDefaults Function

- **File**: `electron/database/json-db.ts`
- **Description**: Create function:
  - Check if uiFontFamily exists
  - Set to DEFAULT_UI_FONT_STACK if missing
  - Check if codeFontFamily exists
  - Set to DEFAULT_CODE_FONT_STACK if missing
- **Dependencies**: Phase 1 (font constants)
- **Acceptance**: Function sets defaults correctly
- **Status**: `completed`

### Task 3.2: Call on Database Initialization

- **File**: `electron/database/json-db.ts`
- **Description**: Call in getDatabase():
  - After initDatabase()
  - Before returning database
  - Ensures defaults always present
- **Dependencies**: Task 3.1
- **Acceptance**: Defaults set on every database access
- **Status**: `completed`

### Task 3.3: Test Database Defaults

- **Description**: Test scenarios:
  - Fresh database → defaults set
  - Existing database with values → values preserved
  - Existing database missing fonts → defaults added
  - Database restart → defaults persist
- **Dependencies**: Tasks 3.1-3.2
- **Acceptance**: Defaults work in all scenarios
- **Status**: `completed`

**Checkpoint**: Database defaults working

---

## Phase 4: Update Monaco Editor

### Task 4.1: Add Settings Listener

- **File**: `src/components/ui/monaco-editor.tsx`
- **Description**: Listen to settings changes:
  - useEffect watching settings.codeFontFamily
  - Get current editor instance
  - Update editor options
- **Dependencies**: Phase 1
- **Acceptance**: Editor listens to changes
- **Status**: `completed`

### Task 4.2: Update Editor Options

- **File**: `src/components/ui/monaco-editor.tsx`
- **Description**: Update Monaco options:
  - `editor.updateOptions({ fontFamily: codeFontStack })`
  - Handle null/undefined editor
  - Handle invalid font values
- **Dependencies**: Task 4.1
- **Acceptance**: Editor font updates correctly
- **Status**: `completed`

### Task 4.3: Test Monaco Updates

- **Description**: Test editor font changes:
  - Change code font → Monaco updates
  - Empty code font → Monaco uses default
  - Multiple changes → Monaco always updates
  - Editor remount → font persists
- **Dependencies**: Tasks 4.1-4.2
- **Acceptance**: Monaco font always correct
- **Status**: `completed`

**Checkpoint**: Monaco editor updates working

---

## Phase 5: Testing & Verification

### Task 5.1: Integration Testing

- **Description**: Test full flow:
  - Open Settings
  - Change UI font → verify immediate update
  - Change code font → verify immediate update
  - Save settings → verify persistence
  - Restart app → verify fonts load correctly
- **Dependencies**: Phases 1-4
- **Acceptance**: Full flow works end-to-end
- **Status**: `completed`

### Task 5.2: Edge Case Testing

- **Description**: Test edge cases:
  - Empty font values
  - Whitespace-only values
  - Invalid font names
  - Very long font strings
  - Special characters in font names
  - Rapid font changes
- **Dependencies**: Phases 1-4
- **Acceptance**: All edge cases handled gracefully
- **Status**: `completed`

### Task 5.3: Regression Testing

- **Description**: Verify no regressions:
  - Other settings still work
  - Theme switching works
  - No console errors
  - No visual glitches
  - Performance unchanged
- **Dependencies**: Phases 1-4
- **Acceptance**: No regressions found
- **Status**: `completed`

### Task 5.4: Cross-Platform Testing

- **Description**: Test on all platforms:
  - macOS: Verify fonts work
  - Windows: Verify fonts work
  - Linux: Verify fonts work
  - Platform-specific fonts handled
- **Dependencies**: Phases 1-4
- **Acceptance**: Works on all platforms
- **Status**: `completed`

**Checkpoint**: All testing complete

---

## Progress Tracking

**Total Tasks**: 17  
**Completed**: 17  
**In Progress**: 0  
**Pending**: 0  
**Blocked**: 0

**Completion**: 100%

### Implementation Summary

- ✅ Phase 1: Enhanced FontProvider with robust validation
- ✅ Phase 2: Implemented live preview in Settings
- ✅ Phase 3: Added database defaults
- ✅ Phase 4: Updated Monaco editor to listen to changes
- ✅ Phase 5: Comprehensive testing completed

### Bug Resolution

- ✅ Fonts apply immediately (live preview)
- ✅ Fonts persist across app restarts
- ✅ Empty values fall back to defaults correctly
- ✅ Monaco editor updates automatically
- ✅ No console errors
- ✅ All edge cases handled
- ✅ Cross-platform compatibility verified

### Files Modified

- `src/constants/fonts.ts` - Added font constants (new file)
- `src/components/providers/FontProvider.tsx` - Enhanced with validation and CSS updates
- `src/pages/Settings.tsx` - Added live preview functionality
- `electron/database/json-db.ts` - Added database defaults function
- `src/components/ui/monaco-editor.tsx` - Added settings listener

### Verification Steps

1. ✅ Change UI font → applies immediately throughout app
2. ✅ Change code font → applies immediately in Monaco editor
3. ✅ Clear font values → falls back to system defaults
4. ✅ Save settings → persists to database
5. ✅ Restart app → fonts load correctly
6. ✅ No console errors or warnings
7. ✅ All integration tests pass

---

## Notes

- Bug fully resolved with comprehensive fix
- Live preview significantly improves UX
- All edge cases now handled gracefully
- Code is more maintainable with centralized constants
- No regressions detected
- Cross-platform compatibility verified
