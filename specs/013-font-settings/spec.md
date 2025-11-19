# Feature Specification: Font Settings

**Status**: completed
**Owner**: @yrathod
**Created**: 2025-11-19
**Related**: N/A

## Overview

Add support for configuring application fonts via Settings. Users should be able to customize:
1. **UI Font**: The font used for the general application interface.
2. **Code Font**: The font used in the Monaco Editor and other code views.

## Goals

- Allow users to customize the look and feel of the application.
- Improve accessibility/readability by allowing users to choose their preferred fonts.
- Align with standard developer tool capabilities (like VS Code).

## User Stories

- As a user, I want to change the "UI Font" so that the application looks the way I prefer.
- As a user, I want to change the "Code Font" so that code snippets are readable in my preferred monospace font.
- As a user, I want to reset these settings to defaults if I make a mistake.

## Acceptance Criteria

### UI Font Setting
- [x] A new setting "UI Font Family" is available in the Settings page.
- [x] The setting accepts a font family string (e.g., "Inter, sans-serif").
- [x] Changing this setting updates the application's font immediately (or after save).
- [x] Default value matches the current system default (system-ui, sans-serif).

### Code Font Setting
- [x] A new setting "Code Font Family" is available in the Settings page.
- [x] The setting accepts a font family string (e.g., "'Fira Code', monospace").
- [x] Changing this setting updates all Monaco Editor instances.
- [x] Default value matches the current default ('Menlo', 'Monaco', 'Courier New', monospace).

### Persistence
- [x] Font settings are saved to the configuration file.
- [x] Font settings are restored on application restart.

## Technical Requirements

- **Storage**: Store `uiFontFamily` and `codeFontFamily` in the existing JSON-based settings store.
- **Application**:
    - Use CSS variables or dynamic style injection for the UI font.
    - Pass the code font to `MonacoEditor` components via props or a context/store.
- **Performance**: Changing fonts should not require a reload.

## Design

- Add a new section "Appearance" or "Fonts" in the Settings page.
- Input fields for "UI Font Family" and "Code Font Family".
- Optional: Helper text explaining valid formats.

## Risks & Constraints

- Invalid font strings might cause the UI to look broken (fallback to browser default).
- We rely on the user having the font installed locally.

## Goal Alignment

- **Performance**: Minimal impact. Font strings are small.
- **Architecture**: Uses existing settings store and state management.
