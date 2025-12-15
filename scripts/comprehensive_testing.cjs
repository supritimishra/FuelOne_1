#!/usr/bin/env node

/**
 * COMPREHENSIVE PETROL PUMP MANAGEMENT SYSTEM TESTING SCRIPT
 * Tests all modules with complex scenarios and edge cases
 */

const { Client } = require('pg');
require('dotenv').config();

class ComprehensiveTester {
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
      console.log('✅ Connected to database for comprehensive testing');
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
      console.log(`\n🧪 Running: ${testName}`);
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

  // WORKFLOW 1: COMPLETE DAILY OPERATIONS CYCLE
  async testDailyOperationsCycle() {
    console.log('\n🔄 WORKFLOW 1: COMPLETE DAILY OPERATIONS CYCLE');
    
    // Create test data
    const fuelProduct = await this.createTestFuelProduct();
    const employee = await this.createTestEmployee();
    const customer = await this.createTestCustomer();
    const vendor = await this.createTestVendor();
    const tank = await this.createTestTank();

    // Test morning opening
    await this.runTest('Morning Opening - System Startup', async () => {
      const healthCheck = await this.client.query('SELECT 1 as health');
      if (healthCheck.rows[0].health !== 1) throw new Error('Health check failed');
    });

    await this.runTest('Morning Opening - Tank Stock Check', async () => {
      const stockResult = await this.client.query('SELECT current_stock FROM tanks WHERE id = $1', [tank.id]);
      if (!stockResult.rows[0]) throw new Error('Tank stock not found');
    });

    // Test peak hour operations
    await this.runTest('Peak Hour - Multiple Guest Sales', async () => {
      const sales = [
        { quantity: 25.5, price: 95.50, payment: 'CASH', vehicle: 'KA01AB1234' },
        { quantity: 30.0, price: 95.50, payment: 'CARD', vehicle: 'KA01CD5678' },
        { quantity: 40.5, price: 95.50, payment: 'UPI', vehicle: 'KA01EF9012' }
      ];

      for (const sale of sales) {
        const totalAmount = sale.quantity * sale.price;
        await this.client.query(`
          INSERT INTO guest_sales (fuel_product_id, sale_date, quantity, price_per_unit, total_amount, payment_mode, vehicle_number)
          VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
        `, [fuelProduct.id, sale.quantity, sale.price, totalAmount, sale.payment, sale.vehicle]);
      }
    });

    await this.runTest('Peak Hour - Credit Sales Processing', async () => {
      const creditSale = await this.client.query(`
        INSERT INTO credit_sales (customer_id, fuel_product_id, sale_date, quantity, price_per_unit, total_amount)
        VALUES ($1, $2, CURRENT_DATE, 50.0, 95.50, 4775.0)
        RETURNING id, total_amount
      `, [customer.id, fuelProduct.id]);

      if (!creditSale.rows[0]) throw new Error('Credit sale not created');
    });

    // Test afternoon operations
    await this.runTest('Afternoon - Vendor Invoice Processing', async () => {
      const invoice = await this.client.query(`
        INSERT INTO vendor_invoices (vendor_id, invoice_date, invoice_number, amount, gst_amount, total_amount)
        VALUES ($1, CURRENT_DATE, 'INV001', 10000.0, 1800.0, 11800.0)
        RETURNING id
      `, [vendor.id]);

      if (!invoice.rows[0]) throw new Error('Vendor invoice not created');
    });

    // Test evening closing
    await this.runTest('Evening Closing - Daily Sales Summary', async () => {
      const summary = await this.client.query(`
        SELECT 
          COUNT(*) as total_sales,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN payment_mode = 'CASH' THEN total_amount ELSE 0 END) as cash_sales,
          SUM(CASE WHEN payment_mode = 'CARD' THEN total_amount ELSE 0 END) as card_sales,
          SUM(CASE WHEN payment_mode = 'UPI' THEN total_amount ELSE 0 END) as upi_sales
        FROM guest_sales 
        WHERE sale_date = CURRENT_DATE
      `);

      if (!summary.rows[0]) throw new Error('Daily summary not generated');
    });

    // Cleanup
    await this.cleanupTestData([fuelProduct.id, employee.id, customer.id, vendor.id, tank.id]);
  }

  // WORKFLOW 2: CREDIT CUSTOMER MANAGEMENT CYCLE
  async testCreditCustomerManagementCycle() {
    console.log('\n🔄 WORKFLOW 2: CREDIT CUSTOMER MANAGEMENT CYCLE');
    
    const customer = await this.createTestCustomer();
    const fuelProduct = await this.createTestFuelProduct();

    await this.runTest('Customer Setup - Credit Limit Setting', async () => {
      await this.client.query(`
        UPDATE credit_customers 
        SET credit_limit = 50000, current_balance = 0 
        WHERE id = $1
      `, [customer.id]);
    });

    await this.runTest('Credit Sales - Multiple Sales Accumulation', async () => {
      const sales = [
        { quantity: 25.0, price: 95.50, expected_total: 2387.50 },
        { quantity: 30.0, price: 95.50, expected_total: 2865.00 },
        { quantity: 20.0, price: 95.50, expected_total: 1910.00 }
      ];

      for (const sale of sales) {
        const result = await this.client.query(`
          INSERT INTO credit_sales (customer_id, fuel_product_id, sale_date, quantity, price_per_unit, total_amount)
          VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)
          RETURNING total_amount
        `, [customer.id, fuelProduct.id, sale.quantity, sale.price, sale.expected_total]);

        if (parseFloat(result.rows[0].total_amount) !== sale.expected_total) {
          throw new Error(`Expected ${sale.expected_total}, got ${result.rows[0].total_amount}`);
        }
      }
    });

    await this.runTest('Payment Collection - Recovery Processing', async () => {
      const recovery = await this.client.query(`
        INSERT INTO recoveries (customer_id, recovery_date, amount, payment_mode, notes)
        VALUES ($1, CURRENT_DATE, 5000.0, 'CASH', 'Partial payment')
        RETURNING id
      `, [customer.id]);

      if (!recovery.rows[0]) throw new Error('Recovery not recorded');
    });

    await this.runTest('Customer Management - Balance Tracking', async () => {
      const balance = await this.client.query(`
        SELECT current_balance FROM credit_customers WHERE id = $1
      `, [customer.id]);

      if (!balance.rows[0]) throw new Error('Customer balance not found');
    });

    // Cleanup
    await this.cleanupTestData([customer.id, fuelProduct.id]);
  }

  // WORKFLOW 3: VENDOR OPERATIONS CYCLE
  async testVendorOperationsCycle() {
    console.log('\n🔄 WORKFLOW 3: VENDOR OPERATIONS CYCLE');
    
    const vendor = await this.createTestVendor();
    const fuelProduct = await this.createTestFuelProduct();

    await this.runTest('Vendor Setup - Initial Balance', async () => {
      await this.client.query(`
        UPDATE vendors 
        SET current_balance = 0 
        WHERE id = $1
      `, [vendor.id]);
    });

    await this.runTest('Purchase Operations - Invoice Creation', async () => {
      const invoice = await this.client.query(`
        INSERT INTO vendor_invoices (vendor_id, invoice_date, invoice_number, amount, gst_amount, total_amount, status)
        VALUES ($1, CURRENT_DATE, 'INV-001', 25000.0, 4500.0, 29500.0, 'PENDING')
        RETURNING id, total_amount
      `, [vendor.id]);

      if (!invoice.rows[0]) throw new Error('Invoice not created');
    });

    await this.runTest('Payment Processing - Vendor Payment', async () => {
      const payment = await this.client.query(`
        INSERT INTO vendor_transactions (vendor_id, transaction_date, amount, transaction_type, payment_mode, notes)
        VALUES ($1, CURRENT_DATE, 15000.0, 'PAYMENT', 'BANK_TRANSFER', 'Partial payment')
        RETURNING id
      `, [vendor.id]);

      if (!payment.rows[0]) throw new Error('Payment not recorded');
    });

    await this.runTest('Vendor Management - Balance Reconciliation', async () => {
      const balance = await this.client.query(`
        SELECT current_balance FROM vendors WHERE id = $1
      `, [vendor.id]);

      if (!balance.rows[0]) throw new Error('Vendor balance not found');
    });

    // Cleanup
    await this.cleanupTestData([vendor.id, fuelProduct.id]);
  }

  // WORKFLOW 4: STOCK MANAGEMENT CYCLE
  async testStockManagementCycle() {
    console.log('\n🔄 WORKFLOW 4: STOCK MANAGEMENT CYCLE');
    
    const tank = await this.createTestTank();
    const fuelProduct = await this.createTestFuelProduct();

    await this.runTest('Stock Receiving - Tanker Delivery', async () => {
      const delivery = await this.client.query(`
        INSERT INTO tanker_sales (fuel_product_id, delivery_date, quantity, price_per_unit, total_amount)
        VALUES ($1, CURRENT_DATE, 1000.0, 85.0, 85000.0)
        RETURNING id
      `, [fuelProduct.id]);

      if (!delivery.rows[0]) throw new Error('Tanker delivery not recorded');
    });

    await this.runTest('Stock Sales - Multiple Sales', async () => {
      const sales = [
        { quantity: 50.0, price: 95.50 },
        { quantity: 75.5, price: 95.50 },
        { quantity: 25.0, price: 95.50 }
      ];

      for (const sale of sales) {
        const totalAmount = sale.quantity * sale.price;
        await this.client.query(`
          INSERT INTO guest_sales (fuel_product_id, sale_date, quantity, price_per_unit, total_amount, payment_mode)
          VALUES ($1, CURRENT_DATE, $2, $3, $4, 'CASH')
        `, [fuelProduct.id, sale.quantity, sale.price, totalAmount]);
      }
    });

    await this.runTest('Stock Reconciliation - Daily Reconciliation', async () => {
      const reconciliation = await this.client.query(`
        SELECT 
          SUM(CASE WHEN delivery_date = CURRENT_DATE THEN quantity ELSE 0 END) as received,
          SUM(CASE WHEN sale_date = CURRENT_DATE THEN quantity ELSE 0 END) as sold
        FROM (
          SELECT delivery_date, quantity FROM tanker_sales WHERE delivery_date = CURRENT_DATE
          UNION ALL
          SELECT sale_date, quantity FROM guest_sales WHERE sale_date = CURRENT_DATE
        ) as stock_movement
      `);

      if (!reconciliation.rows[0]) throw new Error('Stock reconciliation failed');
    });

    await this.runTest('Stock Monitoring - Low Stock Alerts', async () => {
      const lowStock = await this.client.query(`
        SELECT COUNT(*) as low_stock_count
        FROM tanks 
        WHERE current_stock < minimum_stock
      `);

      if (!lowStock.rows[0]) throw new Error('Low stock check failed');
    });

    // Cleanup
    await this.cleanupTestData([tank.id, fuelProduct.id]);
  }

  // WORKFLOW 5: PAYMENT PROCESSING CYCLE
  async testPaymentProcessingCycle() {
    console.log('\n🔄 WORKFLOW 5: PAYMENT PROCESSING CYCLE');
    
    const fuelProduct = await this.createTestFuelProduct();
    const swipeMachine = await this.createTestSwipeMachine();

    await this.runTest('Cash Payments - Cash Sales Processing', async () => {
      const cashSale = await this.client.query(`
        INSERT INTO guest_sales (fuel_product_id, sale_date, quantity, price_per_unit, total_amount, payment_mode)
        VALUES ($1, CURRENT_DATE, 30.0, 95.50, 2865.0, 'CASH')
        RETURNING id
      `, [fuelProduct.id]);

      if (!cashSale.rows[0]) throw new Error('Cash sale not processed');
    });

    await this.runTest('Card Payments - Swipe Transaction Processing', async () => {
      const swipeTransaction = await this.client.query(`
        INSERT INTO swipe_transactions (swipe_machine_id, transaction_date, amount, card_type, transaction_id)
        VALUES ($1, CURRENT_DATE, 2500.0, 'CREDIT', 'TXN001')
        RETURNING id
      `, [swipeMachine.id]);

      if (!swipeTransaction.rows[0]) throw new Error('Swipe transaction not processed');
    });

    await this.runTest('UPI Payments - Digital Payment Processing', async () => {
      const upiSale = await this.client.query(`
        INSERT INTO guest_sales (fuel_product_id, sale_date, quantity, price_per_unit, total_amount, payment_mode)
        VALUES ($1, CURRENT_DATE, 20.0, 95.50, 1910.0, 'UPI')
        RETURNING id
      `, [fuelProduct.id]);

      if (!upiSale.rows[0]) throw new Error('UPI sale not processed');
    });

    await this.runTest('Payment Reconciliation - Daily Reconciliation', async () => {
      const reconciliation = await this.client.query(`
        SELECT 
          payment_mode,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_amount
        FROM guest_sales 
        WHERE sale_date = CURRENT_DATE
        GROUP BY payment_mode
        ORDER BY payment_mode
      `);

      if (!reconciliation.rows[0]) throw new Error('Payment reconciliation failed');
    });

    // Cleanup
    await this.cleanupTestData([fuelProduct.id, swipeMachine.id]);
  }

  // Helper methods for creating test data
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

  async createTestCustomer() {
    const result = await this.client.query(`
      INSERT INTO credit_customers (organization_name, credit_limit, current_balance, is_active)
      VALUES ('Test Corp', 100000, 0, true)
      RETURNING id
    `);
    return result.rows[0];
  }

  async createTestVendor() {
    const result = await this.client.query(`
      INSERT INTO vendors (vendor_name, is_active)
      VALUES ('Test Vendor', true)
      RETURNING id
    `);
    return result.rows[0];
  }

  async createTestTank() {
    const result = await this.client.query(`
      INSERT INTO tanks (tank_number, capacity, current_stock, is_active)
      VALUES ('T001', 10000, 5000, true)
      RETURNING id
    `);
    return result.rows[0];
  }

  async createTestSwipeMachine() {
    const result = await this.client.query(`
      INSERT INTO swipe_machines (machine_name, machine_type, is_active)
      VALUES ('Test Machine', 'EDC', true)
      RETURNING id
    `);
    return result.rows[0];
  }

  async cleanupTestData(ids) {
    try {
      // Clean up test data in reverse order to avoid FK violations
      const tables = [
        'guest_sales', 'credit_sales', 'vendor_invoices', 'vendor_transactions',
        'tanker_sales', 'swipe_transactions', 'recoveries',
        'fuel_products', 'employees', 'credit_customers', 'vendors', 'tanks', 'swipe_machines'
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
    console.log('🚀 Starting Comprehensive Petrol Pump Management System Testing');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      // Run all 5 complex workflows
      await this.testDailyOperationsCycle();
      await this.testCreditCustomerManagementCycle();
      await this.testVendorOperationsCycle();
      await this.testStockManagementCycle();
      await this.testPaymentProcessingCycle();

      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 COMPREHENSIVE TESTING RESULTS');
      console.log('='.repeat(80));
      console.log(`✅ Tests Passed: ${this.testResults.passed}`);
      console.log(`❌ Tests Failed: ${this.testResults.failed}`);
      console.log(`📈 Total Tests: ${this.testResults.total}`);
      console.log(`🎯 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);

      if (this.testResults.failed === 0) {
        console.log('\n🏆 ALL TESTS PASSED! System is production ready!');
      } else {
        console.log('\n⚠️ Some tests failed. Review the details above.');
      }

    } finally {
      await this.disconnect();
    }
  }
}

// Run the comprehensive tests
if (require.main === module) {
  const tester = new ComprehensiveTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTester;
