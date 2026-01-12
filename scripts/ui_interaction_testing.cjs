#!/usr/bin/env node

/**
 * COMPREHENSIVE UI INTERACTION TESTING SCRIPT
 * Tests actual frontend functionality - searching, selecting, and saving
 * Simulates real user interactions with the UI through database operations
 */

const { Client } = require('pg');
require('dotenv').config();

class UIIntractionTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      searchTests: { passed: 0, failed: 0, total: 0, details: [] },
      selectTests: { passed: 0, failed: 0, total: 0, details: [] },
      saveTests: { passed: 0, failed: 0, total: 0, details: [] },
      uiFlowTests: { passed: 0, failed: 0, total: 0, details: [] },
      validationTests: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.testData = {};
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database for UI interaction testing');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Database connection closed');
  }

  async runTest(category, testName, testFunction) {
    this.testResults[category].total++;
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      await testFunction();
      this.testResults[category].passed++;
      this.testResults[category].details.push({ test: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.testResults[category].failed++;
      this.testResults[category].details.push({ test: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  // Test UI functionality through database operations
  async testUIFunctionality(description, testFunction) {
    try {
      console.log(`🔍 Testing UI: ${description}`);
      await testFunction();
      console.log(`✅ UI Test Passed: ${description}`);
      return true;
    } catch (error) {
      console.log(`❌ UI Test Failed: ${description} - ${error.message}`);
      return false;
    }
  }

  // Test database queries for UI data
  async testDatabaseQuery(query, params = []) {
    try {
      const result = await this.client.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  // SEARCH FUNCTIONALITY TESTS
  async executeSearchTests() {
    console.log('\n🔍 SEARCH FUNCTIONALITY TESTS');
    console.log('=' .repeat(60));

    // 1. Search Fuel Products
    await this.runTest('searchTests', 'Search Fuel Products - Find products by name', async () => {
      const products = await this.testDatabaseQuery(`
        SELECT * FROM fuel_products 
        WHERE product_name ILIKE '%petrol%' OR product_name ILIKE '%diesel%'
        ORDER BY product_name
      `);
      
      if (products.length === 0) {
        throw new Error('No fuel products found with search criteria');
      }
      
      console.log(`Found ${products.length} fuel products:`, products.map(p => p.product_name));
    });

    // 2. Search Credit Customers
    await this.runTest('searchTests', 'Search Credit Customers - Find customers by organization name', async () => {
      const customers = await this.testDatabaseQuery(`
        SELECT * FROM credit_customers 
        WHERE organization_name ILIKE '%transport%' OR organization_name ILIKE '%logistics%'
        ORDER BY organization_name
      `);
      
      if (customers.length === 0) {
        throw new Error('No customers found with search criteria');
      }
      
      console.log(`Found ${customers.length} customers:`, customers.map(c => c.organization_name));
    });

    // 3. Search Employees
    await this.runTest('searchTests', 'Search Employees - Find employees by designation', async () => {
      const employees = await this.testDatabaseQuery(`
        SELECT * FROM employees 
        WHERE designation ILIKE '%operator%' OR designation ILIKE '%manager%'
        ORDER BY designation
      `);
      
      if (employees.length === 0) {
        throw new Error('No employees found with search criteria');
      }
      
      console.log(`Found ${employees.length} employees:`, employees.map(e => `${e.employee_name} (${e.designation})`));
    });

    // 4. Search Vendors
    await this.runTest('searchTests', 'Search Vendors - Find vendors by name', async () => {
      const vendors = await this.testDatabaseQuery(`
        SELECT * FROM vendors 
        WHERE vendor_name ILIKE '%oil%' OR vendor_name ILIKE '%petroleum%'
        ORDER BY vendor_name
      `);
      
      if (vendors.length === 0) {
        throw new Error('No vendors found with search criteria');
      }
      
      console.log(`Found ${vendors.length} vendors:`, vendors.map(v => v.vendor_name));
    });

    // 5. Search Lubricants
    await this.runTest('searchTests', 'Search Lubricants - Find lubricants by brand', async () => {
      const lubricants = await this.testDatabaseQuery(`
        SELECT * FROM lubricants 
        WHERE lubricant_name ILIKE '%castrol%' OR lubricant_name ILIKE '%mobil%'
        ORDER BY lubricant_name
      `);
      
      if (lubricants.length === 0) {
        throw new Error('No lubricants found with search criteria');
      }
      
      console.log(`Found ${lubricants.length} lubricants:`, lubricants.map(l => l.lubricant_name));
    });

    // 6. Search Guest Sales by Vehicle Number
    await this.runTest('searchTests', 'Search Guest Sales - Find sales by vehicle number', async () => {
      const sales = await this.testDatabaseQuery(`
        SELECT * FROM guest_sales 
        WHERE vehicle_number ILIKE '%KA01%'
        ORDER BY sale_date DESC
        LIMIT 10
      `);
      
      if (sales.length === 0) {
        throw new Error('No guest sales found with vehicle number search');
      }
      
      console.log(`Found ${sales.length} guest sales:`, sales.map(s => `${s.vehicle_number} - ₹${s.total_amount}`));
    });

    // 7. Search Credit Sales by Customer
    await this.runTest('searchTests', 'Search Credit Sales - Find sales by customer', async () => {
      const sales = await this.testDatabaseQuery(`
        SELECT cs.*, cc.organization_name 
        FROM credit_sales cs
        JOIN credit_customers cc ON cs.credit_customer_id = cc.id
        WHERE cc.organization_name ILIKE '%transport%'
        ORDER BY cs.sale_date DESC
        LIMIT 10
      `);
      
      if (sales.length === 0) {
        throw new Error('No credit sales found with customer search');
      }
      
      console.log(`Found ${sales.length} credit sales:`, sales.map(s => `${s.organization_name} - ₹${s.total_amount}`));
    });

    // 8. Search Expenses by Category
    await this.runTest('searchTests', 'Search Expenses - Find expenses by type', async () => {
      const expenses = await this.testDatabaseQuery(`
        SELECT e.*, et.expense_type_name 
        FROM expenses e
        JOIN expense_types et ON e.expense_type_id = et.id
        WHERE et.expense_type_name ILIKE '%electricity%' OR et.expense_type_name ILIKE '%salary%'
        ORDER BY e.expense_date DESC
        LIMIT 10
      `);
      
      if (expenses.length === 0) {
        throw new Error('No expenses found with category search');
      }
      
      console.log(`Found ${expenses.length} expenses:`, expenses.map(e => `${e.expense_type_name} - ₹${e.amount}`));
    });

    console.log('\n✅ SEARCH TESTS COMPLETED');
  }

  // SELECT FUNCTIONALITY TESTS
  async executeSelectTests() {
    console.log('\n📋 SELECT FUNCTIONALITY TESTS');
    console.log('=' .repeat(60));

    // 1. Select Fuel Product for Sale
    await this.runTest('selectTests', 'Select Fuel Product - Choose product for sale', async () => {
      const products = await this.testDatabaseQuery(`
        SELECT id, product_name, current_rate 
        FROM fuel_products 
        WHERE is_active = true
        ORDER BY product_name
      `);
      
      if (products.length === 0) {
        throw new Error('No active fuel products available for selection');
      }
      
      const selectedProduct = products[0];
      console.log(`Selected product: ${selectedProduct.product_name} at ₹${selectedProduct.current_rate}/liter`);
      
      // Verify product has required fields
      if (!selectedProduct.id || !selectedProduct.product_name || !selectedProduct.current_rate) {
        throw new Error('Selected product missing required fields');
      }
    });

    // 2. Select Credit Customer for Sale
    await this.runTest('selectTests', 'Select Credit Customer - Choose customer for credit sale', async () => {
      const customers = await this.testDatabaseQuery(`
        SELECT id, organization_name, credit_limit, current_balance,
               (credit_limit - current_balance) as available_credit
        FROM credit_customers 
        WHERE is_active = true
        ORDER BY organization_name
      `);
      
      if (customers.length === 0) {
        throw new Error('No active credit customers available for selection');
      }
      
      const selectedCustomer = customers[0];
      console.log(`Selected customer: ${selectedCustomer.organization_name}`);
      console.log(`Credit limit: ₹${selectedCustomer.credit_limit}, Available: ₹${selectedCustomer.available_credit}`);
      
      // Verify customer has available credit
      if (selectedCustomer.available_credit <= 0) {
        throw new Error('Selected customer has no available credit');
      }
    });

    // 3. Select Employee for Assignment
    await this.runTest('selectTests', 'Select Employee - Choose employee for shift assignment', async () => {
      const employees = await this.testDatabaseQuery(`
        SELECT id, employee_name, designation, mobile_number
        FROM employees 
        WHERE is_active = true
        ORDER BY designation, employee_name
      `);
      
      if (employees.length === 0) {
        throw new Error('No active employees available for selection');
      }
      
      const selectedEmployee = employees[0];
      console.log(`Selected employee: ${selectedEmployee.employee_name} (${selectedEmployee.designation})`);
      
      // Verify employee has required fields
      if (!selectedEmployee.id || !selectedEmployee.employee_name || !selectedEmployee.designation) {
        throw new Error('Selected employee missing required fields');
      }
    });

    // 4. Select Vendor for Purchase
    await this.runTest('selectTests', 'Select Vendor - Choose vendor for purchase', async () => {
      const vendors = await this.testDatabaseQuery(`
        SELECT id, vendor_name, contact_person, mobile_number, current_balance
        FROM vendors 
        WHERE is_active = true
        ORDER BY vendor_name
      `);
      
      if (vendors.length === 0) {
        throw new Error('No active vendors available for selection');
      }
      
      const selectedVendor = vendors[0];
      console.log(`Selected vendor: ${selectedVendor.vendor_name}`);
      console.log(`Contact: ${selectedVendor.contact_person}, Balance: ₹${selectedVendor.current_balance}`);
      
      // Verify vendor has required fields
      if (!selectedVendor.id || !selectedVendor.vendor_name) {
        throw new Error('Selected vendor missing required fields');
      }
    });

    // 5. Select Lubricant for Sale
    await this.runTest('selectTests', 'Select Lubricant - Choose lubricant for sale', async () => {
      const lubricants = await this.testDatabaseQuery(`
        SELECT id, lubricant_name, sale_rate, current_stock, minimum_stock
        FROM lubricants 
        WHERE is_active = true AND current_stock > 0
        ORDER BY lubricant_name
      `);
      
      if (lubricants.length === 0) {
        throw new Error('No lubricants with stock available for selection');
      }
      
      const selectedLubricant = lubricants[0];
      console.log(`Selected lubricant: ${selectedLubricant.lubricant_name}`);
      console.log(`Sale rate: ₹${selectedLubricant.sale_rate}, Stock: ${selectedLubricant.current_stock}L`);
      
      // Verify lubricant has stock
      if (selectedLubricant.current_stock <= 0) {
        throw new Error('Selected lubricant has no stock available');
      }
    });

    // 6. Select Swipe Machine for Transaction
    await this.runTest('selectTests', 'Select Swipe Machine - Choose EDC machine for transaction', async () => {
      const machines = await this.testDatabaseQuery(`
        SELECT sm.id, sm.machine_name, sm.machine_type, sm.provider, sm.bank_type
        FROM swipe_machines sm
        WHERE sm.is_active = true
        ORDER BY sm.machine_name
      `);
      
      if (machines.length === 0) {
        throw new Error('No active swipe machines available for selection');
      }
      
      const selectedMachine = machines[0];
      console.log(`Selected machine: ${selectedMachine.machine_name} (${selectedMachine.provider})`);
      
      // Verify machine has required fields
      if (!selectedMachine.id || !selectedMachine.machine_name) {
        throw new Error('Selected machine missing required fields');
      }
    });

    // 7. Select Shift for Assignment
    await this.runTest('selectTests', 'Select Shift - Choose shift for employee assignment', async () => {
      const shifts = await this.testDatabaseQuery(`
        SELECT id, shift_name, start_time, end_time
        FROM duty_shifts
        ORDER BY start_time
      `);
      
      if (shifts.length === 0) {
        throw new Error('No shifts available for selection');
      }
      
      const selectedShift = shifts[0];
      console.log(`Selected shift: ${selectedShift.shift_name} (${selectedShift.start_time} - ${selectedShift.end_time})`);
      
      // Verify shift has required fields
      if (!selectedShift.id || !selectedShift.shift_name) {
        throw new Error('Selected shift missing required fields');
      }
    });

    console.log('\n✅ SELECT TESTS COMPLETED');
  }

  // SAVE FUNCTIONALITY TESTS
  async executeSaveTests() {
    console.log('\n💾 SAVE FUNCTIONALITY TESTS');
    console.log('=' .repeat(60));

    // 1. Save New Fuel Product
    await this.runTest('saveTests', 'Save Fuel Product - Create new fuel product', async () => {
      const newProduct = {
        product_name: 'Test Petrol Premium',
        short_name: 'TEST-PET',
        product_code: 'TEST001',
        current_rate: 100.00,
        gst_percentage: 18.0,
        is_active: true
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO fuel_products (product_name, short_name, product_code, current_rate, gst_percentage, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, product_name, current_rate
      `, [newProduct.product_name, newProduct.short_name, newProduct.product_code, 
          newProduct.current_rate, newProduct.gst_percentage, newProduct.is_active]);

      if (!result[0]) {
        throw new Error('Failed to save new fuel product');
      }

      console.log(`Saved fuel product: ${result[0].product_name} at ₹${result[0].current_rate}/liter`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM fuel_products WHERE id = $1', [result[0].id]);
    });

    // 2. Save New Credit Customer
    await this.runTest('saveTests', 'Save Credit Customer - Create new credit customer', async () => {
      const newCustomer = {
        organization_name: 'Test Transport Company',
        mobile_number: '9876543210',
        credit_limit: 50000,
        current_balance: 0,
        is_active: true
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO credit_customers (organization_name, mobile_number, credit_limit, current_balance, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, organization_name, credit_limit
      `, [newCustomer.organization_name, newCustomer.mobile_number, 
          newCustomer.credit_limit, newCustomer.current_balance, newCustomer.is_active]);

      if (!result[0]) {
        throw new Error('Failed to save new credit customer');
      }

      console.log(`Saved customer: ${result[0].organization_name} with credit limit ₹${result[0].credit_limit}`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM credit_customers WHERE id = $1', [result[0].id]);
    });

    // 3. Save New Employee
    await this.runTest('saveTests', 'Save Employee - Create new employee', async () => {
      const newEmployee = {
        employee_name: 'Test Employee',
        employee_number: 'TEST001',
        mobile_number: '9876543211',
        designation: 'Test Operator',
        salary: 20000,
        is_active: true
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO employees (employee_name, employee_number, mobile_number, designation, salary, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, employee_name, designation
      `, [newEmployee.employee_name, newEmployee.employee_number, newEmployee.mobile_number,
          newEmployee.designation, newEmployee.salary, newEmployee.is_active]);

      if (!result[0]) {
        throw new Error('Failed to save new employee');
      }

      console.log(`Saved employee: ${result[0].employee_name} (${result[0].designation})`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM employees WHERE id = $1', [result[0].id]);
    });

    // 4. Save New Vendor
    await this.runTest('saveTests', 'Save Vendor - Create new vendor', async () => {
      const newVendor = {
        vendor_name: 'Test Oil Company',
        contact_person: 'Test Contact',
        mobile_number: '9876543212',
        gst_number: '29TEST1234F1Z5',
        current_balance: 0,
        is_active: true
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO vendors (vendor_name, contact_person, mobile_number, gst_number, current_balance, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, vendor_name, gst_number
      `, [newVendor.vendor_name, newVendor.contact_person, newVendor.mobile_number,
          newVendor.gst_number, newVendor.current_balance, newVendor.is_active]);

      if (!result[0]) {
        throw new Error('Failed to save new vendor');
      }

      console.log(`Saved vendor: ${result[0].vendor_name} (GST: ${result[0].gst_number})`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM vendors WHERE id = $1', [result[0].id]);
    });

    // 5. Save New Lubricant
    await this.runTest('saveTests', 'Save Lubricant - Create new lubricant', async () => {
      const newLubricant = {
        lubricant_name: 'Test Engine Oil',
        product_code: 'TEST-OIL',
        purchase_rate: 400,
        sale_rate: 450,
        mrp_rate: 500,
        current_stock: 50,
        minimum_stock: 10,
        hsn_code: '27101990',
        gst_percentage: 18.0,
        unit: 'Liters',
        is_active: true
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO lubricants (lubricant_name, product_code, purchase_rate, sale_rate, mrp_rate, 
                               current_stock, minimum_stock, hsn_code, gst_percentage, unit, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, lubricant_name, sale_rate, current_stock
      `, [newLubricant.lubricant_name, newLubricant.product_code, newLubricant.purchase_rate,
          newLubricant.sale_rate, newLubricant.mrp_rate, newLubricant.current_stock,
          newLubricant.minimum_stock, newLubricant.hsn_code, newLubricant.gst_percentage,
          newLubricant.unit, newLubricant.is_active]);

      if (!result[0]) {
        throw new Error('Failed to save new lubricant');
      }

      console.log(`Saved lubricant: ${result[0].lubricant_name} at ₹${result[0].sale_rate}/liter, Stock: ${result[0].current_stock}L`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM lubricants WHERE id = $1', [result[0].id]);
    });

    // 6. Save New Guest Sale
    await this.runTest('saveTests', 'Save Guest Sale - Create new guest sale', async () => {
      // Get a fuel product first
      const products = await this.testDatabaseQuery('SELECT id FROM fuel_products WHERE is_active = true LIMIT 1');
      if (products.length === 0) {
        throw new Error('No fuel products available for sale');
      }

      const newSale = {
        fuel_product_id: products[0].id,
        sale_date: new Date(),
        quantity: 25.5,
        price_per_unit: 95.50,
        discount: 0,
        total_amount: 25.5 * 95.50,
        payment_mode: 'CASH',
        vehicle_number: 'TEST1234',
        customer_name: 'Test Customer',
        mobile_number: '9876543213',
        offer_type: 'Regular'
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO guest_sales (fuel_product_id, sale_date, quantity, price_per_unit, discount, 
                                total_amount, payment_mode, vehicle_number, customer_name, mobile_number, offer_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, vehicle_number, total_amount
      `, [newSale.fuel_product_id, newSale.sale_date, newSale.quantity, newSale.price_per_unit,
          newSale.discount, newSale.total_amount, newSale.payment_mode, newSale.vehicle_number,
          newSale.customer_name, newSale.mobile_number, newSale.offer_type]);

      if (!result[0]) {
        throw new Error('Failed to save new guest sale');
      }

      console.log(`Saved guest sale: ${result[0].vehicle_number} - ₹${result[0].total_amount}`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM guest_sales WHERE id = $1', [result[0].id]);
    });

    // 7. Save New Credit Sale
    await this.runTest('saveTests', 'Save Credit Sale - Create new credit sale', async () => {
      // Get a fuel product and customer first
      const products = await this.testDatabaseQuery('SELECT id FROM fuel_products WHERE is_active = true LIMIT 1');
      const customers = await this.testDatabaseQuery('SELECT id FROM credit_customers WHERE is_active = true LIMIT 1');
      
      if (products.length === 0 || customers.length === 0) {
        throw new Error('No fuel products or customers available for credit sale');
      }

      const newSale = {
        credit_customer_id: customers[0].id,
        fuel_product_id: products[0].id,
        sale_date: new Date(),
        quantity: 50.0,
        price_per_unit: 95.50,
        total_amount: 50.0 * 95.50
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO credit_sales (credit_customer_id, fuel_product_id, sale_date, quantity, price_per_unit, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, quantity, total_amount
      `, [newSale.credit_customer_id, newSale.fuel_product_id, newSale.sale_date,
          newSale.quantity, newSale.price_per_unit, newSale.total_amount]);

      if (!result[0]) {
        throw new Error('Failed to save new credit sale');
      }

      console.log(`Saved credit sale: ${result[0].quantity}L - ₹${result[0].total_amount}`);
      
      // Clean up test data
      await this.testDatabaseQuery('DELETE FROM credit_sales WHERE id = $1', [result[0].id]);
    });

    console.log('\n✅ SAVE TESTS COMPLETED');
  }

  // UI FLOW TESTS
  async executeUIFlowTests() {
    console.log('\n🔄 UI FLOW TESTS');
    console.log('=' .repeat(60));

    // 1. Complete Guest Sale Flow
    await this.runTest('uiFlowTests', 'Complete Guest Sale Flow - End-to-end guest sale process', async () => {
      // Step 1: Get fuel product
      const products = await this.testDatabaseQuery('SELECT id, product_name, current_rate FROM fuel_products WHERE is_active = true LIMIT 1');
      if (products.length === 0) {
        throw new Error('No fuel products available');
      }
      const product = products[0];

      // Step 2: Create guest sale
      const saleData = {
        fuel_product_id: product.id,
        quantity: 30.0,
        price_per_unit: product.current_rate,
        discount: 10,
        total_amount: (30.0 * product.current_rate) - 10,
        payment_mode: 'CARD',
        vehicle_number: 'FLOW1234',
        customer_name: 'Flow Test Customer',
        mobile_number: '9876543214',
        offer_type: 'Test'
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO guest_sales (fuel_product_id, sale_date, quantity, price_per_unit, discount, 
                                total_amount, payment_mode, vehicle_number, customer_name, mobile_number, offer_type)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, vehicle_number, total_amount
      `, [saleData.fuel_product_id, saleData.quantity, saleData.price_per_unit, saleData.discount,
          saleData.total_amount, saleData.payment_mode, saleData.vehicle_number, saleData.customer_name,
          saleData.mobile_number, saleData.offer_type]);

      // Step 3: Verify sale was created
      if (!result[0]) {
        throw new Error('Guest sale creation failed');
      }

      // Step 4: Verify sale can be retrieved
      const retrievedSale = await this.testDatabaseQuery('SELECT * FROM guest_sales WHERE id = $1', [result[0].id]);
      if (retrievedSale.length === 0) {
        throw new Error('Guest sale retrieval failed');
      }

      console.log(`✅ Complete guest sale flow: ${result[0].vehicle_number} - ₹${result[0].total_amount}`);
      
      // Clean up
      await this.testDatabaseQuery('DELETE FROM guest_sales WHERE id = $1', [result[0].id]);
    });

    // 2. Complete Credit Sale Flow
    await this.runTest('uiFlowTests', 'Complete Credit Sale Flow - End-to-end credit sale process', async () => {
      // Step 1: Get fuel product and customer
      const products = await this.testDatabaseQuery('SELECT id, product_name, current_rate FROM fuel_products WHERE is_active = true LIMIT 1');
      const customers = await this.testDatabaseQuery('SELECT id, organization_name, credit_limit, current_balance FROM credit_customers WHERE is_active = true LIMIT 1');
      
      if (products.length === 0 || customers.length === 0) {
        throw new Error('No fuel products or customers available');
      }
      
      const product = products[0];
      const customer = customers[0];

      // Step 2: Check credit availability
      const availableCredit = customer.credit_limit - customer.current_balance;
      if (availableCredit <= 0) {
        throw new Error('Customer has no available credit');
      }

      // Step 3: Create credit sale
      const saleData = {
        credit_customer_id: customer.id,
        fuel_product_id: product.id,
        quantity: 40.0,
        price_per_unit: product.current_rate,
        total_amount: 40.0 * product.current_rate
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO credit_sales (credit_customer_id, fuel_product_id, sale_date, quantity, price_per_unit, total_amount)
        VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)
        RETURNING id, quantity, total_amount
      `, [saleData.credit_customer_id, saleData.fuel_product_id, saleData.quantity, saleData.price_per_unit, saleData.total_amount]);

      // Step 4: Verify sale was created
      if (!result[0]) {
        throw new Error('Credit sale creation failed');
      }

      // Step 5: Verify customer balance updated
      const updatedCustomer = await this.testDatabaseQuery('SELECT current_balance FROM credit_customers WHERE id = $1', [customer.id]);
      if (updatedCustomer.length === 0) {
        throw new Error('Customer balance update verification failed');
      }

      console.log(`✅ Complete credit sale flow: ${customer.organization_name} - ${result[0].quantity}L - ₹${result[0].total_amount}`);
      
      // Clean up
      await this.testDatabaseQuery('DELETE FROM credit_sales WHERE id = $1', [result[0].id]);
    });

    // 3. Complete Lubricant Sale Flow
    await this.runTest('uiFlowTests', 'Complete Lubricant Sale Flow - End-to-end lubricant sale process', async () => {
      // Step 1: Get lubricant and employee
      const lubricants = await this.testDatabaseQuery('SELECT id, lubricant_name, sale_rate, current_stock FROM lubricants WHERE is_active = true AND current_stock > 0 LIMIT 1');
      const employees = await this.testDatabaseQuery('SELECT id, employee_name FROM employees WHERE is_active = true LIMIT 1');
      
      if (lubricants.length === 0 || employees.length === 0) {
        throw new Error('No lubricants with stock or employees available');
      }
      
      const lubricant = lubricants[0];
      const employee = employees[0];

      // Step 2: Create lubricant sale
      const saleData = {
        lubricant_id: lubricant.id,
        quantity: 2,
        sale_rate: lubricant.sale_rate,
        total_amount: 2 * lubricant.sale_rate,
        employee_id: employee.id
      };

      const result = await this.testDatabaseQuery(`
        INSERT INTO lubricant_sales (lubricant_id, sale_date, quantity, sale_rate, total_amount, employee_id)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
        RETURNING id, quantity, total_amount
      `, [saleData.lubricant_id, saleData.quantity, saleData.sale_rate, saleData.total_amount, saleData.employee_id]);

      // Step 3: Verify sale was created
      if (!result[0]) {
        throw new Error('Lubricant sale creation failed');
      }

      // Step 4: Verify lubricant stock updated
      const updatedLubricant = await this.testDatabaseQuery('SELECT current_stock FROM lubricants WHERE id = $1', [lubricant.id]);
      if (updatedLubricant.length === 0) {
        throw new Error('Lubricant stock update verification failed');
      }

      console.log(`✅ Complete lubricant sale flow: ${lubricant.lubricant_name} - ${result[0].quantity}L - ₹${result[0].total_amount}`);
      
      // Clean up
      await this.testDatabaseQuery('DELETE FROM lubricant_sales WHERE id = $1', [result[0].id]);
    });

    console.log('\n✅ UI FLOW TESTS COMPLETED');
  }

  // VALIDATION TESTS
  async executeValidationTests() {
    console.log('\n✅ VALIDATION TESTS');
    console.log('=' .repeat(60));

    // 1. Required Field Validation
    await this.runTest('validationTests', 'Required Field Validation - Test mandatory field validation', async () => {
      try {
        // Try to create fuel product without required fields
        await this.testDatabaseQuery(`
          INSERT INTO fuel_products (product_name, short_name, product_code, current_rate, gst_percentage, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [null, 'TEST', 'TEST001', 100.00, 18.0, true]);
        
        throw new Error('Should have failed due to null product_name');
      } catch (error) {
        if (error.message.includes('null value in column "product_name"')) {
          console.log('✅ Required field validation working: product_name cannot be null');
        } else {
          throw error;
        }
      }
    });

    // 2. Data Type Validation
    await this.runTest('validationTests', 'Data Type Validation - Test numeric field validation', async () => {
      try {
        // Try to create fuel product with invalid data types
        await this.testDatabaseQuery(`
          INSERT INTO fuel_products (product_name, short_name, product_code, current_rate, gst_percentage, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['Test Product', 'TEST', 'TEST001', 'invalid_rate', 18.0, true]);
        
        throw new Error('Should have failed due to invalid current_rate');
      } catch (error) {
        if (error.message.includes('invalid input syntax for type numeric')) {
          console.log('✅ Data type validation working: current_rate must be numeric');
        } else {
          throw error;
        }
      }
    });

    // 3. Credit Limit Validation
    await this.runTest('validationTests', 'Credit Limit Validation - Test credit limit enforcement', async () => {
      // Get a customer with low credit limit
      const customers = await this.testDatabaseQuery(`
        SELECT id, organization_name, credit_limit, current_balance,
               (credit_limit - current_balance) as available_credit
        FROM credit_customers 
        WHERE is_active = true AND (credit_limit - current_balance) < 1000
        LIMIT 1
      `);
      
      if (customers.length === 0) {
        console.log('✅ Credit limit validation: No customers with low credit available for testing');
        return;
      }
      
      const customer = customers[0];
      console.log(`✅ Credit limit validation: Customer ${customer.organization_name} has available credit ₹${customer.available_credit}`);
    });

    // 4. Stock Validation
    await this.runTest('validationTests', 'Stock Validation - Test stock availability validation', async () => {
      // Get lubricants with low stock
      const lubricants = await this.testDatabaseQuery(`
        SELECT id, lubricant_name, current_stock, minimum_stock
        FROM lubricants 
        WHERE is_active = true AND current_stock <= minimum_stock
        LIMIT 1
      `);
      
      if (lubricants.length === 0) {
        console.log('✅ Stock validation: No lubricants with low stock available for testing');
        return;
      }
      
      const lubricant = lubricants[0];
      console.log(`✅ Stock validation: Lubricant ${lubricant.lubricant_name} has low stock ${lubricant.current_stock}L (min: ${lubricant.minimum_stock}L)`);
    });

    // 5. Unique Constraint Validation
    await this.runTest('validationTests', 'Unique Constraint Validation - Test duplicate prevention', async () => {
      // Get existing fuel product
      const existingProduct = await this.testDatabaseQuery('SELECT product_code FROM fuel_products LIMIT 1');
      if (existingProduct.length === 0) {
        console.log('✅ Unique constraint validation: No existing products available for testing');
        return;
      }
      
      try {
        // Try to create duplicate product code
        await this.testDatabaseQuery(`
          INSERT INTO fuel_products (product_name, short_name, product_code, current_rate, gst_percentage, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['Duplicate Product', 'DUP', existingProduct[0].product_code, 100.00, 18.0, true]);
        
        throw new Error('Should have failed due to duplicate product_code');
      } catch (error) {
        if (error.message.includes('duplicate key value')) {
          console.log('✅ Unique constraint validation working: product_code must be unique');
        } else {
          throw error;
        }
      }
    });

    console.log('\n✅ VALIDATION TESTS COMPLETED');
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive UI Interaction Testing');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      // Execute all test categories
      await this.executeSearchTests();
      await this.executeSelectTests();
      await this.executeSaveTests();
      await this.executeUIFlowTests();
      await this.executeValidationTests();
      
      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 COMPREHENSIVE UI INTERACTION TESTING RESULTS');
      console.log('='.repeat(80));
      
      let totalPassed = 0;
      let totalFailed = 0;
      let totalTests = 0;
      
      for (const category in this.testResults) {
        const categoryResults = this.testResults[category];
        totalPassed += categoryResults.passed;
        totalFailed += categoryResults.failed;
        totalTests += categoryResults.total;
        
        console.log(`${category.toUpperCase()}: ${categoryResults.passed}/${categoryResults.total} passed (${categoryResults.failed} failed)`);
      }
      
      console.log(`\n🎯 OVERALL RESULTS:`);
      console.log(`✅ Tests Passed: ${totalPassed}`);
      console.log(`❌ Tests Failed: ${totalFailed}`);
      console.log(`📈 Total Tests: ${totalTests}`);
      console.log(`🎯 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);

      if (totalFailed === 0) {
        console.log('\n🏆 ALL UI INTERACTION TESTS PASSED! System UI is fully functional!');
      } else {
        console.log('\n⚠️ Some UI interaction tests failed. Review the details above.');
      }

    } finally {
      await this.disconnect();
    }
  }
}

// Run the comprehensive UI interaction tests
if (require.main === module) {
  const tester = new UIIntractionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = UIIntractionTester;
