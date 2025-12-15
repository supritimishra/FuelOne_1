# 👥 Team Collaboration Guide

Quick reference guide for the PetroPal development team (4 members).

## 🚀 Quick Start for New Team Members

### Day 1: Setup
1. Clone repository
2. Run `npm install`
3. Set up `.env` file (ask team lead for credentials)
4. Run `npm run migrate`
5. Start with `npm run dev`
6. Read `PROJECT_STRUCTURE.md`

### Day 2: Understanding
1. Read `docs/README.md` - Documentation index
2. Review `docs/SYSTEM_DOCUMENTATION.md` - System overview
3. Check `docs/API_REFERENCE.md` - API endpoints
4. Explore `src/pages/` - See existing modules

### Day 3: First Contribution
1. Pick a small task
2. Create feature branch
3. Make changes
4. Test locally
5. Create pull request

---

## 📋 Daily Workflow

### Morning Routine
```bash
# 1. Pull latest changes
git pull origin main

# 2. Check for updates
npm install  # If package.json changed

# 3. Start development
npm run dev
```

### Before Starting Work
- [ ] Pull latest code
- [ ] Check current branch
- [ ] Review recent commits
- [ ] Check for open PRs

### During Work
- [ ] Write clear commit messages
- [ ] Test your changes
- [ ] Update docs if needed
- [ ] Don't commit secrets

### Before Committing
- [ ] Run `npm run typecheck` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors
- [ ] Test functionality manually
- [ ] Check console for errors

---

## 🔀 Git Workflow

### Branch Strategy
```
main (production-ready code)
  └── feature/your-feature
  └── fix/bug-description
  └── refactor/code-improvement
```

### Creating a Branch
```bash
# From main branch
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/add-export-button
```

### Committing
```bash
# Stage changes
git add .

# Commit with clear message
git commit -m "feat: add export button to sales report"

# Push to remote
git push origin feature/add-export-button
```

### Commit Message Format
```
<type>: <description>

Examples:
feat: add customer export functionality
fix: resolve login authentication error
docs: update API reference
refactor: reorganize API routes
```

---

## 🧪 Testing Checklist

Before submitting PR:
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Manual testing completed
- [ ] Edge cases considered
- [ ] Error handling added
- [ ] Documentation updated

---

## 📝 Code Review Process

### As an Author
1. Create PR with clear description
2. Link related issues
3. Add screenshots if UI changes
4. Respond to comments promptly
5. Make requested changes
6. Mark comments as resolved

### As a Reviewer
1. Review within 24 hours if possible
2. Be constructive and respectful
3. Test changes if possible
4. Approve or request changes clearly
5. Explain reasoning for suggestions

---

## 🗂️ File Organization Rules

### Where to Put New Code

**New Page/Module:**
- `src/pages/ModuleName.tsx`

**Reusable Component:**
- `src/components/ComponentName.tsx`

**API Endpoint:**
- `server/routes.ts` or `server/routes/feature.ts`

**Database Changes:**
- Update `shared/schema.ts`
- Create migration in `migrations/`

**Utility Function:**
- `src/lib/utils.ts` or create new file in `src/lib/`

**Custom Hook:**
- `src/hooks/useHookName.ts`

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Run `npm install`

### Issue: "TypeScript errors"
**Solution:** Run `npm run typecheck` to see all errors

### Issue: "Database connection failed"
**Solution:** Check `.env` file has correct `DATABASE_URL`

### Issue: "Port 5000 already in use"
**Solution:** Kill process or change port in `.env`

### Issue: "Migration failed"
**Solution:** Check migration file syntax, verify database connection

---

## 📚 Documentation Standards

### When to Update Docs

**Always update when:**
- Adding new API endpoint → `docs/API_REFERENCE.md`
- Changing database schema → `docs/DATABASE_REFERENCE.md`
- Adding new feature → Update relevant doc
- Changing workflow → `docs/WORKFLOWS_AND_FLOWS.md`

**Documentation files:**
- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - Directory structure
- `CONTRIBUTING.md` - Contribution guidelines
- `docs/` - Detailed documentation

---

## 🔐 Security Reminders

- ❌ **Never commit** `.env` files
- ❌ **Never commit** API keys or secrets
- ✅ **Always validate** user inputs
- ✅ **Always sanitize** database queries
- ✅ **Use environment variables** for config

---

## 💬 Communication

### When to Ask for Help
- Stuck for >30 minutes
- Unclear requirements
- Need code review
- Found a bug

### How to Ask
1. Check documentation first
2. Search existing issues
3. Ask in team chat with:
   - What you're trying to do
   - What you've tried
   - Error messages (if any)
   - Screenshots (if UI issue)

---

## ✅ PR Checklist

Before submitting:
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Migration files included (if DB changed)
- [ ] Environment variables documented (if new)
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

---

## 🎯 Best Practices

### Code Quality
- Write self-documenting code
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing patterns

### Database
- Always use migrations for schema changes
- Test migrations before committing
- Use transactions for multi-step operations
- Validate data before saving

### API Design
- Use consistent response formats
- Add proper error handling
- Validate all inputs
- Return appropriate HTTP status codes

### Frontend
- Use TypeScript types
- Handle loading and error states
- Optimize re-renders
- Follow component patterns

---

## 📞 Quick Reference

**Common Commands:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # Check TypeScript errors
npm run lint         # Run linter
npm run migrate      # Run database migrations
npm test             # Run tests
```

**Important Files:**
- `package.json` - Dependencies and scripts
- `shared/schema.ts` - Database schema
- `server/routes.ts` - API routes
- `src/App.tsx` - Frontend routing

**Documentation:**
- `PROJECT_STRUCTURE.md` - Directory structure
- `CONTRIBUTING.md` - Contribution guide
- `docs/README.md` - Documentation index

---

## 🎓 Learning Resources

1. **Project Documentation** - Start with `docs/README.md`
2. **Code Examples** - Look at existing pages in `src/pages/`
3. **API Examples** - Check `server/routes.ts`
4. **Database Schema** - Review `shared/schema.ts`

---

**Remember:** When in doubt, ask! Better to ask than to guess. 🚀

---

**Last Updated:** January 2025  
**Team Size:** 4 developers

