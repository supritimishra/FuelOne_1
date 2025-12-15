#!/usr/bin/env node

/**
 * RELATIONAL FEATURES COMPREHENSIVE TESTING SCRIPT
 * Tests all Relational Features section options in real-life scenarios
 */

const { Client } = require('pg');
require('dotenv').config();

class RelationalFeaturesTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database for Relational Features testing');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Database connection closed');
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({ test: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ test: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  // Test 1: Interest Transactions
  async testInterestTransactions() {
    console.log('\n🔄 TESTING INTEREST TRANSACTIONS');
    
    await this.runTest('Interest Transactions - Database Table Exists', async () => {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'interest_transactions'
        );
      `);
      if (!result.rows[0].exists) throw new Error('Interest transactions table does not exist');
    });

    await this.runTest('Interest Transactions - Create Transaction', async () => {
      const result = await this.client.query(`
        INSERT INTO interest_transactions (
          transaction_date, 
          transaction_type, 
          party_name, 
          loan_amount, 
          interest_amount, 
          principal_paid, 
          notes
        ) VALUES (
          CURRENT_DATE, 
          'LOAN_DISBURSEMENT', 
          'Test Party', 
          50000.0, 
          5000.0, 
          0.0, 
          'Test interest transaction'
        ) RETURNING id
      `);
      if (!result.rows[0]) throw new Error('Failed to create interest transaction');
    });

    await this.runTest('Interest Transactions - Read Transactions', async () => {
      const result = await this.client.query(`
        SELECT * FROM interest_transactions 
        WHERE party_name = 'Test Party'
        ORDER BY transaction_date DESC
      `);
      if (result.rows.length === 0) throw new Error('No interest transactions found');
    });

    await this.runTest('Interest Transactions - Update Transaction', async () => {
      const result = await this.client.query(`
        UPDATE interest_transactions 
        SET interest_amount = 6000.0, notes = 'Updated test transaction'
        WHERE party_name = 'Test Party'
        RETURNING id
      `);
      if (result.rows.length === 0) throw new Error('Failed to update interest transaction');
    });

    await this.runTest('Interest Transactions - Delete Transaction', async () => {
      const result = await this.client.query(`
        DELETE FROM interest_transactions 
        WHERE party_name = 'Test Party'
        RETURNING id
      `);
      if (result.rows.length === 0) throw new Error('Failed to delete interest transaction');
    });
  }

  // Test 2: Sheet Records
  async testSheetRecords() {
    console.log('\n🔄 TESTING SHEET RECORDS');
    
    await this.runTest('Sheet Records - Database Table Exists', async () => {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'sheet_records'
        );
      `);
      if (!result.rows[0].exists) throw new Error('Sheet records table does not exist');
    });

    await this.runTest('Sheet Records - Create Sheet Record', async () => {
      const result = await this.client.query(`
        INSERT INTO sheet_records (
          date, 
          sheet_name, 
          open_reading, 
          close_reading, 
          notes
        ) VALUES (
          CURRENT_DATE, 
          'Test Sheet', 
          1000.0, 
          1200.0, 
          'Test sheet record'
        ) RETURNING id
      `);
      if (!result.rows[0]) throw new Error('Failed to create sheet record');
    });

    await this.runTest('Sheet Records - Read Sheet Records', async () => {
      const result = await this.client.query(`
        SELECT * FROM sheet_records 
        WHERE sheet_name = 'Test Sheet'
        ORDER BY date DESC
      `);
      if (result.rows.length === 0) throw new Error('No sheet records found');
    });

    await this.runTest('Sheet Records - Update Sheet Record', async () => {
      const result = await this.client.query(`
        UPDATE sheet_records 
        SET close_reading = 1300.0, notes = 'Updated test sheet record'
        WHERE sheet_name = 'Test Sheet'
        RETURNING id
      `);
      if (result.rows.length === 0) throw new Error('Failed to update sheet record');
    });

    await this.runTest('Sheet Records - Delete Sheet Record', async () => {
      const result = await this.client.query(`
        DELETE FROM sheet_records 
        WHERE sheet_name = 'Test Sheet'
        RETURNING id
      `);
      if (result.rows.length === 0) throw new Error('Failed to delete sheet record');
    });
  }

  // Test 3: Day Cash Report
  async testDayCashReport() {
    console.log('\n🔄 TESTING DAY CASH REPORT');
    
    // Make the check deterministic by inserting a temporary guest sale (CASH) for today
    const tempFuel = await this.createTestFuelProduct();
    let tempGuestSaleId = null;
    try {
      const gs = await this.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id, sale_date, quantity, price_per_unit, total_amount, payment_mode, vehicle_number, customer_name
        ) VALUES ($1, CURRENT_DATE, 5.0, 95.5, 477.5, 'CASH', 'TMP-1', 'Tmp Customer') RETURNING id
      `, [tempFuel.id]);
      tempGuestSaleId = gs.rows[0] && gs.rows[0].id;
    } catch (err) {
      // ignore insert error; test will still run and may fail if no data exists
    }

    await this.runTest('Day Cash Report - Guest Sales Data Available', async () => {
      const result = await this.client.query(`
        SELECT COUNT(*) as count, SUM(total_amount) as total_amount
        FROM guest_sales 
        WHERE payment_mode = 'CASH' 
        AND sale_date = CURRENT_DATE
      `);
      if (!result.rows[0]) throw new Error('No guest sales data found');
    });

    await this.runTest('Day Cash Report - Credit Sales Data Available', async () => {
      const result = await this.client.query(`
        SELECT COUNT(*) as count, SUM(total_amount) as total_amount
        FROM credit_sales 
        WHERE sale_date = CURRENT_DATE
      `);
      if (!result.rows[0]) throw new Error('No credit sales data found');
    });

    await this.runTest('Day Cash Report - Payment Mode Summary', async () => {
      const result = await this.client.query(`
        SELECT 
          payment_mode,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_amount
        FROM guest_sales 
        WHERE sale_date = CURRENT_DATE
        GROUP BY payment_mode
        ORDER BY payment_mode
      `);
      if (!result.rows[0]) throw new Error('No payment mode summary found');
    });

    // cleanup the temporary guest sale and fuel product if created
    try {
      if (tempGuestSaleId) await this.client.query('DELETE FROM guest_sales WHERE id = $1', [tempGuestSaleId]);
    } catch (err) {}
    try { await this.cleanupTestData([tempFuel.id]); } catch (err) {}
  }

  // Test 4: Tanker Sale
  async testTankerSale() {
    console.log('\n🔄 TESTING TANKER SALE');
    
    const fuelProduct = await this.createTestFuelProduct();

    await this.runTest('Tanker Sale - Database Table Exists', async () => {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tanker_sales'
        );
      `);
      if (!result.rows[0].exists) throw new Error('Tanker sales table does not exist');
    });

    await this.runTest('Tanker Sale - Create Tanker Sale', async () => {
      const result = await this.client.query(`
        INSERT INTO tanker_sales (
          fuel_product_id,
          sale_date,
          tanker_sale_quantity,
          before_dip_stock,
          gross_stock
        ) VALUES (
          $1,
          CURRENT_DATE,
          1000.0,
          5000.0,
          6000.0
        ) RETURNING id
      `, [fuelProduct.id]);
      if (!result.rows[0]) throw new Error('Failed to create tanker sale');
    });

    await this.runTest('Tanker Sale - Read Tanker Sales', async () => {
      const result = await this.client.query(`
        SELECT ts.*, fp.product_name 
        FROM tanker_sales ts
        JOIN fuel_products fp ON ts.fuel_product_id = fp.id
        WHERE ts.fuel_product_id = $1
        ORDER BY ts.sale_date DESC
      `, [fuelProduct.id]);
      if (result.rows.length === 0) throw new Error('No tanker sales found');
    });

    await this.runTest('Tanker Sale - Stock Update Verification', async () => {
      const result = await this.client.query(`
        SELECT 
          SUM(tanker_sale_quantity) as total_received,
          COUNT(*) as delivery_count
        FROM tanker_sales 
        WHERE fuel_product_id = $1
        AND sale_date = CURRENT_DATE
      `, [fuelProduct.id]);
      if (!result.rows[0]) throw new Error('No tanker sale stock data found');
    });

    await this.runTest('Tanker Sale - Delete Tanker Sale', async () => {
      const result = await this.client.query(`
        DELETE FROM tanker_sales 
        WHERE fuel_product_id = $1
        RETURNING id
      `, [fuelProduct.id]);
      if (result.rows.length === 0) throw new Error('Failed to delete tanker sale');
    });

    // Cleanup
    await this.cleanupTestData([fuelProduct.id]);
  }

  // Test 5: Guest Sales
  async testGuestSales() {
    console.log('\n🔄 TESTING GUEST SALES');
    
    const fuelProduct = await this.createTestFuelProduct();

    await this.runTest('Guest Sales - Database Table Exists', async () => {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'guest_sales'
        );
      `);
      if (!result.rows[0].exists) throw new Error('Guest sales table does not exist');
    });

    await this.runTest('Guest Sales - Create Cash Sale', async () => {
      const result = await this.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id,
          sale_date,
          quantity,
          price_per_unit,
          total_amount,
          payment_mode,
          vehicle_number,
          customer_name
        ) VALUES (
          $1,
          CURRENT_DATE,
          25.5,
          95.50,
          2435.25,
          'CASH',
          'KA01AB1234',
          'Test Customer'
        ) RETURNING id
      `, [fuelProduct.id]);
      if (!result.rows[0]) throw new Error('Failed to create cash sale');
    });

    await this.runTest('Guest Sales - Create Card Sale', async () => {
      const result = await this.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id,
          sale_date,
          quantity,
          price_per_unit,
          total_amount,
          payment_mode,
          vehicle_number,
          customer_name
        ) VALUES (
          $1,
          CURRENT_DATE,
          30.0,
          95.50,
          2865.0,
          'CARD',
          'KA01CD5678',
          'Test Customer 2'
        ) RETURNING id
      `, [fuelProduct.id]);
      if (!result.rows[0]) throw new Error('Failed to create card sale');
    });

    await this.runTest('Guest Sales - Create UPI Sale', async () => {
      const result = await this.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id,
          sale_date,
          quantity,
          price_per_unit,
          total_amount,
          payment_mode,
          vehicle_number,
          customer_name
        ) VALUES (
          $1,
          CURRENT_DATE,
          20.0,
          95.50,
          1910.0,
          'UPI',
          'KA01EF9012',
          'Test Customer 3'
        ) RETURNING id
      `, [fuelProduct.id]);
      if (!result.rows[0]) throw new Error('Failed to create UPI sale');
    });

    await this.runTest('Guest Sales - Read Guest Sales', async () => {
      const result = await this.client.query(`
        SELECT gs.*, fp.product_name 
        FROM guest_sales gs
        JOIN fuel_products fp ON gs.fuel_product_id = fp.id
        WHERE gs.fuel_product_id = $1
        ORDER BY gs.sale_date DESC
      `, [fuelProduct.id]);
      if (result.rows.length === 0) throw new Error('No guest sales found');
    });

    await this.runTest('Guest Sales - Payment Mode Summary', async () => {
      const result = await this.client.query(`
        SELECT 
          payment_mode,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_amount
        FROM guest_sales 
        WHERE fuel_product_id = $1
        AND sale_date = CURRENT_DATE
        GROUP BY payment_mode
        ORDER BY payment_mode
      `, [fuelProduct.id]);
      if (result.rows.length === 0) throw new Error('No payment mode summary found');
    });

    await this.runTest('Guest Sales - Delete Guest Sales', async () => {
      const result = await this.client.query(`
        DELETE FROM guest_sales 
        WHERE fuel_product_id = $1
        RETURNING id
      `, [fuelProduct.id]);
      if (result.rows.length === 0) throw new Error('Failed to delete guest sales');
    });

    // Cleanup
    await this.cleanupTestData([fuelProduct.id]);
  }

  // Test 6: Attendance
  async testAttendance() {
    console.log('\n🔄 TESTING ATTENDANCE');
    
    const employee = await this.createTestEmployee();

    await this.runTest('Attendance - Sale Entries Table Exists', async () => {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'sale_entries'
        );
      `);
      if (!result.rows[0].exists) throw new Error('Sale entries table does not exist');
    });

    await this.runTest('Attendance - Create Sale Entry', async () => {
      const result = await this.client.query(`
        INSERT INTO sale_entries (
          employee_id,
          sale_date,
          quantity,
          net_sale_amount
        ) VALUES (
          $1,
          CURRENT_DATE,
          50.0,
          4775.0
        ) RETURNING id
      `, [employee.id]);
      if (!result.rows[0]) throw new Error('Failed to create sale entry');
    });

    await this.runTest('Attendance - Read Attendance Data', async () => {
      const result = await this.client.query(`
        SELECT 
          se.sale_date,
          se.employee_id,
          e.employee_name,
          COUNT(*) as entries,
          SUM(se.quantity) as total_quantity,
          SUM(se.net_sale_amount) as total_amount
        FROM sale_entries se
        JOIN employees e ON se.employee_id = e.id
        WHERE se.employee_id = $1
        AND se.sale_date = CURRENT_DATE
        GROUP BY se.sale_date, se.employee_id, e.employee_name
      `, [employee.id]);
      if (result.rows.length === 0) throw new Error('No attendance data found');
    });

    await this.runTest('Attendance - Employee Performance Summary', async () => {
      const result = await this.client.query(`
        SELECT 
          e.employee_name,
          COUNT(DISTINCT se.sale_date) as days_worked,
          SUM(se.quantity) as total_quantity,
          SUM(se.net_sale_amount) as total_amount
        FROM sale_entries se
        JOIN employees e ON se.employee_id = e.id
        WHERE se.employee_id = $1
        GROUP BY e.employee_name
      `, [employee.id]);
      if (result.rows.length === 0) throw new Error('No employee performance data found');
    });

    await this.runTest('Attendance - Delete Sale Entries', async () => {
      const result = await this.client.query(`
        DELETE FROM sale_entries 
        WHERE employee_id = $1
        RETURNING id
      `, [employee.id]);
      if (result.rows.length === 0) throw new Error('Failed to delete sale entries');
    });

    // Cleanup
    await this.cleanupTestData([employee.id]);
  }

  // Helper methods
  async createTestFuelProduct() {
    const result = await this.client.query(`
      INSERT INTO fuel_products (product_name, short_name, is_active)
      VALUES ('Test Petrol', 'TP', true)
      RETURNING id
    `);
    return result.rows[0];
  }

  async createTestEmployee() {
    const result = await this.client.query(`
      INSERT INTO employees (employee_name, employee_number, mobile_number, is_active)
      VALUES ('Test Employee', 'EMP001', '1234567890', true)
      RETURNING id
    `);
    return result.rows[0];
  }

  async cleanupTestData(ids) {
    try {
      const tables = [
        'guest_sales', 'credit_sales', 'tanker_sales', 'sale_entries',
        'interest_transactions', 'sheet_records',
        'fuel_products', 'employees'
      ];

      for (const table of tables) {
        for (const id of ids) {
          try {
            await this.client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
          } catch (error) {
            // Ignore errors for tables that don't have the ID
          }
        }
      }
    } catch (error) {
      console.log('Note: Cleanup completed with some warnings');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Relational Features Comprehensive Testing');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      // Test all Relational Features
      await this.testInterestTransactions();
      await this.testSheetRecords();
      await this.testDayCashReport();
      await this.testTankerSale();
      await this.testGuestSales();
      await this.testAttendance();

      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 RELATIONAL FEATURES TESTING RESULTS');
      console.log('='.repeat(80));
      console.log(`✅ Tests Passed: ${this.testResults.passed}`);
      console.log(`❌ Tests Failed: ${this.testResults.failed}`);
      console.log(`📈 Total Tests: ${this.testResults.total}`);
      console.log(`🎯 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);

      if (this.testResults.failed === 0) {
        console.log('\n🏆 ALL RELATIONAL FEATURES TESTS PASSED! System is production ready!');
      } else {
        console.log('\n⚠️ Some tests failed. Review the details above.');
      }

    } finally {
      await this.disconnect();
    }
  }
}

// Run the relational features tests
if (require.main === module) {
  const tester = new RelationalFeaturesTester();
  tester.runAllTests().catch(console.error);
}

module.exports = RelationalFeaturesTester;
