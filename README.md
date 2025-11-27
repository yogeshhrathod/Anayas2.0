# Anayas - Desktop Application

A lightweight REST API Client built with Electron, React, TypeScript, and TailwindCSS for professional API testing and development.

## Features

### Core Features

- ✅ **Modern UI** - React + TailwindCSS + shadcn/ui components
- ✅ **Request Builder** - HTTP method selector, URL input, headers, body
- ✅ **Collections Management** - Organize API requests in collections
- ✅ **Environment Variables** - Quick environment switching with variables
- ✅ **Request History** - Complete history with search and filtering
- ✅ **Cross-Platform** - Works on macOS, Windows, and Linux
- ✅ **Real-time Response** - Live response viewing with syntax highlighting

### Key Capabilities

- Send HTTP requests (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Manage multiple environments with variables
- Store and organize requests in collections
- View complete request history
- Import/Export configurations
- Dark/Light theme support
- Comprehensive settings management

## Technology Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Monaco Editor** - JSON editing
- **Zustand** - State management
- **Lucide React** - Icons

### Backend

- **Electron 28** - Desktop framework
- **Node.js 20+** - Runtime
- **JSON Database** - Local data storage
- **Winston** - Logging
- **UUID** - Unique identifiers

### Build Tools

- **Vite** - Build tool
- **electron-builder** - Packaging
- **TypeScript** - Compilation

## Installation

### Prerequisites

- Node.js 20+ or Bun
- npm, yarn, or bun

### Install Dependencies

```bash
cd anayas
npm install
# or
bun install
```

## Development

### Run in Development Mode

```bash
npm run electron:dev
# or
bun run electron:dev
```

This will:

1. Start the Vite dev server
2. Launch Electron with hot reload
3. Open DevTools automatically

### Build for Production

```bash
# Build for current platform
npm run electron:build

# Build for specific platforms
npm run build:mac
npm run build:win
npm run build:linux
```

Built applications will be in the `release/` directory.

## Project Structure

```
anayas/
├── electron/                 # Main Process
│   ├── main.ts              # Electron entry point
│   ├── preload.ts           # Preload script (IPC bridge)
│   ├── database/            # JSON database
│   ├── ipc/                 # IPC handlers
│   └── services/            # Background services
├── src/                     # Renderer Process
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── store/               # Zustand state management
│   ├── lib/                 # Utilities
│   └── types/               # TypeScript types
├── build/                   # Build assets
└── release/                 # Built applications
```

## Usage

### Creating Collections

1. Navigate to Collections page
2. Click "Create Collection"
3. Enter name, description, and variables
4. Save your collection

### Building Requests

1. Go to Request Builder
2. Select HTTP method (GET, POST, etc.)
3. Enter URL
4. Add headers and body (JSON)
5. Click Send to execute

### Managing Environments

1. Go to Environments page
2. Create environments for different stages
3. Set variables like `base_url`, `api_key`
4. Switch between environments

### Viewing History

1. Navigate to History page
2. See all executed requests
3. Filter by method, status, or date
4. Re-run requests from history

## Configuration

### Environment Variables

Use `{{variableName}}` syntax in URLs and headers:

```json
{
  "base_url": "https://api.example.com",
  "api_key": "your-api-key"
}
```

### Settings

- Theme preferences (Light/Dark/System)
- Request timeout
- Follow redirects
- SSL verification
- Auto-save requests

## Development Guidelines

### Adding New Features

1. Define IPC handlers in `electron/ipc/handlers.ts`
2. Expose APIs in `electron/preload.ts`
3. Update Zustand store in `src/store/useStore.ts`
4. Create React components in `src/pages/` or `src/components/`

### Database Schema

The app uses a JSON-based database with the following collections:

- `environments` - Environment configurations
- `collections` - Request collections
- `requests` - Individual API requests
- `request_history` - Execution history
- `settings` - Application settings

### TypeScript

- Strict mode enabled
- All APIs are typed
- Use proper interfaces for data structures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the logs in the application

---

**Built with ❤️ using Electron, React, and TypeScript**
