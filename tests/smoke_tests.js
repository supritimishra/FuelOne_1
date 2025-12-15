#!/usr/bin/env node
// Simple smoke test script for local server endpoints
// Usage: node tests/smoke_tests.js
const endpoints = [
  '/health',
  '/api/health',
  '/api/reports/receivables-payables',
  '/api/reports/revenue',
  '/api/reports/net-profit',
  '/api/reports/fuel-inventory-valuation',
  '/api/reports/inventory-valuation',
  '/api/reports/cashflow'
];

const base = process.env.BASE_URL || 'http://localhost:5000';
const fetch = globalThis.fetch || (await import('node-fetch')).default;

async function check(url) {
  try {
    const res = await fetch(base + url, { method: 'GET' });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch(e) {}
    console.log(`GET ${url} -> ${res.status}`);
    console.log(body);
    return res.ok;
  } catch (err) {
    console.error(`GET ${url} -> ERROR:`, err.message || err);
    return false;
  }
}

(async ()=>{
  console.log('Base URL:', base);
  let allOk = true;
  for (const e of endpoints) {
    const ok = await check(e);
    allOk = allOk && ok;
  }
  process.exit(allOk ? 0 : 2);
})();
