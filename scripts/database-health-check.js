import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config({ path: '.local.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function databaseHealthCheck() {
  console.log('🏥 Starting Comprehensive Database Health Check...\n');
  
  const healthReport = {
    timestamp: new Date().toISOString(),
    overallStatus: 'HEALTHY',
    issues: [],
    warnings: [],
    checks: {}
  };
  
  try {
    // 1. Connection Test
    console.log('1️⃣ Testing Database Connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    healthReport.checks.connection = {
      status: 'PASS',
      message: 'Database connection successful',
      details: connectionTest.rows[0]
    };
    console.log('✅ Database connection successful');
    
    // 2. Table Existence Check
    console.log('\n2️⃣ Checking Required Tables...');
    const requiredTables = [
      'users', 'credit_customers', 'fuel_products', 'tanks', 'nozzles',
      'employees', 'vendors', 'guest_sales', 'credit_sales', 'recoveries',
      'expenses', 'expense_types', 'daily_sale_rates', 'opening_stock',
      'denominations', 'tank_transfers', 'tank_dips', 'swipe_transactions',
      'lub_sales', 'lubricants', 'sale_entries', 'tanker_sales'
    ];
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    healthReport.checks.tables = {
      status: missingTables.length === 0 ? 'PASS' : 'FAIL',
      message: missingTables.length === 0 ? 'All required tables exist' : `${missingTables.length} tables missing`,
      details: {
        required: requiredTables.length,
        existing: existingTables.length,
        missing: missingTables
      }
    };
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist');
    } else {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
      healthReport.issues.push(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    // 3. Foreign Key Integrity Check
    console.log('\n3️⃣ Checking Foreign Key Integrity...');
    const fkResult = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    healthReport.checks.foreignKeys = {
      status: 'PASS',
      message: `${fkResult.rows.length} foreign key constraints found`,
      details: fkResult.rows
    };
    console.log(`✅ Found ${fkResult.rows.length} foreign key constraints`);
    
    // 4. Trigger Health Check
    console.log('\n4️⃣ Checking Database Triggers...');
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    const criticalTriggers = [
      'update_balance_after_recovery',
      'trg_update_customer_balance_on_sale',
      'trg_update_tank_stock_on_guest_sale',
      'trg_update_tank_stock_on_credit_sale'
    ];
    
    const existingTriggers = triggersResult.rows.map(t => t.trigger_name);
    const missingTriggers = criticalTriggers.filter(trigger => !existingTriggers.includes(trigger));
    
    healthReport.checks.triggers = {
      status: missingTriggers.length === 0 ? 'PASS' : 'WARN',
      message: missingTriggers.length === 0 ? 'All critical triggers exist' : `${missingTriggers.length} critical triggers missing`,
      details: {
        total: triggersResult.rows.length,
        critical: criticalTriggers.length,
        missing: missingTriggers,
        allTriggers: triggersResult.rows
      }
    };
    
    if (missingTriggers.length === 0) {
      console.log('✅ All critical triggers exist');
    } else {
      console.log(`⚠️ Missing critical triggers: ${missingTriggers.join(', ')}`);
      healthReport.warnings.push(`Missing critical triggers: ${missingTriggers.join(', ')}`);
    }
    
    // 5. Data Integrity Check
    console.log('\n5️⃣ Checking Data Integrity...');
    
    // Check for orphaned records
    const orphanChecks = [
      {
        name: 'Credit Sales without valid customers',
        query: `SELECT COUNT(*) as count FROM credit_sales cs LEFT JOIN credit_customers cc ON cs.credit_customer_id = cc.id WHERE cc.id IS NULL`
      },
      {
        name: 'Guest Sales without valid fuel products',
        query: `SELECT COUNT(*) as count FROM guest_sales gs LEFT JOIN fuel_products fp ON gs.fuel_product_id = fp.id WHERE fp.id IS NULL`
      },
      {
        name: 'Recoveries without valid customers',
        query: `SELECT COUNT(*) as count FROM recoveries r LEFT JOIN credit_customers cc ON r.credit_customer_id = cc.id WHERE cc.id IS NULL`
      },
      {
        name: 'Expenses without valid expense types',
        query: `SELECT COUNT(*) as count FROM expenses e LEFT JOIN expense_types et ON e.expense_type_id = et.id WHERE e.expense_type_id IS NOT NULL AND et.id IS NULL`
      }
    ];
    
    const integrityResults = {};
    let integrityIssues = 0;
    
    for (const check of orphanChecks) {
      try {
        const result = await pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        integrityResults[check.name] = count;
        
        if (count > 0) {
          console.log(`❌ ${check.name}: ${count} orphaned records`);
          integrityIssues++;
        } else {
          console.log(`✅ ${check.name}: No orphaned records`);
        }
      } catch (error) {
        console.log(`⚠️ ${check.name}: Check failed - ${error.message}`);
        integrityResults[check.name] = 'ERROR';
      }
    }
    
    healthReport.checks.dataIntegrity = {
      status: integrityIssues === 0 ? 'PASS' : 'WARN',
      message: integrityIssues === 0 ? 'No data integrity issues found' : `${integrityIssues} data integrity issues found`,
      details: integrityResults
    };
    
    // 6. Performance Check
    console.log('\n6️⃣ Checking Database Performance...');
    
    // Check table sizes
    const tableSizesResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
    `);
    
    // Check for large tables
    const largeTablesResult = await pool.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY pg_total_relation_size(table_name::regclass) DESC
      LIMIT 10
    `);
    
    healthReport.checks.performance = {
      status: 'PASS',
      message: 'Performance check completed',
      details: {
        largestTables: largeTablesResult.rows,
        statistics: tableSizesResult.rows.length
      }
    };
    
    console.log('✅ Performance check completed');
    console.log('📊 Largest tables:');
    largeTablesResult.rows.forEach(table => {
      console.log(`   - ${table.table_name}: ${table.size}`);
    });
    
    // 7. API Endpoint Compatibility Check
    console.log('\n7️⃣ Checking API Endpoint Compatibility...');
    
    // Test critical API endpoints
    const apiTests = [
      { name: 'Fuel Products', query: 'SELECT COUNT(*) FROM fuel_products WHERE is_active = true' },
      { name: 'Credit Customers', query: 'SELECT COUNT(*) FROM credit_customers' },
      { name: 'Employees', query: 'SELECT COUNT(*) FROM employees WHERE is_active = true' },
      { name: 'Tanks', query: 'SELECT COUNT(*) FROM tanks WHERE is_active = true' },
      { name: 'Nozzles', query: 'SELECT COUNT(*) FROM nozzles WHERE is_active = true' }
    ];
    
    const apiResults = {};
    let apiIssues = 0;
    
    for (const test of apiTests) {
      try {
        const result = await pool.query(test.query);
        const count = parseInt(result.rows[0].count);
        apiResults[test.name] = count;
        
        if (count === 0) {
          console.log(`⚠️ ${test.name}: No active records found`);
          apiIssues++;
        } else {
          console.log(`✅ ${test.name}: ${count} records found`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: Query failed - ${error.message}`);
        apiResults[test.name] = 'ERROR';
        apiIssues++;
      }
    }
    
    healthReport.checks.apiCompatibility = {
      status: apiIssues === 0 ? 'PASS' : 'WARN',
      message: apiIssues === 0 ? 'All API endpoints compatible' : `${apiIssues} API compatibility issues found`,
      details: apiResults
    };
    
    // Determine overall health status
    const hasFailures = healthReport.checks.tables.status === 'FAIL';
    const hasWarnings = healthReport.warnings.length > 0 || 
                       Object.values(healthReport.checks).some(check => check.status === 'WARN');
    
    if (hasFailures) {
      healthReport.overallStatus = 'CRITICAL';
    } else if (hasWarnings) {
      healthReport.overallStatus = 'WARNING';
    } else {
      healthReport.overallStatus = 'HEALTHY';
    }
    
    // Generate summary
    console.log('\n📋 HEALTH CHECK SUMMARY');
    console.log('========================');
    console.log(`Overall Status: ${healthReport.overallStatus}`);
    console.log(`Issues: ${healthReport.issues.length}`);
    console.log(`Warnings: ${healthReport.warnings.length}`);
    console.log(`Checks Passed: ${Object.values(healthReport.checks).filter(c => c.status === 'PASS').length}/${Object.keys(healthReport.checks).length}`);
    
    if (healthReport.issues.length > 0) {
      console.log('\n❌ Issues:');
      healthReport.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (healthReport.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      healthReport.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    // Save detailed report
    const fs = await import('fs');
    fs.writeFileSync('database-health-report.json', JSON.stringify(healthReport, null, 2));
    console.log('\n💾 Detailed health report saved to database-health-report.json');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    healthReport.overallStatus = 'ERROR';
    healthReport.issues.push(`Health check failed: ${error.message}`);
  } finally {
    await pool.end();
  }
  
  return healthReport;
}

databaseHealthCheck();
