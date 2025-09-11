# Froemic Workspace Starter - Module 0

A multi-tenant coding agent starter built with Mastra, React, ElectricSQL, and modern TypeScript. This Module 0 implementation provides a solid foundation with authentication, real-time data synchronization, and AI-powered workflows.

## 🏗️ Architecture

- **Frontend**: React 18+ SPA with Vite, TypeScript, React Router, and shadcn/ui
- **Backend**: Mastra AI workflows with Hono HTTP server and Postgres storage
- **Database**: PostgreSQL with logical replication for ElectricSQL
- **Sync**: ElectricSQL for real-time client-server synchronization via proxy-auth pattern  
- **ORM**: Drizzle ORM with TypeScript-first database access
- **Auth**: Session-based authentication with httpOnly cookies and JWT
- **Storage**: MinIO (S3-compatible) ready for future modules
- **Email**: Resend integration ready for future modules

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### 1. Setup Environment

```bash
# Clone and setup
git clone <your-repo>
cd froemic-workspace-starter

# Copy environment variables
cp .env.example .env

# Install dependencies
pnpm install
```

### 2. Start Infrastructure

```bash
# Start Postgres, ElectricSQL, and MinIO
docker-compose up -d

# Wait for services to be healthy (check with docker-compose ps)
```

### 3. Setup Database

```bash
# Generate and run migrations
pnpm --filter api db:generate
pnpm --filter api db:migrate
```

### 4. Start Development

```bash
# Start both API and client in development mode
pnpm dev

# Or start individually:
# pnpm --filter api dev      # Backend on port 4000
# pnpm --filter client dev   # Frontend on port 5173
```

## 📁 Project Structure

```
froemic-workspace-starter/
├── api/                          # Backend workspace
│   ├── src/
│   │   ├── db/                   # Database schema and connection
│   │   ├── lib/                  # Auth utilities
│   │   ├── middleware/           # Hono middleware
│   │   ├── routes/               # API endpoints
│   │   ├── workflows/            # Mastra AI workflows
│   │   └── scripts/              # Database utilities
│   ├── migrations/               # Drizzle migrations
│   └── mastra.config.ts         # Mastra configuration
├── client/                       # Frontend workspace
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── contexts/             # React contexts
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utilities and API client
│   │   └── pages/                # Route components
│   └── vite.config.ts           # Vite configuration
├── docker-compose.yml           # Infrastructure services
└── .env                         # Environment variables
```

## 🔑 Environment Variables

Key environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5433/froemic_db"

# ElectricSQL (internal)
ELECTRIC_URL="http://localhost:3001"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
COOKIE_NAME="froemic_session"

# Backend
MASTRA_PORT="4000"

# Client
VITE_API_BASE="http://localhost:4000"
```

## 📋 Module 0 Features

### ✅ Authentication
- User registration with email/password
- Session-based login with httpOnly cookies
- Protected routes with automatic redirects
- Session persistence across page refreshes

### ✅ AI Workflows  
- Mastra-powered "tell me a joke" workflow
- Postgres storage adapter integration
- Workflow results persisted to database

### ✅ Real-time Sync
- ElectricSQL shapes for live data synchronization
- Backend proxy-auth endpoint with user scoping
- Client never directly accesses Electric service
- Auto-updating jokes list without manual refresh

### ✅ Database & ORM
- PostgreSQL with logical replication enabled
- Drizzle ORM with TypeScript-first schema
- Migration system with version control
- Tables: Users, Sessions, Jokes

### ✅ Modern Frontend
- React 18 with TypeScript and Vite
- shadcn/ui component library with Tailwind CSS
- React Router with protected route patterns
- Real-time connection status indicators

## 🧪 Manual QA Checklist

### Server & Infrastructure
- [ ] Backend starts successfully with Mastra + Hono
- [ ] Postgres connects and migrations are applied
- [ ] ElectricSQL service runs and is healthy
- [ ] Electric service not directly accessible from client

### Authentication Flow
- [ ] New user can register with email/password
- [ ] User entry appears in database after registration
- [ ] User can log in with correct credentials
- [ ] Session cookie is set and persists across page refreshes
- [ ] User can log out and session is cleared
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Users remain logged in after browser refresh

### Workflow & Data Sync
- [ ] Authenticated user can trigger "tell me a joke" 
- [ ] Generated joke is stored in jokes table with correct user_id
- [ ] Jokes list updates automatically without manual refresh (ElectricSQL)
- [ ] Multiple users see only their own jokes
- [ ] Real-time sync indicator shows connection status

### Client UX
- [ ] Registration page works with validation
- [ ] Login page works with error handling
- [ ] Dashboard accessible only when authenticated
- [ ] Logout button clears session and redirects to login
- [ ] UI components render properly with shadcn/ui styling

## 🛠️ Development Commands

```bash
# Root level
pnpm dev              # Start both API and client
pnpm build            # Build both workspaces
pnpm lint             # Lint both workspaces
pnpm typecheck        # Type check both workspaces

# API workspace
pnpm --filter api dev         # Start API server
pnpm --filter api build       # Build API
pnpm --filter api db:generate # Generate migrations
pnpm --filter api db:migrate  # Run migrations
pnpm --filter api db:reset    # Reset database data

# Client workspace  
pnpm --filter client dev      # Start dev server
pnpm --filter client build    # Build for production
pnpm --filter client preview  # Preview production build
```

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check if Postgres is running
docker-compose ps

# View Postgres logs
docker-compose logs postgres

# Recreate database
docker-compose down
docker volume rm froemic-workspace-starter_postgres_data
docker-compose up -d
pnpm --filter api db:migrate
```

### ElectricSQL Sync Issues
```bash
# Check Electric service status
docker-compose logs electric

# Test Electric health endpoint (should not be publicly accessible)
curl http://localhost:3001/health

# Test backend proxy endpoint (requires authentication)
curl -X GET http://localhost:4000/electric/v1/shape?table=jokes
```

### Frontend Build Issues
```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Reinstall dependencies
pnpm install

# Check TypeScript compilation
pnpm --filter client typecheck
```

## 🔄 Data Flow

1. **Authentication**: Client authenticates via API, receives httpOnly cookie
2. **Writes**: All data writes go through backend API endpoints
3. **AI Workflows**: Backend triggers Mastra workflows, stores results in Postgres  
4. **Reads**: Client connects to ElectricSQL shapes via backend proxy-auth
5. **Real-time Updates**: ElectricSQL automatically syncs database changes to client
6. **Security**: Electric service not directly accessible; all access via authenticated proxy

## 🚧 Future Modules

- **Module 1**: Multi-tenant workspaces, roles/permissions, invitations, email integration
- **Module 2**: Enterprise audit logging with platform/org-level views  
- **Module 3**: Notification system with inbox UX and email preferences
- **Module 4**: AI-powered idea evaluation with scorecards and workflows

## 📚 Technology Stack

- **Mastra** - AI agent framework with workflow orchestration
- **Hono** - Fast, lightweight HTTP server framework
- **ElectricSQL** - Real-time Postgres sync with offline-first capabilities
- **Drizzle ORM** - TypeScript-first SQL toolkit and query builder
- **React** - UI library with hooks and modern patterns
- **Vite** - Fast build tool and development server
- **shadcn/ui** - High-quality component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Zod** - TypeScript-first schema validation

## 📄 License

MIT
