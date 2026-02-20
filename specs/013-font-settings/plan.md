# Implementation Plan: Font Settings

**Status**: completed
**Feature**: Font Settings

## Architecture

- **State Management**: Use the existing `useStore` (Zustand) to hold settings on the client side.
- **Persistence**: Use the existing `electronAPI.settings` IPC bridge.
- **UI Application**:
  - **Global UI Font**: We will use a CSS variable `--font-sans` and `--font-mono` in the root, or inject styles dynamically in `App.tsx` or a new `FontProvider` component.
  - **Code Font**: We will update `MonacoEditor` to listen to the settings store (or receive props) for the font family.

## Proposed Changes

### 1. Settings Store & IPC

- The settings store already supports arbitrary keys. We will add `uiFontFamily` and `codeFontFamily`.

### 2. Settings Page (`src/pages/Settings.tsx`)

- Add a new section "Fonts".
- Add input fields for:
  - UI Font Family (default: system default)
  - Code Font Family (default: 'Menlo', 'Monaco', 'Courier New', monospace)
- Validation: Basic non-empty check (optional).

### 3. Global Style Application (`src/components/FontProvider.tsx` or `App.tsx`)

- Create a component that reads the `uiFontFamily` from settings and applies it to `document.body` or `:root`.

### 4. Monaco Editor (`src/components/ui/monaco-editor.tsx`)

- Update component to read `codeFontFamily` from settings (via `useStore` or props).
- Pass `fontFamily` to `editor.updateOptions`.

## Implementation Phases

### Phase 1: Settings Logic & UI

- Update `Settings.tsx` to include the new fields.
- Ensure they are saved and loaded.

### Phase 2: Apply UI Font

- Implement the mechanism to apply the UI font globally.

### Phase 3: Apply Code Font

- Update `MonacoEditor` to use the configured code font.

### Phase 4: Testing

- Verify persistence.
- Verify visual updates.

## File Structure Changes

- `src/components/settings/FontSettings.tsx` (Optional: extract settings section)
- `src/components/providers/FontProvider.tsx` (New: to handle global font injection)

## Testing Plan

- **Manual Test**: Change fonts and verify immediate update.
- **Persistence Test**: Restart app and verify fonts are remembered.
