import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth routes
app.use("/api/auth", (await import("../server/auth-routes.js")).authRouter);

// API routes
app.use("/api", (await import("../server/routes.js")).router);

// Serve static files from dist directory
const distPath = join(__dirname, "../dist");
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

// For Vercel, export the app
export default app;
