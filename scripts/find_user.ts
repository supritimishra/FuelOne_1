
import { pool } from '../server/db.js';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEARCH_EMAIL = process.argv[2] || 'suk@gmail.com';

async function main() {
    console.log(`🔍 Searching for user: ${SEARCH_EMAIL}`);

    // 1. Get all active tenants
    const tenantRes = await pool.query(`SELECT id, organization_name, connection_string, status FROM tenants WHERE status = 'active'`);
    const tenants = tenantRes.rows;
    console.log(`📂 Found ${tenants.length} active tenants.`);

    let foundUser = false;

    for (const tenant of tenants) {
        const tenantPool = new pg.Pool({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false },
        });

        try {
            const userRes = await tenantPool.query(`SELECT id, email, full_name FROM users WHERE LOWER(email) = LOWER($1)`, [SEARCH_EMAIL]);

            if (userRes.rows.length > 0) {
                foundUser = true;
                const user = userRes.rows[0];
                console.log(`✅ FOUND in tenant: "${tenant.organization_name}" (${tenant.id})`);
                console.log(`   User ID: ${user.id}`);
                console.log(`   Name: ${user.full_name}`);

                // 2. Check mapping in master
                const mapRes = await pool.query(`SELECT * FROM tenant_users WHERE tenant_id = $1 AND LOWER(user_email) = LOWER($2)`, [tenant.id, SEARCH_EMAIL]);
                if (mapRes.rows.length > 0) {
                    console.log(`   ✅ Mapped in master tenant_users (user_id: ${mapRes.rows[0].user_id})`);
                } else {
                    console.log(`   ❌ NOT MAPPED in master tenant_users! This is the issue.`);
                    console.log(`   👉 AUTO-FIX: Inserting mapping now...`);
                    await pool.query(
                        `INSERT INTO tenant_users (tenant_id, user_email, user_id) VALUES ($1, $2, $3)
                 ON CONFLICT (tenant_id, user_email) DO UPDATE SET user_id = EXCLUDED.user_id`,
                        [tenant.id, SEARCH_EMAIL, user.id]
                    );
                    console.log(`   ✅ Mapping inserted/updated successfully.`);
                }
            }
        } catch (err) {
            console.log(`⚠️ Error checking tenant ${tenant.organization_name}:`, (err as Error).message);
        } finally {
            await tenantPool.end();
        }
    }

    if (!foundUser) {
        console.log(`❌ User ${SEARCH_EMAIL} not found in any active tenant.`);
    }

    await pool.end();
}

main().catch(console.error);
