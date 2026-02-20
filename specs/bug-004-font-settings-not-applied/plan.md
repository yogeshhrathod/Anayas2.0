# Fix Plan: Font Settings Not Applied

**Bug ID**: `bug-004-font-settings-not-applied`  
**Status**: `resolved`  
**Related Spec**: [spec.md](./spec.md)

## Root Cause

Font settings were not being applied properly due to multiple issues:

1. **FontProvider issues**: Didn't handle empty/undefined values correctly
2. **No live preview**: Settings only applied after save and reload
3. **Database defaults missing**: No fallback defaults in database
4. **Monaco editor not updating**: Editor didn't listen to font changes
5. **Inconsistent state handling**: Settings state and store out of sync

## Fix Strategy

### Phase 1: Enhance FontProvider

**Goal**: Make FontProvider robust and reactive

**Changes Needed**:

- Add proper empty string/undefined/null handling
- Add value trimming and validation
- Add CSS variable updates to document root
- Add dynamic style injection with !important
- Ensure proper fallback to defaults

**Why**: FontProvider is the central place where fonts are applied. Making it robust fixes the core issue.

### Phase 2: Implement Live Preview

**Goal**: Update fonts immediately when user changes settings

**Changes Needed**:

- Update Zustand store immediately on input change
- Keep local state for form management
- Debounce database saves
- Show live preview without needing save

**Why**: Improves UX significantly - users see changes immediately.

### Phase 3: Add Database Defaults

**Goal**: Ensure fonts always have valid values

**Changes Needed**:

- Create `ensureFontSettingsDefaults()` function
- Call on database initialization
- Set defaults if values missing

**Why**: Prevents undefined/null values from causing issues.

### Phase 4: Update Monaco Editor

**Goal**: Make code editor fonts update automatically

**Changes Needed**:

- Listen to settings changes
- Update editor font option
- Refresh editor display

**Why**: Code editor needs explicit font updates.

### Phase 5: Add Font Constants

**Goal**: Centralize font defaults

**Changes Needed**:

- Create `src/constants/fonts.ts`
- Export DEFAULT_UI_FONT_STACK
- Export DEFAULT_CODE_FONT_STACK

**Why**: Single source of truth for defaults.

## Implementation Approach

### Approach 1: Fix FontProvider First ✅

**Pros**:

- Fixes core issue immediately
- Other fixes build on this
- Can test incrementally

**Cons**:

- Users still need to reload for changes

**Decision**: Start with this - it's the foundation.

### Approach 2: Add Live Preview ✅

**Pros**:

- Better UX
- Encourages users to experiment with fonts
- Modern app behavior

**Cons**:

- Slightly more complex state management

**Decision**: Implement this - significantly improves UX.

### Approach 3: Add Database Defaults ✅

**Pros**:

- Prevents future issues
- Clean initialization
- Consistent state

**Cons**:

- None significant

**Decision**: Implement this - prevents edge cases.

## Files to Modify

### 1. FontProvider Enhancement

**File**: `src/components/providers/FontProvider.tsx`

**Why**: Core font application logic lives here

**Changes**:

- Add robust value validation
- Add CSS variable updates
- Add dynamic style injection
- Add proper defaults

### 2. Settings Page Updates

**File**: `src/pages/Settings.tsx`

**Why**: Where users change font settings

**Changes**:

- Update store immediately for live preview
- Keep local state for form
- Add proper trimming
- Handle empty values

### 3. Database Defaults

**File**: `electron/database/json-db.ts`

**Why**: Ensure defaults always present

**Changes**:

- Add ensureFontSettingsDefaults()
- Call on database init
- Set defaults if missing

### 4. Monaco Editor Updates

**File**: `src/components/ui/monaco-editor.tsx`

**Why**: Code editor needs explicit font updates

**Changes**:

- Listen to settings changes
- Update editor options
- Refresh display

### 5. Font Constants

**File**: `src/constants/fonts.ts` (new)

**Why**: Centralize defaults

**Changes**:

- Export DEFAULT_UI_FONT_STACK
- Export DEFAULT_CODE_FONT_STACK

## Testing Strategy

### Unit Tests

- Test FontProvider with various inputs
- Test empty/undefined/null handling
- Test trimming and validation
- Test fallback to defaults

### Integration Tests

- Test Settings page → FontProvider flow
- Test database persistence
- Test app restart scenario
- Test Monaco editor updates

### Manual Tests

- Change UI font → verify immediate update
- Change code font → verify immediate update
- Clear fonts → verify fallback to defaults
- Restart app → verify persistence
- Try invalid fonts → verify fallback

## Rollback Plan

If fix causes issues:

1. Revert FontProvider changes
2. Revert Settings page changes
3. Font settings disabled temporarily
4. Users can still use defaults
5. No data loss

## Success Criteria

- [x] Fonts apply immediately (live preview)
- [x] Fonts persist across restarts
- [x] Empty values handled gracefully
- [x] Monaco editor updates correctly
- [x] No console errors
- [x] All tests pass

## Implementation Timeline

- **Phase 1**: 1-2 hours (FontProvider)
- **Phase 2**: 1-2 hours (Live preview)
- **Phase 3**: 0.5 hours (Database defaults)
- **Phase 4**: 0.5 hours (Monaco editor)
- **Phase 5**: 0.5 hours (Font constants)
- **Testing**: 1-2 hours

**Total**: 4-6 hours

## References

- [spec.md](./spec.md)
- [specs/013-font-settings/](../013-font-settings/) - Original font settings feature
- `src/components/providers/FontProvider.tsx` - Fixed implementation
- `src/pages/Settings.tsx` - Fixed implementation
