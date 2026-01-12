const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const map = {};
  for (const l of lines) {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      map[k] = v;
    }
  }
  return map;
}

(async function main(){
  try {
    const repoRoot = path.resolve(__dirname, '..');
    // Prefer .env but fall back to .local.env for dev setups where developers use .local.env
    let envPath = path.join(repoRoot, '.env');
    if (!fs.existsSync(envPath)) {
      const alt = path.join(repoRoot, '.local.env');
      if (fs.existsSync(alt)) {
        console.log('.env not found, falling back to .local.env');
        envPath = alt;
      } else {
        console.error('.env or .local.env file not found at', repoRoot);
        process.exit(1);
      }
    }

    const env = loadEnv(envPath);
    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not found in .env');
      process.exit(1);
    }

    const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory not found at', migrationsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.toLowerCase().endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No .sql migration files found in', migrationsDir);
      process.exit(0);
    }

    console.log('Connecting to database...');
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    console.log('Connected.');

    for (const f of files) {
      const sqlPath = path.join(migrationsDir, f);
      console.log('Applying', f);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`Applied ${f}`);
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        // Non-fatal: skip migration if object/column already exists
        if (/already exists|duplicate column|column .* already exists/i.test(msg)) {
          await client.query('ROLLBACK').catch(() => {});
          console.warn(`Skipping ${f} due to non-fatal error: ${msg}`);
          continue;
        }

        await client.query('ROLLBACK').catch(() => {});
        console.error(`Failed applying ${f}:`, msg);
        await client.end();
        process.exit(2);
      }
    }

    console.log('All migrations applied successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration runner failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
