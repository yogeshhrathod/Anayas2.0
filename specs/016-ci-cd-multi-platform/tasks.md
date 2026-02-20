# Task Breakdown: CI/CD Multi-Platform Builds

**Feature ID**: `016-ci-cd-multi-platform`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks organized by implementation phase.

---

## Phase 1: Icon Assets

### Task 1.1: Create Icons Directory

- **File**: `build/icons/`
- **Description**: Create directory structure for build assets
- **Dependencies**: None
- **Acceptance**: Directory created and ready for assets
- **Status**: `completed`

### Task 1.2: Add Application Icon

- **File**: `build/icons/icon.png`
- **Description**: Add main application icon:
  - Minimum 512x512 resolution
  - PNG format
  - Transparent background (if applicable)
  - electron-builder will generate platform-specific formats
- **Dependencies**: Task 1.1
- **Acceptance**: Icon file added and looks good
- **Status**: `completed`

**Checkpoint**: Icon assets ready

---

## Phase 2: electron-builder Configuration

### Task 2.1: Add Base Build Configuration

- **File**: `package.json`
- **Description**: Add base build section:
  - `appId`: "com.anayas.app"
  - `productName`: "Anayas"
  - `directories.output`: "release"
  - `directories.buildResources`: "build"
- **Dependencies**: Phase 1
- **Acceptance**: Base configuration compiles
- **Status**: `completed`

### Task 2.2: Configure File Patterns

- **File**: `package.json`
- **Description**: Configure files to include in build:
  - `dist/**/*` (Vite renderer output)
  - `dist-electron/**/*` (Main/preload output)
- **Dependencies**: Task 2.1
- **Acceptance**: Correct files included in build
- **Status**: `completed`

### Task 2.3: Configure macOS Build

- **File**: `package.json`
- **Description**: Add macOS-specific settings:
  - Category: "public.app-category.developer-tools"
  - Icon path: "build/icons/icon.png"
  - Targets: ["dmg", "zip"]
- **Dependencies**: Task 2.1
- **Acceptance**: macOS configuration complete
- **Status**: `completed`

### Task 2.4: Configure Windows Build

- **File**: `package.json`
- **Description**: Add Windows-specific settings:
  - Icon path: "build/icons/icon.png"
  - Targets: ["nsis", "zip"]
  - NSIS installer configuration
- **Dependencies**: Task 2.1
- **Acceptance**: Windows configuration complete
- **Status**: `completed`

### Task 2.5: Configure Linux Build

- **File**: `package.json`
- **Description**: Add Linux-specific settings:
  - Icon path: "build/icons/icon.png"
  - Targets: ["AppImage", "deb"]
  - Desktop entry configuration
- **Dependencies**: Task 2.1
- **Acceptance**: Linux configuration complete
- **Status**: `completed`

**Checkpoint**: electron-builder fully configured

---

## Phase 3: Build Scripts

### Task 3.1: Add Universal Build Script

- **File**: `package.json` - `scripts` section
- **Description**: Add `build` script:
  - Run type-check first
  - Run vite build
  - Run electron-builder for all platforms
- **Dependencies**: Phase 2
- **Acceptance**: Universal build script works
- **Status**: `completed`

### Task 3.2: Add Platform-Specific Scripts

- **File**: `package.json` - `scripts` section
- **Description**: Add platform-specific scripts:
  - `build:mac` - macOS only
  - `build:win` - Windows only
  - `build:linux` - Linux only
- **Dependencies**: Task 3.1
- **Acceptance**: Platform-specific scripts work
- **Status**: `completed`

### Task 3.3: Verify Build Order

- **File**: `package.json`
- **Description**: Ensure correct build order:
  1. Type checking
  2. Vite build (renderer)
  3. Electron TypeScript compilation (main/preload)
  4. electron-builder packaging
- **Dependencies**: Tasks 3.1-3.2
- **Acceptance**: Build order correct, all steps complete
- **Status**: `completed`

**Checkpoint**: Build scripts ready

---

## Phase 4: Testing & Verification

### Task 4.1: Test macOS Build

- **Description**: Build and test macOS artifacts:
  - Run `npm run build:mac`
  - Verify DMG created in `release/`
  - Verify ZIP created in `release/`
  - Install from DMG
  - Extract and run from ZIP
  - Verify app launches successfully
  - Check icon appears correctly
- **Dependencies**: Phase 3
- **Acceptance**: macOS builds work correctly
- **Status**: `completed`

### Task 4.2: Test Windows Build

- **Description**: Build and test Windows artifacts:
  - Run `npm run build:win`
  - Verify NSIS installer created in `release/`
  - Verify ZIP created in `release/`
  - Run installer
  - Extract and run from ZIP
  - Verify app launches successfully
  - Check icon appears correctly
- **Dependencies**: Phase 3
- **Acceptance**: Windows builds work correctly
- **Status**: `completed`

### Task 4.3: Test Linux Build

- **Description**: Build and test Linux artifacts:
  - Run `npm run build:linux`
  - Verify AppImage created in `release/`
  - Verify DEB created in `release/`
  - Run AppImage
  - Install DEB package
  - Verify app launches successfully
  - Check icon appears correctly
- **Dependencies**: Phase 3
- **Acceptance**: Linux builds work correctly
- **Status**: `completed`

### Task 4.4: Cross-Platform Build Testing

- **Description**: Test cross-platform building:
  - From macOS, build for Windows and Linux
  - Verify output files correct
  - Check for any platform-specific issues
  - Document any limitations
- **Dependencies**: Tasks 4.1-4.3
- **Acceptance**: Cross-platform builds documented
- **Status**: `completed`

### Task 4.5: Verify App Functionality

- **Description**: Test app functionality on each platform:
  - All features work correctly
  - No platform-specific bugs
  - Performance is acceptable
  - Database works correctly
  - IPC handlers work
  - UI renders correctly
- **Dependencies**: Tasks 4.1-4.3
- **Acceptance**: App fully functional on all platforms
- **Status**: `completed`

**Checkpoint**: All builds tested and verified

---

## Phase 5: Documentation

### Task 5.1: Update README - Build Instructions

- **File**: `README.md`
- **Description**: Add build instructions section:
  - Prerequisites (Node.js version, etc.)
  - Build commands
  - Platform-specific notes
  - Output directory location
  - Expected build artifacts
- **Dependencies**: Phase 4
- **Acceptance**: Clear build instructions added
- **Status**: `completed`

### Task 5.2: Document Platform-Specific Notes

- **File**: `README.md`
- **Description**: Document platform specifics:
  - macOS: DMG vs ZIP, notarization notes
  - Windows: NSIS installer, code signing notes
  - Linux: AppImage vs DEB, distribution notes
  - Cross-platform building limitations
- **Dependencies**: Task 5.1
- **Acceptance**: Platform notes comprehensive
- **Status**: `completed`

### Task 5.3: Add Troubleshooting Section

- **File**: `README.md`
- **Description**: Document common issues:
  - Build failures and solutions
  - Icon not showing - resolution/format issues
  - Missing dependencies
  - Platform-specific build errors
  - Output directory permissions
- **Dependencies**: Task 5.1
- **Acceptance**: Common issues documented with solutions
- **Status**: `completed`

### Task 5.4: Document Output Structure

- **File**: `README.md`
- **Description**: Document release/ directory structure:
  - List all generated files
  - Explain file naming convention
  - Document file purposes
  - Note which files to distribute
- **Dependencies**: Task 5.1
- **Acceptance**: Output structure clearly documented
- **Status**: `completed`

### Task 5.5: Update .gitignore

- **File**: `.gitignore`
- **Description**: Verify build output ignored:
  - `/release` directory
  - `/dist` directory
  - `/dist-electron` directory
  - Build artifacts
- **Dependencies**: None
- **Acceptance**: Build output properly ignored
- **Status**: `completed`

**Checkpoint**: Documentation complete

---

## Progress Tracking

**Total Tasks**: 20  
**Completed**: 20  
**In Progress**: 0  
**Pending**: 0  
**Blocked**: 0

**Completion**: 100%

### Implementation Summary

- ✅ Phase 1: Icon Assets (icon prepared)
- ✅ Phase 2: electron-builder Configuration (all platforms configured)
- ✅ Phase 3: Build Scripts (universal + platform-specific)
- ✅ Phase 4: Testing & Verification (all platforms tested)
- ✅ Phase 5: Documentation (comprehensive docs added)

### Achievements

- ✅ Multi-platform builds working (macOS, Windows, Linux)
- ✅ Platform-specific installers generated correctly
- ✅ Cross-platform building tested and documented
- ✅ App functionality verified on all platforms
- ✅ Complete build documentation

### Files Created/Modified

**New Files:**

- `build/icons/icon.png` - Application icon

**Modified Files:**

- `package.json` - Added build configuration and scripts
- `README.md` - Added build instructions and troubleshooting
- `.gitignore` - Verified build output ignored

**Generated Files (in release/):**

- macOS: DMG, ZIP
- Windows: NSIS (.exe), ZIP
- Linux: AppImage, DEB

### Build Commands

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

### Platform Support

- ✅ macOS (DMG + ZIP)
- ✅ Windows (NSIS + ZIP)
- ✅ Linux (AppImage + DEB)

### Future Enhancements

- [ ] CI/CD automation via GitHub Actions
- [ ] Code signing for macOS and Windows
- [ ] macOS notarization
- [ ] Auto-update mechanism
- [ ] Universal macOS binary (ARM64 + x64)
- [ ] App Store distribution

---

## Notes

- Local builds working for all platforms
- Cross-platform building possible but native builds recommended
- Build artifacts in `release/` directory (gitignored)
- Icons automatically converted for each platform by electron-builder
- Future: Automate builds with CI/CD pipeline
- Future: Add code signing before public distribution
