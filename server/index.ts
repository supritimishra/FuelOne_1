import "dotenv/config";
import { config } from "dotenv";
import path from "path";

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });
import express from "express";
import fs from 'fs';
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

console.log("!!! SERVER STARTING !!!");

// Simple request audit log to help diagnose timeouts (appends to server_requests.log)
const reqLogFile = path.resolve(process.cwd(), 'server_requests.log');
function auditReqToFile(req: any) {
  try {
    const entry = `${new Date().toISOString()} ${req.method} ${req.path} headers=${JSON.stringify(req.headers || {})}`;
    fs.appendFileSync(reqLogFile, entry + '\n');
  } catch (e) {
    // swallow logging errors
  }
}
app.use((req, res, next) => { auditReqToFile(req); next(); });

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

// Early trace: confirm POST /api/recoveries reaches server before auth/tenant
app.use((req, _res, next) => {
  try {
    if (req.method === 'POST' && req.path === '/api/recoveries') {
      console.log('[POST /api/recoveries] EARLY-PIPE received at', new Date().toISOString());
    }
  } catch { }
  next();
});

// Super simple health check BEFORE any middleware
app.get('/health', (req, res) => {
  console.log('✅ Health check endpoint hit!');
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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
    const { connectToMongo } = await import("./mongo.js");

    await connectToMongo();

    // Public endpoints (before authentication)
    app.get('/api/health', (req, res) => {
      res.json({ ok: true, service: "api", time: new Date().toISOString() });
    });

    app.get('/api/readiness', async (req, res) => {
      const { pool } = await import("./db.js");
      const started = Date.now();
      try {
        await pool.query('SELECT 1');
        const latencyMs = Date.now() - started;
        res.json({ ok: true, db: 'up', latencyMs });
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
          // Attach auth + tenant with caps
          await new Promise<void>((resolve, reject) =>
            authenticateToken(req as any, {} as any, (err?: any) => {
              if (err) reject(err);
              else resolve();
            })
          );

          // Tenant attach with 5s cap
          const attachPromise = new Promise<void>((resolve, reject) =>
            attachTenantDb(req as any, {} as any, (err?: any) => {
              if (err) reject(err);
              else resolve();
            })
          );
          await Promise.race([
            attachPromise,
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('TENANT_ATTACH_TIMEOUT')), 5000)),
          ]);

          const tenantDb = (req as any).tenantDb;
          if (!tenantDb) {
            warn('No tenantDb after attach; giving up for this request');
            return;
          }

          // Build INSERT SQL
          const body = req.body || {};
          const esc = (v: any) => (v === undefined || v === null || String(v).trim() === '' || String(v) === 'undefined' || String(v) === 'null')
            ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
          const num = (v: any, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
          const uuidVal = (v: any) => {
            if (!v || v === 'undefined' || v === 'null') return 'NULL';
            const str = String(v);
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str) ? `'${str}'` : 'NULL';
          };
          const computedCustomerName = body.customer_name && String(body.customer_name).trim() !== '' ? String(body.customer_name).trim() : null;
          const computedShift = (body.shift === 'S-1' || body.shift === 'S-2') ? body.shift : 'S-1';
          const received = num(body.received_amount, 0);
          const disc = num(body.discount, 0);
          const pending = num(body.pending_amount, 0);
          const balance = num(body.balance_amount, Math.max(0, pending - received - disc));
          const employeeId = body.employee_id || null;
          const employeeName = body.employee_name && String(body.employee_name).trim() !== '' ? String(body.employee_name).trim() : null;

          const sql = `
            INSERT INTO recoveries (
              credit_customer_id, customer_name, recovery_date, shift, employee_id, employee_name,
              received_amount, discount, pending_amount, balance_amount, payment_mode, notes
            )
            VALUES (
              ${uuidVal(body.credit_customer_id)}, ${esc(computedCustomerName)}, ${esc(body.recovery_date || new Date().toISOString().slice(0, 10))},
              ${esc(computedShift)}, ${uuidVal(employeeId)}, ${esc(employeeName)},
              ${received}, ${disc}, ${pending}, ${balance}, ${esc(body.payment_mode)}, ${esc(body.notes)}
            )
            RETURNING id
          `;

          // Retry up to 2 times on transient failures
          let attempt = 0;
          while (attempt < 3) {
            try {
              attempt += 1;
              log('Background insert attempt', attempt);
              const r: any = await tenantDb.execute(sql);
              const id = r?.rows ? r.rows[0]?.id : (Array.isArray(r) ? r[0]?.id : undefined);
              log('Background insert finished id:', id, 'in', Date.now() - start, 'ms');
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
    app.use("/api/auth", (await import("./auth-routes")).authRouter);

    // User management routes (no authentication required)
    app.use("/api/users", (await import("./routes/user-management")).userManagementRouter);

    // Developer mode / feature access routes
    try {
      app.use("/api/developer-mode", (await import("./routes/developer-mode")).developerModeRouter);
    } catch (e) { console.error("Failed to load developer-mode router", e); }

    try {
      app.use("/api/features", (await import("./routes/feature-access")).featureAccessRouter);
    } catch (e) { console.error("Failed to load feature-access router", e); }

    // MongoDB Master Data Routes (with authentication and tenant middleware)
    try {
      const { masterDataRouter } = await import("./routes/master-data-mongodb.js");
      app.use("/api", masterDataRouter);
      console.log("✅ MongoDB Master Data Routes loaded successfully");
    } catch (e) {
      console.error("❌ Failed to load MongoDB Master Data Routes:", e);
    }

    // API routes with authentication and tenant middleware
    try {
      const routesModule: any = await import("./routes");
      const mainRouter = routesModule && typeof routesModule.router === "function"
        ? routesModule.router
        : express.Router().use((req, res) => {
          console.warn("[server] Main API router missing, returning 501 for", req.method, req.path);
          res.status(501).json({ ok: false, error: "API router not configured" });
        });

      app.use("/api", authenticateToken, attachTenantDb, mainRouter);
    } catch (e) {
      console.error("[server] Failed to load main API router, mounting fallback handler:", e);
      const fallbackRouter = express.Router();
      fallbackRouter.use((req, res) => {
        res.status(501).json({ ok: false, error: "API router failed to load" });
      });
      app.use("/api", authenticateToken, attachTenantDb, fallbackRouter);
    }

    // TEMPORARILY DISABLE VITE FOR DEBUGGING
    // Vite dev server (middleware mode)
    // Completely disable HMR and WebSocket for TestSprite compatibility
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
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
      // Skip API routes
      if (req.path.startsWith('/api/')) {
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

    const server = app.listen(PORT, "0.0.0.0", async () => {
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
