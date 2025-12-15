import { pool } from '../server/db.js';

async function checkAuditLogs() {
  console.log('🔍 Checking audit logs table...\n');

  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'developer_audit_logs'
      );
    `);

    if (!tableCheck.rows[0]?.exists) {
      console.error('❌ Table developer_audit_logs does not exist!');
      console.log('   Please run the migration: migrations/20250102_add_audit_logs.sql');
      process.exit(1);
    }

    console.log('✅ Table developer_audit_logs exists\n');

    // Count rows
    const countResult = await pool.query('SELECT COUNT(*) as count FROM developer_audit_logs');
    const rowCount = parseInt(countResult.rows[0]?.count || '0', 10);
    console.log(`📊 Total audit log entries: ${rowCount}\n`);

    if (rowCount > 0) {
      // Get recent entries
      const recentResult = await pool.query(`
        SELECT 
          developer_email,
          target_user_email,
          feature_key,
          action,
          created_at
        FROM developer_audit_logs
        ORDER BY created_at DESC
        LIMIT 10
      `);

      console.log('📝 Recent audit log entries (last 10):\n');
      recentResult.rows.forEach((row: any, idx: number) => {
        console.log(`${idx + 1}. [${row.created_at}] ${row.developer_email} → ${row.target_user_email}`);
        console.log(`   Feature: ${row.feature_key || 'N/A'}, Action: ${row.action}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No audit log entries found.');
      console.log('   This is normal if no feature changes have been made in Developer Mode yet.');
      console.log('   To generate audit logs:');
      console.log('   1. Go to Developer Mode → User Management');
      console.log('   2. Select a user (Jay, Rakhy, or Rick)');
      console.log('   3. Check/uncheck any feature');
      console.log('   4. Click "Save Changes"');
      console.log('   5. Come back to this script and run it again\n');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAuditLogs();

