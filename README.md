# PetroPal - Petrol Pump Management System

A comprehensive management system for petrol pump operations including sales, inventory, employees, and financial tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (via Supabase)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in your credentials
# See docs/ENVIRONMENT_SETUP_GUIDE.md for details

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## 📁 Project Structure

For a detailed breakdown of the project structure, see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**

```
PetroPal/
├── src/              # Frontend React application
├── server/           # Backend Express server
├── shared/           # Shared schemas and types
├── migrations/       # Database migration files
├── docs/             # Project documentation
├── scripts/          # Utility scripts
├── tests/            # Test files
└── api/              # Vercel serverless functions
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests

## 📚 Documentation

Comprehensive documentation is available:

- **Project Structure** - `PROJECT_STRUCTURE.md` - Detailed directory guide
- **API Reference** - `docs/API_REFERENCE.md` - All API endpoints
- **Database Schema** - `docs/DATABASE_SCHEMA_DOCUMENTATION.md` - Database structure
- **System Architecture** - `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` - Architecture overview
- **Development Checklist** - `docs/DEVELOPMENT_CHECKLIST.md` - Development guidelines
- **Workflows** - `docs/WORKFLOWS_AND_FLOWS.md` - Business process flows
- **Documentation Index** - `docs/README.md` - Complete documentation navigation

## 🏗️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: JWT

## 👥 Team Collaboration

This project is maintained by a team of 4 developers.

### Essential Team Documents

- **[TEAM_GUIDE.md](./TEAM_GUIDE.md)** - Quick reference for daily workflow
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Detailed directory structure
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

### Quick Team Guidelines

1. Always pull before starting work
2. Create feature branches for new work
3. Run tests before committing
4. Update documentation when adding features
5. Follow naming conventions consistently

## 📝 License

Private project - All rights reserved

