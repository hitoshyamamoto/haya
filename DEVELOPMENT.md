# Development Setup Guide

## Prerequisites

Before you start working on Hayai, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** (for testing database containers)
- **Git**

## Installation

### Option 1: Using WSL (Recommended for Windows users)

1. Open WSL terminal
2. Navigate to your project directory:
   ```bash
   cd /home/hitoshi/Documents/github/hitoshyamamoto/haya
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Option 2: Using Windows PowerShell

1. Install Node.js for Windows from [nodejs.org](https://nodejs.org/)
2. Open PowerShell in your project directory
3. Install dependencies:
   ```powershell
   npm install
   ```

## Development Commands

```bash
# Install dependencies
npm install

# Start development mode with hot reload
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Format code
npm run format

# Lint code
npm run lint
```

## Testing Your CLI

After installation, you can test your CLI in development mode:

```bash
# Run the CLI in development mode
npm run dev -- --help

# Test the init command
npm run dev -- init

# Test other commands
npm run dev -- list
npm run dev -- start
npm run dev -- stop
```

## Project Structure

```
haya/
├── src/
│   ├── cli/                 # CLI interface
│   │   ├── index.ts         # Main CLI entry point
│   │   └── commands/        # Command implementations
│   │       ├── init.ts      # Database initialization
│   │       ├── start.ts     # Start containers
│   │       ├── stop.ts      # Stop containers
│   │       ├── list.ts      # List instances
│   │       ├── remove.ts    # Remove instances
│   │       ├── logs.ts      # Show logs
│   │       ├── studio.ts    # Admin dashboard
│   │       └── snapshot.ts  # Create snapshots
│   ├── core/                # Core engine logic
│   │   ├── types.ts         # Type definitions
│   │   ├── config.ts        # Configuration management
│   │   ├── docker.ts        # Docker integration
│   │   ├── port-manager.ts  # Port allocation
│   │   └── templates.ts     # Template generation
│   ├── templates/           # Database templates
│   ├── api/                 # Optional REST API
│   └── dashboard/           # Optional web dashboard
├── dist/                    # Compiled output
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── haya.config.yaml         # Global configuration
└── .gitignore               # Git ignore rules
```

## Next Steps

1. **Install dependencies** using one of the methods above
2. **Implement Docker integration** in `src/core/docker.ts`
3. **Create database templates** in `src/templates/`
4. **Test with real databases** using Docker
5. **Add more database engines** to the supported list
6. **Implement admin dashboard** features
7. **Add comprehensive tests**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Troubleshooting

### WSL Path Issues
If you encounter path issues with WSL, make sure you're working in the correct directory:
```bash
pwd  # Should show /home/hitoshi/Documents/github/hitoshyamamoto/haya
```

### Node.js Not Found
If Node.js is not found, install it:
- **WSL**: `sudo apt update && sudo apt install nodejs npm`
- **Windows**: Download from [nodejs.org](https://nodejs.org/)

### Docker Issues
Make sure Docker is running:
```bash
docker --version
docker ps
```

Ready to build the future of local database management! 🚀 