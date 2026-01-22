# Local Development & Deployment Guide

This guide walks you through running the application locally first, then deploying to production.

## 🏠 Step 1: Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (or MongoDB if configured)
- Environment variables configured

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.local.env` file in the root directory with your local configuration:

```env
# Database
DATABASE_URL=your_local_database_url
# OR for MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here

# Server Port (optional, defaults to 5000)
PORT=5000

# Node Environment
NODE_ENV=development
```

### 3. Run Database Migrations (if using PostgreSQL)

```bash
npm run migrate
```

### 4. Start Local Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or your configured PORT).

**What this does:**
- Starts Express backend server
- Starts Vite dev server for frontend with hot reloading
- Enables development features and debugging

### 5. Verify Local Setup

- Open browser: `http://localhost:5000`
- Test API endpoints: `http://localhost:5000/api/test`
- Check that authentication works
- Verify database connections

---

## 🏗️ Step 2: Build for Production (Local Test)

Before deploying, test the production build locally:

### 1. Build the Application

```bash
npm run build
```

This will:
- Build the client (React app) → `dist/` directory
- Build the server (TypeScript) → `dist-server/` directory

### 2. Test Production Build Locally

```bash
npm run start
```

This runs the production server using the built files.

**Verify:**
- Application loads correctly
- All routes work
- API endpoints respond
- No console errors

---

## 🚀 Step 3: Deploy to Production

### Option A: Deploy to Render

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Configure Render Service:**
   - Go to your Render dashboard
   - Select your service
   - Set environment variables (see below)
   - Render will auto-deploy on push

3. **Required Environment Variables on Render:**
   ```env
   NODE_ENV=production
   JWT_SECRET=your_production_jwt_secret
   DATABASE_URL=your_production_database_url
   PORT=10000  # Render sets this automatically
   ```

4. **Build Command:** `npm run build`
5. **Start Command:** `npm run start`

### Option B: Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Vercel will auto-detect and deploy**
   - Uses `vercel-build` script: `npm run build`
   - Configured in `vercel.json`

3. **Set Environment Variables in Vercel Dashboard**

---

## 📋 Quick Reference Commands

### Development
```bash
# Start dev server
npm run dev

# Type check
npm run typecheck

# Lint code
npm run lint
```

### Building
```bash
# Build everything
npm run build

# Build client only
npm run build:client

# Build server only
npm run build:server
```

### Production
```bash
# Start production server (after build)
npm run start
```

### Database
```bash
# Run migrations
npm run migrate

# Run tenant migrations
npm run migrate:tenants
```

---

## 🔍 Troubleshooting

### Local Development Issues

**Port already in use:**
```bash
# Change PORT in .local.env
PORT=5001
```

**Database connection errors:**
- Verify `DATABASE_URL` or `MONGODB_URI` in `.local.env`
- Check database is running and accessible
- Verify network/firewall settings

**TypeScript errors:**
```bash
# Clear TypeScript cache and rebuild
npm run typecheck
```

### Build Issues

**Build fails:**
```bash
# Clean and rebuild
rm -rf dist dist-server node_modules/.vite
npm run build
```

**Missing dependencies:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues

**Render deployment fails:**
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure `NODE_ENV=production` is set
- Check that build command completes successfully

**Vercel deployment fails:**
- Check build logs in Vercel dashboard
- Verify `vercel.json` configuration
- Ensure all required environment variables are set

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Local development works (`npm run dev`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Production server runs locally (`npm run start`)
- [ ] All environment variables are configured
- [ ] Database migrations are up to date
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] All tests pass (if applicable)
- [ ] Code is committed and pushed to GitHub

---

## 📝 Notes

- **Local development** uses `.local.env` for environment variables
- **Production** uses environment variables set in your hosting platform
- Always test the production build locally before deploying
- Keep `JWT_SECRET` secure and different between dev/prod
- Database URLs should point to appropriate environments

---

## 🆘 Need Help?

- Check `RENDER_DEPLOYMENT_FIX.md` for Render-specific issues
- Review server logs for detailed error messages
- Check browser console for frontend errors
- Verify all environment variables are correctly set
