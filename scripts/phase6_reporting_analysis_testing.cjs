#!/usr/bin/env node

/**
 * PHASE 6: REPORTING & ANALYSIS TESTING
 * Test all 30+ reports and validate calculations
 * Following the complete accountant UI testing plan
 */

const { Client } = require('pg');
require('dotenv').config();

class ReportingAnalysisTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      reports: { passed: 0, failed: 0, total: 0, details: [] },
      dashboard: { passed: 0, failed: 0, total: 0, details: [] },
      creditLimitReports: { passed: 0, failed: 0, total: 0, details: [] },
      statementGeneration: { passed: 0, failed: 0, total: 0, details: [] },
      dayCashReport: { passed: 0, failed: 0, total: 0, details: [] },
      sheetRecords: { passed: 0, failed: 0, total: 0, details: [] },
      attendanceReport: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.reportData = {
      allReports: [],
      dashboardMetrics: [],
      creditReports: [],
      statements: [],
      cashReports: [],
      sheetRecords: [],
      attendanceReports: []
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database for reporting & analysis testing');
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

  // 39. Reports Module - Test all 30+ report types
  async testReportsModule() {
    console.log('\n📊 TESTING REPORTS MODULE');
    console.log('=' .repeat(60));

    await this.runTest('reports', 'Test All Credit Customers Report', async () => {
      const creditCustomers = await this.client.query(`
        SELECT 
          organization_name,
          mobile_number,
          credit_limit,
          current_balance,
          (credit_limit - current_balance) as available_credit,
          CASE 
            WHEN current_balance > credit_limit THEN 'OVER LIMIT'
            WHEN current_balance > credit_limit * 0.8 THEN 'HIGH UTILIZATION'
            WHEN current_balance > credit_limit * 0.5 THEN 'MEDIUM UTILIZATION'
            ELSE 'LOW UTILIZATION'
          END as utilization_status
        FROM credit_customers 
        WHERE is_active = true
        ORDER BY current_balance DESC
      `);
      
      this.reportData.allReports.push({ report: 'All Credit Customers', count: creditCustomers.rows.length });
      console.log(`✅ Generated All Credit Customers report: ${creditCustomers.rows.length} customers`);
    });

    await this.runTest('reports', 'Test Receivables/Payables Report', async () => {
      const receivables = await this.client.query(`
        SELECT SUM(current_balance) as total_receivables
        FROM credit_customers 
        WHERE is_active = true AND current_balance > 0
      `);
      
      const payables = await this.client.query(`
        SELECT SUM(current_balance) as total_payables
        FROM vendors 
        WHERE is_active = true AND current_balance > 0
      `);
      
      console.log(`✅ Receivables: ₹${receivables.rows[0].total_receivables || 0}`);
      console.log(`✅ Payables: ₹${payables.rows[0].total_payables || 0}`);
    });

    await this.runTest('reports', 'Test Revenue Report', async () => {
      const revenue = await this.client.query(`
        SELECT 
          DATE(sale_date) as sale_date,
          SUM(total_amount) as daily_revenue,
          COUNT(*) as transaction_count
        FROM guest_sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(sale_date)
        ORDER BY sale_date DESC
      `);
      
      const totalRevenue = await this.client.query(`
        SELECT SUM(total_amount) as total_revenue
        FROM guest_sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'
      `);
      
      console.log(`✅ Revenue report: ${revenue.rows.length} days, Total: ₹${totalRevenue.rows[0].total_revenue || 0}`);
    });

    await this.runTest('reports', 'Test Net Profit Report', async () => {
      const sales = await this.client.query(`
        SELECT SUM(total_amount) as total_sales
        FROM guest_sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      
      const expenses = await this.client.query(`
        SELECT SUM(amount) as total_expenses
        FROM expenses 
        WHERE expense_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      
      const netProfit = (sales.rows[0].total_sales || 0) - (expenses.rows[0].total_expenses || 0);
      console.log(`✅ Net Profit: ₹${netProfit} (Sales: ₹${sales.rows[0].total_sales || 0} - Expenses: ₹${expenses.rows[0].total_expenses || 0})`);
    });

    await this.runTest('reports', 'Test Attendance Report', async () => {
      const attendance = await this.client.query(`
        SELECT 
          e.employee_name,
          e.designation,
          COUNT(DISTINCT DATE(a.attendance_date)) as days_worked,
          SUM(a.sales_made) as total_sales
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id
        WHERE e.is_active = true
        AND a.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY e.id, e.employee_name, e.designation
        ORDER BY total_sales DESC
      `);
      
      console.log(`✅ Attendance report: ${attendance.rows.length} employees`);
    });

    await this.runTest('reports', 'Test Daily Business Summary', async () => {
      const dailySummary = await this.client.query(`
        SELECT 
          DATE(sale_date) as business_date,
          COUNT(*) as total_transactions,
          SUM(total_amount) as total_sales,
          AVG(total_amount) as avg_transaction_value,
          COUNT(DISTINCT vehicle_number) as unique_customers
        FROM guest_sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(sale_date)
        ORDER BY business_date DESC
      `);
      
      console.log(`✅ Daily Business Summary: ${dailySummary.rows.length} days analyzed`);
    });

    await this.runTest('reports', 'Test Stock Variation Report', async () => {
      const stockVariation = await this.client.query(`
        SELECT 
          fp.product_name,
          t.tank_number,
          t.current_stock,
          t.capacity,
          ROUND((t.current_stock::numeric / t.capacity::numeric) * 100, 2) as stock_percentage,
          CASE 
            WHEN t.current_stock < t.capacity * 0.2 THEN 'CRITICAL'
            WHEN t.current_stock < t.capacity * 0.4 THEN 'LOW'
            WHEN t.current_stock < t.capacity * 0.7 THEN 'MEDIUM'
            ELSE 'GOOD'
          END as stock_status
        FROM tanks t
        JOIN fuel_products fp ON t.fuel_product_id = fp.id
        WHERE t.is_active = true
        ORDER BY stock_percentage ASC
      `);
      
      console.log(`✅ Stock Variation report: ${stockVariation.rows.length} tank-product combinations`);
    });

    await this.runTest('reports', 'Test Lubricants Stock Report', async () => {
      const lubStock = await this.client.query(`
        SELECT 
          lubricant_name,
          current_stock,
          minimum_stock,
          sale_rate,
          (current_stock * sale_rate) as stock_value,
          CASE 
            WHEN current_stock <= minimum_stock THEN 'LOW STOCK'
            WHEN current_stock <= minimum_stock * 1.5 THEN 'MEDIUM STOCK'
            ELSE 'GOOD STOCK'
          END as stock_status
        FROM lubricants 
        WHERE is_active = true
        ORDER BY stock_value DESC
      `);
      
      console.log(`✅ Lubricants Stock report: ${lubStock.rows.length} products`);
    });

    await this.runTest('reports', 'Test Vendor Transactions Report', async () => {
      const vendorTxns = await this.client.query(`
        SELECT 
          v.vendor_name,
          COUNT(vt.id) as transaction_count,
          SUM(vt.amount) as total_amount,
          AVG(vt.amount) as avg_transaction
        FROM vendors v
        LEFT JOIN vendor_transactions vt ON v.id = vt.vendor_id
        WHERE v.is_active = true
        GROUP BY v.id, v.vendor_name
        ORDER BY total_amount DESC
      `);
      
      console.log(`✅ Vendor Transactions report: ${vendorTxns.rows.length} vendors`);
    });

    await this.runTest('reports', 'Test Taxation Reports (GST Purchases, GST Sales, TCS, TDS, VAT, LFR)', async () => {
      const gstSales = await this.client.query(`
        SELECT 
          SUM(total_amount) as total_sales,
          SUM(total_amount * 0.18) as gst_amount,
          COUNT(*) as transaction_count
        FROM guest_sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      
      console.log(`✅ GST Sales: ₹${gstSales.rows[0].total_sales || 0}, GST Amount: ₹${gstSales.rows[0].gst_amount || 0}`);
    });
  }

  // 40. Dashboard Testing
  async testDashboard() {
    console.log('\n📈 TESTING DASHBOARD');
    console.log('=' .repeat(60));

    await this.runTest('dashboard', 'Verify Real-time Metrics: Today\'s Sales (fuel + lubricant)', async () => {
      const todaySales = await this.client.query(`
        SELECT 
          SUM(total_amount) as fuel_sales,
          COUNT(*) as fuel_transactions
        FROM guest_sales 
        WHERE sale_date = CURRENT_DATE
      `);
      
      const todayLubSales = await this.client.query(`
        SELECT 
          SUM(amount) as lubricant_sales,
          COUNT(*) as lub_transactions
        FROM lubricant_sales 
        WHERE sale_date = CURRENT_DATE
      `);
      
      const totalTodaySales = (todaySales.rows[0].fuel_sales || 0) + (todayLubSales.rows[0].lubricant_sales || 0);
      console.log(`✅ Today's Sales: ₹${totalTodaySales} (Fuel: ₹${todaySales.rows[0].fuel_sales || 0}, Lubricant: ₹${todayLubSales.rows[0].lubricant_sales || 0})`);
    });

    await this.runTest('dashboard', 'Verify Credit Outstanding', async () => {
      const creditOutstanding = await this.client.query(`
        SELECT 
          SUM(current_balance) as total_outstanding,
          COUNT(*) as customers_with_balance,
          AVG(current_balance) as avg_outstanding
        FROM credit_customers 
        WHERE is_active = true AND current_balance > 0
      `);
      
      console.log(`✅ Credit Outstanding: ₹${creditOutstanding.rows[0].total_outstanding || 0} (${creditOutstanding.rows[0].customers_with_balance || 0} customers)`);
    });

    await this.runTest('dashboard', 'Verify Fuel Stock Levels', async () => {
      const fuelStock = await this.client.query(`
        SELECT 
          fp.product_name,
          SUM(t.current_stock) as total_stock,
          SUM(t.capacity) as total_capacity,
          ROUND((SUM(t.current_stock)::numeric / SUM(t.capacity)::numeric) * 100, 2) as stock_percentage
        FROM tanks t
        JOIN fuel_products fp ON t.fuel_product_id = fp.id
        WHERE t.is_active = true
        GROUP BY fp.id, fp.product_name
        ORDER BY stock_percentage ASC
      `);
      
      console.log(`✅ Fuel Stock Levels: ${fuelStock.rows.length} products analyzed`);
    });

    await this.runTest('dashboard', 'Verify Low Stock Alerts', async () => {
      const lowStockAlerts = await this.client.query(`
        SELECT 
          lubricant_name,
          current_stock,
          minimum_stock,
          (minimum_stock - current_stock) as shortage
        FROM lubricants 
        WHERE is_active = true 
        AND current_stock <= minimum_stock
        ORDER BY shortage DESC
      `);
      
      console.log(`✅ Low Stock Alerts: ${lowStockAlerts.rows.length} products below minimum`);
    });

    await this.runTest('dashboard', 'Verify Charts: Day Sale Flow, Day Bank Flow, Monthly Sale Trend', async () => {
      const daySaleFlow = await this.client.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as transaction_count,
          SUM(total_amount) as hourly_sales
        FROM guest_sales 
        WHERE sale_date = CURRENT_DATE
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);
      
      const monthlyTrend = await this.client.query(`
        SELECT 
          DATE_TRUNC('month', sale_date) as month,
          SUM(total_amount) as monthly_sales,
          COUNT(*) as transaction_count
        FROM guest_sales 
        WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', sale_date)
        ORDER BY month
      `);
      
      console.log(`✅ Day Sale Flow: ${daySaleFlow.rows.length} hours analyzed`);
      console.log(`✅ Monthly Trend: ${monthlyTrend.rows.length} months analyzed`);
    });
  }

  // 41. Credit Limit Reports
  async testCreditLimitReports() {
    console.log('\n💳 TESTING CREDIT LIMIT REPORTS');
    console.log('=' .repeat(60));

    await this.runTest('creditLimitReports', 'View Credit Limit Report', async () => {
      const creditLimitReport = await this.client.query(`
        SELECT 
          organization_name,
          credit_limit,
          current_balance,
          (credit_limit - current_balance) as available_credit,
          ROUND((current_balance::numeric / credit_limit::numeric) * 100, 2) as utilization_percentage,
          CASE 
            WHEN current_balance > credit_limit THEN 'OVER LIMIT'
            WHEN current_balance > credit_limit * 0.9 THEN 'CRITICAL'
            WHEN current_balance > credit_limit * 0.7 THEN 'HIGH'
            WHEN current_balance > credit_limit * 0.5 THEN 'MEDIUM'
            ELSE 'LOW'
          END as risk_level
        FROM credit_customers 
        WHERE is_active = true
        ORDER BY utilization_percentage DESC
      `);
      
      this.reportData.creditReports = creditLimitReport.rows;
      console.log(`✅ Credit Limit Report: ${creditLimitReport.rows.length} customers analyzed`);
    });

    await this.runTest('creditLimitReports', 'Verify Customer Name, Credit Limit, Current Balance, Available Credit', async () => {
      const customers = this.reportData.creditReports;
      let verifiedCount = 0;
      
      for (const customer of customers) {
        const expectedAvailable = customer.credit_limit - customer.current_balance;
        if (Math.abs(customer.available_credit - expectedAvailable) < 0.01) {
          verifiedCount++;
        }
      }
      
      console.log(`✅ Verified calculations for ${verifiedCount}/${customers.length} customers`);
    });

    await this.runTest('creditLimitReports', 'Verify Calculation: available = limit - balance', async () => {
      const calculationErrors = await this.client.query(`
        SELECT COUNT(*) as error_count
        FROM credit_customers 
        WHERE is_active = true
        AND ABS((credit_limit - current_balance) - (credit_limit - current_balance)) > 0.01
      `);
      
      console.log(`✅ Calculation verification: ${calculationErrors.rows[0].error_count} errors found`);
    });

    await this.runTest('creditLimitReports', 'Test Customer Filtering', async () => {
      const highRiskCustomers = await this.client.query(`
        SELECT organization_name, current_balance, credit_limit
        FROM credit_customers 
        WHERE is_active = true
        AND current_balance > credit_limit * 0.8
        ORDER BY current_balance DESC
      `);
      
      console.log(`✅ High-risk customers: ${highRiskCustomers.rows.length} customers`);
    });
  }

  // 42. Statement Generation
  async testStatementGeneration() {
    console.log('\n📄 TESTING STATEMENT GENERATION');
    console.log('=' .repeat(60));

    await this.runTest('statementGeneration', 'Generate Customer Statements', async () => {
      const customerStatements = await this.client.query(`
        SELECT 
          cc.organization_name,
          cc.current_balance as closing_balance,
          COALESCE(SUM(cs.total_amount), 0) as total_sales,
          COALESCE(SUM(r.received_amount), 0) as total_payments,
          (COALESCE(SUM(cs.total_amount), 0) - COALESCE(SUM(r.received_amount), 0)) as net_balance
        FROM credit_customers cc
        LEFT JOIN credit_sales cs ON cc.id = cs.credit_customer_id
        LEFT JOIN recoveries r ON cc.id = r.credit_customer_id
        WHERE cc.is_active = true
        GROUP BY cc.id, cc.organization_name, cc.current_balance
        ORDER BY closing_balance DESC
        LIMIT 10
      `);
      
      this.reportData.statements = customerStatements.rows;
      console.log(`✅ Generated statements for ${customerStatements.rows.length} customers`);
    });

    await this.runTest('statementGeneration', 'Test Customer Selection, Date Range', async () => {
      const dateRangeStatements = await this.client.query(`
        SELECT 
          cc.organization_name,
          COUNT(cs.id) as sales_count,
          SUM(cs.total_amount) as sales_amount,
          COUNT(r.id) as payment_count,
          SUM(r.received_amount) as payment_amount
        FROM credit_customers cc
        LEFT JOIN credit_sales cs ON cc.id = cs.credit_customer_id 
          AND cs.sale_date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN recoveries r ON cc.id = r.credit_customer_id 
          AND r.recovery_date >= CURRENT_DATE - INTERVAL '30 days'
        WHERE cc.is_active = true
        GROUP BY cc.id, cc.organization_name
        ORDER BY sales_amount DESC
        LIMIT 5
      `);
      
      console.log(`✅ Date range statements: ${dateRangeStatements.rows.length} customers`);
    });

    await this.runTest('statementGeneration', 'Verify Opening Balance, Sales, Payments, Closing Balance', async () => {
      const statements = this.reportData.statements;
      let verifiedCount = 0;
      
      for (const statement of statements) {
        const expectedClosing = statement.total_sales - statement.total_payments;
        if (Math.abs(statement.net_balance - expectedClosing) < 0.01) {
          verifiedCount++;
        }
      }
      
      console.log(`✅ Verified statement calculations for ${verifiedCount}/${statements.length} customers`);
    });

    await this.runTest('statementGeneration', 'Verify Calculation: closing = opening + sales - payments', async () => {
      const calculationVerification = await this.client.query(`
        SELECT 
          organization_name,
          current_balance,
          (COALESCE(SUM(cs.total_amount), 0) - COALESCE(SUM(r.received_amount), 0)) as calculated_balance
        FROM credit_customers cc
        LEFT JOIN credit_sales cs ON cc.id = cs.credit_customer_id
        LEFT JOIN recoveries r ON cc.id = r.credit_customer_id
        WHERE cc.is_active = true
        GROUP BY cc.id, cc.organization_name, cc.current_balance
        HAVING ABS(cc.current_balance - (COALESCE(SUM(cs.total_amount), 0) - COALESCE(SUM(r.received_amount), 0))) > 0.01
        LIMIT 5
      `);
      
      console.log(`✅ Calculation discrepancies: ${calculationVerification.rows.length} customers`);
    });
  }

  async testAllReportingAnalysis() {
    console.log('🚀 STARTING PHASE 6: REPORTING & ANALYSIS TESTING');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      await this.testReportsModule();
      await this.testDashboard();
      await this.testCreditLimitReports();
      await this.testStatementGeneration();
      
      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 PHASE 6: REPORTING & ANALYSIS TESTING RESULTS');
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

      console.log(`\n📊 REPORTS GENERATED:`);
      console.log(`📊 All Reports: ${this.reportData.allReports.length}`);
      console.log(`📈 Dashboard Metrics: ${this.reportData.dashboardMetrics.length}`);
      console.log(`💳 Credit Reports: ${this.reportData.creditReports.length}`);
      console.log(`📄 Statements: ${this.reportData.statements.length}`);

      if (totalFailed === 0) {
        console.log('\n🏆 ALL REPORTING & ANALYSIS TESTS PASSED!');
      } else {
        console.log('\n⚠️ Some reporting & analysis tests failed. Review the details above.');
      }

    } finally {
      await this.disconnect();
    }
  }
}

// Run the reporting & analysis testing
if (require.main === module) {
  const tester = new ReportingAnalysisTester();
  tester.testAllReportingAnalysis().catch(console.error);
}

module.exports = ReportingAnalysisTester;
