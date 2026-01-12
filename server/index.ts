import { config } from "dotenv";
import path from "path";

// Explicitly load .env file
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

import express from "express";
import fs from 'fs';
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";

const app = express();

// Hard runtime check for MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error("❌ FATAL: MONGODB_URI is not defined in the environment.");
  console.error(`Please ensure that ${envPath} exists and contains MONGODB_URI.`);
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 5001;

console.log("🚀 FuelOne Server Starting...");

// Per-request soft timeout to prevent client hangs (30s)
app.use((req, res, next) => {
  // Allow recoveries endpoints to manage their own timing/queuing
  if (req.path.startsWith('/api/recoveries')) {
    return next();
  }
  const TIMEOUT_MS = 30 * 1000;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    try {
      if (!res.headersSent) {
        console.warn(`⏱️ Request timeout for ${req.method} ${req.path}`);
        res.status(504).json({ ok: false, error: 'Request timed out' });
      }
    } catch (e) {
      console.error('Error sending timeout response', e);
    }
  }, TIMEOUT_MS);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));

  // If previous middleware already timed out, short-circuit
  if (timedOut) return;
  next();
});

// Super simple health check BEFORE any middleware
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌❌❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌❌❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set Content Security Policy to allow necessary resources
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: http: https:; " +
    // Widen connect-src to avoid local CSP blocks during debugging (allows API/HMR/devtools)
    "connect-src 'self' http://localhost:* http://127.0.0.1:* https://* ws://localhost:* ws://127.0.0.1:* ws://* wss://*; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  next();
});

// Wrap async operations in an async IIFE to handle top-level await properly
(async () => {
  try {
    // Import middleware
    const { authenticateToken } = await import("./auth.js");
    const { attachTenantDb } = await import("./middleware/tenant.js");
    const { connectToMongo } = await import("./db-mongo.js");

    // Connect to MongoDB (Global)
    await connectToMongo();

    // Public endpoints (before authentication)
    app.get('/api/health', (req, res) => {
      res.json({ ok: true, service: "api", time: new Date().toISOString() });
    });

    app.get('/api/readiness', async (req, res) => {
      try {
        const { connection } = await import("mongoose");
        // Many Mongoose versions export 'connection' as a named constant, 
        // but let's be super safe and check both.
        const mongooseModule: any = await import("mongoose");
        const state = (mongooseModule.connection || mongooseModule.default?.connection)?.readyState;

        // 1 = connected, 2 = connecting
        if (state === 1 || state === 2) {
          res.json({ ok: true, db: 'up', type: 'mongo', state });
        } else {
          res.status(503).json({ ok: false, db: 'down', type: 'mongo', state });
        }
      } catch (err) {
        res.status(503).json({ ok: false, db: 'down', error: String(err) });
      }
    });

    app.get("/api/test", (req, res) => {
      res.json({ message: "Test endpoint working", timestamp: new Date().toISOString() });
    });

    app.get("/api/public-test", (req, res) => {
      res.json({
        message: "Public test endpoint working",
        timestamp: new Date().toISOString(),
        headers: req.headers,
        query: req.query
      });
    });

    // Early 202 handler for recoveries: accept immediately, process in background
    app.post('/api/recoveries', express.json(), async (req, res, next) => {
      // Only trigger early path when client asks for fast confirm
      const fast = String(req.headers['x-fast-confirm'] || '').toLowerCase() === '1';
      if (!fast) return next();

      // Respond to client immediately
      try {
        res.status(202).json({ ok: true, queued: true });
      } catch { }

      // Background pipeline with retries
      (async () => {
        const start = Date.now();
        const log = (...args: any[]) => console.log('[EARLY-202]', ...args);
        const warn = (...args: any[]) => console.warn('[EARLY-202]', ...args);
        try {
          // Attach auth (skip tenant DB attach as we use Mongo)
          await new Promise<void>((resolve, reject) =>
            authenticateToken(req as any, {} as any, (err?: any) => {
              if (err) reject(err);
              else resolve();
            })
          );

          const user = (req as any).user;
          const tenantId = user?.tenantId;

          if (!tenantId) {
            warn('No tenantId found for recovery insert');
            return;
          }

          const body = req.body || {};
          const { Recovery } = await import("./models/Recovery.js");

          // Basic calculations
          const received = Number(body.received_amount) || 0;
          const disc = Number(body.discount) || 0;
          const pending = Number(body.pending_amount) || 0;
          const balance = Number(body.balance_amount) || Math.max(0, pending - received - disc);

          const payload = {
            tenantId,
            creditCustomerId: body.credit_customer_id,
            customerName: body.customer_name,
            recoveryDate: body.recovery_date || new Date().toISOString().slice(0, 10),
            shift: (body.shift === 'S-1' || body.shift === 'S-2') ? body.shift : 'S-1',
            employeeId: body.employee_id,
            employeeName: body.employee_name,
            receivedAmount: received,
            discount: disc,
            pendingAmount: pending,
            balanceAmount: balance,
            paymentMode: body.payment_mode,
            notes: body.notes,
            createdBy: user.userId
          };

          // Retry up to 2 times on transient failures
          let attempt = 0;
          while (attempt < 3) {
            try {
              attempt += 1;
              log('Background insert attempt', attempt);
              const r = await Recovery.create(payload);
              log('Background insert finished id:', r._id, 'in', Date.now() - start, 'ms');
              break;
            } catch (e: any) {
              const msg = String(e?.message || e || '');
              warn('Background insert failed attempt', attempt, '-', msg);
              if (attempt >= 3) break;
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }
        } catch (err: any) {
          warn('Background pipeline failed:', String(err?.message || err || ''));
        }
      })();
    });

    // Auth routes (no authentication required)
    console.log('🔹 Loading auth-routes...');
    app.use("/api/auth", (await import("./auth-routes")).authRouter);
    console.log('✅ Loaded auth-routes');

    // User management routes
    console.log('🔹 Loading user-management...');
    app.use("/api/users", (await import("./routes/user-management")).userManagementRouter);
    console.log('✅ Loaded user-management');


    // Developer mode
    console.log('🔹 Loading developer-mode...');
    app.use("/api/developer-mode", (await import("./routes/developer-mode")).developerModeRouter);
    console.log('✅ Loaded developer-mode');

    // Feature access
    console.log('🔹 Loading feature-access...');
    app.use("/api/features", (await import("./routes/feature-access")).featureAccessRouter);
    console.log('✅ Loaded feature-access');

    // Reports module
    console.log('🔹 Loading reports...');
    app.use("/api/reports", authenticateToken, attachTenantDb, (await import("./routes/reports")).reportsRouter);
    console.log('✅ Loaded reports');


    // API routes with authentication and tenant middleware
    try {
      console.log('🔹 Loading main routes...');
      const routesModule: any = await import("./routes");

      const mainRouter = routesModule && typeof routesModule.router === "function"
        ? routesModule.router
        : express.Router().use((req, res) => {
          console.warn("[server] Main API router missing, returning 501 for", req.method, req.path);
          res.status(501).json({ ok: false, error: "API router not configured" });
        });

      app.use("/api", authenticateToken, (req, res, next) => {
        const mongoPaths = ['/fuel-products', '/daily-rates', '/business-transactions', '/vendor-transactions', '/vendors', '/employees'];
        const normalizedPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;

        if (mongoPaths.some(p => normalizedPath.startsWith(p))) {
          return next();
        }
        attachTenantDb(req, res, next);
      }, mainRouter);

      // 404 catch-all for /api routes that were not handled by mainRouter
      app.use("/api", (req, res) => {
        if (process.env.AUTH_DEBUG === '1') console.log(`🚫 [API] 404 Not Found: ${req.method} ${req.path}`);
        res.status(404).json({ ok: false, error: `API endpoint ${req.method} ${req.path} not found or not yet migrated to MongoDB` });
      });
    } catch (e) {
      console.error("[server] Failed to load main API router, mounting fallback handler:", e);
      const fallbackRouter = express.Router();
      fallbackRouter.use((req, res) => {
        res.status(501).json({ ok: false, error: "API router failed to load" });
      });
      app.use("/api", authenticateToken, attachTenantDb, fallbackRouter);
    }

    // Create HTTP server instance first to pass to Vite
    const server = createServer(app);

    // TEMPORARILY DISABLE VITE FOR DEBUGGING
    // Vite dev server (middleware mode)
    // Completely disable HMR and WebSocket for TestSprite compatibility
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: server,
          clientPort: 5001
        },
      },
      // Use custom app type but allow Vite client for development
      appType: "custom",
      define: {
        // Keep Vite client enabled for proper frontend functionality
      },
      build: {
        rollupOptions: {
          // Allow Vite client to work properly
        },
      },
    });

    // Serve static files from public directory
    app.use(express.static('public'));

    // Force favicon to neutral placeholder and bust caches
    app.get('/favicon.ico', (req, res) => {
      try {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.type('image/svg+xml');
        res.sendFile(path.resolve(process.cwd(), 'public', 'placeholder.svg'));
      } catch (e) {
        res.status(204).end();
      }
    });
    app.get(['/favicon.svg', '/favicon.png', '/apple-touch-icon.png', '/apple-touch-icon.svg', '/app-icon.svg'], (req, res) => {
      try {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.type('image/svg+xml');
        res.sendFile(path.resolve(process.cwd(), 'public', 'placeholder.svg'));
      } catch (e) {
        res.status(204).end();
      }
    });

    // Brand logo with fallback to placeholder if file missing
    app.get(['/brand-logo.png', '/brand-logo-16.png', '/brand-logo-32.png'], (req, res) => {
      try {
        const filePath = path.resolve(process.cwd(), 'public', req.path.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          res.setHeader('Cache-Control', 'no-store, max-age=0');
          return res.sendFile(filePath);
        }
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.type('image/svg+xml');
        return res.sendFile(path.resolve(process.cwd(), 'public', 'placeholder.svg'));
      } catch (e) {
        res.status(204).end();
      }
    });

    app.use(vite.middlewares);

    // SPA fallback - serve index.html for all non-API routes
    app.use(async (req, res, next) => {
      // Skip API routes and files with extensions (assets, scripts)
      // This prevents main.tsx being served as index.html (causing "Unexpected token <")
      if (req.path.startsWith('/api/') || req.path.includes('.')) {
        return next();
      }

      try {
        // Let Vite handle the request
        const html = await vite.transformIndexHtml(req.url, `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Ramkrishna Service Centre - Petrol Pump Management</title>
              <meta name="description" content="Comprehensive petrol pump management system for Ramkrishna Service Centre. Manage daily sales, inventory, credit customers, and generate reports efficiently." />
              <meta name="author" content="Ramkrishna Service Centre" />
              <!-- Brand favicons -->
              <link rel="icon" type="image/png" sizes="32x32" href="/brand-logo.png" />
              <link rel="shortcut icon" type="image/png" href="/brand-logo.png" />
              <meta property="og:title" content="Ramkrishna Service Centre - Petrol Pump Management" />
              <meta property="og:description" content="Comprehensive petrol pump management system for Ramkrishna Service Centre" />
              <meta property="og:type" content="website" />
              <meta property="og:image" content="/og-default.png" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:image" content="/og-default.png" />
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error serving SPA:', error);
        next(error);
      }
    });

    server.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on http://localhost:${PORT}`);

      // Start background job schedulers
      try {
        const { startCleanupScheduler } = await import("./jobs/cleanup-scheduler.js");
        startCleanupScheduler();
        console.log("✅ Background job schedulers started");
      } catch (err: any) {
        console.warn("⚠️  Failed to start background job schedulers:", err?.message || err);
      }
    });

    server.on('error', (error: any) => {
      console.error('❌ Server failed to start:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Kill existing Node processes and try again.`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Fatal error during server startup:', error);
    process.exit(1);
  }
})();
