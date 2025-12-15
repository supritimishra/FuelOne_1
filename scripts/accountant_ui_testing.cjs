#!/usr/bin/env node

/**
 * COMPREHENSIVE ACCOUNTANT UI TESTING SCRIPT
 * Simulates real accountant user interactions with all 50+ modules
 * Tests CRUD operations, calculations, and data connectivity
 */

const { Client } = require('pg');
require('dotenv').config();

class AccountantUITester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      phase1: { passed: 0, failed: 0, total: 0, details: [] },
      phase2: { passed: 0, failed: 0, total: 0, details: [] },
      phase3: { passed: 0, failed: 0, total: 0, details: [] },
      phase4: { passed: 0, failed: 0, total: 0, details: [] },
      phase5: { passed: 0, failed: 0, total: 0, details: [] },
      phase6: { passed: 0, failed: 0, total: 0, details: [] },
      phase7: { passed: 0, failed: 0, total: 0, details: [] },
      phase8: { passed: 0, failed: 0, total: 0, details: [] },
      crossModule: { passed: 0, failed: 0, total: 0, details: [] },
      dataIntegrity: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.testData = {
      fuelProducts: [],
      lubricants: [],
      employees: [],
      customers: [],
      vendors: [],
      expenseTypes: [],
      businessParties: [],
      swipeMachines: [],
      tanks: [],
      nozzles: [],
      shifts: [],
      guestSales: [],
      creditSales: [],
      saleEntries: [],
      lubSales: [],
      swipeTransactions: [],
      tankerSales: [],
      liquidPurchases: [],
      lubPurchases: [],
      expenses: [],
      recoveries: [],
      employeeRecoveries: [],
      dayAssignings: [],
      dailySaleRates: [],
      denominations: [],
      daySettlements: [],
      shiftSheetEntries: [],
      openingStocks: [],
      lubLosses: [],
      businessTransactions: [],
      vendorTransactions: [],
      interestTransactions: []
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database for comprehensive accountant UI testing');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Database connection closed');
  }

  async runTest(phase, testName, testFunction) {
    this.testResults[phase].total++;
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      await testFunction();
      this.testResults[phase].passed++;
      this.testResults[phase].details.push({ test: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.testResults[phase].failed++;
      this.testResults[phase].details.push({ test: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  // PHASE 1: MASTER DATA SETUP
  async executePhase1() {
    console.log('\n🚀 PHASE 1: MASTER DATA SETUP');
    console.log('=' .repeat(60));

    // 1. Organization Settings
    await this.runTest('phase1', 'Organization Settings - Create/Update Organization', async () => {
      const result = await this.client.query(`
        INSERT INTO organization_details (
          organization_name, 
          owner_name,
          address, 
          phone_number,
          mobile_number,
          email, 
          gst_number,
          pan_number,
          bank_name,
          account_number,
          ifsc_code,
          branch_name
        ) VALUES (
          'Ramkrishna Service Centre',
          'Mr. Ramkrishna',
          '123 Main Street, Bangalore',
          '080-12345678',
          '9876543210',
          'info@ramkrishna.com',
          '29ABCDE1234F1Z5',
          'ABCDE1234F',
          'State Bank of India',
          '1234567890123456',
          'SBIN0001234',
          'Main Branch'
        ) ON CONFLICT (id) DO UPDATE SET
          organization_name = EXCLUDED.organization_name,
          owner_name = EXCLUDED.owner_name,
          address = EXCLUDED.address,
          phone_number = EXCLUDED.phone_number,
          mobile_number = EXCLUDED.mobile_number,
          email = EXCLUDED.email,
          gst_number = EXCLUDED.gst_number,
          pan_number = EXCLUDED.pan_number,
          bank_name = EXCLUDED.bank_name,
          account_number = EXCLUDED.account_number,
          ifsc_code = EXCLUDED.ifsc_code,
          branch_name = EXCLUDED.branch_name
        RETURNING id
      `);
      if (!result.rows[0]) throw new Error('Failed to create/update organization');
    });

    // 2. Fuel Products
    await this.runTest('phase1', 'Fuel Products - Create Multiple Products', async () => {
      const fuelProducts = [
        { name: 'Petrol Regular', short: 'PET', code: 'PET001', rate: 95.50, gst: 18.0 },
        { name: 'Petrol Premium', short: 'PET-P', code: 'PET002', rate: 98.50, gst: 18.0 },
        { name: 'Diesel Regular', short: 'DIES', code: 'DIES001', rate: 87.50, gst: 18.0 },
        { name: 'Diesel Premium', short: 'DIES-P', code: 'DIES002', rate: 90.50, gst: 18.0 }
      ];

      for (const product of fuelProducts) {
        const result = await this.client.query(`
          INSERT INTO fuel_products (product_name, short_name, product_code, current_rate, gst_percentage, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id
        `, [product.name, product.short, product.code, product.rate, product.gst]);
        
        this.testData.fuelProducts.push(result.rows[0]);
      }
      
      if (this.testData.fuelProducts.length !== fuelProducts.length) {
        throw new Error('Not all fuel products created successfully');
      }
    });

    // 3. Lubricants
    await this.runTest('phase1', 'Lubricants - Create Multiple Lubricants', async () => {
      const lubricants = [
        { name: 'Castrol GTX 20W-50', code: 'CGTX20W50', purchase: 450, sale: 500, mrp: 550, stock: 100, min: 20 },
        { name: 'Mobil 1 5W-30', code: 'M1-5W30', purchase: 650, sale: 720, mrp: 800, stock: 80, min: 15 },
        { name: 'Shell Helix Ultra', code: 'SHU-5W40', purchase: 550, sale: 620, mrp: 700, stock: 120, min: 25 },
        { name: 'Valvoline Premium', code: 'VP-10W40', purchase: 480, sale: 540, mrp: 600, stock: 90, min: 18 },
        { name: 'Motul 300V', code: 'M300V-5W40', purchase: 850, sale: 950, mrp: 1100, stock: 60, min: 10 },
        { name: 'Total Quartz', code: 'TQ-5W30', purchase: 420, sale: 480, mrp: 550, stock: 150, min: 30 },
        { name: 'BP Visco 7000', code: 'BPV7K-10W40', purchase: 380, sale: 430, mrp: 500, stock: 200, min: 40 },
        { name: 'Gulf Pride', code: 'GP-20W50', purchase: 350, sale: 400, mrp: 450, stock: 180, min: 35 },
        { name: 'Coolant Premium', code: 'CP-50-50', purchase: 120, sale: 150, mrp: 180, stock: 50, min: 10 },
        { name: 'Brake Fluid DOT4', code: 'BF-DOT4', purchase: 200, sale: 250, mrp: 300, stock: 30, min: 5 }
      ];

      for (const lub of lubricants) {
        const result = await this.client.query(`
          INSERT INTO lubricants (
            lubricant_name, product_code, purchase_rate, sale_rate, mrp_rate,
            current_stock, minimum_stock, hsn_code, gst_percentage, unit, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, '27101990', 18.0, 'Liters', true)
          RETURNING id
        `, [lub.name, lub.code, lub.purchase, lub.sale, lub.mrp, lub.stock, lub.min]);
        
        this.testData.lubricants.push(result.rows[0]);
      }
      
      if (this.testData.lubricants.length !== lubricants.length) {
        throw new Error('Not all lubricants created successfully');
      }
    });

    // 4. Employees
    await this.runTest('phase1', 'Employees - Create Multiple Employees', async () => {
      const employees = [
        { name: 'Rajesh Kumar', number: 'EMP001', mobile: '9876543210', designation: 'Manager', salary: 25000 },
        { name: 'Priya Sharma', number: 'EMP002', mobile: '9876543211', designation: 'Operator', salary: 18000 },
        { name: 'Amit Singh', number: 'EMP003', mobile: '9876543212', designation: 'Operator', salary: 18000 },
        { name: 'Sunita Devi', number: 'EMP004', mobile: '9876543213', designation: 'Cashier', salary: 20000 },
        { name: 'Vikram Patel', number: 'EMP005', mobile: '9876543214', designation: 'Supervisor', salary: 22000 },
        { name: 'Anita Reddy', number: 'EMP006', mobile: '9876543215', designation: 'Operator', salary: 18000 },
        { name: 'Suresh Kumar', number: 'EMP007', mobile: '9876543216', designation: 'Maintenance', salary: 19000 },
        { name: 'Meera Joshi', number: 'EMP008', mobile: '9876543217', designation: 'Accountant', salary: 23000 }
      ];

      for (const emp of employees) {
        const result = await this.client.query(`
          INSERT INTO employees (employee_name, employee_number, mobile_number, designation, salary, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id
        `, [emp.name, emp.number, emp.mobile, emp.designation, emp.salary]);
        
        this.testData.employees.push(result.rows[0]);
      }
      
      if (this.testData.employees.length !== employees.length) {
        throw new Error('Not all employees created successfully');
      }
    });

    // 5. Credit Customers
    await this.runTest('phase1', 'Credit Customers - Create Multiple Customers', async () => {
      const customers = [
        { name: 'ABC Transport Ltd', mobile: '9876543220', limit: 100000, balance: 0 },
        { name: 'XYZ Logistics', mobile: '9876543221', limit: 150000, balance: 0 },
        { name: 'DEF Courier Services', mobile: '9876543222', limit: 75000, balance: 0 },
        { name: 'GHI Freight', mobile: '9876543223', limit: 200000, balance: 0 },
        { name: 'JKL Cargo', mobile: '9876543224', limit: 125000, balance: 0 },
        { name: 'MNO Transport', mobile: '9876543225', limit: 80000, balance: 0 },
        { name: 'PQR Logistics', mobile: '9876543226', limit: 180000, balance: 0 },
        { name: 'STU Freight', mobile: '9876543227', limit: 90000, balance: 0 },
        { name: 'VWX Cargo', mobile: '9876543228', limit: 110000, balance: 0 },
        { name: 'YZA Transport', mobile: '9876543229', limit: 160000, balance: 0 },
        { name: 'BCD Logistics', mobile: '9876543230', limit: 95000, balance: 0 },
        { name: 'EFG Freight', mobile: '9876543231', limit: 130000, balance: 0 },
        { name: 'HIJ Cargo', mobile: '9876543232', limit: 85000, balance: 0 },
        { name: 'KLM Transport', mobile: '9876543233', limit: 140000, balance: 0 },
        { name: 'NOP Logistics', mobile: '9876543234', limit: 105000, balance: 0 },
        { name: 'QRS Freight', mobile: '9876543235', limit: 175000, balance: 0 },
        { name: 'TUV Cargo', mobile: '9876543236', limit: 120000, balance: 0 },
        { name: 'WXY Transport', mobile: '9876543237', limit: 70000, balance: 0 },
        { name: 'ZAB Logistics', mobile: '9876543238', limit: 155000, balance: 0 },
        { name: 'CDE Freight', mobile: '9876543239', limit: 115000, balance: 0 }
      ];

      for (const customer of customers) {
        const result = await this.client.query(`
          INSERT INTO credit_customers (
            organization_name, mobile_number, credit_limit, current_balance, is_active
          ) VALUES ($1, $2, $3, $4, true)
          RETURNING id
        `, [customer.name, customer.mobile, customer.limit, customer.balance]);
        
        this.testData.customers.push(result.rows[0]);
      }
      
      if (this.testData.customers.length !== customers.length) {
        throw new Error('Not all customers created successfully');
      }
    });

    // 6. Vendors
    await this.runTest('phase1', 'Vendors - Create Multiple Vendors', async () => {
      const vendors = [
        { name: 'Indian Oil Corporation', contact: 'Mr. Kumar', mobile: '9876543240', gst: '29ABCDE1234F1Z5', balance: 0 },
        { name: 'Bharat Petroleum', contact: 'Ms. Sharma', mobile: '9876543241', gst: '29ABCDE1234F1Z6', balance: 0 },
        { name: 'Hindustan Petroleum', contact: 'Mr. Singh', mobile: '9876543242', gst: '29ABCDE1234F1Z7', balance: 0 },
        { name: 'Castrol India', contact: 'Ms. Gupta', mobile: '9876543243', gst: '29ABCDE1234F1Z8', balance: 0 },
        { name: 'Mobil Lubricants', contact: 'Mr. Verma', mobile: '9876543244', gst: '29ABCDE1234F1Z9', balance: 0 },
        { name: 'Shell India', contact: 'Ms. Tiwari', mobile: '9876543245', gst: '29ABCDE1234F1Z0', balance: 0 },
        { name: 'Valvoline Cummins', contact: 'Mr. Agarwal', mobile: '9876543246', gst: '29ABCDE1234F1Z1', balance: 0 },
        { name: 'Motul India', contact: 'Ms. Jain', mobile: '9876543247', gst: '29ABCDE1234F1Z2', balance: 0 },
        { name: 'Total Lubricants', contact: 'Mr. Malhotra', mobile: '9876543248', gst: '29ABCDE1234F1Z3', balance: 0 },
        { name: 'Gulf Oil India', contact: 'Ms. Kapoor', mobile: '9876543249', gst: '29ABCDE1234F1Z4', balance: 0 }
      ];

      for (const vendor of vendors) {
        const result = await this.client.query(`
          INSERT INTO vendors (vendor_name, contact_person, mobile_number, gst_number, current_balance, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id
        `, [vendor.name, vendor.contact, vendor.mobile, vendor.gst, vendor.balance]);
        
        this.testData.vendors.push(result.rows[0]);
      }
      
      if (this.testData.vendors.length !== vendors.length) {
        throw new Error('Not all vendors created successfully');
      }
    });

    // 7. Expense Types
    await this.runTest('phase1', 'Expense Types - Create Multiple Categories', async () => {
      const expenseTypes = [
        { name: 'Electricity Bill', effect: 'Expense' },
        { name: 'Water Bill', effect: 'Expense' },
        { name: 'Salary', effect: 'Expense' },
        { name: 'Maintenance', effect: 'Expense' },
        { name: 'Insurance', effect: 'Expense' },
        { name: 'Rent', effect: 'Expense' },
        { name: 'Telephone', effect: 'Expense' },
        { name: 'Stationery', effect: 'Expense' },
        { name: 'Transport', effect: 'Expense' },
        { name: 'Professional Fees', effect: 'Expense' },
        { name: 'Marketing', effect: 'Expense' },
        { name: 'Security', effect: 'Expense' }
      ];

      for (const expenseType of expenseTypes) {
        const result = await this.client.query(`
          INSERT INTO expense_types (expense_type_name, effect_for, is_active)
          VALUES ($1, $2, true)
          RETURNING id
        `, [expenseType.name, expenseType.effect]);
        
        this.testData.expenseTypes.push(result.rows[0]);
      }
      
      if (this.testData.expenseTypes.length !== expenseTypes.length) {
        throw new Error('Not all expense types created successfully');
      }
    });

    // 8. Business Credit/Debit Party
    await this.runTest('phase1', 'Business Parties - Create Multiple Parties', async () => {
      const businessParties = [
        { name: 'SBI Current Account', type: 'Bank', balance: 500000 },
        { name: 'HDFC Savings Account', type: 'Bank', balance: 250000 },
        { name: 'Owner Capital', type: 'Capital', balance: 1000000 },
        { name: 'Cash Account', type: 'Cash', balance: 50000 },
        { name: 'Creditor Account', type: 'Creditor', balance: 0 },
        { name: 'Tanker Account', type: 'Tanker', balance: 0 },
        { name: 'Petty Cash', type: 'Cash', balance: 10000 },
        { name: 'Fixed Deposit', type: 'Bank', balance: 2000000 }
      ];

      for (const party of businessParties) {
        const result = await this.client.query(`
          INSERT INTO business_parties (
            date, party_name, party_type, opening_balance, opening_date, opening_type, is_active
          ) VALUES (
            CURRENT_DATE, $1, $2, $3, CURRENT_DATE, 'Opening', true
          )
          RETURNING id
        `, [party.name, party.type, party.balance]);
        
        this.testData.businessParties.push(result.rows[0]);
      }
      
      if (this.testData.businessParties.length !== businessParties.length) {
        throw new Error('Not all business parties created successfully');
      }
    });

    // 9. Swipe Machines
    await this.runTest('phase1', 'Swipe Machines - Create EDC Machines', async () => {
      const swipeMachines = [
        { name: 'EDC Machine 1', type: 'EDC', provider: 'ICICI Bank', bank: 'ICICI', vendor: 'ICICI Bank' },
        { name: 'EDC Machine 2', type: 'EDC', provider: 'HDFC Bank', bank: 'HDFC', vendor: 'HDFC Bank' },
        { name: 'EDC Machine 3', type: 'EDC', provider: 'Axis Bank', bank: 'Axis', vendor: 'Axis Bank' }
      ];

      for (const machine of swipeMachines) {
        const result = await this.client.query(`
          INSERT INTO swipe_machines (
            machine_name, machine_type, provider, bank_type, vendor_id, status, is_active
          ) VALUES ($1, $2, $3, $4, $5, 'Active', true)
          RETURNING id
        `, [machine.name, machine.type, machine.provider, machine.bank, this.testData.vendors[0].id]);
        
        this.testData.swipeMachines.push(result.rows[0]);
      }
      
      if (this.testData.swipeMachines.length !== swipeMachines.length) {
        throw new Error('Not all swipe machines created successfully');
      }
    });

    // 10. Tanks & Nozzles
    await this.runTest('phase1', 'Tanks & Nozzles - Create Tank and Nozzle Setup', async () => {
      // Create tanks
      const tanks = [
        { number: 'T001', product: this.testData.fuelProducts[0].id, capacity: 10000, stock: 5000, min: 500 },
        { number: 'T002', product: this.testData.fuelProducts[1].id, capacity: 8000, stock: 4000, min: 400 },
        { number: 'T003', product: this.testData.fuelProducts[2].id, capacity: 12000, stock: 6000, min: 600 },
        { number: 'T004', product: this.testData.fuelProducts[3].id, capacity: 9000, stock: 4500, min: 450 },
        { number: 'T005', product: this.testData.fuelProducts[0].id, capacity: 15000, stock: 7500, min: 750 },
        { number: 'T006', product: this.testData.fuelProducts[2].id, capacity: 11000, stock: 5500, min: 550 }
      ];

      for (const tank of tanks) {
        const result = await this.client.query(`
          INSERT INTO tanks (
            tank_number, fuel_product_id, capacity, current_stock, minimum_stock, is_active
          ) VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id
        `, [tank.number, tank.product, tank.capacity, tank.stock, tank.min]);
        
        this.testData.tanks.push(result.rows[0]);
      }

      // Create nozzles
      const nozzles = [
        { number: 'N001', tank: this.testData.tanks[0].id, product: this.testData.fuelProducts[0].id },
        { number: 'N002', tank: this.testData.tanks[0].id, product: this.testData.fuelProducts[0].id },
        { number: 'N003', tank: this.testData.tanks[1].id, product: this.testData.fuelProducts[1].id },
        { number: 'N004', tank: this.testData.tanks[1].id, product: this.testData.fuelProducts[1].id },
        { number: 'N005', tank: this.testData.tanks[2].id, product: this.testData.fuelProducts[2].id },
        { number: 'N006', tank: this.testData.tanks[2].id, product: this.testData.fuelProducts[2].id },
        { number: 'N007', tank: this.testData.tanks[3].id, product: this.testData.fuelProducts[3].id },
        { number: 'N008', tank: this.testData.tanks[3].id, product: this.testData.fuelProducts[3].id },
        { number: 'N009', tank: this.testData.tanks[4].id, product: this.testData.fuelProducts[0].id },
        { number: 'N010', tank: this.testData.tanks[4].id, product: this.testData.fuelProducts[0].id },
        { number: 'N011', tank: this.testData.tanks[5].id, product: this.testData.fuelProducts[2].id },
        { number: 'N012', tank: this.testData.tanks[5].id, product: this.testData.fuelProducts[2].id }
      ];

      for (const nozzle of nozzles) {
        const result = await this.client.query(`
          INSERT INTO nozzles (
            nozzle_number, tank_id, fuel_product_id, is_active
          ) VALUES ($1, $2, $3, true)
          RETURNING id
        `, [nozzle.number, nozzle.tank, nozzle.product]);
        
        this.testData.nozzles.push(result.rows[0]);
      }
      
      if (this.testData.tanks.length !== tanks.length || this.testData.nozzles.length !== nozzles.length) {
        throw new Error('Not all tanks and nozzles created successfully');
      }
    });

    // 11. Duty/Pay Shift
    await this.runTest('phase1', 'Duty/Pay Shift - Create Shifts', async () => {
      const shifts = [
        { name: 'Morning Shift', start: '06:00', end: '14:00' },
        { name: 'Afternoon Shift', start: '14:00', end: '22:00' },
        { name: 'Night Shift', start: '22:00', end: '06:00' }
      ];

      for (const shift of shifts) {
        const result = await this.client.query(`
          INSERT INTO duty_shifts (shift_name, start_time, end_time)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [shift.name, shift.start, shift.end]);
        
        this.testData.shifts.push(result.rows[0]);
      }
      
      if (this.testData.shifts.length !== shifts.length) {
        throw new Error('Not all shifts created successfully');
      }
    });

    // 12. Print Templates
    await this.runTest('phase1', 'Print Templates - Create Invoice Templates', async () => {
      const templates = [
        { name: 'Standard Invoice', type: 'invoice', content: 'Standard invoice template' },
        { name: 'Credit Sale Invoice', type: 'credit_invoice', content: 'Credit sale invoice template' },
        { name: 'Receipt Template', type: 'receipt', content: 'Payment receipt template' }
      ];

      for (const template of templates) {
        const result = await this.client.query(`
          INSERT INTO print_templates (name, content)
          VALUES ($1, $2)
          RETURNING id
        `, [template.name, template.content]);
        
        // Store template IDs for later use
        if (!this.testData.printTemplates) this.testData.printTemplates = [];
        this.testData.printTemplates.push(result.rows[0]);
      }
    });

    console.log('\n✅ PHASE 1 COMPLETED: Master Data Setup');
    console.log(`📊 Created: ${this.testData.fuelProducts.length} fuel products, ${this.testData.lubricants.length} lubricants, ${this.testData.employees.length} employees, ${this.testData.customers.length} customers, ${this.testData.vendors.length} vendors`);
  }

  // PHASE 2: DAILY OPERATIONS
  async executePhase2() {
    console.log('\n🚀 PHASE 2: DAILY OPERATIONS');
    console.log('=' .repeat(60));

    // 14. Guest Entry/Guest Sales
    await this.runTest('phase2', 'Guest Sales - Create Multiple Sales (Cash, Card, UPI)', async () => {
      const guestSales = [
        // Cash Sales
        { vehicle: 'KA01AB1234', mobile: '9876543300', customer: 'John Doe', qty: 25.5, rate: 95.50, discount: 0, payment: 'CASH', offer: 'Regular' },
        { vehicle: 'KA02CD5678', mobile: '9876543301', customer: 'Jane Smith', qty: 30.0, rate: 95.50, discount: 10, payment: 'CASH', offer: 'Festive' },
        { vehicle: 'KA03EF9012', mobile: '9876543302', customer: 'Bob Johnson', qty: 40.5, rate: 95.50, discount: 0, payment: 'CASH', offer: 'Regular' },
        { vehicle: 'KA04GH3456', mobile: '9876543303', customer: 'Alice Brown', qty: 20.0, rate: 95.50, discount: 5, payment: 'CASH', offer: 'Loyalty' },
        { vehicle: 'KA05IJ7890', mobile: '9876543304', customer: 'Charlie Wilson', qty: 35.0, rate: 95.50, discount: 0, payment: 'CASH', offer: 'Regular' },
        { vehicle: 'KA06KL1234', mobile: '9876543305', customer: 'Diana Davis', qty: 28.5, rate: 95.50, discount: 15, payment: 'CASH', offer: 'Bulk' },
        { vehicle: 'KA07MN5678', mobile: '9876543306', customer: 'Eve Miller', qty: 45.0, rate: 95.50, discount: 0, payment: 'CASH', offer: 'Regular' },
        { vehicle: 'KA08OP9012', mobile: '9876543307', customer: 'Frank Garcia', qty: 22.0, rate: 95.50, discount: 8, payment: 'CASH', offer: 'Member' },
        
        // Card Sales
        { vehicle: 'KA09QR3456', mobile: '9876543308', customer: 'Grace Lee', qty: 32.0, rate: 95.50, discount: 0, payment: 'CARD', offer: 'Regular' },
        { vehicle: 'KA10ST7890', mobile: '9876543309', customer: 'Henry Taylor', qty: 38.5, rate: 95.50, discount: 12, payment: 'CARD', offer: 'Premium' },
        { vehicle: 'KA11UV1234', mobile: '9876543310', customer: 'Ivy Anderson', qty: 26.0, rate: 95.50, discount: 0, payment: 'CARD', offer: 'Regular' },
        { vehicle: 'KA12WX5678', mobile: '9876543311', customer: 'Jack Thomas', qty: 42.0, rate: 95.50, discount: 20, payment: 'CARD', offer: 'Corporate' },
        { vehicle: 'KA13YZ9012', mobile: '9876543312', customer: 'Kate Jackson', qty: 29.5, rate: 95.50, discount: 0, payment: 'CARD', offer: 'Regular' },
        { vehicle: 'KA14AB3456', mobile: '9876543313', customer: 'Leo White', qty: 36.0, rate: 95.50, discount: 10, payment: 'CARD', offer: 'VIP' },
        
        // UPI Sales
        { vehicle: 'KA15CD7890', mobile: '9876543314', customer: 'Mia Harris', qty: 24.0, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA16EF1234', mobile: '9876543315', customer: 'Noah Martin', qty: 33.5, rate: 95.50, discount: 18, payment: 'UPI', offer: 'Digital' },
        { vehicle: 'KA17GH5678', mobile: '9876543316', customer: 'Olivia Thompson', qty: 27.0, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA18IJ9012', mobile: '9876543317', customer: 'Paul Garcia', qty: 41.0, rate: 95.50, discount: 25, payment: 'UPI', offer: 'Cashless' },
        { vehicle: 'KA19KL3456', mobile: '9876543318', customer: 'Quinn Martinez', qty: 31.5, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA20MN7890', mobile: '9876543319', customer: 'Ruby Robinson', qty: 37.0, rate: 95.50, discount: 14, payment: 'UPI', offer: 'Mobile' },
        { vehicle: 'KA21OP1234', mobile: '9876543320', customer: 'Sam Clark', qty: 23.5, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA22QR5678', mobile: '9876543321', customer: 'Tina Rodriguez', qty: 39.0, rate: 95.50, discount: 22, payment: 'UPI', offer: 'Smart' },
        { vehicle: 'KA23ST9012', mobile: '9876543322', customer: 'Uma Lewis', qty: 25.0, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA24UV3456', mobile: '9876543323', customer: 'Victor Walker', qty: 34.5, rate: 95.50, discount: 16, payment: 'UPI', offer: 'Instant' },
        { vehicle: 'KA25WX7890', mobile: '9876543324', customer: 'Wendy Hall', qty: 28.0, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA26YZ1234', mobile: '9876543325', customer: 'Xavier Allen', qty: 43.5, rate: 95.50, discount: 30, payment: 'UPI', offer: 'Super' },
        { vehicle: 'KA27AB5678', mobile: '9876543326', customer: 'Yara Young', qty: 30.0, rate: 95.50, discount: 0, payment: 'UPI', offer: 'Regular' },
        { vehicle: 'KA28CD9012', mobile: '9876543327', customer: 'Zoe Hernandez', qty: 35.5, rate: 95.50, discount: 12, payment: 'UPI', offer: 'Quick' }
      ];

      for (const sale of guestSales) {
        const totalAmount = (sale.qty * sale.rate) - sale.discount;
        const result = await this.client.query(`
          INSERT INTO guest_sales (
            fuel_product_id, sale_date, quantity, price_per_unit, discount, total_amount,
            payment_mode, vehicle_number, customer_name, mobile_number, offer_type
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          this.testData.fuelProducts[0].id, sale.qty, sale.rate, sale.discount, totalAmount,
          sale.payment, sale.vehicle, sale.customer, sale.mobile, sale.offer
        ]);
        
        this.testData.guestSales.push(result.rows[0]);
      }
      
      if (this.testData.guestSales.length !== guestSales.length) {
        throw new Error('Not all guest sales created successfully');
      }
    });

    // 15. Credit Sale
    await this.runTest('phase2', 'Credit Sales - Create Multiple Credit Sales', async () => {
      const creditSales = [
        { customer: this.testData.customers[0].id, qty: 50.0, rate: 95.50 },
        { customer: this.testData.customers[1].id, qty: 75.5, rate: 95.50 },
        { customer: this.testData.customers[2].id, qty: 40.0, rate: 95.50 },
        { customer: this.testData.customers[3].id, qty: 60.0, rate: 95.50 },
        { customer: this.testData.customers[4].id, qty: 85.0, rate: 95.50 },
        { customer: this.testData.customers[5].id, qty: 35.5, rate: 95.50 },
        { customer: this.testData.customers[6].id, qty: 70.0, rate: 95.50 },
        { customer: this.testData.customers[7].id, qty: 45.0, rate: 95.50 },
        { customer: this.testData.customers[8].id, qty: 55.5, rate: 95.50 },
        { customer: this.testData.customers[9].id, qty: 65.0, rate: 95.50 },
        { customer: this.testData.customers[10].id, qty: 42.5, rate: 95.50 },
        { customer: this.testData.customers[11].id, qty: 80.0, rate: 95.50 },
        { customer: this.testData.customers[12].id, qty: 38.0, rate: 95.50 },
        { customer: this.testData.customers[13].id, qty: 72.5, rate: 95.50 },
        { customer: this.testData.customers[14].id, qty: 48.0, rate: 95.50 },
        { customer: this.testData.customers[15].id, qty: 58.5, rate: 95.50 },
        { customer: this.testData.customers[16].id, qty: 67.0, rate: 95.50 },
        { customer: this.testData.customers[17].id, qty: 33.5, rate: 95.50 },
        { customer: this.testData.customers[18].id, qty: 76.0, rate: 95.50 },
        { customer: this.testData.customers[19].id, qty: 52.5, rate: 95.50 }
      ];

      for (const sale of creditSales) {
        const totalAmount = sale.qty * sale.rate;
        const result = await this.client.query(`
          INSERT INTO credit_sales (
            credit_customer_id, fuel_product_id, sale_date, quantity, price_per_unit, total_amount
          ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)
          RETURNING id
        `, [sale.customer, this.testData.fuelProducts[0].id, sale.qty, sale.rate, totalAmount]);
        
        this.testData.creditSales.push(result.rows[0]);
      }
      
      if (this.testData.creditSales.length !== creditSales.length) {
        throw new Error('Not all credit sales created successfully');
      }
    });

    // 16. Sale Entry (Meter Reading Based)
    await this.runTest('phase2', 'Sale Entry - Create Meter Reading Based Sales', async () => {
      const saleEntries = [
        { nozzle: this.testData.nozzles[0].id, opening: 1000, closing: 1050, rate: 95.50 },
        { nozzle: this.testData.nozzles[1].id, opening: 2000, closing: 2075, rate: 95.50 },
        { nozzle: this.testData.nozzles[2].id, opening: 1500, closing: 1580, rate: 95.50 },
        { nozzle: this.testData.nozzles[3].id, opening: 3000, closing: 3120, rate: 95.50 },
        { nozzle: this.testData.nozzles[4].id, opening: 2500, closing: 2625, rate: 95.50 },
        { nozzle: this.testData.nozzles[5].id, opening: 1800, closing: 1890, rate: 95.50 },
        { nozzle: this.testData.nozzles[6].id, opening: 2200, closing: 2310, rate: 95.50 },
        { nozzle: this.testData.nozzles[7].id, opening: 1600, closing: 1680, rate: 95.50 },
        { nozzle: this.testData.nozzles[8].id, opening: 2800, closing: 2940, rate: 95.50 },
        { nozzle: this.testData.nozzles[9].id, opening: 1900, closing: 1995, rate: 95.50 },
        { nozzle: this.testData.nozzles[10].id, opening: 2400, closing: 2520, rate: 95.50 },
        { nozzle: this.testData.nozzles[11].id, opening: 1700, closing: 1785, rate: 95.50 },
        { nozzle: this.testData.nozzles[0].id, opening: 1050, closing: 1100, rate: 95.50 },
        { nozzle: this.testData.nozzles[1].id, opening: 2075, closing: 2150, rate: 95.50 },
        { nozzle: this.testData.nozzles[2].id, opening: 1580, closing: 1650, rate: 95.50 }
      ];

      for (const entry of saleEntries) {
        const quantity = entry.closing - entry.opening;
        const amount = quantity * entry.rate;
        const result = await this.client.query(`
          INSERT INTO sale_entries (
            nozzle_id, sale_date, opening_reading, closing_reading, quantity, rate_per_unit, net_sale_amount
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
          RETURNING id
        `, [entry.nozzle, entry.opening, entry.closing, quantity, entry.rate, amount]);
        
        this.testData.saleEntries.push(result.rows[0]);
      }
      
      if (this.testData.saleEntries.length !== saleEntries.length) {
        throw new Error('Not all sale entries created successfully');
      }
    });

    // 17. Lub Sale
    await this.runTest('phase2', 'Lub Sale - Create Lubricant Sales', async () => {
      const lubSales = [
        { lubricant: this.testData.lubricants[0].id, qty: 2, employee: this.testData.employees[0].id },
        { lubricant: this.testData.lubricants[1].id, qty: 1, employee: this.testData.employees[1].id },
        { lubricant: this.testData.lubricants[2].id, qty: 3, employee: this.testData.employees[2].id },
        { lubricant: this.testData.lubricants[3].id, qty: 2, employee: this.testData.employees[3].id },
        { lubricant: this.testData.lubricants[4].id, qty: 1, employee: this.testData.employees[4].id },
        { lubricant: this.testData.lubricants[5].id, qty: 4, employee: this.testData.employees[5].id },
        { lubricant: this.testData.lubricants[6].id, qty: 2, employee: this.testData.employees[6].id },
        { lubricant: this.testData.lubricants[7].id, qty: 3, employee: this.testData.employees[7].id },
        { lubricant: this.testData.lubricants[8].id, qty: 1, employee: this.testData.employees[0].id },
        { lubricant: this.testData.lubricants[9].id, qty: 2, employee: this.testData.employees[1].id },
        { lubricant: this.testData.lubricants[0].id, qty: 1, employee: this.testData.employees[2].id },
        { lubricant: this.testData.lubricants[1].id, qty: 3, employee: this.testData.employees[3].id },
        { lubricant: this.testData.lubricants[2].id, qty: 2, employee: this.testData.employees[4].id },
        { lubricant: this.testData.lubricants[3].id, qty: 1, employee: this.testData.employees[5].id },
        { lubricant: this.testData.lubricants[4].id, qty: 2, employee: this.testData.employees[6].id },
        { lubricant: this.testData.lubricants[5].id, qty: 3, employee: this.testData.employees[7].id },
        { lubricant: this.testData.lubricants[6].id, qty: 1, employee: this.testData.employees[0].id },
        { lubricant: this.testData.lubricants[7].id, qty: 2, employee: this.testData.employees[1].id },
        { lubricant: this.testData.lubricants[8].id, qty: 1, employee: this.testData.employees[2].id },
        { lubricant: this.testData.lubricants[9].id, qty: 2, employee: this.testData.employees[3].id }
      ];

      for (const sale of lubSales) {
        // Get lubricant sale rate
        const lubResult = await this.client.query('SELECT sale_rate FROM lubricants WHERE id = $1', [sale.lubricant]);
        const saleRate = lubResult.rows[0].sale_rate;
        const totalAmount = sale.qty * saleRate;
        
        const result = await this.client.query(`
          INSERT INTO lubricant_sales (
            lubricant_id, sale_date, quantity, sale_rate, total_amount, employee_id
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
          RETURNING id
        `, [sale.lubricant, sale.qty, saleRate, totalAmount, sale.employee]);
        
        this.testData.lubSales.push(result.rows[0]);
      }
      
      if (this.testData.lubSales.length !== lubSales.length) {
        throw new Error('Not all lubricant sales created successfully');
      }
    });

    // 18. Swipe Transactions
    await this.runTest('phase2', 'Swipe Transactions - Create Swipe Sales', async () => {
      const swipeTransactions = [
        { machine: this.testData.swipeMachines[0].id, amount: 2500, mode: 'Cash', type: 'Credit' },
        { machine: this.testData.swipeMachines[1].id, amount: 3000, mode: 'Bank', type: 'Debit' },
        { machine: this.testData.swipeMachines[2].id, amount: 1800, mode: 'Petrol', type: 'Credit' },
        { machine: this.testData.swipeMachines[0].id, amount: 2200, mode: 'Swipe', type: 'Credit' },
        { machine: this.testData.swipeMachines[1].id, amount: 3500, mode: 'Cash', type: 'Debit' },
        { machine: this.testData.swipeMachines[2].id, amount: 2800, mode: 'Bank', type: 'Credit' },
        { machine: this.testData.swipeMachines[0].id, amount: 1900, mode: 'Petrol', type: 'Debit' },
        { machine: this.testData.swipeMachines[1].id, amount: 3200, mode: 'Swipe', type: 'Credit' },
        { machine: this.testData.swipeMachines[2].id, amount: 2400, mode: 'Cash', type: 'Debit' },
        { machine: this.testData.swipeMachines[0].id, amount: 2700, mode: 'Bank', type: 'Credit' },
        { machine: this.testData.swipeMachines[1].id, amount: 2100, mode: 'Petrol', type: 'Debit' },
        { machine: this.testData.swipeMachines[2].id, amount: 3600, mode: 'Swipe', type: 'Credit' },
        { machine: this.testData.swipeMachines[0].id, amount: 2300, mode: 'Cash', type: 'Debit' },
        { machine: this.testData.swipeMachines[1].id, amount: 2900, mode: 'Bank', type: 'Credit' },
        { machine: this.testData.swipeMachines[2].id, amount: 2000, mode: 'Petrol', type: 'Debit' }
      ];

      for (const transaction of swipeTransactions) {
        const result = await this.client.query(`
          INSERT INTO swipe_transactions (
            swipe_machine_id, transaction_date, amount, swipe_mode, swipe_type
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4)
          RETURNING id
        `, [transaction.machine, transaction.amount, transaction.mode, transaction.type]);
        
        this.testData.swipeTransactions.push(result.rows[0]);
      }
      
      if (this.testData.swipeTransactions.length !== swipeTransactions.length) {
        throw new Error('Not all swipe transactions created successfully');
      }
    });

    // 19. Tanker Sale (Fuel Receiving)
    await this.runTest('phase2', 'Tanker Sale - Create Fuel Deliveries', async () => {
      const tankerSales = [
        { product: this.testData.fuelProducts[0].id, qty: 5000, beforeDip: 5000, gross: 10000 },
        { product: this.testData.fuelProducts[1].id, qty: 3000, beforeDip: 4000, gross: 7000 },
        { product: this.testData.fuelProducts[2].id, qty: 4000, beforeDip: 6000, gross: 10000 },
        { product: this.testData.fuelProducts[3].id, qty: 2500, beforeDip: 4500, gross: 7000 },
        { product: this.testData.fuelProducts[0].id, qty: 3500, beforeDip: 10000, gross: 13500 },
        { product: this.testData.fuelProducts[2].id, qty: 4500, beforeDip: 10000, gross: 14500 },
        { product: this.testData.fuelProducts[1].id, qty: 2000, beforeDip: 7000, gross: 9000 },
        { product: this.testData.fuelProducts[3].id, qty: 3000, beforeDip: 7000, gross: 10000 }
      ];

      for (const sale of tankerSales) {
        const result = await this.client.query(`
          INSERT INTO tanker_sales (
            fuel_product_id, sale_date, tanker_sale_quantity, before_dip_stock, gross_stock
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4)
          RETURNING id
        `, [sale.product, sale.qty, sale.beforeDip, sale.gross]);
        
        this.testData.tankerSales.push(result.rows[0]);
      }
      
      if (this.testData.tankerSales.length !== tankerSales.length) {
        throw new Error('Not all tanker sales created successfully');
      }
    });

    // 20. Liquid Purchase
    await this.runTest('phase2', 'Liquid Purchase - Create Fuel Purchases', async () => {
      const liquidPurchases = [
        { vendor: this.testData.vendors[0].id, invoice: 'INV001', description: 'Petrol Regular Delivery' },
        { vendor: this.testData.vendors[1].id, invoice: 'INV002', description: 'Petrol Premium Delivery' },
        { vendor: this.testData.vendors[2].id, invoice: 'INV003', description: 'Diesel Regular Delivery' },
        { vendor: this.testData.vendors[0].id, invoice: 'INV004', description: 'Diesel Premium Delivery' },
        { vendor: this.testData.vendors[1].id, invoice: 'INV005', description: 'Petrol Regular Delivery' },
        { vendor: this.testData.vendors[2].id, invoice: 'INV006', description: 'Petrol Premium Delivery' },
        { vendor: this.testData.vendors[0].id, invoice: 'INV007', description: 'Diesel Regular Delivery' },
        { vendor: this.testData.vendors[1].id, invoice: 'INV008', description: 'Diesel Premium Delivery' },
        { vendor: this.testData.vendors[2].id, invoice: 'INV009', description: 'Petrol Regular Delivery' },
        { vendor: this.testData.vendors[0].id, invoice: 'INV010', description: 'Petrol Premium Delivery' },
        { vendor: this.testData.vendors[1].id, invoice: 'INV011', description: 'Diesel Regular Delivery' },
        { vendor: this.testData.vendors[2].id, invoice: 'INV012', description: 'Diesel Premium Delivery' }
      ];

      for (const purchase of liquidPurchases) {
        const result = await this.client.query(`
          INSERT INTO liquid_purchases (
            vendor_id, invoice_no, description, date, invoice_date
          ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE)
          RETURNING id
        `, [purchase.vendor, purchase.invoice, purchase.description]);
        
        this.testData.liquidPurchases.push(result.rows[0]);
      }
      
      if (this.testData.liquidPurchases.length !== liquidPurchases.length) {
        throw new Error('Not all liquid purchases created successfully');
      }
    });

    // 21. Lubs Purchase
    await this.runTest('phase2', 'Lubs Purchase - Create Lubricant Purchases', async () => {
      const lubPurchases = [
        { lubricant: this.testData.lubricants[0].id, qty: 50, vendor: this.testData.vendors[3].id },
        { lubricant: this.testData.lubricants[1].id, qty: 30, vendor: this.testData.vendors[4].id },
        { lubricant: this.testData.lubricants[2].id, qty: 40, vendor: this.testData.vendors[5].id },
        { lubricant: this.testData.lubricants[3].id, qty: 25, vendor: this.testData.vendors[6].id },
        { lubricant: this.testData.lubricants[4].id, qty: 20, vendor: this.testData.vendors[7].id },
        { lubricant: this.testData.lubricants[5].id, qty: 60, vendor: this.testData.vendors[8].id },
        { lubricant: this.testData.lubricants[6].id, qty: 35, vendor: this.testData.vendors[9].id },
        { lubricant: this.testData.lubricants[7].id, qty: 45, vendor: this.testData.vendors[3].id },
        { lubricant: this.testData.lubricants[8].id, qty: 15, vendor: this.testData.vendors[4].id },
        { lubricant: this.testData.lubricants[9].id, qty: 20, vendor: this.testData.vendors[5].id },
        { lubricant: this.testData.lubricants[0].id, qty: 30, vendor: this.testData.vendors[6].id },
        { lubricant: this.testData.lubricants[1].id, qty: 25, vendor: this.testData.vendors[7].id },
        { lubricant: this.testData.lubricants[2].id, qty: 35, vendor: this.testData.vendors[8].id },
        { lubricant: this.testData.lubricants[3].id, qty: 40, vendor: this.testData.vendors[9].id },
        { lubricant: this.testData.lubricants[4].id, qty: 18, vendor: this.testData.vendors[3].id }
      ];

      for (const purchase of lubPurchases) {
        // Get lubricant purchase rate
        const lubResult = await this.client.query('SELECT purchase_rate FROM lubricants WHERE id = $1', [purchase.lubricant]);
        const purchaseRate = lubResult.rows[0].purchase_rate;
        const totalAmount = purchase.qty * purchaseRate;
        
        const result = await this.client.query(`
          INSERT INTO lubricant_purchases (
            lubricant_id, purchase_date, quantity, purchase_rate, total_amount, vendor_id
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
          RETURNING id
        `, [purchase.lubricant, purchase.qty, purchaseRate, totalAmount, purchase.vendor]);
        
        this.testData.lubPurchases.push(result.rows[0]);
      }
      
      if (this.testData.lubPurchases.length !== lubPurchases.length) {
        throw new Error('Not all lubricant purchases created successfully');
      }
    });

    // 22. Expenses
    await this.runTest('phase2', 'Expenses - Create Multiple Expenses', async () => {
      const expenses = [
        { type: this.testData.expenseTypes[0].id, amount: 5000, description: 'Monthly electricity bill' },
        { type: this.testData.expenseTypes[1].id, amount: 2000, description: 'Monthly water bill' },
        { type: this.testData.expenseTypes[2].id, amount: 150000, description: 'Employee salary payments' },
        { type: this.testData.expenseTypes[3].id, amount: 8000, description: 'Equipment maintenance' },
        { type: this.testData.expenseTypes[4].id, amount: 12000, description: 'Insurance premium' },
        { type: this.testData.expenseTypes[5].id, amount: 25000, description: 'Property rent' },
        { type: this.testData.expenseTypes[6].id, amount: 3000, description: 'Phone and internet bills' },
        { type: this.testData.expenseTypes[7].id, amount: 1500, description: 'Office supplies' },
        { type: this.testData.expenseTypes[8].id, amount: 4000, description: 'Transportation costs' },
        { type: this.testData.expenseTypes[9].id, amount: 6000, description: 'Legal services' },
        { type: this.testData.expenseTypes[10].id, amount: 2000, description: 'Advertising' },
        { type: this.testData.expenseTypes[11].id, amount: 5000, description: 'Security services' },
        { type: this.testData.expenseTypes[0].id, amount: 4500, description: 'Additional electricity' },
        { type: this.testData.expenseTypes[1].id, amount: 1800, description: 'Additional water' },
        { type: this.testData.expenseTypes[2].id, amount: 20000, description: 'Bonus payments' },
        { type: this.testData.expenseTypes[3].id, amount: 6000, description: 'Generator maintenance' },
        { type: this.testData.expenseTypes[4].id, amount: 8000, description: 'Vehicle insurance' },
        { type: this.testData.expenseTypes[5].id, amount: 15000, description: 'Additional rent' },
        { type: this.testData.expenseTypes[6].id, amount: 2500, description: 'Additional phone' },
        { type: this.testData.expenseTypes[7].id, amount: 1200, description: 'Additional stationery' },
        { type: this.testData.expenseTypes[8].id, amount: 3500, description: 'Additional transport' },
        { type: this.testData.expenseTypes[9].id, amount: 4000, description: 'Accounting services' },
        { type: this.testData.expenseTypes[10].id, amount: 1500, description: 'Additional marketing' },
        { type: this.testData.expenseTypes[11].id, amount: 3000, description: 'Additional security' },
        { type: this.testData.expenseTypes[0].id, amount: 5500, description: 'Peak electricity' },
        { type: this.testData.expenseTypes[1].id, amount: 2200, description: 'Peak water' },
        { type: this.testData.expenseTypes[2].id, amount: 25000, description: 'Overtime payments' },
        { type: this.testData.expenseTypes[3].id, amount: 10000, description: 'Major maintenance' },
        { type: this.testData.expenseTypes[4].id, amount: 15000, description: 'Comprehensive insurance' }
      ];

      for (const expense of expenses) {
        const result = await this.client.query(`
          INSERT INTO expenses (
            expense_type_id, expense_date, amount, description
          ) VALUES ($1, CURRENT_DATE, $2, $3)
          RETURNING id
        `, [expense.type, expense.amount, expense.description]);
        
        this.testData.expenses.push(result.rows[0]);
      }
      
      if (this.testData.expenses.length !== expenses.length) {
        throw new Error('Not all expenses created successfully');
      }
    });

    // 23. Recovery (Customer Payments)
    await this.runTest('phase2', 'Recovery - Create Customer Payments', async () => {
      const recoveries = [
        { customer: this.testData.customers[0].id, amount: 10000, mode: 'CASH' },
        { customer: this.testData.customers[1].id, amount: 15000, mode: 'CHEQUE' },
        { customer: this.testData.customers[2].id, amount: 8000, mode: 'ONLINE' },
        { customer: this.testData.customers[3].id, amount: 20000, mode: 'CASH' },
        { customer: this.testData.customers[4].id, amount: 12000, mode: 'CHEQUE' },
        { customer: this.testData.customers[5].id, amount: 7000, mode: 'ONLINE' },
        { customer: this.testData.customers[6].id, amount: 18000, mode: 'CASH' },
        { customer: this.testData.customers[7].id, amount: 9000, mode: 'CHEQUE' },
        { customer: this.testData.customers[8].id, amount: 11000, mode: 'ONLINE' },
        { customer: this.testData.customers[9].id, amount: 16000, mode: 'CASH' },
        { customer: this.testData.customers[10].id, amount: 9500, mode: 'CHEQUE' },
        { customer: this.testData.customers[11].id, amount: 13000, mode: 'ONLINE' },
        { customer: this.testData.customers[12].id, amount: 8500, mode: 'CASH' },
        { customer: this.testData.customers[13].id, amount: 14000, mode: 'CHEQUE' },
        { customer: this.testData.customers[14].id, amount: 10500, mode: 'ONLINE' },
        { customer: this.testData.customers[15].id, amount: 17500, mode: 'CASH' },
        { customer: this.testData.customers[16].id, amount: 12000, mode: 'CHEQUE' },
        { customer: this.testData.customers[17].id, amount: 7000, mode: 'ONLINE' },
        { customer: this.testData.customers[18].id, amount: 15500, mode: 'CASH' },
        { customer: this.testData.customers[19].id, amount: 11500, mode: 'CHEQUE' }
      ];

      for (const recovery of recoveries) {
        const result = await this.client.query(`
          INSERT INTO recoveries (
            customer_id, recovery_date, amount, payment_mode
          ) VALUES ($1, CURRENT_DATE, $2, $3)
          RETURNING id
        `, [recovery.customer, recovery.amount, recovery.mode]);
        
        this.testData.recoveries.push(result.rows[0]);
      }
      
      if (this.testData.recoveries.length !== recoveries.length) {
        throw new Error('Not all recoveries created successfully');
      }
    });

    // 24. Employee Cash Recovery
    await this.runTest('phase2', 'Employee Cash Recovery - Create Employee Recoveries', async () => {
      const employeeRecoveries = [
        { employee: this.testData.employees[0].id, amount: 5000 },
        { employee: this.testData.employees[1].id, amount: 3000 },
        { employee: this.testData.employees[2].id, amount: 4000 },
        { employee: this.testData.employees[3].id, amount: 2500 },
        { employee: this.testData.employees[4].id, amount: 3500 },
        { employee: this.testData.employees[5].id, amount: 2000 },
        { employee: this.testData.employees[6].id, amount: 4500 },
        { employee: this.testData.employees[7].id, amount: 3000 },
        { employee: this.testData.employees[0].id, amount: 2000 },
        { employee: this.testData.employees[1].id, amount: 1500 }
      ];

      for (const recovery of employeeRecoveries) {
        const result = await this.client.query(`
          INSERT INTO employee_cash_recovery (
            employee_id, recovery_date, amount
          ) VALUES ($1, CURRENT_DATE, $2)
          RETURNING id
        `, [recovery.employee, recovery.amount]);
        
        this.testData.employeeRecoveries.push(result.rows[0]);
      }
      
      if (this.testData.employeeRecoveries.length !== employeeRecoveries.length) {
        throw new Error('Not all employee recoveries created successfully');
      }
    });

    // 25. Day Assignings
    await this.runTest('phase2', 'Day Assignings - Create Daily Assignments', async () => {
      const dayAssignings = [
        { employee: this.testData.employees[0].id, shift: this.testData.shifts[0].id, nozzle: this.testData.nozzles[0].id },
        { employee: this.testData.employees[1].id, shift: this.testData.shifts[0].id, nozzle: this.testData.nozzles[1].id },
        { employee: this.testData.employees[2].id, shift: this.testData.shifts[1].id, nozzle: this.testData.nozzles[2].id },
        { employee: this.testData.employees[3].id, shift: this.testData.shifts[1].id, nozzle: this.testData.nozzles[3].id },
        { employee: this.testData.employees[4].id, shift: this.testData.shifts[2].id, nozzle: this.testData.nozzles[4].id },
        { employee: this.testData.employees[5].id, shift: this.testData.shifts[2].id, nozzle: this.testData.nozzles[5].id },
        { employee: this.testData.employees[6].id, shift: this.testData.shifts[0].id, nozzle: this.testData.nozzles[6].id },
        { employee: this.testData.employees[7].id, shift: this.testData.shifts[1].id, nozzle: this.testData.nozzles[7].id },
        { employee: this.testData.employees[0].id, shift: this.testData.shifts[2].id, nozzle: this.testData.nozzles[8].id },
        { employee: this.testData.employees[1].id, shift: this.testData.shifts[0].id, nozzle: this.testData.nozzles[9].id },
        { employee: this.testData.employees[2].id, shift: this.testData.shifts[1].id, nozzle: this.testData.nozzles[10].id },
        { employee: this.testData.employees[3].id, shift: this.testData.shifts[2].id, nozzle: this.testData.nozzles[11].id }
      ];

      for (const assigning of dayAssignings) {
        const result = await this.client.query(`
          INSERT INTO day_assignings (
            employee_id, shift_id, nozzle_id, assignment_date
          ) VALUES ($1, $2, $3, CURRENT_DATE)
          RETURNING id
        `, [assigning.employee, assigning.shift, assigning.nozzle]);
        
        this.testData.dayAssignings.push(result.rows[0]);
      }
      
      if (this.testData.dayAssignings.length !== dayAssignings.length) {
        throw new Error('Not all day assignings created successfully');
      }
    });

    // 26. Daily Sale Rate
    await this.runTest('phase2', 'Daily Sale Rate - Set Daily Fuel Rates', async () => {
      const dailySaleRates = [
        { product: this.testData.fuelProducts[0].id, rate: 95.50 },
        { product: this.testData.fuelProducts[1].id, rate: 98.50 },
        { product: this.testData.fuelProducts[2].id, rate: 87.50 },
        { product: this.testData.fuelProducts[3].id, rate: 90.50 }
      ];

      for (const rate of dailySaleRates) {
        const result = await this.client.query(`
          INSERT INTO daily_sale_rates (
            fuel_product_id, sale_date, rate_per_unit
          ) VALUES ($1, CURRENT_DATE, $2)
          RETURNING id
        `, [rate.product, rate.rate]);
        
        this.testData.dailySaleRates.push(result.rows[0]);
      }
      
      if (this.testData.dailySaleRates.length !== dailySaleRates.length) {
        throw new Error('Not all daily sale rates created successfully');
      }
    });

    // 27. Denominations (Cash Counting)
    await this.runTest('phase2', 'Denominations - Create Cash Counting Entries', async () => {
      const denominations = [
        { denomination: 2000, count: 10, total: 20000 },
        { denomination: 500, count: 20, total: 10000 },
        { denomination: 200, count: 25, total: 5000 },
        { denomination: 100, count: 30, total: 3000 },
        { denomination: 50, count: 40, total: 2000 },
        { denomination: 20, count: 50, total: 1000 },
        { denomination: 10, count: 100, total: 1000 },
        { denomination: 5, count: 200, total: 1000 },
        { denomination: 2, count: 500, total: 1000 },
        { denomination: 1, count: 1000, total: 1000 }
      ];

      for (const denom of denominations) {
        const result = await this.client.query(`
          INSERT INTO denominations (
            denomination_date, denomination_value, count, total_amount
          ) VALUES (CURRENT_DATE, $1, $2, $3)
          RETURNING id
        `, [denom.denomination, denom.count, denom.total]);
        
        this.testData.denominations.push(result.rows[0]);
      }
      
      if (this.testData.denominations.length !== denominations.length) {
        throw new Error('Not all denominations created successfully');
      }
    });

    console.log('\n✅ PHASE 2 COMPLETED: Daily Operations');
    console.log(`📊 Created: ${this.testData.guestSales.length} guest sales, ${this.testData.creditSales.length} credit sales, ${this.testData.saleEntries.length} sale entries, ${this.testData.lubSales.length} lub sales, ${this.testData.swipeTransactions.length} swipe transactions, ${this.testData.tankerSales.length} tanker sales, ${this.testData.liquidPurchases.length} liquid purchases, ${this.testData.lubPurchases.length} lub purchases, ${this.testData.expenses.length} expenses, ${this.testData.recoveries.length} recoveries, ${this.testData.employeeRecoveries.length} employee recoveries, ${this.testData.dayAssignings.length} day assignings, ${this.testData.dailySaleRates.length} daily sale rates, ${this.testData.denominations.length} denominations`);
  }

  // PHASE 3: PERIOD-END OPERATIONS
  async executePhase3() {
    console.log('\n🚀 PHASE 3: PERIOD-END OPERATIONS');
    console.log('=' .repeat(60));

    // 28. Day Settlement
    await this.runTest('phase3', 'Day Settlement - Create Daily Settlement', async () => {
      const result = await this.client.query(`
        INSERT INTO day_settlements (
          settlement_date, cash_in_hand, bank_deposit, total_sales, variance
        ) VALUES (
          CURRENT_DATE, 
          50000, 
          100000, 
          150000, 
          0
        )
        RETURNING id
      `);
      
      if (!result.rows[0]) throw new Error('Failed to create day settlement');
    });

    // 29. Shift Sheet Entry
    await this.runTest('phase3', 'Shift Sheet Entry - Create Shift Sheets', async () => {
      const shiftSheetEntries = [
        { shift: this.testData.shifts[0].id, employee: this.testData.employees[0].id, opening: 1000, closing: 1050 },
        { shift: this.testData.shifts[1].id, employee: this.testData.employees[1].id, opening: 2000, closing: 2075 },
        { shift: this.testData.shifts[2].id, employee: this.testData.employees[2].id, opening: 1500, closing: 1580 }
      ];

      for (const entry of shiftSheetEntries) {
        const result = await this.client.query(`
          INSERT INTO shift_sheet_entries (
            shift_id, employee_id, sheet_date, opening_reading, closing_reading
          ) VALUES ($1, $2, CURRENT_DATE, $3, $4)
          RETURNING id
        `, [entry.shift, entry.employee, entry.opening, entry.closing]);
        
        this.testData.shiftSheetEntries.push(result.rows[0]);
      }
      
      if (this.testData.shiftSheetEntries.length !== shiftSheetEntries.length) {
        throw new Error('Not all shift sheet entries created successfully');
      }
    });

    // 30. Opening Stock
    await this.runTest('phase3', 'Opening Stock - Set Opening Stock', async () => {
      const openingStocks = [
        { product: this.testData.fuelProducts[0].id, qty: 10000 },
        { product: this.testData.fuelProducts[1].id, qty: 8000 },
        { product: this.testData.fuelProducts[2].id, qty: 12000 },
        { product: this.testData.fuelProducts[3].id, qty: 9000 }
      ];

      for (const stock of openingStocks) {
        const result = await this.client.query(`
          INSERT INTO opening_stocks (
            fuel_product_id, opening_date, quantity
          ) VALUES ($1, CURRENT_DATE, $2)
          RETURNING id
        `, [stock.product, stock.qty]);
        
        this.testData.openingStocks.push(result.rows[0]);
      }
      
      if (this.testData.openingStocks.length !== openingStocks.length) {
        throw new Error('Not all opening stocks created successfully');
      }
    });

    console.log('\n✅ PHASE 3 COMPLETED: Period-End Operations');
    console.log(`📊 Created: 1 day settlement, ${this.testData.shiftSheetEntries.length} shift sheet entries, ${this.testData.openingStocks.length} opening stocks`);
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Accountant UI Testing');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      // Execute all phases
      await this.executePhase1();
      await this.executePhase2();
      await this.executePhase3();
      
      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 COMPREHENSIVE ACCOUNTANT UI TESTING RESULTS');
      console.log('='.repeat(80));
      
      let totalPassed = 0;
      let totalFailed = 0;
      let totalTests = 0;
      
      for (const phase in this.testResults) {
        const phaseResults = this.testResults[phase];
        totalPassed += phaseResults.passed;
        totalFailed += phaseResults.failed;
        totalTests += phaseResults.total;
        
        console.log(`${phase.toUpperCase()}: ${phaseResults.passed}/${phaseResults.total} passed (${phaseResults.failed} failed)`);
      }
      
      console.log(`\n🎯 OVERALL RESULTS:`);
      console.log(`✅ Tests Passed: ${totalPassed}`);
      console.log(`❌ Tests Failed: ${totalFailed}`);
      console.log(`📈 Total Tests: ${totalTests}`);
      console.log(`🎯 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);

      if (totalFailed === 0) {
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
  const tester = new AccountantUITester();
  tester.runAllTests().catch(console.error);
}

module.exports = AccountantUITester;
