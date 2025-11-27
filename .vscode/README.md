# VS Code & Cursor Configuration

This directory contains VS Code workspace configurations for optimal development experience. **All configurations are fully compatible with Cursor AI Editor** since Cursor is built on VS Code.

## Cursor AI Compatibility

✅ **YES! All configurations work perfectly in Cursor AI Editor**

Since Cursor is built on VS Code, **100% of these configurations are compatible**:

### What Works in Cursor:
- ✅ **All Settings** - TypeScript, editor, formatting, IntelliSense
- ✅ **Tasks** - All build, dev, and test tasks
- ✅ **Debug Configurations** - Electron debugging works identically
- ✅ **Keybindings** - All custom shortcuts
- ✅ **Snippets** - All code snippets (TypeScript, React, Electron)
- ✅ **Extensions** - Recommended extensions work in Cursor
- ✅ **Prettier & EditorConfig** - Formatting configurations

### Cursor-Specific Benefits:
The settings are optimized for AI-assisted development:
- **Enhanced IntelliSense** - Better context for AI suggestions
- **Optimized Suggestions** - More suggestion types enabled for AI
- **Better File Indexing** - Improved code understanding for AI
- **Code Navigation** - Enhanced navigation helps AI understand code structure
- **TypeScript Strict Mode** - Better type inference for AI

### How Cursor Uses These Settings:
1. **AI Context** - Cursor uses TypeScript IntelliSense to understand your code
2. **Code Suggestions** - Enhanced suggestion settings help AI provide better completions
3. **File Structure** - File nesting and exclusions help AI understand project organization
4. **Path Aliases** - `@/` alias configuration helps AI navigate your codebase
5. **Snippets** - AI can leverage your custom snippets when generating code

**Bottom Line:** These configurations will make Cursor's AI features work even better by providing rich context about your codebase structure, types, and patterns.

## Files Overview

### `settings.json`
Workspace-specific settings including:
- TypeScript configuration and IntelliSense
- Editor formatting and code actions
- File exclusions and search settings
- Tailwind CSS support
- Performance optimizations
- Testing configuration

### `tasks.json`
Predefined tasks for common development operations:
- **Type Check** - Run TypeScript type checking
- **Build** - Build the project
- **Dev Server** - Start Vite dev server
- **Electron: Dev** - Run Electron in development mode
- **Test: Electron** - Run Electron tests
- **Clean Build** - Remove build artifacts

### `launch.json`
Debug configurations:
- **Debug Electron Main Process** - Debug Electron main process
- **Debug Electron Renderer Process** - Attach to renderer process
- **Debug Electron (Full App)** - Debug both processes
- **Debug Tests (Playwright)** - Debug Playwright tests

### `keybindings.json`
Custom keyboard shortcuts:
- `Ctrl+Shift+D` - Start Dev Server
- `Ctrl+Shift+E` - Start Electron Dev
- `Ctrl+Shift+T` - Type Check
- `Ctrl+Shift+B` - Build
- `Ctrl+Shift+Alt+T` - Run Electron Tests
- `Ctrl+Shift+X` - Terminate Task

### `extensions.json`
Recommended extensions for the project. VS Code will prompt you to install them.

### `snippets/`
Code snippets for faster development:
- **typescript.json** - TypeScript snippets
- **react.json** - React component snippets
- **electron.json** - Electron-specific snippets

## Quick Start

1. **Install Recommended Extensions**
   - VS Code will prompt you, or run "Extensions: Show Recommended Extensions"
   - Essential: Prettier, ESLint, Tailwind CSS IntelliSense

2. **Use Tasks**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Tasks: Run Task"
   - Select a task

3. **Debug**
   - Open Run and Debug panel (`Cmd+Shift+D` / `Ctrl+Shift+D`)
   - Select a debug configuration
   - Press F5 to start debugging

4. **Use Snippets**
   - Type snippet prefix (e.g., `rfc` for React component)
   - Press Tab to expand

## Notes

- Prettier formatter warnings will disappear once the Prettier extension is installed
- Some settings require specific extensions to be installed
- File nesting patterns help organize related files in the explorer
- Performance settings are optimized for large TypeScript projects

