# Anayas Development Plan & Timeline

## Phase 1: Foundation & Core Features ✅ COMPLETED

### 1.1 Project Setup ✅
- [x] Initialize Electron + React + TypeScript + Vite
- [x] Configure Tailwind CSS and shadcn/ui
- [x] Set up project structure
- [x] Create .cursorrules file
- [x] Configure TypeScript (strict mode)
- [x] Set up Electron TypeScript compilation
- [x] Create development scripts

### 1.2 Database & State Management ✅
- [x] Set up JSON Database (instead of Dexie.js/IndexedDB)
- [x] Define database schema (collections, requests, history, environments, settings, folders)
- [x] Create Zustand stores (request, collection, environment, history, settings)
- [x] Implement database initialization with default data
- [x] Add proper TypeScript types

### 1.3 UI Layout & Design System ✅
- [x] Create Arc browser-inspired layout
- [x] Implement collapsible sidebar
- [x] Build top bar with environment selector
- [x] Create tab management system
- [x] Set up shadcn/ui components
- [x] Configure theme system (light/dark/system)
- [x] Add CSS variables for theming
- [x] Implement basic animations

### 1.4 Request Builder (Basic) ✅
- [x] HTTP method selector (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- [x] URL input field
- [x] Send button with loading state
- [x] Copy as cURL button
- [x] Tabbed interface (Params, Headers, Body, Auth)
- [x] **Complete Params Editor** (key-value pairs with enable/disable)
- [x] **Complete Headers Editor** (with suggestions)
- [x] **Complete Body Editor** (JSON, Form Data, x-www-form-urlencoded)
- [x] **Complete Auth Panel** (Bearer, Basic, API Key)
- [x] **Integrate Monaco Editor** for code editing

### 1.5 HTTP Client Service ✅
- [x] Create Fetch-based HTTP client (instead of Axios)
- [x] Request/response interceptors
- [x] Timing metrics
- [x] Error handling (network, validation, auth, server)
- [x] Support for different authentication types
- [x] Proxy configuration support

### 1.6 Response Viewer (Basic) ✅
- [x] Status code display with color coding
- [x] Response time and size indicators
- [x] Tabbed interface (Body, Headers)
- [x] Copy buttons for response data
- [x] **Add syntax highlighting** (JSON, XML, HTML)
- [x] **JSON tree viewer** with collapsible nodes
- [x] **Search in response**

---

## Phase 2: Essential Features 🔄 IN PROGRESS (91% Complete)

### 2.1 Collections Management ✅ COMPLETED
- [x] **Create Collection** - CRUD operations
- [x] **Create Folders** - Nested folder support
- [x] **Add Request to Collection**
- [x] **Drag-and-Drop** - Reorganize requests and folders
- [x] **Collection Variables** - Variable management per collection
- [x] **Duplicate Collection**
- [x] **Delete Collection** (with confirmation)
- [x] **Collection Runner** - Execute all requests in sequence
- [x] **Collection Export/Import** - Export and import collections as JSON
- [x] **Collection Documentation** - Markdown notes
- [x] **Bulk Operations** - Deferred to Phase 4 (low priority)

**Timeline**: 3-4 days ✅ **COMPLETED**

### 2.2 Environment & Variables System ✅ COMPLETED
- [x] **Environment CRUD** - Create, edit, delete environments
- [x] **Environment Selector** - Quick switch in top bar
- [x] **Variable Editor** - Inline variable editing
- [x] **Variable Interpolation Engine** - Parse `{{variableName}}`
- [x] **Global Variables** - Available in all environments
- [x] **Environment-Specific Variables**
- [x] **Dynamic Variables**:
  - [x] `{{$timestamp}}`
  - [x] `{{$randomInt}}`
  - [x] `{{$guid}}`
  - [x] `{{$randomEmail}}`
- [ ] **Secrets Management** - Encrypted storage for sensitive data
- [ ] **Environment Inheritance** - Base + overrides
- [x] **Color Coding** - Visual distinction for environments
- [ ] **Variable from Response** - Extract and save from API response

**Timeline**: 3-4 days ✅ **COMPLETED**

### 2.3 Request History ✅ COMPLETED
- [x] **Auto-Save Requests** - Save all executed requests
- [x] **History Panel** - Chronological list with timestamps
- [x] **Search History** - Search by method, URL, status
- [x] **Filter History** - By date range, status code, method
- [x] **Group by Date** - Organize history by day
- [x] **Load from History** - Restore request from history
- [x] **Clear History** - All, by date, by status
- [x] **Export History** - Export as JSON
- [x] **History Limit** - Configurable max items (default 1000)
- [x] **Auto-Delete Old History** - Keep last N days

**Timeline**: 2-3 days ✅ **COMPLETED**

---

## Phase 3: Import/Export & Interoperability 🔄 IN PROGRESS (25% Complete)

### 3.1 cURL Support ✅ COMPLETED
- [x] **cURL Parser** - Parse cURL commands
  - [x] Parse method
  - [x] Parse URL
  - [x] Parse headers (-H)
  - [x] Parse data (-d, --data)
  - [x] Parse auth credentials
  - [ ] Parse proxy settings
  - [ ] Parse SSL options
- [x] **cURL Generator** - Export request as cURL
- [x] **Import from Clipboard** - Paste and parse cURL
- [x] **Bulk cURL Import** - Import multiple commands

**Timeline**: 2 days ✅ **COMPLETED**

### 3.2 Postman Collection Import/Export 📦 PLANNED
- [ ] **Postman v2.0 Importer**
- [ ] **Postman v2.1 Importer**
- [ ] **Parse Postman Variables**
- [ ] **Parse Postman Auth**
- [ ] **Parse Postman Scripts**
- [ ] **Export as Postman Format**
- [ ] **Batch Import** - Multiple collections

**Timeline**: 2-3 days

### 3.3 Additional Import Formats 📥 PLANNED
- [ ] **OpenAPI/Swagger Importer** - Generate requests from specs
  - [ ] OpenAPI 3.0
  - [ ] Swagger 2.0
  - [ ] Auto-generate variables from spec
- [ ] **Insomnia Collection Import**
- [ ] **HAR File Import** - HTTP Archive format
- [ ] **Postman to Collection** - Direct conversion

**Timeline**: 3-4 days

### 3.4 Code Generation 💻 PLANNED
- [ ] **Generate JavaScript** (fetch, axios)
- [ ] **Generate Python** (requests)
- [ ] **Generate Go**
- [ ] **Generate PHP** (cURL, Guzzle)
- [ ] **Generate Ruby** (Net::HTTP)
- [ ] **Generate Java** (OkHttp, HttpClient)
- [ ] **Generate C#** (HttpClient)
- [ ] **Generate Swift** (URLSession)
- [ ] **Generate Kotlin**
- [ ] **Generate Rust** (reqwest)

**Timeline**: 2-3 days

---

## Phase 4: Advanced Features 🔄 IN PROGRESS (40% Complete)

### 4.1 Sandbox Mode 📋 PLANNED
- [ ] **Toggle Sandbox Mode** - Per tab
- [ ] **Temporary Changes** - Don't save modifications
- [ ] **Visual Indicator** - Border or badge
- [ ] **Reset Button** - Instant revert to saved state
- [ ] **Discard Warning** - Prompt on tab close
- [ ] **Compare Changes** - Show diff from saved version

**Timeline**: 1-2 days

### 4.7 Bulk Operations (Deferred from Phase 2) 📋 PLANNED
- [ ] **Multi-Select UI** - Checkboxes for selecting multiple requests
- [ ] **Select All/Deselect All** - Quick selection controls
- [ ] **Bulk Delete** - Delete multiple requests at once
- [ ] **Bulk Move** - Move multiple requests to another collection/folder
- [ ] **Bulk Duplicate** - Duplicate multiple requests
- [ ] **Bulk Export** - Export multiple requests as collection
- [ ] **Bulk Property Edit** - Change properties (method, tags) for multiple requests

**Timeline**: 1-2 days  
**Priority**: Low (deferred from Phase 2 - not critical for MVP)

### 4.2 Keyboard Shortcuts 🔄 PARTIALLY COMPLETED
- [x] **Command Palette** (Cmd+K) - Quick actions
- [x] **New Request** (Cmd+N)
- [x] **Send Request** (Cmd+Enter)
- [x] **Save Request** (Cmd+S)
- [ ] **Save As** (Cmd+Shift+S)
- [x] **Settings** (Cmd+,)
- [x] **Toggle Sidebar** (Cmd+B)
- [x] **Focus URL** (Cmd+L)
- [x] **Edit Item** (Cmd+E) - Edit selected collection/folder/request
- [x] **Duplicate Request/Collection** (Cmd+D) - Duplicate selected item
- [x] **Delete Item** (Cmd+Backspace) - Delete selected item
- [x] **Export Item** (Cmd+Shift+E) - Export collection or request
- [x] **Import Item** (Cmd+Shift+I) - Import collection
- [x] **Add Request** (Cmd+R) - Add new request to collection
- [x] **Add Folder** (Cmd+Shift+N) - Add new folder
- [x] **New Collection** (Cmd+Shift+N) - Create new collection
- [ ] **Focus Environment** (Cmd+E) - Focus environment selector
- [ ] **Close Tab** (Cmd+W)
- [ ] **Close All Tabs** (Cmd+Shift+W)
- [ ] **Search in Response** (Cmd+F)
- [ ] **Switch Tabs** (Cmd+1-9)
- [ ] **Next Tab** (Cmd+Shift+])
- [ ] **Previous Tab** (Cmd+Shift+[)
- [ ] **Split View** (Cmd+\)
- [ ] **Shortcuts Customization** - Let users change shortcuts

**Timeline**: 2 days

### 4.3 Settings Panel 🔄 PARTIALLY COMPLETED
- [x] **General Settings**
  - [x] Language selection
  - [x] Auto-update toggle
  - [x] Default HTTP method
  - [x] Request timeout
  - [x] Follow redirects
  - [x] SSL verification
- [x] **Appearance Settings**
  - [x] Theme selector (Light, Dark, System, Custom)
  - [x] Import custom theme
  - [x] Font size adjustment
  - [x] Font family selection
  - [x] Enable/disable animations
  - [x] Reduce motion toggle
  - [x] Density (Compact/Comfortable)
- [ ] **Editor Settings**
  - [ ] Tab size (2/4/8)
  - [ ] Word wrap
  - [ ] Line numbers
  - [ ] Mini map
  - [ ] Auto-format JSON/XML
- [ ] **Network Settings**
  - [ ] Proxy configuration
  - [ ] Request timeout
  - [ ] Max redirects
  - [ ] Custom DNS
- [ ] **Privacy Settings**
  - [ ] Clear history on exit
  - [ ] Analytics opt-in/out
  - [ ] Crash reporting
- [x] **Storage Settings**
  - [x] Data location
  - [x] Export all data
  - [x] Import data
  - [x] Clear all data
- [ ] **Advanced Settings**
  - [ ] Developer tools toggle
  - [ ] Debug logging
  - [ ] Performance monitoring
  - [ ] Feature flags

**Timeline**: 3-4 days

### 4.4 VS Code-Style Theming ✅ COMPLETED
- [x] **Theme Engine** - JSON-based configuration
- [x] **Built-in Themes**:
  - [x] Light
  - [x] Dark
  - [x] High Contrast Light
  - [x] High Contrast Dark
  - [x] Dracula
  - [x] Monokai
  - [x] Nord
  - [x] Tokyo Night
  - [x] One Dark Pro
  - [x] Catppuccin
  - [x] Solarized Light/Dark
- [x] **Custom Theme Import** - From JSON
- [x] **Theme Editor** - Visual theme customization
- [x] **Live Preview** - See changes in real-time
- [x] **Export Theme** - Save custom themes
- [x] **Syntax Highlighting Themes** - For code editors

**Timeline**: 2-3 days ✅ **COMPLETED**

### 4.5 Performance Optimizations 🔄 PARTIALLY COMPLETED
- [x] **Lazy Loading** - Load components on demand ✅ **COMPLETED** (specs/003-performance-optimization-lazy-loading/)
- [ ] **Virtual Scrolling** - For large collections and responses
- [x] **Code Splitting** - Separate bundles for features
- [x] **Debounced Auto-save** - Save after 500ms inactivity
- [x] **Memoization** - React.memo for expensive components
- [x] **IndexedDB Indexing** - Fast queries (using JSON DB)
- [ ] **Worker Threads** - Heavy parsing in background
- [x] **Bundle Size Optimization** - Target <150MB installed
- [x] **Memory Management** - Cleanup on tab close
- [ ] **Response Streaming** - For large responses

**Timeline**: 2-3 days

### 4.6 UI Design System Alignment 🎨 📋 PLANNED
- [ ] **Shell Layout Alignment** - Align app shell with editor-style three/four-pane model (activity/navigation, sidebar, main stage, response stage)
- [ ] **Layout Modes** - Implement normal/write/debug modes with smooth transitions
- [ ] **Request Builder Alignment** - Match design system patterns (URL strip, compact tabs, table-like sections)
- [ ] **Response Visualization** - Align with design system (tabs, status/metrics bar, large JSON handling)
- [ ] **Virtualized JSON Viewer** - Implement virtualized viewer for large responses with in-pane search
- [ ] **Command Palette** - First-class command palette (Cmd/Ctrl+K) with fuzzy search and context awareness
- [ ] **Navigation & Sidebar** - Align NavigationBar and CollectionHierarchy with activity bar and tree patterns
- [ ] **Accessibility Improvements** - ARIA roles, focus management, keyboard navigation, semantic colors
- [ ] **Visual Polish** - Semantic color usage, density guidelines, micro-interactions

**Timeline**: 3-4 days  
**Spec**: `specs/012-ui-design-system-alignment/`  
**Status**: `planned` - Aligns UI with `ai-context/ui-design-system.md`

---

## Phase 5: Premium Features 📋 PLANNED (0% Complete)

### 5.1 Request Chaining & Scripting 🔗 PLANNED
- [ ] **Pre-request Scripts** - JavaScript execution before send
- [ ] **Post-request Scripts** - Process response
- [ ] **Test Scripts** - Assertions (chai-like syntax)
- [ ] **Variable Extraction** - From response to variables
- [ ] **Request Chaining** - Use response data in next request
- [ ] **Script Templates** - Common script patterns
- [ ] **Console Output** - Script logs and errors

**Timeline**: 3-4 days

### 5.2 Additional Protocols 🌐 PLANNED
- [ ] **WebSocket Support**
  - [ ] Connect to WebSocket
  - [ ] Send messages
  - [ ] Receive messages
  - [ ] Message history
- [ ] **GraphQL Explorer**
  - [ ] Query builder
  - [ ] Schema introspection
  - [ ] Variables panel
  - [ ] GraphQL Playground UI
- [ ] **SSE (Server-Sent Events)**
  - [ ] Connect to SSE endpoint
  - [ ] Display event stream
  - [ ] Event history
- [ ] **gRPC Support**
  - [ ] Protocol buffer testing
  - [ ] Service definition import

**Timeline**: 5-7 days

### 5.3 Mock Server 🎭 PLANNED
- [ ] **Create Mock Endpoint** - From saved response
- [ ] **Mock Server Runner** - Local server
- [ ] **Route Management** - Add/edit/delete routes
- [ ] **Response Customization** - Status, headers, body
- [ ] **Delay Simulation** - Add artificial delay
- [ ] **Conditional Responses** - Based on request data

**Timeline**: 3-4 days

### 5.4 API Testing & Monitoring 🧪 PLANNED
- [ ] **Test Suite Runner** - Execute test scripts
- [ ] **Assertions Library** - Built-in assertions
- [ ] **Test Reports** - Pass/fail results
- [ ] **Collection Runner** - Run entire collection
- [ ] **Request Scheduling** - Cron-like scheduled execution
- [ ] **API Monitoring** - Schedule requests and alert on failures
- [ ] **Performance Testing** - Basic load testing
- [ ] **Response Validation** - JSON Schema validation

**Timeline**: 4-5 days

---

## Phase 6: Collaboration & Productivity 📋 PLANNED (0% Complete)

### 6.1 Documentation Generator 📚 PLANNED
- [ ] **Auto-generate API Docs** - From collections
- [ ] **Markdown Export** - Documentation as markdown
- [ ] **HTML Export** - Static documentation site
- [ ] **OpenAPI Generator** - Create OpenAPI spec from collection
- [ ] **Request Notes** - Documentation per request
- [ ] **Examples** - Multiple response examples

**Timeline**: 2-3 days

### 6.2 Workspace Management 🗂️ PLANNED
- [ ] **Multiple Workspaces** - For different projects
- [ ] **Workspace Switcher** - Quick switch
- [ ] **Workspace Settings** - Per-workspace configuration
- [ ] **Import/Export Workspace** - Full workspace backup
- [ ] **Workspace Templates** - Starter templates

**Timeline**: 2 days

### 6.3 Collaboration (Future) 👥 PLANNED
- [ ] **Cloud Sync** - Sync collections across devices
- [ ] **Team Workspaces** - Shared collections
- [ ] **Real-time Collaboration** - Live editing
- [ ] **Comments** - On requests
- [ ] **Version Control** - Track changes
- [ ] **Share Request** - Generate shareable link

**Timeline**: 7-10 days (Phase 3)

---

## Phase 7: Visual API Flow (Phase 2 Feature) 🎯 PLANNED

### 7.1 Canvas Foundation 📋 PLANNED
- [ ] **Flow View Tab** - Add to collections
- [ ] **React Flow Integration** - Visual node editor
- [ ] **Drag-Drop API Nodes** - From collection to canvas
- [ ] **Node Types**:
  - [ ] Request nodes (HTTP calls)
  - [ ] Conditional nodes (if/else)
  - [ ] Loop nodes (iterate)
  - [ ] Delay nodes (wait)
  - [ ] Variable nodes (set/get)
- [ ] **Visual Connections** - Connect nodes with arrows
- [ ] **Flow Execution Engine** - Run entire flow
- [ ] **Variable Passing** - Between nodes
- [ ] **Flow Templates** - Common patterns
- [ ] **Export Flow** - As code or diagram
- [ ] **Flow Debugging** - Step through execution

**Timeline**: 10-14 days (Phase 2)

---

## Additional Tasks & Polish

### UI/UX Improvements 🎨 🔄 PARTIALLY COMPLETED
- [x] **Resizable Panels** - Implement proper panel resizing
- [x] **Keyboard Navigation** - Full keyboard support
- [ ] **Accessibility** - ARIA labels, screen reader support (see Phase 4.6 UI Design System Alignment)
- [x] **Tooltips** - Helpful hints throughout UI
- [x] **Empty States** - Better empty state designs
- [x] **Loading States** - Skeleton loaders
- [x] **Error States** - User-friendly error messages
- [x] **Success Animations** - Subtle feedback
- [ ] **Onboarding** - First-time user guide
- [ ] **Shortcuts Overlay** - Show available shortcuts
- [ ] **UI Design System Alignment** - Comprehensive alignment with design system (see Phase 4.6)

### Developer Experience 🛠️ 📋 PLANNED
- [ ] **Plugin System** - Allow community extensions
- [ ] **CLI Tool** - Command-line interface for CI/CD
- [ ] **Request Templates** - Boilerplates for common APIs
- [ ] **Response Transformers** - Modify response before display
- [ ] **Custom Validators** - Create custom validation rules
- [ ] **API Analytics** - Usage statistics and insights

### Quality Assurance 🔍 ✅ COMPLETED
- [x] **IPC Handler Tests** - 100% coverage (68 tests, 53 handlers)
- [x] **Component Integration Tests** - CollectionHierarchy, RequestBuilder, EnvironmentSwitcher, Sidebar (21 tests)
- [x] **E2E Tests** - Playwright tests (223+ tests across 35 files)
- [x] **Performance Tests** - Large datasets, concurrent operations, memory leak detection (14 tests)
- [x] **Data Flow Tests** - Complete UI → IPC → DB → UI verification
- [x] **Rendering Tests** - Component rendering, state updates, loading/error states
- [x] **Debugging Infrastructure** - Error reports, console logs, network activity, state capture
- [ ] **Accessibility Tests** - a11y compliance
- [ ] **Security Audit** - Review for vulnerabilities
- [x] **Code Coverage** - IPC handlers: 100%, Components: 90%+, Data flow: 100%

---

## Timeline Summary

### **Phase 1** (Foundation) - ✅ COMPLETED
- Duration: ~2 weeks
- Status: **100% Complete**

### **Phase 2** (Essential Features) - 🔄 IN PROGRESS
- Duration: ~2-3 weeks
- Status: **91% Complete**
- Priority: HIGH

### **Phase 3** (Import/Export) - 🔄 IN PROGRESS
- Duration: ~1-2 weeks
- Status: **25% Complete** (cURL Support completed)
- Priority: HIGH

### **Phase 4** (Advanced Features) - 🔄 IN PROGRESS
- Duration: ~2-3 weeks
- Status: **45% Complete** (UI Design System Alignment added)
- Priority: MEDIUM

### **Phase 5** (Premium Features) - 📋 PLANNED
- Duration: ~3-4 weeks
- Priority: MEDIUM

### **Phase 6** (Collaboration) - 📋 PLANNED
- Duration: ~1-2 weeks
- Priority: LOW (Future)

### **Phase 7** (Visual Flow Canvas) - 📋 PLANNED
- Duration: ~2-3 weeks
- Priority: LOW (Phase 2 Feature)

---

## **Total Estimated Timeline**: 12-16 weeks for MVP
## **Current Progress**: ~75% Complete

---

## Priority Matrix

### **Must Have (MVP)** 🔴
- ✅ Collections Management
- ✅ Environment & Variables
- ✅ Request History
- ✅ cURL Import/Export
- 🔄 Keyboard Shortcuts (Partial)
- 🔄 Settings Panel (Partial)

### **Should Have** 🟡
- 📋 Postman Import
- 📋 Code Generation
- 📋 Sandbox Mode
- ✅ Theme System
- 🔄 Performance Optimizations (Partial)
- 📋 Request Chaining

### **Nice to Have** 🟢
- 📋 WebSocket Support
- 📋 GraphQL Explorer
- 📋 Mock Server
- 📋 API Monitoring
- 📋 Documentation Generator
- 📋 Visual Flow Canvas

---

## Current Status Summary

### ✅ **COMPLETED FEATURES**
- **Core Foundation**: Electron + React + TypeScript setup
- **Database**: JSON-based storage with full CRUD operations
- **UI/UX**: Modern Arc-inspired interface with theming
- **Request Builder**: Complete HTTP client with all methods
- **Collections**: Full collection and folder management with drag-and-drop
- **Collection Runner**: Execute all requests in a collection sequentially
- **Collection Export/Import**: Export and import collections as JSON
- **Collection Documentation**: Markdown documentation editor
- **Environments**: Complete environment and variable system
- **Dynamic Variables**: `{{$timestamp}}`, `{{$randomInt}}`, `{{$guid}}`, `{{$randomEmail}}`
- **History**: Full request history with search and filtering
- **Theming**: Advanced VS Code-style theme system
- **Basic Settings**: Core application settings
- **Keyboard Shortcuts**: Comprehensive shortcut system including:
    - Global shortcuts (Cmd+K, Cmd+N, Cmd+B, etc.)
    - Item operations (Cmd+E edit, Cmd+D duplicate, Cmd+Backspace delete)
    - Export/Import (Cmd+Shift+E, Cmd+Shift+I)
    - Collection operations (Cmd+R add request, Cmd+Shift+N new folder/collection)
- **cURL Import/Export**: Full cURL command parsing and generation with bulk import support

### 🔄 **IN PROGRESS**
- **Keyboard Shortcuts**: Core shortcuts implemented (duplicate, edit, export/import), tab navigation and advanced shortcuts pending
- **Settings Panel**: Core settings done, editor/network/privacy/advanced settings pending
- **Performance**: Basic optimizations done, virtual scrolling and worker threads pending
- **Collections**: Complete (bulk operations deferred to Phase 4 as low priority)

### 📋 **NEXT PRIORITIES**
1. **Postman Collection Import** - Essential for user migration
2. **Code Generation** - High user value
3. **Sandbox Mode** - Important for experimentation
4. **Request Chaining & Scripting** - Advanced testing capabilities
5. **Additional Import Formats** - OpenAPI/Swagger, Insomnia, HAR

---

## Notes

- All checkboxes can be marked as completed during development
- Timeline estimates are approximate
- Priorities may shift based on user feedback
- Phase 7 (Visual Flow) is a future enhancement
- Some features may be implemented in parallel
- **Current MVP is 75% complete** with core functionality ready for production use
