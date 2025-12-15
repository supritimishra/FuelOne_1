import { Client } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Load environment variables
config();

export interface TestDatabase {
  client: Client;
  cleanup: () => Promise<void>;
}

/**
 * Sets up a test database connection and ensures migrations are applied
 */
export async function setupTestDatabase(): Promise<TestDatabase> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for integration tests');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to test database');

    // Apply migrations to ensure schema is up to date
    console.log('🔄 Applying migrations...');
    execSync('node scripts/run_migration.cjs', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Migrations applied');

    return {
      client,
      cleanup: async () => {
        await client.end();
        console.log('🧹 Test database connection closed');
      },
    };
  } catch (error) {
    await client.end();
    throw error;
  }
}

/**
 * Cleans up test data between tests
 */
export async function cleanupTestData(client: Client): Promise<void> {
  const tables = [
    'credit_sales',
    'guest_sales', 
    'tanker_sales',
    'vendor_invoices',
    'vendor_payments',
    'swipe_transactions',
    'sale_entries',
    'denominations',
    'expenses',
    'recovery',
    'meter_readings',
    'tank_readings',
  ];

  // Delete in reverse dependency order to avoid FK violations
  for (const table of tables.reverse()) {
    try {
      await client.query(`DELETE FROM ${table} WHERE created_at > NOW() - INTERVAL '1 hour'`);
    } catch (error) {
      // Some tables might not exist or have created_at, continue
      console.log(`Note: Could not clean ${table}:`, (error as Error).message);
    }
  }
  
  console.log('🧹 Test data cleaned up');
}

/**
 * Creates test data for common entities
 */
export async function createTestFixtures(client: Client) {
  // Create test fuel product if not exists
  let fuelProductResult = await client.query(`
    SELECT id FROM fuel_products WHERE product_name = 'Test Petrol'
  `);
  
  if (fuelProductResult.rows.length === 0) {
    fuelProductResult = await client.query(`
      INSERT INTO fuel_products (product_name, short_name, is_active) 
      VALUES ('Test Petrol', 'TP', true) 
      RETURNING id
    `);
  }
  const fuelProductId = fuelProductResult.rows[0].id;

  // Create test credit customer if not exists
  let customerResult = await client.query(`
    SELECT id FROM credit_customers WHERE organization_name = 'Test Corp'
  `);
  
  if (customerResult.rows.length === 0) {
    customerResult = await client.query(`
      INSERT INTO credit_customers (organization_name, credit_limit, current_balance, is_active) 
      VALUES ('Test Corp', 100000, 0, true)
      RETURNING id
    `);
  }
  const customerId = customerResult.rows[0].id;

  // Create test vendor if not exists
  let vendorResult = await client.query(`
    SELECT id FROM vendors WHERE vendor_name = 'Test Vendor'
  `);
  
  if (vendorResult.rows.length === 0) {
    vendorResult = await client.query(`
      INSERT INTO vendors (vendor_name, is_active) 
      VALUES ('Test Vendor', true)
      RETURNING id
    `);
  }
  const vendorId = vendorResult.rows[0].id;

  // Create test employee if not exists
  let employeeResult = await client.query(`
    SELECT id FROM employees WHERE employee_name = 'Test Employee'
  `);
  
  if (employeeResult.rows.length === 0) {
    employeeResult = await client.query(`
      INSERT INTO employees (employee_name, employee_number, mobile_number, is_active) 
      VALUES ('Test Employee', 'EMP001', '1234567890', true)
      RETURNING id
    `);
  }
  const employeeId = employeeResult.rows[0].id;

  console.log('🔧 Test fixtures created');
  
  return {
    fuelProductId,
    customerId,
    vendorId,
    employeeId,
  };
}

/**
 * Assertion helpers for database state
 */
export async function assertRecord(
  client: Client, 
  table: string, 
  conditions: Record<string, any>,
  message?: string
): Promise<any> {
  const whereClause = Object.keys(conditions)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ');
  
  const values = Object.values(conditions);
  
  const result = await client.query(
    `SELECT * FROM ${table} WHERE ${whereClause}`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new Error(message || `Expected record not found in ${table} with conditions: ${JSON.stringify(conditions)}`);
  }
  
  return result.rows[0];
}

export async function assertRecordCount(
  client: Client,
  table: string,
  expectedCount: number,
  conditions: Record<string, any> = {},
  message?: string
): Promise<void> {
  const whereClause = Object.keys(conditions).length > 0 
    ? 'WHERE ' + Object.keys(conditions).map((key, index) => `${key} = $${index + 1}`).join(' AND ')
    : '';
  
  const values = Object.values(conditions);
  
  const result = await client.query(
    `SELECT COUNT(*) as count FROM ${table} ${whereClause}`,
    values
  );
  
  const actualCount = parseInt(result.rows[0].count);
  
  if (actualCount !== expectedCount) {
    throw new Error(
      message || 
      `Expected ${expectedCount} records in ${table}, but found ${actualCount}${
        Object.keys(conditions).length > 0 ? ` with conditions: ${JSON.stringify(conditions)}` : ''
      }`
    );
  }
}

export async function assertFieldValue(
  client: Client,
  table: string,
  field: string,
  expectedValue: any,
  conditions: Record<string, any>,
  message?: string
): Promise<void> {
  const whereClause = Object.keys(conditions)
    .map((key, index) => `${key} = $${index + 1}`)
    .join(' AND ');
  
  const values = Object.values(conditions);
  
  const result = await client.query(
    `SELECT ${field} FROM ${table} WHERE ${whereClause}`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new Error(`No record found in ${table} with conditions: ${JSON.stringify(conditions)}`);
  }
  
  const actualValue = result.rows[0][field];
  
  // Handle numeric comparison with tolerance for precision issues
  if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
    const tolerance = 0.01; // Allow small precision differences
    if (Math.abs(actualValue - expectedValue) > tolerance) {
      throw new Error(
        message || 
        `Expected ${field} to be ${expectedValue}, but got ${actualValue} in ${table} (diff: ${Math.abs(actualValue - expectedValue)})`
      );
    }
  } else if (typeof expectedValue === 'number' && typeof actualValue === 'string') {
    // Handle case where DB returns string representation of number
    const numericActual = parseFloat(actualValue);
    const tolerance = 0.01;
    if (Math.abs(numericActual - expectedValue) > tolerance) {
      throw new Error(
        message || 
        `Expected ${field} to be ${expectedValue}, but got ${actualValue} (${numericActual}) in ${table}`
      );
    }
  } else if (actualValue !== expectedValue) {
    throw new Error(
      message || 
      `Expected ${field} to be ${expectedValue}, but got ${actualValue} in ${table}`
    );
  }
}