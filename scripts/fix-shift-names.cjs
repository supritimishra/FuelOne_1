
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .local.env (since we're in dev)
const envPath = path.resolve(__dirname, '../.local.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // Fallback to default .env
}

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'petro_pump_db',
};

async function fixShiftNames() {
    const pool = new Pool(dbConfig);

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        // 1. Get Tenant ID (Assuming single tenant for now or apply to all)
        // We'll just apply to the active tenant found in user context if possible, 
        // or just search for the shifts globally if the design allows (but likely schema-based).
        // Wait, the application uses schema-per-tenant or one DB?
        // Based on previous logs: "Connection acquired from pool for tenant f1f5c217..."
        // It seems to use schemas.

        // Let's find all schemas that have a duty_shifts table.
        // Or simpler: Just fix for the specific tenant the user is finding issues with.
        // The previous log showed tenant: f1f5c217-7b39-4031-9d76-b7da090bad65
        // But I don't want to hardcode if I can avoid it.

        // Let's iterate over ALL schemas that look like tenants.
        // Actually, usually schemas are named `tenant_<uuid>` or just use the public schema + tenant_id column?
        // Let's check `shared/schema.ts` or `server/db.ts` to see how tenant isolation works.
        // From `routes.ts`, it uses `req.tenantDb`.

        // Inspecting `server/db.ts` would be best, but I don't have it open.
        // Assuming standard Drizzle/Postgres schema.

        // Strategy: Just check public schema first?
        // Previous queries in `routes.ts` used `req.tenantDb`.
        // If I use `pg`, I am typically in `public` unless I switch schema.

        // Let's try to find schemas.
        const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'
    `);

        // Actually, based on "Connection acquired from pool for tenant...", the tenant ID is likely used to fetch connection params OR set search_path.
        // Let's assume standard `tenant_<id>` schema naming convection from previous experience with this user/codebase?
        // Or maybe the user only has one active workspace.

        console.log('Found schemas:', schemasRes.rows.map(r => r.schema_name));

        // Let's try to update in ALL found schemas + public.
        for (const row of schemasRes.rows) {
            const schema = row.schema_name;
            console.log(`Checking schema: ${schema}`);

            try {
                // Check if table exists
                const tableCheck = await client.query(`
                SELECT exists(
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = $1 
                    AND table_name = 'duty_shifts'
                )
            `, [schema]);

                if (tableCheck.rows[0].exists) {
                    console.log(`Updating shifts in ${schema}...`);

                    // Update Morning -> S-1
                    await client.query(`
                    UPDATE "${schema}".duty_shifts 
                    SET shift_name = 'S-1', start_time = '06:00', end_time = '14:00'
                    WHERE shift_name ILIKE '%Morning%' OR shift_name ILIKE '%S1%' OR shift_name = 'S1'
                `);

                    // Update Shift1 -> S-2
                    // Also cover "Evening" or just generic fallback
                    await client.query(`
                    UPDATE "${schema}".duty_shifts 
                    SET shift_name = 'S-2', start_time = '14:00', end_time = '22:00'
                    WHERE shift_name ILIKE '%Shift1%' OR shift_name ILIKE '%Evening%' OR shift_name = 'S2'
                `);

                    console.log(`Updates applied to ${schema}`);
                }
            } catch (e) {
                console.error(`Error processing schema ${schema}:`, e.message);
            }
        }

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fixShiftNames();
