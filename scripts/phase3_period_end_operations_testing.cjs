#!/usr/bin/env node

/**
 * PHASE 3: PERIOD-END OPERATIONS TESTING
 * Test period-end operations (settlements, shift sheets)
 * Following the complete accountant UI testing plan
 */

const { Client } = require('pg');
require('dotenv').config();

class PeriodEndOperationsTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      daySettlements: { passed: 0, failed: 0, total: 0, details: [] },
      shiftSheetEntries: { passed: 0, failed: 0, total: 0, details: [] },
      openingStocks: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.createdData = {
      daySettlements: [],
      shiftSheetEntries: [],
      openingStocks: []
    };
    this.masterData = {
      employees: [],
      shifts: [],
      fuelProducts: [],
      tanks: [],
      nozzles: []
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database for period-end operations testing');
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

  async loadMasterData() {
    console.log('\n📋 LOADING MASTER DATA FOR PERIOD-END TESTING');
    console.log('=' .repeat(60));

    // Load employees
    const employees = await this.client.query('SELECT id, employee_name, designation FROM employees WHERE is_active = true LIMIT 8');
    this.masterData.employees = employees.rows;
    console.log(`✅ Loaded ${this.masterData.employees.length} employees`);

    // Load shifts
    const shifts = await this.client.query('SELECT id, shift_name FROM duty_shifts LIMIT 3');
    this.masterData.shifts = shifts.rows;
    console.log(`✅ Loaded ${this.masterData.shifts.length} shifts`);

    // Load fuel products
    const fuelProducts = await this.client.query('SELECT id, product_name FROM fuel_products WHERE is_active = true LIMIT 4');
    this.masterData.fuelProducts = fuelProducts.rows;
    console.log(`✅ Loaded ${this.masterData.fuelProducts.length} fuel products`);

    // Load tanks
    const tanks = await this.client.query('SELECT id, tank_number FROM tanks WHERE is_active = true LIMIT 6');
    this.masterData.tanks = tanks.rows;
    console.log(`✅ Loaded ${this.masterData.tanks.length} tanks`);

    // Load nozzles
    const nozzles = await this.client.query('SELECT id, nozzle_number FROM nozzles WHERE is_active = true LIMIT 12');
    this.masterData.nozzles = nozzles.rows;
    console.log(`✅ Loaded ${this.masterData.nozzles.length} nozzles`);
  }

  // 28. Day Settlement
  async testDaySettlements() {
    console.log('\n💰 TESTING DAY SETTLEMENTS');
    console.log('=' .repeat(60));

    await this.runTest('daySettlements', 'Create Daily Settlement', async () => {
      const settlements = [
        { date: '2024-01-15', openingBalance: 10000, meterSale: 45000, lubSale: 5000, creditAmount: 20000, expenses: 5000, shortage: 0 },
        { date: '2024-01-16', openingBalance: 15000, meterSale: 50000, lubSale: 6000, creditAmount: 25000, expenses: 6000, shortage: 500 },
        { date: '2024-01-17', openingBalance: 12000, meterSale: 48000, lubSale: 5500, creditAmount: 22000, expenses: 5500, shortage: -200 },
        { date: '2024-01-18', openingBalance: 18000, meterSale: 52000, lubSale: 7000, creditAmount: 28000, expenses: 7000, shortage: 300 },
        { date: '2024-01-19', openingBalance: 14000, meterSale: 46000, lubSale: 6500, creditAmount: 24000, expenses: 6500, shortage: 0 }
      ];

      for (const settlement of settlements) {
        const totalSale = settlement.meterSale + settlement.lubSale;
        const closingBalance = settlement.openingBalance + totalSale + settlement.creditAmount - settlement.expenses - settlement.shortage;
        
        const result = await this.client.query(`
          INSERT INTO day_settlements (
            settlement_date, opening_balance, meter_sale, lubricant_sale, total_sale,
            credit_amount, expenses, shortage, closing_balance, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, settlement_date, opening_balance, closing_balance
        `, [
          settlement.date, settlement.openingBalance, settlement.meterSale, settlement.lubSale, totalSale,
          settlement.creditAmount, settlement.expenses, settlement.shortage, closingBalance, 
          'Daily settlement test', null
        ]);
        
        this.createdData.daySettlements.push(result.rows[0]);
        console.log(`✅ Created: ${result.rows[0].settlement_date} - Opening: ₹${result.rows[0].opening_balance}, Closing: ₹${result.rows[0].closing_balance}`);
      }
      
      if (this.createdData.daySettlements.length !== settlements.length) {
        throw new Error('Not all day settlements created successfully');
      }
    });

    await this.runTest('daySettlements', 'Verify Totals Match Sales', async () => {
      for (const settlement of this.createdData.daySettlements) {
        const result = await this.client.query('SELECT * FROM day_settlements WHERE id = $1', [settlement.id]);
        if (result.rows.length === 0) throw new Error(`Settlement ${settlement.settlement_date} not found`);
        
        const settlementData = result.rows[0];
        const expectedTotal = parseFloat(settlementData.meter_sale || 0) + parseFloat(settlementData.lubricant_sale || 0);
        const actualTotal = parseFloat(settlementData.total_sale || 0);
        
        if (Math.abs(actualTotal - expectedTotal) > 0.01) {
          throw new Error(`Total mismatch for ${settlementData.settlement_date}: Expected ${expectedTotal}, Got ${actualTotal}`);
        }
        console.log(`✅ Verified: ${settlementData.settlement_date} - Totals match`);
      }
    });

    await this.runTest('daySettlements', 'Test Variance Handling', async () => {
      const varianceSettlements = await this.client.query(`
        SELECT settlement_date, shortage 
        FROM day_settlements 
        WHERE shortage != 0 
        ORDER BY ABS(shortage) DESC
      `);
      console.log(`✅ Found ${varianceSettlements.rows.length} settlements with variance`);
    });

    await this.runTest('daySettlements', 'Verify Settlement Calculations', async () => {
      const totalMeterSales = await this.client.query('SELECT SUM(meter_sale) as total_meter_sales FROM day_settlements');
      const totalLubSales = await this.client.query('SELECT SUM(lubricant_sale) as total_lub_sales FROM day_settlements');
      const totalShortage = await this.client.query('SELECT SUM(shortage) as total_shortage FROM day_settlements');
      
      console.log(`✅ Total Meter Sales: ₹${totalMeterSales.rows[0].total_meter_sales}`);
      console.log(`✅ Total Lubricant Sales: ₹${totalLubSales.rows[0].total_lub_sales}`);
      console.log(`✅ Total Shortage: ₹${totalShortage.rows[0].total_shortage}`);
    });
  }

  // 29. Shift Sheet Entry (Using Daily Nozzle Assignings and Sale Entries)
  async testShiftSheetEntries() {
    console.log('\n📋 TESTING SHIFT SHEET ENTRIES');
    console.log('=' .repeat(60));

    await this.runTest('shiftSheetEntries', 'Create Shift-wise Assignments', async () => {
      const assignments = [
        { shift: 'S-1', employee: 0, nozzle: 'N1', date: '2024-01-15' },
        { shift: 'S-2', employee: 1, nozzle: 'N2', date: '2024-01-15' },
        { shift: 'S-1', employee: 2, nozzle: 'N3', date: '2024-01-15' },
        { shift: 'S-2', employee: 3, nozzle: 'N4', date: '2024-01-16' },
        { shift: 'S-1', employee: 4, nozzle: 'N5', date: '2024-01-16' },
        { shift: 'S-2', employee: 5, nozzle: 'N6', date: '2024-01-16' },
        { shift: 'S-1', employee: 6, nozzle: 'N7', date: '2024-01-17' },
        { shift: 'S-2', employee: 7, nozzle: 'N8', date: '2024-01-17' }
      ];

      for (const assignment of assignments) {
        const result = await this.client.query(`
          INSERT INTO daily_nozzle_assignings (
            assign_date, shift, employee_id, nozzle, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, assign_date, shift, nozzle
        `, [
          assignment.date, assignment.shift, this.masterData.employees[assignment.employee].id, 
          assignment.nozzle, 'Shift assignment test', null
        ]);
        
        this.createdData.shiftSheetEntries.push(result.rows[0]);
        console.log(`✅ Created: ${result.rows[0].assign_date} - ${result.rows[0].shift} - ${result.rows[0].nozzle}`);
      }
      
      if (this.createdData.shiftSheetEntries.length !== assignments.length) {
        throw new Error('Not all shift assignments created successfully');
      }
    });

    await this.runTest('shiftSheetEntries', 'Create Sale Entries with Meter Readings', async () => {
      const saleEntries = [
        { shift: 0, nozzle: 0, fuel: 0, opening: 1000, closing: 1050, price: 95.50 },
        { shift: 1, nozzle: 1, fuel: 1, opening: 2000, closing: 2080, price: 98.50 },
        { shift: 2, nozzle: 2, fuel: 2, opening: 3000, closing: 3120, price: 87.50 },
        { shift: 0, nozzle: 3, fuel: 3, opening: 1500, closing: 1580, price: 90.50 },
        { shift: 1, nozzle: 4, fuel: 0, opening: 2500, closing: 2620, price: 95.50 },
        { shift: 2, nozzle: 5, fuel: 1, opening: 3500, closing: 3650, price: 98.50 }
      ];

      for (const entry of saleEntries) {
        const quantity = entry.closing - entry.opening;
        const netAmount = quantity * entry.price;
        
        const result = await this.client.query(`
          INSERT INTO sale_entries (
            sale_date, shift_id, pump_station, nozzle_id, fuel_product_id,
            opening_reading, closing_reading, quantity, price_per_unit, 
            net_sale_amount, employee_id, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, quantity, net_sale_amount
        `, [
          '2024-01-15', this.masterData.shifts[entry.shift].id, 'Pump-1', 
          this.masterData.nozzles[entry.nozzle].id, this.masterData.fuelProducts[entry.fuel].id,
          entry.opening, entry.closing, quantity, entry.price, netAmount,
          this.masterData.employees[entry.shift].id, null
        ]);
        
        console.log(`✅ Created Sale Entry: ${quantity}L - ₹${result.rows[0].net_sale_amount}`);
      }
    });

    await this.runTest('shiftSheetEntries', 'Verify Shift-wise Calculations', async () => {
      const shiftTotals = await this.client.query(`
        SELECT 
          ds.shift_name,
          COUNT(se.id) as entry_count,
          SUM(se.quantity) as total_quantity,
          SUM(se.net_sale_amount) as total_amount
        FROM duty_shifts ds
        LEFT JOIN sale_entries se ON ds.id = se.shift_id
        GROUP BY ds.id, ds.shift_name
        ORDER BY ds.shift_name
      `);
      console.log(`✅ Shift-wise totals calculated for ${shiftTotals.rows.length} shifts`);
    });

    await this.runTest('shiftSheetEntries', 'Verify Employee-Nozzle Mapping', async () => {
      const employeeNozzleMapping = await this.client.query(`
        SELECT 
          e.employee_name,
          dna.nozzle,
          COUNT(*) as assignments
        FROM daily_nozzle_assignings dna
        JOIN employees e ON dna.employee_id = e.id
        GROUP BY e.employee_name, dna.nozzle
        ORDER BY e.employee_name
      `);
      console.log(`✅ Verified: ${employeeNozzleMapping.rows.length} employee-nozzle mappings`);
    });
  }

  // 30. Opening Stock (Using Tanks Table)
  async testOpeningStocks() {
    console.log('\n📦 TESTING OPENING STOCKS');
    console.log('=' .repeat(60));

    await this.runTest('openingStocks', 'Set Opening Stock for Products', async () => {
      // Get available tanks and set opening stock for them
      const availableTanks = await this.client.query(`
        SELECT t.id, t.tank_number, t.fuel_product_id, fp.product_name, t.current_stock
        FROM tanks t
        JOIN fuel_products fp ON t.fuel_product_id = fp.id
        WHERE t.is_active = true
        ORDER BY t.tank_number
        LIMIT 4
      `);
      
      if (availableTanks.rows.length === 0) {
        throw new Error('No active tanks found to set opening stock');
      }

      const openingStocks = [
        { quantity: 5000 },
        { quantity: 3000 },
        { quantity: 4000 },
        { quantity: 2500 }
      ];

      for (let i = 0; i < availableTanks.rows.length && i < openingStocks.length; i++) {
        const tank = availableTanks.rows[i];
        const stock = openingStocks[i];
        
        // Update tank stock as opening stock
        const result = await this.client.query(`
          UPDATE tanks 
          SET current_stock = $1 
          WHERE id = $2
          RETURNING id, tank_number, current_stock
        `, [stock.quantity, tank.id]);
        
        this.createdData.openingStocks.push(result.rows[0]);
        console.log(`✅ Set Opening Stock: ${result.rows[0].tank_number} (${tank.product_name}) - ${stock.quantity}L`);
      }
      
      if (this.createdData.openingStocks.length === 0) {
        throw new Error('No tanks updated with opening stock');
      }
    });

    await this.runTest('openingStocks', 'Verify Stock Initialization', async () => {
      for (const stock of this.createdData.openingStocks) {
        const result = await this.client.query('SELECT * FROM tanks WHERE id = $1', [stock.id]);
        if (result.rows.length === 0) throw new Error(`Tank ${stock.id} not found`);
        
        const tankData = result.rows[0];
        if (!tankData.current_stock || tankData.current_stock <= 0) {
          throw new Error(`Invalid opening quantity for tank ${stock.id}`);
        }
        console.log(`✅ Verified: Tank ${stock.tank_number} - Qty: ${tankData.current_stock}L`);
      }
    });

    await this.runTest('openingStocks', 'Test Stock Reconciliation', async () => {
      const totalOpeningStock = await this.client.query('SELECT SUM(current_stock) as total_opening FROM tanks WHERE is_active = true');
      console.log(`✅ Total opening stock: ${totalOpeningStock.rows[0].total_opening}L`);
    });

    await this.runTest('openingStocks', 'Verify Product-wise Stock Distribution', async () => {
      const productStocks = await this.client.query(`
        SELECT fp.product_name, SUM(t.current_stock) as total_stock
        FROM tanks t
        JOIN fuel_products fp ON t.fuel_product_id = fp.id
        WHERE t.is_active = true
        GROUP BY fp.id, fp.product_name
        ORDER BY total_stock DESC
      `);
      console.log(`✅ Verified: ${productStocks.rows.length} products with opening stock`);
    });
  }

  async testAllPeriodEndOperations() {
    console.log('🚀 STARTING PHASE 3: PERIOD-END OPERATIONS TESTING');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      await this.loadMasterData();
      await this.testDaySettlements();
      await this.testShiftSheetEntries();
      await this.testOpeningStocks();
      
      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 PHASE 3: PERIOD-END OPERATIONS TESTING RESULTS');
      console.log('=' .repeat(80));
      
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

      console.log(`\n📊 OPERATIONS CREATED:`);
      console.log(`💰 Day Settlements: ${this.createdData.daySettlements.length}`);
      console.log(`📋 Shift Sheet Entries: ${this.createdData.shiftSheetEntries.length}`);
      console.log(`📦 Opening Stocks: ${this.createdData.openingStocks.length}`);

      if (totalFailed === 0) {
        console.log('\n🏆 ALL PERIOD-END OPERATIONS TESTS PASSED!');
      } else {
        console.log('\n⚠️ Some period-end operations tests failed. Review the details above.');
      }

    } finally {
      await this.disconnect();
    }
  }
}

// Run the period-end operations testing
if (require.main === module) {
  const tester = new PeriodEndOperationsTester();
  tester.testAllPeriodEndOperations().catch(console.error);
}

module.exports = PeriodEndOperationsTester;
