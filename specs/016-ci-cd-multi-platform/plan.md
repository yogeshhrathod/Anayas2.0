# Implementation Plan: CI/CD Multi-Platform Builds

**Feature ID**: `016-ci-cd-multi-platform`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Configure electron-builder to generate platform-specific installers and distributable packages for macOS, Windows, and Linux. This enables developers to build and distribute Anayas across all major desktop operating systems.

## Existing Code Analysis

### Current Build Setup

- [x] Vite configured for Electron renderer build
- [x] TypeScript compilation for main/preload processes
- [x] Basic electron-builder installed as dependency
- [x] Build scripts partially configured

### What Needs Configuration

- [x] electron-builder multi-platform settings
- [x] Platform-specific build targets
- [x] Icon assets for all platforms
- [x] Build output directory structure
- [x] Platform-specific build scripts

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes - Build configuration doesn't affect runtime performance
- [x] Enables distribution to more users across platforms
- [x] No negative impact on app performance or memory

**Architecture Compliance:**

- [x] Standard electron-builder configuration pattern
- [x] No changes to application code
- [x] No dependencies added (electron-builder already present)
- [x] No architecture violations

## Implementation Phases

### Phase 1: Icon Assets

**Goal**: Prepare application icon for all platforms  
**Duration**: 0.5 days

**Tasks**:

- [x] Create `build/icons/` directory
- [x] Add `icon.png` (512x512 or higher resolution)
- [x] Verify icon looks good at various sizes

**Dependencies**: None  
**Deliverables**: Icon assets ready

### Phase 2: electron-builder Configuration

**Goal**: Configure multi-platform build settings  
**Duration**: 0.5 days

**Tasks**:

- [x] Add `build` section to `package.json`
- [x] Configure macOS builds (DMG, ZIP)
- [x] Configure Windows builds (NSIS, ZIP)
- [x] Configure Linux builds (AppImage, DEB)
- [x] Set app ID and product name
- [x] Configure file patterns to include
- [x] Set output directory

**Dependencies**: Phase 1  
**Deliverables**: Complete electron-builder config

### Phase 3: Build Scripts

**Goal**: Create convenient build scripts  
**Duration**: 0.5 days

**Tasks**:

- [x] Add `build` script (all platforms)
- [x] Add `build:mac` script
- [x] Add `build:win` script
- [x] Add `build:linux` script
- [x] Ensure type-check runs before build
- [x] Ensure Vite build runs before electron-builder

**Dependencies**: Phase 2  
**Deliverables**: Build scripts ready

### Phase 4: Testing & Verification

**Goal**: Test builds on all platforms  
**Duration**: 1 day

**Tasks**:

- [x] Test macOS builds
- [x] Test Windows builds
- [x] Test Linux builds (if possible)
- [x] Verify installers work correctly
- [x] Verify app launches on each platform
- [x] Verify icons display correctly

**Dependencies**: Phase 3  
**Deliverables**: Verified multi-platform builds

### Phase 5: Documentation

**Goal**: Document build process  
**Duration**: 0.5 days

**Tasks**:

- [x] Update README with build instructions
- [x] Document platform-specific notes
- [x] Document troubleshooting tips
- [x] Document output directory structure

**Dependencies**: Phase 4  
**Deliverables**: Complete documentation

## File Structure

### New Files/Directories

```
build/
└── icons/
    └── icon.png                # Application icon (512x512+)

release/                        # Build output (gitignored)
├── Anayas-1.0.0.dmg           # macOS DMG installer
├── Anayas-1.0.0-mac.zip       # macOS ZIP archive
├── Anayas Setup 1.0.0.exe     # Windows NSIS installer
├── Anayas-1.0.0-win.zip       # Windows ZIP archive
├── Anayas-1.0.0.AppImage      # Linux AppImage
└── anayas_1.0.0_amd64.deb     # Debian package
```

### Modified Files

```
package.json
  - Add: build.appId
  - Add: build.productName
  - Add: build.directories
  - Add: build.files
  - Add: build.mac
  - Add: build.win
  - Add: build.linux
  - Add/Update: scripts.build
  - Add: scripts.build:mac
  - Add: scripts.build:win
  - Add: scripts.build:linux

README.md
  - Add: Build instructions section
  - Add: Platform-specific build notes
  - Add: Troubleshooting section

.gitignore
  - Verify: /release directory ignored
  - Verify: build output ignored
```

## Implementation Details

### electron-builder Configuration

**Location**: `package.json`

**Key Settings**:

```json
{
  "build": {
    "appId": "com.anayas.app",
    "productName": "Anayas",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "build/icons/icon.png",
      "target": ["dmg", "zip"]
    },
    "win": {
      "icon": "build/icons/icon.png",
      "target": ["nsis", "zip"]
    },
    "linux": {
      "icon": "build/icons/icon.png",
      "target": ["AppImage", "deb"]
    }
  }
}
```

### Build Flow

```
npm run build
    ↓
Type check (npm run type-check)
    ↓
Vite build (renderer process)
    ↓
Electron TypeScript compilation (main/preload)
    ↓
electron-builder (create installers)
    ↓
Output to release/ directory
```

### Platform-Specific Build Commands

```bash
# Build for all platforms
npm run build

# Build for macOS only
npm run build:mac

# Build for Windows only
npm run build:win

# Build for Linux only
npm run build:linux
```

## Testing Strategy

### Build Testing

- [x] Test each platform build script
- [x] Verify output files created correctly
- [x] Check file sizes are reasonable
- [x] Verify no build errors or warnings

### Installation Testing

- [x] Install from DMG on macOS
- [x] Install from NSIS on Windows
- [x] Run AppImage on Linux
- [x] Install DEB on Ubuntu/Debian
- [x] Verify app launches successfully
- [x] Verify all features work post-install

### Visual Testing

- [x] Check app icon in installer
- [x] Check app icon in dock/taskbar
- [x] Check app icon in file manager
- [x] Verify no placeholder icons used

### Manual Testing Checklist

- [x] macOS DMG installs correctly
- [x] macOS ZIP extracts and runs
- [x] Windows NSIS installs correctly
- [x] Windows ZIP extracts and runs
- [x] Linux AppImage runs correctly
- [x] Linux DEB installs correctly
- [x] App functionality identical on all platforms

## Performance Considerations

**Build Performance:**

- Type checking takes ~10s
- Vite build takes ~30s
- electron-builder packaging takes ~1-2 min per platform
- Total build time: ~3-6 minutes (all platforms)

**Optimization**:

- Parallel builds not currently implemented
- Future: Use GitHub Actions for parallel cloud builds

## Security Considerations

- [x] No code execution during build
- [x] No secrets in build configuration
- [x] Build output should be scanned before distribution
- [ ] Future: Add code signing for macOS/Windows
- [ ] Future: Add notarization for macOS

## Distribution Strategy

**Current**:

- Manual local builds
- Manual distribution of installers

**Future**:

- Automated builds via GitHub Actions
- Automated releases via GitHub Releases
- Auto-update mechanism
- App Store distribution (Mac App Store, Windows Store)

## Cross-Platform Building

**From macOS:**

- ✅ Can build for macOS
- ✅ Can build for Windows (with wine)
- ✅ Can build for Linux

**From Windows:**

- ✅ Can build for Windows
- ✅ Can build for Linux
- ⚠️ Limited support for macOS

**From Linux:**

- ✅ Can build for Linux
- ✅ Can build for Windows
- ⚠️ Limited support for macOS

**Recommendation**: Build on native platform when possible for best results.

## Rollback Plan

If builds fail:

1. Revert package.json changes
2. Remove build/ directory
3. Continue with manual distribution
4. No impact on application code or runtime

## Future Enhancements

- [ ] GitHub Actions CI/CD pipeline
- [ ] Automated releases on git tags
- [ ] Code signing certificates
- [ ] macOS notarization
- [ ] Auto-update mechanism (electron-updater)
- [ ] macOS universal binaries (ARM64 + x64)
- [ ] Windows Store submission
- [ ] Mac App Store submission
- [ ] Snap package for Linux
- [ ] Flatpak for Linux

## References

- [spec.md](./spec.md)
- [electron-builder Documentation](https://www.electron.build/)
- [Electron Documentation - Distribution](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [package.json](../../package.json)
