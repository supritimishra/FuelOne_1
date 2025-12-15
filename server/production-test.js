#!/usr/bin/env node

import { createServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001', // Backend API server
  changeOrigin: true,
  secure: false,
}));

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, 'localhost', () => {
  console.log(`Production server running on http://localhost:${PORT}`);
  console.log('✅ No WebSocket connections - TestSprite compatible');
});
