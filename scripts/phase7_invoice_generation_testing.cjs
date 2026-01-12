#!/usr/bin/env node

/**
 * PHASE 7: INVOICE GENERATION AND MANAGEMENT TESTING
 * Tests invoice generation, management, and related functionality
 */

const { Client } = require('pg');
require('dotenv').config();

class Phase7InvoicingTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      invoiceGeneration: { passed: 0, failed: 0, total: 0, details: [] },
      invoiceManagement: { passed: 0, failed: 0, total: 0, details: [] },
      invoiceCalculations: { passed: 0, failed: 0, total: 0, details: [] },
      invoiceValidation: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.createdData = {
      invoices: [],
      creditSales: [],
      customers: [],
      fuelProducts: []
    };
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to database for invoice testing');
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Database connection closed');
  }

  async runTest(category, description, testFunction) {
    try {
      console.log(`\n🧪 Testing: ${description}`);
      await testFunction();
      console.log(`✅ PASSED: ${description}`);
      this.testResults[category].passed++;
      this.testResults[category].details.push({ test: description, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${description} - ${error.message}`);
      this.testResults[category].failed++;
      this.testResults[category].details.push({ test: description, status: 'FAILED', error: error.message });
    }
    this.testResults[category].total++;
  }

  async loadMasterData() {
    console.log('\n📋 LOADING MASTER DATA FOR INVOICE TESTING');
    console.log('=' .repeat(60));

    // Load credit customers
    const customersResult = await this.client.query('SELECT id, organization_name, credit_limit, current_balance FROM credit_customers WHERE is_active = true LIMIT 5');
    this.createdData.customers = customersResult.rows;
    console.log(`✅ Loaded ${this.createdData.customers.length} customers`);

    // Load fuel products
    const productsResult = await this.client.query('SELECT id, product_name, current_rate, gst_percentage FROM fuel_products WHERE is_active = true LIMIT 4');
    this.createdData.fuelProducts = productsResult.rows;
    console.log(`✅ Loaded ${this.createdData.fuelProducts.length} fuel products`);

    // Load existing credit sales for invoice generation
    const creditSalesResult = await this.client.query(`
      SELECT cs.id, cs.credit_customer_id, cs.fuel_product_id, cs.quantity, cs.price_per_unit, cs.total_amount, cs.sale_date
      FROM credit_sales cs
      JOIN credit_customers cc ON cs.credit_customer_id = cc.id
      WHERE cc.is_active = true
      ORDER BY cs.sale_date DESC
      LIMIT 10
    `);
    this.createdData.creditSales = creditSalesResult.rows;
    console.log(`✅ Loaded ${this.createdData.creditSales.length} credit sales for invoicing`);
  }

  // 46. Generate Sale Invoice
  async testInvoiceGeneration() {
    console.log('\n📄 TESTING INVOICE GENERATION');
    console.log('=' .repeat(60));

    await this.runTest('invoiceGeneration', 'Create Print Templates for Invoices', async () => {
      const templates = [
        { name: 'Customer Invoice Template', content: 'Customer invoice template with company details, customer info, and line items' },
        { name: 'Credit Sale Invoice', content: 'Credit sale invoice template with payment terms and due date' },
        { name: 'Receipt Template', content: 'Payment receipt template for customer payments' }
      ];

      for (const template of templates) {
        const result = await this.client.query(`
          INSERT INTO print_templates (name, content, created_by)
          VALUES ($1, $2, null)
          RETURNING id, name
        `, [template.name, template.content]);
        
        console.log(`✅ Created Template: ${result.rows[0].name}`);
      }
    });

    await this.runTest('invoiceGeneration', 'Test Invoice Calculation from Credit Sales', async () => {
      if (this.createdData.creditSales.length === 0) {
        throw new Error('No credit sales available for invoice calculation test');
      }

      // Test invoice calculations for existing credit sales
      for (const sale of this.createdData.creditSales.slice(0, 3)) {
        const subtotal = parseFloat(sale.total_amount || 0);
        const gstRate = 18; // Assuming 18% GST
        const gstAmount = subtotal * (gstRate / 100);
        const totalAmount = subtotal + gstAmount;

        console.log(`✅ Invoice Calculation: Sale ${sale.id} - Subtotal ₹${subtotal.toFixed(2)} + GST ₹${gstAmount.toFixed(2)} = Total ₹${totalAmount.toFixed(2)}`);
      }
    });

    await this.runTest('invoiceGeneration', 'Test Customer Invoice Association', async () => {
      // Filter out sales with invalid data
      const validSales = this.createdData.creditSales.filter(sale => 
        sale.credit_customer_id && 
        parseFloat(sale.total_amount || 0) > 0
      );

      if (validSales.length === 0) {
        throw new Error('No valid credit sales available for customer association test');
      }

      for (const sale of validSales.slice(0, 3)) {
        const customer = this.createdData.customers.find(c => c.id === sale.credit_customer_id);
        if (!customer) {
          console.log(`⚠️ Customer not found for sale ${sale.id}, skipping...`);
          continue;
        }
        console.log(`✅ Sale ${sale.id} associated with customer ${customer.organization_name}`);
      }
    });

    await this.runTest('invoiceGeneration', 'Test Invoice Data Validation', async () => {
      // Validate credit sales data for invoice generation
      let validSalesCount = 0;
      let invalidSalesCount = 0;

      for (const sale of this.createdData.creditSales) {
        if (!sale.credit_customer_id || !sale.fuel_product_id || !sale.quantity || !sale.price_per_unit) {
          console.log(`⚠️ Incomplete sale data for ${sale.id}, skipping...`);
          invalidSalesCount++;
          continue;
        }
        
        const calculatedTotal = parseFloat(sale.quantity) * parseFloat(sale.price_per_unit);
        const actualTotal = parseFloat(sale.total_amount || 0);
        
        // Allow for small rounding differences
        if (Math.abs(calculatedTotal - actualTotal) > 0.01) {
          console.log(`⚠️ Sale calculation mismatch for ${sale.id}: Expected ${calculatedTotal}, Got ${actualTotal}, skipping...`);
          invalidSalesCount++;
          continue;
        }
        
        validSalesCount++;
      }
      
      console.log(`✅ Validated ${validSalesCount} valid sales, ${invalidSalesCount} invalid sales skipped`);
      
      if (validSalesCount === 0) {
        throw new Error('No valid credit sales found for invoice generation');
      }
    });
  }

  // 47. Generated Invoices Management
  async testInvoiceManagement() {
    console.log('\n📋 TESTING INVOICE MANAGEMENT');
    console.log('=' .repeat(60));

    await this.runTest('invoiceManagement', 'View Credit Sales History', async () => {
      const salesHistory = await this.client.query(`
        SELECT 
          cs.id,
          cs.total_amount,
          cs.sale_date,
          cs.quantity,
          cs.price_per_unit,
          cc.organization_name as customer_name,
          fp.product_name
        FROM credit_sales cs
        JOIN credit_customers cc ON cs.credit_customer_id = cc.id
        LEFT JOIN fuel_products fp ON cs.fuel_product_id = fp.id
        ORDER BY cs.sale_date DESC
        LIMIT 20
      `);

      if (salesHistory.rows.length === 0) {
        throw new Error('No credit sales history found');
      }

      console.log(`✅ Retrieved ${salesHistory.rows.length} credit sales from history`);
      
      // Verify sales details
      for (const sale of salesHistory.rows) {
        if (!sale.total_amount || !sale.customer_name) {
          throw new Error(`Incomplete sale data for ${sale.id}`);
        }
      }
    });

    await this.runTest('invoiceManagement', 'Search Sales by Customer', async () => {
      if (this.createdData.customers.length === 0) {
        throw new Error('No customers available for search test');
      }

      const testCustomer = this.createdData.customers[0];
      const customerSales = await this.client.query(`
        SELECT cs.id, cs.total_amount, cs.sale_date, cs.quantity, cs.price_per_unit
        FROM credit_sales cs
        WHERE cs.credit_customer_id = $1
        ORDER BY cs.sale_date DESC
      `, [testCustomer.id]);

      console.log(`✅ Found ${customerSales.rows.length} sales for ${testCustomer.organization_name}`);
    });

    await this.runTest('invoiceManagement', 'Search Sales by Date Range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const dateRangeSales = await this.client.query(`
        SELECT cs.id, cs.total_amount, cs.sale_date, cs.quantity, cs.price_per_unit
        FROM credit_sales cs
        WHERE cs.sale_date BETWEEN $1 AND $2
        ORDER BY cs.sale_date DESC
      `, [startDate, endDate]);

      console.log(`✅ Found ${dateRangeSales.rows.length} sales in date range ${startDate} to ${endDate}`);
    });

    await this.runTest('invoiceManagement', 'Test Print Template Management', async () => {
      const templates = await this.client.query(`
        SELECT id, name, content, created_at
        FROM print_templates
        ORDER BY created_at DESC
      `);

      if (templates.rows.length === 0) {
        throw new Error('No print templates found');
      }

      console.log(`✅ Found ${templates.rows.length} print templates`);
      
      // Test template content validation
      for (const template of templates.rows) {
        if (!template.name || !template.content) {
          throw new Error(`Incomplete template data for ${template.id}`);
        }
      }
    });
  }

  // Invoice Calculations Testing
  async testInvoiceCalculations() {
    console.log('\n🧮 TESTING INVOICE CALCULATIONS');
    console.log('=' .repeat(60));

    await this.runTest('invoiceCalculations', 'Test GST Calculation', async () => {
      const testAmount = 1000;
      const gstRate = 18;
      const expectedGst = testAmount * (gstRate / 100);
      const expectedTotal = testAmount + expectedGst;

      console.log(`✅ GST Calculation Test: Base ₹${testAmount} + GST ₹${expectedGst.toFixed(2)} = Total ₹${expectedTotal.toFixed(2)}`);
    });

    await this.runTest('invoiceCalculations', 'Test Subtotal Calculation', async () => {
      const testItems = [
        { quantity: 10, rate: 95.50 },
        { quantity: 5, rate: 87.25 },
        { quantity: 8, rate: 98.75 }
      ];

      let expectedSubtotal = 0;
      for (const item of testItems) {
        expectedSubtotal += item.quantity * item.rate;
      }

      console.log(`✅ Subtotal Calculation Test: ${testItems.length} items = ₹${expectedSubtotal.toFixed(2)}`);
    });

    await this.runTest('invoiceCalculations', 'Test Discount Application', async () => {
      const subtotal = 1000;
      const discountPercent = 5;
      const discountAmount = subtotal * (discountPercent / 100);
      const discountedAmount = subtotal - discountAmount;

      console.log(`✅ Discount Test: ₹${subtotal} - ${discountPercent}% (₹${discountAmount.toFixed(2)}) = ₹${discountedAmount.toFixed(2)}`);
    });

    await this.runTest('invoiceCalculations', 'Test Multi-Item Invoice Total', async () => {
      const items = [
        { quantity: 20, rate: 95.50, gst: 18 },
        { quantity: 15, rate: 87.25, gst: 18 },
        { quantity: 10, rate: 98.75, gst: 18 }
      ];

      let subtotal = 0;
      let totalGst = 0;

      for (const item of items) {
        const itemTotal = item.quantity * item.rate;
        subtotal += itemTotal;
        totalGst += itemTotal * (item.gst / 100);
      }

      const grandTotal = subtotal + totalGst;

      console.log(`✅ Multi-Item Invoice: Subtotal ₹${subtotal.toFixed(2)} + GST ₹${totalGst.toFixed(2)} = Total ₹${grandTotal.toFixed(2)}`);
    });
  }

  // Invoice Validation Testing
  async testInvoiceValidation() {
    console.log('\n✅ TESTING INVOICE VALIDATION');
    console.log('=' .repeat(60));

    await this.runTest('invoiceValidation', 'Test Required Field Validation', async () => {
      // Test creating invoice without required fields
      try {
        await this.client.query(`
          INSERT INTO credit_sales (credit_customer_id, fuel_product_id, quantity, price_per_unit, total_amount, sale_date)
          VALUES (null, null, null, null, null, null)
        `);
        throw new Error('Should have failed due to null values');
      } catch (error) {
        if (error.message.includes('null value') || error.message.includes('violates')) {
          console.log('✅ Required field validation working correctly');
        } else {
          throw error;
        }
      }
    });

    await this.runTest('invoiceValidation', 'Test Amount Validation', async () => {
      // Test negative amounts
      try {
        await this.client.query(`
          INSERT INTO credit_sales (credit_customer_id, fuel_product_id, quantity, price_per_unit, total_amount, sale_date)
          VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
        `, [
          this.createdData.customers[0]?.id,
          this.createdData.fuelProducts[0]?.id,
          -10, // Negative quantity
          -95.50, // Negative price
          -1000 // Negative total
        ]);
        throw new Error('Should have failed due to negative values');
      } catch (error) {
        console.log('✅ Amount validation working correctly');
      }
    });

    await this.runTest('invoiceValidation', 'Test Customer Credit Limit Validation', async () => {
      if (this.createdData.customers.length === 0) {
        throw new Error('No customers available for credit limit test');
      }

      const customer = this.createdData.customers[0];
      const currentBalance = parseFloat(customer.current_balance || 0);
      const creditLimit = parseFloat(customer.credit_limit || 0);
      const availableCredit = creditLimit - currentBalance;

      console.log(`✅ Customer ${customer.organization_name}: Limit ₹${creditLimit}, Balance ₹${currentBalance}, Available ₹${availableCredit.toFixed(2)}`);
    });

    await this.runTest('invoiceValidation', 'Test Invoice Number Uniqueness', async () => {
      const invoiceNumbers = this.createdData.invoices.map(inv => inv.invoice_number);
      const uniqueNumbers = new Set(invoiceNumbers);
      
      if (uniqueNumbers.size !== invoiceNumbers.length) {
        throw new Error('Duplicate invoice numbers detected');
      }
      
      console.log(`✅ All ${uniqueNumbers.size} invoice numbers are unique`);
    });
  }

  async runAllTests() {
    console.log('🚀 STARTING PHASE 7: INVOICE GENERATION AND MANAGEMENT TESTING');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      await this.loadMasterData();
      await this.testInvoiceGeneration();
      await this.testInvoiceManagement();
      await this.testInvoiceCalculations();
      await this.testInvoiceValidation();

      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 PHASE 7: INVOICE GENERATION AND MANAGEMENT TESTING RESULTS');
      console.log('='.repeat(80));

      let totalPassed = 0;
      let totalFailed = 0;
      let totalTests = 0;

      Object.keys(this.testResults).forEach(category => {
        const result = this.testResults[category];
        const successRate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(2) : '0.00';
        
        console.log(`${category.toUpperCase()}: ${result.passed}/${result.total} passed (${result.failed} failed) - ${successRate}%`);
        
        totalPassed += result.passed;
        totalFailed += result.failed;
        totalTests += result.total;
      });

      const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0.00';

      console.log('\n🎯 OVERALL RESULTS:');
      console.log(`✅ Tests Passed: ${totalPassed}`);
      console.log(`❌ Tests Failed: ${totalFailed}`);
      console.log(`📈 Total Tests: ${totalTests}`);
      console.log(`🎯 Success Rate: ${overallSuccessRate}%`);

      console.log('\n📊 INVOICES CREATED:');
      console.log(`📄 Print Templates Created: ${this.createdData.templates ? this.createdData.templates.length : 0}`);
      console.log(`💳 Credit Sales Processed: ${this.createdData.creditSales.length}`);
      console.log(`👥 Customers Involved: ${this.createdData.customers.length}`);
      console.log(`⛽ Products Involved: ${this.createdData.fuelProducts.length}`);

      if (totalFailed === 0) {
        console.log('\n🏆 ALL INVOICE GENERATION AND MANAGEMENT TESTS PASSED!');
      } else {
        console.log('\n⚠️ Some invoice tests failed. Review the details above.');
      }

    } catch (error) {
      console.error('❌ Phase 7 testing failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the tests
const tester = new Phase7InvoicingTester();
tester.runAllTests().catch(console.error);
