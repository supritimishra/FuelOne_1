# 📁 Project Structure Guide

This document explains the organization of the PetroPal project to help team members navigate and understand the codebase.

## 🗂️ Root Directory Overview

```
PetroPal/
├── 📄 Configuration Files
│   ├── package.json          # Dependencies and scripts
│   ├── tsconfig.json         # TypeScript config (root)
│   ├── tsconfig.app.json     # Frontend TypeScript config
│   ├── tsconfig.server.json  # Backend TypeScript config
│   ├── vite.config.ts        # Vite build configuration
│   ├── tailwind.config.ts    # Tailwind CSS configuration
│   ├── drizzle.config.ts     # Drizzle ORM configuration
│   ├── eslint.config.js      # ESLint configuration
│   ├── postcss.config.js     # PostCSS configuration
│   ├── vercel.json           # Vercel deployment config
│   └── components.json        # shadcn/ui components config
│
├── 📚 Documentation
│   ├── README.md             # Main project README
│   ├── PROJECT_STRUCTURE.md  # This file
│   └── docs/                 # Comprehensive documentation
│
├── 💻 Source Code
│   ├── src/                  # Frontend React application
│   ├── server/               # Backend Express server
│   └── shared/               # Shared code (schemas, types)
│
├── 🗄️ Database
│   ├── migrations/           # Database migration files
│   └── supabase/             # Supabase configuration
│
├── 🛠️ Utilities
│   ├── scripts/              # Utility and migration scripts
│   └── tests/                # Test files
│
├── 🌐 Deployment
│   └── api/                  # Vercel serverless functions
│
└── 📦 Build & Assets
    ├── public/               # Static assets
    ├── dist/                 # Frontend build output (gitignored)
    └── dist-server/          # Backend build output (gitignored)
```

---

## 📂 Detailed Directory Structure

### `/api` - Vercel Serverless Functions

```
api/
├── index.ts          # Main serverless function entry point
├── auth/             # Authentication endpoints
│   ├── login.js
│   ├── register.js
│   └── me.js
└── hello.js          # Test endpoint
```

**Key Points:**
- Used for Vercel serverless deployment
- Routes defined in `vercel.json`
- Alternative to Express server for serverless environments

---

### `/attached_assets` - Temporary Assets

```
attached_assets/
└── *.png, *.docx    # Temporary test/documentation assets
```

**Key Points:**
- Contains temporary images and documents
- May be used for testing or documentation
- Can be cleaned up periodically

---

### `/tmp` - Temporary Files

```
tmp/
└── run-dev.ps1      # Temporary development scripts
```

**Key Points:**
- Temporary scripts and files
- Not tracked in git
- Can be safely deleted

---

### `/testsprite_tests` - TestSprite Test Files

```
testsprite_tests/
├── *.py            # Python test files
├── *.json          # Test configuration
└── *.md            # Test documentation
```

**Key Points:**
- TestSprite automated testing files
- Generated test code and reports
- Can be regenerated if needed

---

### `/src` - Frontend Application

```
src/
├── pages/              # Page components (37 modules)
│   ├── Home.tsx       # Dashboard
│   ├── FuelProducts.tsx
│   ├── Lubricants.tsx
│   └── ...            # Other module pages
│
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   ├── forms/       # Form components
│   └── ...          # Other shared components
│
├── hooks/            # Custom React hooks
│   ├── useAuth.ts    # Authentication hook
│   └── ...
│
├── lib/              # Utilities and helpers
│   ├── utils.ts     # General utilities
│   ├── api.ts       # API client functions
│   └── ...
│
├── integrations/     # Third-party integrations
│   └── supabase/    # Supabase client
│
├── App.tsx          # Main app component with routing
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

**Key Points:**
- Each module has a corresponding page in `pages/`
- Reusable components go in `components/`
- Custom hooks in `hooks/` for shared logic
- API calls and utilities in `lib/`

---

### `/server` - Backend Server

```
server/
├── index.ts              # Express server setup
├── production.ts         # Production server entry
├── routes.ts             # All API route definitions
├── auth.ts               # Authentication middleware
├── db.ts                 # Database connection
│
├── routes/               # Route handlers (organized by feature)
│   ├── master-data.ts
│   ├── sales.ts
│   └── ...
│
├── middleware/           # Express middleware
│   ├── authorize.ts      # Authorization middleware
│   └── tenant.ts         # Multi-tenant middleware
│
├── services/             # Business logic services
│   └── ...
│
└── jobs/                 # Background jobs/schedulers
    └── cleanup-scheduler.ts
```

**Key Points:**
- Main server setup in `index.ts`
- Routes defined in `routes.ts` and organized in `routes/`
- Middleware for auth and tenant isolation
- Business logic in `services/`

---

### `/shared` - Shared Code

```
shared/
└── schema.ts    # Drizzle ORM database schema definitions
```

**Key Points:**
- Contains database schema used by both frontend and backend
- Single source of truth for database structure

---

### `/migrations` - Database Migrations

```
migrations/
├── 0000_jazzy_lucky_pierre.sql    # Initial schema
├── 0001_sturdy_zarda.sql         # Schema updates
├── 20250102_add_audit_logs.sql   # Feature migrations
├── 20250103_add_*.sql            # Various feature additions
├── add-guest-sales-fields.sql    # Field additions
└── meta/                         # Migration metadata
    ├── _journal.json
    └── *.json                    # Schema snapshots
```

**Key Points:**
- Numbered migrations (0000, 0001) are Drizzle-generated
- Date-prefixed migrations (20250102) are manual additions
- Always run migrations in order
- Use `npm run migrate` to apply migrations

---

### `/scripts` - Utility Scripts

```
scripts/
├── Database Scripts
│   ├── init-master-db.ts         # Initialize master database
│   ├── migrate-all-tenants.ts    # Multi-tenant migrations
│   └── run-*-migration.ts        # Specific migration runners
│
├── User Management
│   ├── create-admin-user.ts
│   ├── create-developer-user.ts
│   └── list-all-users.ts
│
├── Data Verification
│   ├── check-*.ts                # Various check scripts
│   └── verify-*.ts              # Verification scripts
│
└── Testing Scripts
    ├── smoke_*.cjs              # Smoke tests
    └── seed_*.cjs               # Data seeding scripts
```

**Key Points:**
- Scripts are organized by purpose
- Use TypeScript scripts for database operations
- Use CommonJS (.cjs) for test scripts
- Run with: `tsx scripts/script-name.ts`

---

### `/docs` - Documentation

```
docs/
├── README.md                        # Documentation index
├── SYSTEM_DOCUMENTATION.md          # Complete system guide
├── API_REFERENCE.md                 # API endpoint reference
├── DATABASE_REFERENCE.md            # Database schema docs
├── COLUMN_NAMING_REFERENCE.md       # Naming conventions
├── SYSTEM_ARCHITECTURE_DIAGRAMS.md  # Architecture diagrams
├── DEVELOPMENT_CHECKLIST.md         # Development guidelines
└── WORKFLOWS_AND_FLOWS.md           # Business process flows
```

**Key Points:**
- Start with `README.md` for navigation
- `API_REFERENCE.md` for quick API lookup
- `DATABASE_REFERENCE.md` for schema details
- `SYSTEM_DOCUMENTATION.md` for comprehensive understanding

---

### `/tests` - Test Files

```
tests/
├── unit/              # Unit tests
│   └── *.test.tsx
│
├── integration/       # Integration tests
│   └── *.test.ts
│
├── setup/            # Test setup files
│   └── ...
│
└── *.js              # E2E and smoke tests
```

**Key Points:**
- Unit tests for components/utilities
- Integration tests for API endpoints
- Run with: `npm run test:unit` or `npm run test:integration`

---

### `/public` - Static Assets

```
public/
├── brand-logo.png        # Application logo
├── brand-logo-16.png     # Favicon sizes
├── brand-logo-32.png
├── placeholder.svg       # Placeholder images
└── robots.txt           # SEO robots file
```

**Key Points:**
- Static files served directly
- Images, fonts, and other assets
- Referenced in code as `/filename.png`

---

## 🔑 Key Files to Know

### Configuration Files
- **`package.json`** - Dependencies and npm scripts
- **`vite.config.ts`** - Frontend build configuration
- **`drizzle.config.ts`** - Database ORM configuration
- **`vercel.json`** - Deployment configuration

### Entry Points
- **`src/main.tsx`** - Frontend entry point
- **`server/index.ts`** - Backend server entry point
- **`src/App.tsx`** - Main React app component

### Core Files
- **`shared/schema.ts`** - Database schema (single source of truth)
- **`server/routes.ts`** - All API routes
- **`server/auth.ts`** - Authentication logic

---

## 📋 Naming Conventions

### Files
- **Components**: PascalCase (e.g., `FuelProducts.tsx`)
- **Utilities**: camelCase (e.g., `apiClient.ts`)
- **Pages**: PascalCase matching route (e.g., `/fuel-products` → `FuelProducts.tsx`)

### Database
- **Tables**: snake_case (e.g., `fuel_products`)
- **Columns**: snake_case (e.g., `sale_date`)
- **Schema (Drizzle)**: camelCase (e.g., `fuelProducts`, `saleDate`)

### Code
- **Variables/Functions**: camelCase
- **Components**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

---

## 🚀 Common Workflows

### Adding a New Module
1. Create page in `src/pages/ModuleName.tsx`
2. Add route in `src/App.tsx`
3. Create API endpoints in `server/routes.ts`
4. Update database schema in `shared/schema.ts` if needed
5. Create migration in `migrations/` if schema changed
6. Update documentation in `docs/`

### Database Changes
1. Update `shared/schema.ts`
2. Generate migration: `npm run db:push` (or create manually)
3. Test migration locally
4. Commit migration file
5. Update `docs/DATABASE_REFERENCE.md`

### Adding a New API Endpoint
1. Add route handler in `server/routes/` or `server/routes.ts`
2. Add route definition in `server/routes.ts`
3. Update `docs/API_REFERENCE.md`
4. Add tests in `tests/integration/`

---

## 🗑️ Files/Folders to Ignore

These are build outputs or temporary files (already in `.gitignore`):
- `dist/` - Frontend build output
- `dist-server/` - Backend build output
- `node_modules/` - Dependencies
- `*.log` - Log files
- `.env*` - Environment variables
- `test-reports/` - Test output

---

## 👥 Team Collaboration Tips

1. **Always pull before starting work**
2. **Create feature branches** for new work
3. **Run tests** before committing
4. **Update documentation** when adding features
5. **Follow naming conventions** consistently
6. **Keep commits focused** and descriptive
7. **Review migration files** before running
8. **Check `docs/`** before asking questions

---

## 📞 Need Help?

1. Check `docs/README.md` for documentation index
2. Review `docs/SYSTEM_DOCUMENTATION.md` for system overview
3. Check `docs/API_REFERENCE.md` for API details
4. Review `docs/DATABASE_REFERENCE.md` for schema questions

---

**Last Updated:** January 2025  
**Maintained By:** PetroPal Development Team

