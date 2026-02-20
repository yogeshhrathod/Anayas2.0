# Task Breakdown: Font Settings

**Status**: completed

## Phase 1: Settings UI & Persistence

- [x] Update `src/types/index.ts` or `settings` type definition to include `uiFontFamily` and `codeFontFamily` (if explicit typing is used).
- [x] Update `src/pages/Settings.tsx` to include "Fonts" section.
  - [x] Add "UI Font Family" input.
  - [x] Add "Code Font Family" input.
  - [x] Add validation/defaults.
  - [x] Ensure saving works.

## Phase 2: Apply UI Font

- [x] Create `src/components/providers/FontProvider.tsx`.
  - [x] Read `uiFontFamily` from store.
  - [x] Apply to `document.documentElement` via style attribute or CSS variable.
- [x] Wrap `App` or `Main` with `FontProvider` in `src/main.tsx` or `src/App.tsx`.

## Phase 3: Apply Code Font

- [x] Update `src/components/ui/monaco-editor.tsx`.
  - [x] Read `codeFontFamily` from store/settings.
  - [x] Pass `fontFamily` to `editor.updateOptions`.
- [x] Update `src/components/ui/monaco-key-value-editor.tsx` similarly.

## Phase 4: Verification

- [x] Test changing UI font (e.g., to "Times New Roman").
- [x] Test changing Code font (e.g., to "Courier New").
- [x] Verify persistence after reload.
