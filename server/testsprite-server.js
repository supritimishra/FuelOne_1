#!/usr/bin/env node

/**
 * TestSprite Static Server
 * Serves the built application for TestSprite testing without Vite dev server issues
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API routes (same as main server)
app.use("/api/auth", (await import("./auth-routes.js")).authRouter);
app.use("/api", (await import("./routes.js")).router);

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, 'localhost', () => {
  console.log(`TestSprite Static Server running on http://localhost:${PORT}`);
  console.log('✅ No WebSocket issues - perfect for TestSprite testing!');
});
