# UI Test Plan Tracking

**Status**: `in-progress`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27

## Overview

This document tracks the implementation progress of comprehensive UI tests for Anayas API Tester. The test plan covers all pages, components, user interactions, keyboard shortcuts, drag & drop, dialogs, form validation, error handling, performance, and accessibility.

## Test Strategy & Principles

- ✅ **No conditional checks** - Use `waitFor()` instead of `if (count > 0)`
- ✅ **Strong assertions** - Verify actual behavior, not just existence
- ✅ **No silent failures** - Remove `.catch(() => false)` patterns
- ✅ **Verify state changes** - Check UI updates after actions
- ✅ **Test error cases** - Verify error messages and handling
- ✅ **BDD format** - Use Given-When-Then structure

## Progress Summary

**Total Test Categories**: 12  
**Total Estimated Test Cases**: 200+  
**Completed Test Cases**: 0  
**In Progress**: 0  
**Pending**: 200+

### Overall Progress: 0% (0/200+)

---

## 1. Page-Level Tests

**Status**: `pending`  
**Progress**: 0% (0/50+)

### 1.1 Homepage Tests
- [ ] Page loads and renders RequestBuilder
- [ ] Status bar shows "Ready"
- [ ] Sidebar is visible and functional
- [ ] Navigation bar is visible
- [ ] Can navigate to other pages from homepage

### 1.2 Collections Page Tests
- [ ] Page loads and displays collections grid
- [ ] Empty state when no collections
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Grid layout is responsive
- [ ] Can create new collection
- [ ] Can edit existing collection
- [ ] Can delete collection
- [ ] Can duplicate collection
- [ ] Can toggle favorite status
- [ ] Can export collections
- [ ] Can import collections
- [ ] Can run collection
- [ ] Collection runner dialog works

### 1.3 Environments Page Tests
- [ ] Page loads and displays environments grid
- [ ] Empty state when no environments
- [ ] Search functionality works
- [ ] Can create new environment
- [ ] Can edit existing environment
- [ ] Can delete environment
- [ ] Can duplicate environment
- [ ] Can set default environment
- [ ] Can test environment connection
- [ ] Can export environments
- [ ] Can import environments

### 1.4 History Page Tests
- [ ] Page loads and displays request history
- [ ] Empty state when no history
- [ ] Search by URL/method works
- [ ] Filter by status (success/error) works
- [ ] Filter by method works
- [ ] Filter by date (today/week/month) works
- [ ] Can view request details
- [ ] Can rerun request
- [ ] Can delete request from history
- [ ] Request details modal displays correctly

### 1.5 Settings Page Tests
- [ ] Page loads and displays settings
- [ ] Can change request timeout
- [ ] Can change max history
- [ ] Can toggle auto-save
- [ ] Can toggle SSL verification
- [ ] Can toggle follow redirects
- [ ] Can change theme (light/dark/system)
- [ ] Can customize themes
- [ ] Settings validation works
- [ ] Settings persist after save
- [ ] Can reset settings to defaults

### 1.6 Logs Page Tests
- [ ] Page loads and displays logs
- [ ] Empty state when no logs
- [ ] Search logs works
- [ ] Filter by level (info/warn/error) works
- [ ] Filter by module works
- [ ] Auto-refresh toggle works
- [ ] Can export logs
- [ ] Can clear logs
- [ ] Log details expand/collapse works
- [ ] Stats cards display correctly

---

## 2. Component-Level Tests

**Status**: `pending`  
**Progress**: 0% (0/60+)

### 2.1 Request Builder Component
- [ ] Component renders with all tabs
- [ ] URL input is visible and functional
- [ ] Method selector works (GET, POST, PUT, DELETE, PATCH, etc.)
- [ ] Send button is visible and functional
- [ ] Save button is visible and functional
- [ ] Request name input works
- [ ] All tabs are accessible (Params, Headers, Body, Auth)
- [ ] Response tab appears after sending request
- [ ] Response displays status code
- [ ] Response displays headers
- [ ] Response displays body
- [ ] Response view modes work (Headers/Body/Both)
- [ ] Split view ratio adjustment works

### 2.2 Params Tab
- [ ] Tab is clickable and becomes active
- [ ] Table view displays parameters
- [ ] Can add new parameter
- [ ] Can edit parameter key/value
- [ ] Can toggle parameter enabled/disabled
- [ ] Can delete parameter
- [ ] JSON view toggle works
- [ ] JSON editor displays parameters
- [ ] Can edit parameters in JSON view
- [ ] JSON validation works
- [ ] View mode persists

### 2.3 Headers Tab
- [ ] Tab is clickable and becomes active
- [ ] Table view displays headers
- [ ] Can add new header
- [ ] Can edit header key/value
- [ ] Can delete header
- [ ] JSON view toggle works
- [ ] JSON editor displays headers
- [ ] Can edit headers in JSON view
- [ ] JSON validation works
- [ ] View mode persists

### 2.4 Body Tab
- [ ] Tab is clickable and becomes active
- [ ] Body type selector works (raw/form-data/none)
- [ ] Content type selector works (JSON/XML/Text/etc.)
- [ ] Raw body editor works
- [ ] Form data table works
- [ ] Can add form data field
- [ ] Can edit form data field
- [ ] Can delete form data field
- [ ] View mode toggle works (table/JSON)
- [ ] Body content persists

### 2.5 Auth Tab
- [ ] Tab is clickable and becomes active
- [ ] Auth type selector works (none/bearer/basic/apikey)
- [ ] Bearer token input works
- [ ] Basic auth username/password inputs work
- [ ] API key key/value inputs work
- [ ] Auth type changes update form
- [ ] Auth values persist

### 2.6 Response Tab
- [ ] Tab appears after sending request
- [ ] Response sub-tabs work (Headers/Body/Both)
- [ ] Response headers display correctly
- [ ] Response body displays correctly
- [ ] Response status code displays
- [ ] Response time displays
- [ ] Response size displays
- [ ] Response view modes work
- [ ] Split view works
- [ ] Response can be copied

### 2.7 Sidebar Component
- [ ] Sidebar is visible
- [ ] Can toggle sidebar visibility
- [ ] Can resize sidebar width
- [ ] Collections section displays
- [ ] Unsaved requests section displays
- [ ] Can expand/collapse collections
- [ ] Can select collection
- [ ] Can select request
- [ ] Can select folder
- [ ] Sidebar scrolls when content overflows
- [ ] Sidebar state persists

### 2.8 Collection Hierarchy
- [ ] Collections display in hierarchy
- [ ] Folders display within collections
- [ ] Requests display within collections/folders
- [ ] Can expand/collapse collection
- [ ] Can expand/collapse folder
- [ ] Can select collection
- [ ] Can select folder
- [ ] Can select request
- [ ] Drag and drop works
- [ ] Context menu works

### 2.9 Navigation Bar
- [ ] Navigation bar is visible
- [ ] Home button works
- [ ] Collections button works
- [ ] Environments button works
- [ ] History button works
- [ ] Settings button works
- [ ] Logs button works
- [ ] Active page is highlighted
- [ ] Environment switcher works
- [ ] Import dropdown works
- [ ] New request button works

### 2.10 Environment Switcher
- [ ] Switcher is visible
- [ ] Current environment displays
- [ ] Can open environment dropdown
- [ ] Can select different environment
- [ ] Environment change updates UI
- [ ] Global environment displays
- [ ] Collection environments display

---

## 3. User Interaction Tests

**Status**: `pending`  
**Progress**: 0% (0/30+)

### 3.1 Request Creation & Editing
- [ ] Can create new request
- [ ] Can edit request name
- [ ] Can change HTTP method
- [ ] Can enter URL
- [ ] Can add query parameters
- [ ] Can add headers
- [ ] Can add body content
- [ ] Can configure authentication
- [ ] Can save request
- [ ] Can send request
- [ ] Can cancel editing

### 3.2 Collection Management
- [ ] Can create collection
- [ ] Can edit collection name
- [ ] Can edit collection description
- [ ] Can add environments to collection
- [ ] Can remove environments from collection
- [ ] Can save collection
- [ ] Can delete collection
- [ ] Can duplicate collection
- [ ] Can toggle favorite
- [ ] Can export collection
- [ ] Can import collection

### 3.3 Environment Management
- [ ] Can create environment
- [ ] Can edit environment name
- [ ] Can edit environment display name
- [ ] Can add base URL
- [ ] Can add variables
- [ ] Can edit variables
- [ ] Can delete variables
- [ ] Can set as default
- [ ] Can test connection
- [ ] Can save environment
- [ ] Can delete environment
- [ ] Can duplicate environment

### 3.4 Request History
- [ ] Can view request history
- [ ] Can search history
- [ ] Can filter history
- [ ] Can view request details
- [ ] Can rerun request
- [ ] Can delete from history
- [ ] History persists after app restart

### 3.5 Unsaved Requests
- [ ] Unsaved requests appear in sidebar
- [ ] Can select unsaved request
- [ ] Can delete unsaved request
- [ ] Can promote unsaved request to collection
- [ ] Can clear all unsaved requests
- [ ] Unsaved requests persist

---

## 4. Keyboard Shortcut Tests

**Status**: `pending`  
**Progress**: 0% (0/20+)

### 4.1 Global Shortcuts
- [ ] Cmd/Ctrl+K - Opens global search
- [ ] Cmd/Ctrl+B - Toggles sidebar
- [ ] Cmd/Ctrl+? - Shows shortcuts help

### 4.2 Request Editor Shortcuts
- [ ] Cmd/Ctrl+Enter - Sends request
- [ ] Cmd/Ctrl+S - Saves request
- [ ] Cmd/Ctrl+L - Focuses URL input
- [ ] Cmd/Ctrl+N - Creates new request
- [ ] Cmd/Ctrl+Shift+P - Creates preset
- [ ] Cmd/Ctrl+Shift+1-9 - Selects preset

### 4.3 Sidebar Shortcuts
- [ ] Cmd/Ctrl+E - Edits selected item
- [ ] Cmd/Ctrl+D - Duplicates selected item
- [ ] Cmd/Ctrl+Backspace - Deletes selected item
- [ ] Cmd/Ctrl+R - Adds new request
- [ ] Cmd/Ctrl+Shift+N - Adds new folder
- [ ] Cmd/Ctrl+Shift+E - Exports item
- [ ] Cmd/Ctrl+Shift+I - Imports item

---

## 5. Drag & Drop Tests

**Status**: `pending`  
**Progress**: 0% (0/10+)

### 5.1 Request Drag & Drop
- [ ] Can drag request within collection
- [ ] Can drag request to different collection
- [ ] Can drag request to folder
- [ ] Can drag request from folder to collection
- [ ] Drag visual feedback works
- [ ] Drop target highlights
- [ ] Request moves correctly
- [ ] Error handling on invalid drop

### 5.2 Folder Drag & Drop
- [ ] Can drag folder to different collection
- [ ] Folder moves correctly
- [ ] Child requests move with folder
- [ ] Error handling on invalid drop

### 5.3 Unsaved Request Drag & Drop
- [ ] Can drag unsaved request to collection
- [ ] Can drag unsaved request to folder
- [ ] Request is promoted on drop
- [ ] Error handling on invalid drop

---

## 6. Dialog & Modal Tests

**Status**: `pending`  
**Progress**: 0% (0/40+)

### 6.1 Save Request Dialog
- [ ] Dialog opens when saving request
- [ ] Can enter request name
- [ ] Can select collection
- [ ] Can select folder
- [ ] Can create new collection
- [ ] Validation works
- [ ] Can save request
- [ ] Can cancel
- [ ] Dialog closes on backdrop click
- [ ] Dialog closes on Escape key

### 6.2 Collection Form Dialog
- [ ] Dialog opens for new collection
- [ ] Dialog opens for edit collection
- [ ] Form fields are editable
- [ ] Validation works
- [ ] Can save collection
- [ ] Can cancel
- [ ] Environment manager works

### 6.3 Environment Form Dialog
- [ ] Dialog opens for new environment
- [ ] Dialog opens for edit environment
- [ ] Form fields are editable
- [ ] Validation works
- [ ] Can add variables
- [ ] Can save environment
- [ ] Can cancel

### 6.4 Promote Request Dialog
- [ ] Dialog opens when promoting unsaved request
- [ ] Can select collection
- [ ] Can select folder
- [ ] Can enter request name
- [ ] Can promote request
- [ ] Can cancel

### 6.5 cURL Import Dialog
- [ ] Dialog opens from import menu
- [ ] Can paste cURL command
- [ ] Can import from cURL
- [ ] Validation works
- [ ] Error messages display
- [ ] Can cancel

### 6.6 Collection Runner Dialog
- [ ] Dialog opens when running collection
- [ ] Shows request list
- [ ] Shows progress
- [ ] Shows results
- [ ] Can cancel run
- [ ] Can close dialog

### 6.7 Bulk Edit Modal
- [ ] Modal opens for bulk edit
- [ ] JSON editor works
- [ ] Validation works
- [ ] Can save changes
- [ ] Can cancel

---

## 7. Form Validation Tests

**Status**: `pending`  
**Progress**: 0% (0/20+)

### 7.1 Request Form Validation
- [ ] URL validation works
- [ ] Method validation works
- [ ] Header key validation works
- [ ] Parameter key validation works
- [ ] JSON body validation works
- [ ] Error messages display
- [ ] Form prevents invalid submission

### 7.2 Collection Form Validation
- [ ] Name required validation
- [ ] Name pattern validation
- [ ] Description length validation
- [ ] Error messages display
- [ ] Form prevents invalid submission

### 7.3 Environment Form Validation
- [ ] Name required validation
- [ ] Name pattern validation
- [ ] Display name required validation
- [ ] Base URL pattern validation
- [ ] Variable key validation
- [ ] Error messages display
- [ ] Form prevents invalid submission

### 7.4 Settings Form Validation
- [ ] Request timeout validation
- [ ] Max history validation
- [ ] Error messages display
- [ ] Form prevents invalid submission

---

## 8. Error Handling Tests

**Status**: `pending`  
**Progress**: 0% (0/15+)

### 8.1 Network Error Handling
- [ ] Invalid URL shows error
- [ ] Network timeout shows error
- [ ] Connection refused shows error
- [ ] DNS error shows error
- [ ] SSL error shows error
- [ ] Error messages are user-friendly
- [ ] Error details are available

### 8.2 Validation Error Handling
- [ ] Invalid form data shows errors
- [ ] Required fields show errors
- [ ] Pattern validation shows errors
- [ ] Error messages are clear
- [ ] Errors clear on correction

### 8.3 IPC Error Handling
- [ ] Database errors are handled
- [ ] File system errors are handled
- [ ] IPC communication errors are handled
- [ ] Error messages are user-friendly
- [ ] App doesn't crash on errors

---

## 9. Performance Tests

**Status**: `pending`  
**Progress**: 0% (0/10+)

### 9.1 Large Dataset Tests
- [ ] 100+ collections load efficiently
- [ ] 1000+ requests load efficiently
- [ ] Sidebar scrolls smoothly
- [ ] Search is fast
- [ ] Filtering is fast
- [ ] No memory leaks
- [ ] No UI freezing

### 9.2 Request Performance
- [ ] Large response bodies display
- [ ] Response rendering is fast
- [ ] JSON parsing is fast
- [ ] No UI freezing during request

### 9.3 UI Performance
- [ ] Page transitions are smooth
- [ ] Dialog animations are smooth
- [ ] No layout shifts
- [ ] No janky scrolling

---

## 10. Accessibility Tests

**Status**: `pending`  
**Progress**: 0% (0/15+)

### 10.1 Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Escape key closes dialogs
- [ ] Enter key submits forms

### 10.2 Screen Reader Support
- [ ] ARIA labels are present
- [ ] ARIA roles are correct
- [ ] ARIA states are updated
- [ ] Semantic HTML is used

### 10.3 Visual Accessibility
- [ ] Color contrast is sufficient
- [ ] Text is readable
- [ ] Icons have labels
- [ ] Focus indicators are visible

---

## 11. Cross-Platform Tests

**Status**: `pending`  
**Progress**: 0% (0/10+)

### 11.1 macOS Tests
- [ ] App works on macOS
- [ ] Keyboard shortcuts work (Cmd)
- [ ] Native dialogs work
- [ ] Menu bar works

### 11.2 Windows Tests
- [ ] App works on Windows
- [ ] Keyboard shortcuts work (Ctrl)
- [ ] Native dialogs work
- [ ] Taskbar works

### 11.3 Linux Tests
- [ ] App works on Linux
- [ ] Keyboard shortcuts work (Ctrl)
- [ ] Native dialogs work

---

## Test File Structure

```
tests/integration/
├── pages/
│   ├── homepage.spec.ts
│   ├── collections.spec.ts
│   ├── environments.spec.ts
│   ├── history.spec.ts
│   ├── settings.spec.ts
│   └── logs.spec.ts
├── components/
│   ├── request-builder.spec.ts
│   ├── params-tab.spec.ts
│   ├── headers-tab.spec.ts
│   ├── body-tab.spec.ts
│   ├── auth-tab.spec.ts
│   ├── response-tab.spec.ts
│   ├── sidebar.spec.ts
│   ├── collection-hierarchy.spec.ts
│   ├── navigation-bar.spec.ts
│   └── environment-switcher.spec.ts
├── interactions/
│   ├── keyboard-shortcuts.spec.ts
│   ├── drag-drop.spec.ts
│   └── form-validation.spec.ts
├── dialogs/
│   ├── save-request-dialog.spec.ts
│   ├── collection-form-dialog.spec.ts
│   ├── environment-form-dialog.spec.ts
│   └── promote-request-dialog.spec.ts
└── workflows/
    ├── create-request-workflow.spec.ts
    ├── collection-management-workflow.spec.ts
    └── environment-management-workflow.spec.ts
```

---

## Notes

- Update this file as tests are implemented
- Mark items as `[x]` when completed
- Update progress percentages after each test category
- Add notes for any blockers or issues encountered
- Reference test file names when creating tests

---

## Changelog

### 2025-01-27
- Initial test plan created
- All test categories documented
- Tracking structure established

