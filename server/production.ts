// @ts-nocheck
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { authenticateToken } from "./auth.js";
import { attachTenantDb } from "./middleware/tenant.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Wrap async operations in an async IIFE
(async () => {
  try {
    const { connectToMongo } = await import("./mongo.js");
    await connectToMongo();

    // Auth routes (no authentication required)
    console.log("🔄 Auth routes module loading...");
    app.use("/api/auth", (await import("./auth-routes")).authRouter);
    console.log("✅ Auth router created");

    // User management routes (no authentication required)
    app.use("/api/users", (await import("./routes/user-management")).userManagementRouter);

    // Early 202 handler for recoveries in production: accept immediately, process in background
    app.post('/api/recoveries', express.json(), async (req, res, next) => {
      const fast = String(req.headers['x-fast-confirm'] || '').toLowerCase() === '1';
      if (!fast) return next();

      try {
        res.status(202).json({ ok: true, queued: true });
      } catch { }

      (async () => {
        const start = Date.now();
        const log = (...args: any[]) => console.log('[EARLY-202]', ...args);
        const warn = (...args: any[]) => console.warn('[EARLY-202]', ...args);
        try {
          const attachPromise = new Promise<void>((resolve: any) => attachTenantDb(req as any, {} as any, resolve));
          await Promise.race([
            attachPromise,
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('TENANT_ATTACH_TIMEOUT')), 5000)),
          ]);

          const tenantDb = (req as any).tenantDb;
          if (!tenantDb) {
            warn('No tenantDb after attach; giving up for this request');
            return;
          }

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

    // API routes with authentication and tenant middleware
    app.use("/api", authenticateToken, attachTenantDb, (await import("./routes")).router);

    // Serve static files from dist directory
    const distPath = join(__dirname, "../dist");
    app.use(express.static(distPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get(/^(?!\/api).*$/, (req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });

    // Only listen if not in Vercel environment
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Production server running on http://0.0.0.0:${PORT}`);

        // Log connection stats every 10 seconds
        setInterval(async () => {
          const { getConnectionStats } = await import("./services/db-connection-manager.js");
          const stats = getConnectionStats();
          console.log(`Connection stats: ${stats.activeTenants} active tenants`);
        }, 10000);
      });
    }
  } catch (error) {
    console.error('❌ Fatal error during server startup:', error);
    process.exit(1);
  }
})();

export default app;

