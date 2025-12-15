import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

const { Pool } = pkg;
dotenv.config({ path: '.local.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function auditDatabaseSchema() {
  console.log('🔍 Starting Database Schema Audit...\n');
  
  try {
    // Get all tables
    console.log('📋 Fetching all tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables:`, tables);
    console.log('');
    
    // Get columns for each table
    const schemaAudit = {};
    
    for (const tableName of tables) {
      console.log(`📊 Analyzing table: ${tableName}`);
      
      const columnsResult = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      schemaAudit[tableName] = columnsResult.rows;
      
      console.log(`  Columns (${columnsResult.rows.length}):`);
      columnsResult.rows.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
      console.log('');
    }
    
    // Check for missing tables that are referenced in API
    console.log('🚨 Checking for missing tables referenced in API...');
    const expectedTables = [
      'opening_stock',
      'denominations', 
      'expense_types',
      'sales_officer_inspections',
      'vendor_transactions',
      'business_transactions',
      'user_roles',
      'tank_transfers',
      'tank_dips'
    ];
    
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables);
    } else {
      console.log('✅ All expected tables exist');
    }
    console.log('');
    
    // Check for problematic columns
    console.log('🔍 Checking for column name issues...');
    
    // Check expenses table
    if (tables.includes('expenses')) {
      const expenseColumns = schemaAudit['expenses'].map(col => col.column_name);
      console.log('Expenses table columns:', expenseColumns);
      
      if (!expenseColumns.includes('expense_type_id')) {
        console.log('❌ expenses table missing expense_type_id column');
      }
      if (!expenseColumns.includes('employee_id')) {
        console.log('❌ expenses table missing employee_id column');
      }
    }
    
    // Check recoveries table
    if (tables.includes('recoveries')) {
      const recoveryColumns = schemaAudit['recoveries'].map(col => col.column_name);
      console.log('Recoveries table columns:', recoveryColumns);
      
      if (!recoveryColumns.includes('received_amount')) {
        console.log('❌ recoveries table missing received_amount column');
      }
      if (!recoveryColumns.includes('credit_customer_id')) {
        console.log('❌ recoveries table missing credit_customer_id column');
      }
    }
    
    // Check triggers
    console.log('\n🔧 Checking database triggers...');
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `);
    
    console.log(`Found ${triggersResult.rows.length} triggers:`);
    triggersResult.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table}`);
    });
    
    // Generate summary report
    console.log('\n📋 SCHEMA AUDIT SUMMARY');
    console.log('========================');
    console.log(`Total tables: ${tables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    console.log(`Total triggers: ${triggersResult.rows.length}`);
    
    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      tables: tables,
      missingTables: missingTables,
      schemaAudit: schemaAudit,
      triggers: triggersResult.rows
    };
    
    fs.writeFileSync('database-schema-audit.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to database-schema-audit.json');
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await pool.end();
  }
}

auditDatabaseSchema();
