# 🤝 Contributing to PetroPal

Thank you for contributing to PetroPal! This guide will help you get started and ensure smooth collaboration with the team.

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Git
- PostgreSQL database access (via Supabase)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd PetroPal

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in your credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## 📋 Development Workflow

### 1. Before Starting Work

```bash
# Always pull latest changes
git pull origin main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-export-functionality`)
- `fix/` - Bug fixes (e.g., `fix/login-error-handling`)
- `refactor/` - Code refactoring (e.g., `refactor/api-routes`)
- `docs/` - Documentation updates (e.g., `docs/update-api-reference`)

### 3. Making Changes

- **Follow existing code style** - Use the same patterns you see in the codebase
- **Write clear commit messages** - Be descriptive about what changed
- **Update documentation** - If you add features, update relevant docs
- **Test your changes** - Run tests before committing

### 4. Code Style Guidelines

#### TypeScript/React
- Use TypeScript for all new code
- Use functional components with hooks
- Follow existing naming conventions (see PROJECT_STRUCTURE.md)
- Use meaningful variable and function names

#### Database
- Always use snake_case for database tables and columns
- Update `shared/schema.ts` when adding/changing tables
- Create migration files for schema changes
- Test migrations before committing

#### API Endpoints
- Follow RESTful conventions
- Use consistent response formats
- Add error handling
- Update `docs/API_REFERENCE.md` for new endpoints

### 5. Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests
npm test
```

**Before committing:**
- ✅ All tests pass
- ✅ No TypeScript errors (`npm run typecheck`)
- ✅ No linting errors (`npm run lint`)
- ✅ Code works in development

### 6. Committing Changes

```bash
# Stage your changes
git add .

# Commit with a clear message
git commit -m "feat: add export functionality to sales report"

# Push to your branch
git push origin feature/your-feature-name
```

#### Commit Message Format

Use conventional commits format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add customer export functionality
fix: resolve login authentication error
docs: update API reference for new endpoints
refactor: reorganize API route handlers
```

### 7. Pull Request Process

1. **Ensure your branch is up to date**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Create Pull Request**
   - Use clear title and description
   - Reference any related issues
   - List what was changed
   - Add screenshots if UI changes

3. **PR Checklist**
   - [ ] Code follows project style guidelines
   - [ ] Tests added/updated and passing
   - [ ] Documentation updated
   - [ ] No console errors or warnings
   - [ ] Migration files included if database changed
   - [ ] Environment variables documented if new ones added

4. **Code Review**
   - Address review comments promptly
   - Be open to feedback
   - Ask questions if unclear

## 📁 File Organization

### Adding a New Module

1. **Create page component**
   - `src/pages/ModuleName.tsx`

2. **Add route**
   - Update `src/App.tsx` with new route

3. **Create API endpoints**
   - Add to `server/routes.ts` or create in `server/routes/`

4. **Update database schema** (if needed)
   - Update `shared/schema.ts`
   - Create migration in `migrations/`

5. **Update documentation**
   - Add to `docs/API_REFERENCE.md`
   - Update `docs/DATABASE_REFERENCE.md` if schema changed

### Database Changes

1. **Update schema**
   - Modify `shared/schema.ts`

2. **Create migration**
   ```bash
   npm run db:push  # Auto-generate migration
   # OR manually create in migrations/
   ```

3. **Test migration**
   - Test on local database
   - Verify data integrity

4. **Document changes**
   - Update `docs/DATABASE_REFERENCE.md`

## 🐛 Reporting Issues

When reporting bugs:

1. **Check existing issues** - Don't duplicate
2. **Use issue template** - Provide all requested information
3. **Include:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs
   - Environment details
   - Screenshots if applicable

## 💡 Feature Requests

For new features:

1. **Check if already requested** - Search existing issues
2. **Describe the feature** - What problem does it solve?
3. **Provide use cases** - How would it be used?
4. **Consider implementation** - Any technical considerations?

## 📝 Documentation

When updating documentation:

- Keep it clear and concise
- Use examples where helpful
- Update related docs if needed
- Check for broken links

**Key documentation files:**
- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - Directory structure
- `docs/API_REFERENCE.md` - API endpoints
- `docs/DATABASE_REFERENCE.md` - Database schema
- `docs/SYSTEM_DOCUMENTATION.md` - Complete system guide

## 🔒 Security

- **Never commit secrets** - Use environment variables
- **Review dependencies** - Keep them updated
- **Report vulnerabilities** - Contact team lead immediately
- **Follow security best practices** - Validate inputs, sanitize outputs

## ✅ Code Review Guidelines

### As a Reviewer

- Be constructive and respectful
- Explain reasoning for suggestions
- Approve when code meets standards
- Test changes when possible

### As an Author

- Respond to all comments
- Don't take feedback personally
- Ask for clarification if needed
- Make requested changes promptly

## 🎯 Team Communication

- **Use clear commit messages** - Help team understand changes
- **Update documentation** - Help others understand your work
- **Ask questions** - Better to ask than assume
- **Share knowledge** - Help teammates learn

## 📞 Getting Help

1. **Check documentation first** - `docs/README.md`
2. **Search existing issues** - Your question might be answered
3. **Ask in team chat** - For quick questions
4. **Create an issue** - For bugs or feature requests

## 🙏 Thank You!

Your contributions make PetroPal better for everyone. Thank you for taking the time to contribute!

---

**Questions?** Check `PROJECT_STRUCTURE.md` or `docs/README.md` for more information.






