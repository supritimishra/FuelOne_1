const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Read .local.env to get DATABASE_URL
const envPath = path.join(__dirname, '..', '.local.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!dbUrl) {
    console.error('DATABASE_URL not found in .local.env');
    process.exit(1);
}

// Tenant ID from previous logs
const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
const tenantDbName = `tenant_${tenantId.replace(/-/g, '_')}`;

// Parse URL and construct config
const url = new URL(dbUrl);
const config = {
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: decodeURIComponent(url.password), // Decode password manually
    database: tenantDbName,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
};

console.log(`Connecting to database: ${config.database} on ${config.host} as ${config.user}`);

const client = new Client(config);

async function inspectConstraints() {
    try {
        await client.connect();
        console.log(`Connected to ${tenantDbName}`);

        const query = `
      SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='credit_customers';
    `;

        const res = await client.query(query);
        console.log('Foreign Keys referencing credit_customers:');
        console.table(res.rows);

    } catch (err) {
        console.error('Error inspecting constraints:', err);
    } finally {
        await client.end();
    }
}

inspectConstraints();
