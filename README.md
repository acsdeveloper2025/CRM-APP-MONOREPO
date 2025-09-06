# CRM Application (ACS) — Local Development (No Docker)

This repository contains a multi-app CRM stack:

- Backend API: `crm-backend` (Node.js/Express + PostgreSQL + Redis)
- Web Frontend: `crm-frontend` (React + Vite + TypeScript)
- Mobile App: `caseflow-mobile` (React Native/Capacitor)

Docker is no longer required for local development. Run all services directly on your machine.

## Prerequisites

- Node.js 18+
- npm 9+ (or Yarn/PNPM)
- PostgreSQL 14+
- Redis 7+

## Quick Start

### 1) Backend API (crm-backend)

```bash
cd CRM-BACKEND
npm install
cp .env.example .env
# Ensure DATABASE_URL points to your local PostgreSQL (localhost:5432)
# Ensure REDIS_URL is redis://localhost:6379

# Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start the server
npm run dev        # for development (nodemon)
# or
npm run build && npm start   # for a compiled run
```

Health check: http://localhost:3000/health

### 2) Web Frontend (crm-frontend)

```bash
cd CRM-FRONTEND
npm install
cp .env.example .env.local
# Set VITE_API_URL and VITE_WS_URL to http://localhost:3000
npm run dev
```

Frontend will be available at http://localhost:5173.

## Detailed Local Setup (SQL Server, Redis, Troubleshooting)

See the step-by-step guide with OS-specific notes:

- docs/LOCAL_SETUP.md

## Useful backend scripts

- `npm run dev` — start in development (ts-node + nodemon)
- `npm run build && npm start` — compile TypeScript and run Node.js
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — apply Prisma migrations (development)
- `npm run db:seed` — seed the database
- `npm run db:reset` — reset database and re-apply migrations
- `npm run test` — run backend tests

## 📚 Documentation

Comprehensive project documentation is organized in the `project-documentation/` directory:

- **[Project Documentation Index](project-documentation/README.md)** - Complete documentation overview
- **API Documentation** - API implementation, testing, and gap analysis reports
- **Database Reports** - Schema changes, migrations, and audit reports
- **System Reports** - Rate limiting, WebSocket, Docker, and port configuration
- **Audit Reports** - Codebase fixes, security audits, and compliance reports
- **Setup Guides** - Detailed setup instructions and troubleshooting guides

## Troubleshooting

- **Port conflicts**: Ensure ports 3000, 5173, 5174, 5432, 6379 are available
- **Database connection**: Verify PostgreSQL is running and credentials are correct
- **Redis connection**: Ensure Redis server is running on localhost:6379
- **Build errors**: Clear node_modules and reinstall dependencies

## Notes

- If Prisma type errors appear in dev, run `npm run db:generate` and restart `npm run dev`.
- Ensure PostgreSQL is reachable on `localhost:5432` and Redis on `localhost:6379`.
- PostgreSQL can be installed via Homebrew on macOS, apt on Linux, or downloaded from postgresql.org on Windows.
- For detailed setup instructions, see individual app README files and the [project documentation](project-documentation/README.md).

## 📚 Documentation

### Quick Start
- [Local Setup Guide](docs/LOCAL_SETUP.md) - Development environment setup
- [Project Documentation](project-documentation/README.md) - Complete documentation index

### Organized Documentation Structure
All project documentation has been organized into categories:

- **📊 [Comprehensive Reports](project-documentation/comprehensive-reports/)** - Major project overviews and audit reports
- **🔧 [Cleanup Scripts](project-documentation/scripts/cleanup/)** - Data maintenance and cleanup tools
- **🚀 [Deployment](project-documentation/deployment/)** - Production deployment guides
- **🗄️ [Database](project-documentation/database-reports/)** - Schema documentation and migration reports
- **🔌 [API Documentation](project-documentation/api-docs/)** - API endpoints and testing reports
- **🔍 [Audit Reports](project-documentation/audit-reports/)** - Code quality and fix reports
- **⚙️ [System Reports](project-documentation/system-reports/)** - Infrastructure and configuration
- **🚀 [Setup Guides](project-documentation/setup-guides/)** - Installation and configuration guides

### Quick Access
- **[Complete Documentation Index](project-documentation/DOCUMENTATION_INDEX.md)** - Full file listing with descriptions
- **[Cleanup Summary](project-documentation/scripts/cleanup/cleanup-summary.md)** - Recent data cleanup documentation

