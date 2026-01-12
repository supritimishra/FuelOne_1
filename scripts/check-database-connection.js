import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

const { Pool } = pkg;
dotenv.config({ path: '.local.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabaseConnection() {
  console.log('🔍 Checking Database Connection Health...');
  const report = {
    timestamp: new Date().toISOString(),
    connectionStatus: 'UNKNOWN',
    issues: [],
    warnings: [],
    recommendations: [],
    details: {}
  };

  try {
    // Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ Database connection successful (${connectionTime}ms)`);
    report.connectionStatus = 'HEALTHY';
    report.details.connectionTime = connectionTime;

    // Test connection pool
    console.log('\n2️⃣ Testing connection pool...');
    const poolStats = await pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    console.log(`📊 Connection pool stats:`, poolStats.rows[0]);
    report.details.poolStats = poolStats.rows[0];

    // Test critical tables
    console.log('\n3️⃣ Testing critical tables...');
    const criticalTables = [
      'users', 'employees', 'fuel_products', 'tanks', 'nozzles', 
      'credit_customers', 'credit_sales', 'guest_sales', 'recoveries', 
      'expenses', 'expense_types', 'daily_sale_rates', 'day_settlements'
    ];

    const tableResults = [];
    for (const table of criticalTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        console.log(`✅ ${table}: ${count} records`);
        tableResults.push({ table, status: 'OK', count });
      } catch (err) {
        console.error(`❌ ${table}: ${err.message}`);
        tableResults.push({ table, status: 'ERROR', error: err.message });
        report.issues.push(`Table ${table} is not accessible: ${err.message}`);
      }
    }
    report.details.tableResults = tableResults;

    // Test API endpoints that were failing
    console.log('\n4️⃣ Testing problematic API queries...');
    
    // Test expenses query
    try {
      const expensesResult = await pool.query(`
        SELECT e.id, e.expense_date, e.expense_type_id, et.expense_type_name as expense_type, 
               e.amount, e.description, e.employee_id, e.created_at
        FROM expenses e
        LEFT JOIN expense_types et ON e.expense_type_id = et.id
        ORDER BY e.created_at DESC 
        LIMIT 5
      `);
      console.log(`✅ Expenses query: ${expensesResult.rows.length} records`);
      report.details.expensesQuery = 'OK';
    } catch (err) {
      console.error(`❌ Expenses query failed: ${err.message}`);
      report.issues.push(`Expenses query failed: ${err.message}`);
      report.details.expensesQuery = err.message;
    }

    // Test tank transfers query
    try {
      const tankTransfersResult = await pool.query(`
        SELECT tt.id, tt.transfer_date, tt.from_tank_id, tt.to_tank_id, tt.amount, tt.created_at,
               ft.tank_number as from_tank_number, tt_to.tank_number as to_tank_number
        FROM tank_transfers tt
        LEFT JOIN tanks ft ON tt.from_tank_id = ft.id
        LEFT JOIN tanks tt_to ON tt.to_tank_id = tt_to.id
        ORDER BY tt.transfer_date DESC
        LIMIT 5
      `);
      console.log(`✅ Tank transfers query: ${tankTransfersResult.rows.length} records`);
      report.details.tankTransfersQuery = 'OK';
    } catch (err) {
      console.error(`❌ Tank transfers query failed: ${err.message}`);
      report.issues.push(`Tank transfers query failed: ${err.message}`);
      report.details.tankTransfersQuery = err.message;
    }

    // Test recoveries query
    try {
      const recoveriesResult = await pool.query(`
        SELECT r.id, r.recovery_date, r.credit_customer_id, r.received_amount, r.discount, r.created_at,
               cc.organization_name
        FROM recoveries r
        LEFT JOIN credit_customers cc ON r.credit_customer_id = cc.id
        ORDER BY r.recovery_date DESC
        LIMIT 5
      `);
      console.log(`✅ Recoveries query: ${recoveriesResult.rows.length} records`);
      report.details.recoveriesQuery = 'OK';
    } catch (err) {
      console.error(`❌ Recoveries query failed: ${err.message}`);
      report.issues.push(`Recoveries query failed: ${err.message}`);
      report.details.recoveriesQuery = err.message;
    }

    // Test database performance
    console.log('\n5️⃣ Testing database performance...');
    const performanceStart = Date.now();
    await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);
    const performanceTime = Date.now() - performanceStart;
    
    console.log(`✅ Performance query completed (${performanceTime}ms)`);
    report.details.performanceTime = performanceTime;

    if (performanceTime > 5000) {
      report.warnings.push('Database performance is slow (>5s for simple queries)');
    }

    // Generate recommendations
    if (report.issues.length === 0) {
      report.recommendations.push('Database is healthy - no issues detected');
    } else {
      report.recommendations.push('Fix the identified issues before proceeding');
    }

    if (report.warnings.length > 0) {
      report.recommendations.push('Monitor database performance and consider optimization');
    }

    report.recommendations.push('Run this check regularly to monitor database health');

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    report.connectionStatus = 'UNHEALTHY';
    report.issues.push(`Connection failed: ${error.message}`);
    report.recommendations.push('Check database URL and network connectivity');
  } finally {
    console.log('\n📋 DATABASE HEALTH SUMMARY');
    console.log('==========================');
    console.log(`Connection Status: ${report.connectionStatus}`);
    console.log(`Issues: ${report.issues.length}`);
    console.log(`Warnings: ${report.warnings.length}`);
    console.log(`Recommendations: ${report.recommendations.length}`);

    if (report.issues.length > 0) {
      console.log('\n🚨 Issues Found:');
      report.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      report.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Save detailed report
    fs.writeFileSync('database-connection-health.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to database-connection-health.json');

    await pool.end();
  }
}

checkDatabaseConnection();
