import "dotenv/config";
import { config } from "dotenv";
import path from "path";

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set Content Security Policy to allow necessary resources
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: http: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' ws: wss: https://rozgwrsgenmsixvrdvxu.supabase.co http://localhost:24678; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

// Auth routes
app.use("/api/auth", (await import("./auth-routes")).authRouter);

// API routes
app.use("/api", (await import("./routes")).router);

// Serve static files from public directory
app.use(express.static('public'));

// Simple SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, "localhost", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
