
import { Pool } from 'pg';
import { BASIC_FEATURES, ADVANCED_FEATURES } from './server/feature-defaults.js';

async function seedFeatures() {
    console.log("Seeding feature_permissions...");

    const masterPool = new Pool({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    });

    try {
        const tenants = await masterPool.query("SELECT id, organization_name, connection_string FROM tenants WHERE status = 'active'");
        if (tenants.rows.length === 0) {
            console.log("No active tenants found.");
            return;
        }

        for (const tenant of tenants.rows) {
            console.log(`Seeding tenant: ${tenant.organization_name} (${tenant.id})`);
            const pool = new Pool({
                connectionString: tenant.connection_string,
                ssl: { rejectUnauthorized: false },
            });

            try {
                // Create table if not exists
                await pool.query(`
          CREATE TABLE IF NOT EXISTS feature_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_key TEXT UNIQUE NOT NULL,
            label TEXT NOT NULL,
            description TEXT,
            feature_group TEXT NOT NULL,
            default_enabled BOOLEAN NOT NULL DEFAULT false
          )
        `);

                // Insert Basic Features
                for (const fk of BASIC_FEATURES) {
                    const label = fk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    await pool.query(`
            INSERT INTO feature_permissions (feature_key, label, description, feature_group, default_enabled)
            VALUES ($1, $2, 'Basic feature', 'basic', true)
            ON CONFLICT (feature_key) DO NOTHING
          `, [fk, label]);
                }

                // Insert Advanced Features
                for (const fk of ADVANCED_FEATURES) {
                    const label = fk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    await pool.query(`
            INSERT INTO feature_permissions (feature_key, label, description, feature_group, default_enabled)
            VALUES ($1, $2, 'Advanced feature', 'advanced', false)
            ON CONFLICT (feature_key) DO NOTHING
          `, [fk, label]);
                }

                const count = await pool.query('SELECT COUNT(*) FROM feature_permissions');
                console.log(`Seeded ${count.rows[0].count} features for tenant ${tenant.organization_name}`);

            } catch (e) {
                console.error(`Error seeding tenant ${tenant.id}:`, e.message);
            } finally {
                await pool.end();
            }
        }

    } catch (err) {
        console.error("Global error:", err);
    } finally {
        await masterPool.end();
    }
}

seedFeatures();
