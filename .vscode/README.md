# VS Code Configuration

This directory contains VS Code workspace configurations for optimal development experience.

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

