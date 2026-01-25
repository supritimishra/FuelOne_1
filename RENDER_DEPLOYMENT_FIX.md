# Render Deployment Authentication Fix

## Issues Fixed

### 1. ✅ Cookie Security Settings
**Problem:** Cookies were set with `secure: false`, which doesn't work on HTTPS (Render uses HTTPS).

**Fix:** Updated all cookie settings in `server/auth-routes.ts` to:
- Use `secure: true` in production (HTTPS required)
- Use `sameSite: 'none'` in production for cross-site compatibility
- Use `sameSite: 'lax'` in development
- Properly handle cookie domain for Render URLs

### 2. ✅ API Route Stubs Removed
**Problem:** Placeholder API route files (`api/auth/login.js` and `api/auth/me.js`) were interfering with the Express server routes.

**Fix:** Removed these stub files since the Express server handles all `/api/auth/*` routes directly.

### 3. ✅ Cookie Domain Configuration
**Problem:** Cookie domain wasn't properly configured for Render.

**Fix:** Updated `getCookieDomain()` function to handle Render URLs (returns `undefined` for Render, letting the browser handle it automatically).

## Required Environment Variables on Render

Make sure these environment variables are set in your Render dashboard:

### Required:
- `JWT_SECRET` - A secure random string for JWT token signing (e.g., generate with `openssl rand -hex 32`)
- `NODE_ENV=production` - This enables secure cookies and production settings
- `MONGODB_URI` - Your MongoDB connection string (if using MongoDB)
- `PORT` - Usually set automatically by Render, but can be explicitly set

### Optional (depending on your setup):
- `DATABASE_URL` - PostgreSQL connection string (if using Postgres instead of MongoDB)
- `COOKIE_DOMAIN` - Custom domain for cookies (usually not needed for Render)
- `AUTH_DEBUG=1` - Enable debug logging for authentication (set to `1` for debugging)

## Deployment Steps

1. **Set Environment Variables in Render:**
   - Go to your Render service dashboard
   - Navigate to "Environment" tab
   - Add all required environment variables listed above
   - **Important:** Set `NODE_ENV=production`

2. **Redeploy:**
   - Push your changes to the repository
   - Render will automatically redeploy, or manually trigger a redeploy

3. **Verify:**
   - Check that cookies are being set with `Secure` flag in browser DevTools
   - Test login functionality
   - Check server logs for any authentication errors

## Testing the Fix

After deployment, check:

1. **Browser DevTools → Application → Cookies:**
   - Cookie should have `Secure` flag checked
   - Cookie should have `SameSite=None` (or `Lax` if same-origin)
   - Cookie domain should be your Render domain

2. **Network Tab:**
   - Login request should return 200 (not 500)
   - `/api/auth/me` request should return 200 (not 401) after login
   - Cookies should be included in requests

## Common Issues

### Still getting 401 errors?
- Verify `JWT_SECRET` is set correctly
- Check that `NODE_ENV=production` is set
- Verify cookies are being sent in requests (check Network tab)

### Still getting 500 errors on login?
- Check MongoDB/PostgreSQL connection string is correct
- Verify database is accessible from Render
- Check server logs for specific error messages

### Cookies not being set?
- Ensure `NODE_ENV=production` is set
- Check that your Render URL uses HTTPS (it should by default)
- Verify cookie settings in browser DevTools

## Additional Notes

- The `sameSite: 'none'` setting requires `secure: true`, which is why both are needed for production
- Render automatically provides HTTPS, so secure cookies will work
- If you're using a custom domain, you may need to set `COOKIE_DOMAIN` environment variable
