
import { pool } from '../server/db.js';
import pg from 'pg';

async function main() {
    console.log('🔍 Checking nozzles...');

    const tenantRes = await pool.query(`SELECT id, organization_name, connection_string FROM tenants WHERE status = 'active'`);

    for (const tenant of tenantRes.rows) {
        console.log(`\nTenant: ${tenant.organization_name} (${tenant.id})`);
        const tenantPool = new pg.Pool({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        try {
            const res = await tenantPool.query(`SELECT id, nozzle_number, is_active, tank_id, pump_station, fuel_product_id, created_at FROM nozzles`);
            if (res.rows.length === 0) {
                console.log(`  ⚠️ No nozzles found.`);
            } else {
                console.log(`  ✅ Found ${res.rows.length} nozzles:`);
                res.rows.forEach(r => {
                    console.log(`    - Nozzle ${r.nozzle_number} (Active: ${r.is_active}, Tank: ${r.tank_id}, Product: ${r.fuel_product_id}) Created: ${r.created_at}`);
                });
            }

            // Also check tanks
            const tankRes = await tenantPool.query(`SELECT id, tank_number, fuel_product_id FROM tanks`);
            console.log(`  Found ${tankRes.rows.length} tanks:`);
            tankRes.rows.forEach(r => console.log(`    - Tank ${r.tank_number} (Product: ${r.fuel_product_id})`));

        } catch (e) {
            console.error(`  ❌ Failed: ${(e as Error).message}`);
        } finally {
            await tenantPool.end();
        }
    }
    await pool.end();
}

main().catch(console.error);
