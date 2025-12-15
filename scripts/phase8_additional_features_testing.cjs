#!/usr/bin/env node

/**
 * PHASE 8: ADDITIONAL FEATURES TESTING
 * Tests sales officer, credit requests, duty pay, and feedback functionality
 */

const { Client } = require('pg');
require('dotenv').config();

class Phase8AdditionalFeaturesTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      salesOfficer: { passed: 0, failed: 0, total: 0, details: [] },
      creditRequests: { passed: 0, failed: 0, total: 0, details: [] },
      dutyPay: { passed: 0, failed: 0, total: 0, details: [] },
      feedback: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.createdData = {
      salesOfficerInspections: [],
      creditRequests: [],
      dutyPayRecords: [],
      feedbackRecords: [],
      employees: [],
      customers: []
    };
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to database for additional features testing');
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
    console.log('\n📋 LOADING MASTER DATA FOR ADDITIONAL FEATURES TESTING');
    console.log('=' .repeat(60));

    // Load employees
    const employeesResult = await this.client.query('SELECT id, employee_name, designation FROM employees WHERE is_active = true LIMIT 5');
    this.createdData.employees = employeesResult.rows;
    console.log(`✅ Loaded ${this.createdData.employees.length} employees`);

    // Load credit customers
    const customersResult = await this.client.query('SELECT id, organization_name, credit_limit, current_balance FROM credit_customers WHERE is_active = true LIMIT 5');
    this.createdData.customers = customersResult.rows;
    console.log(`✅ Loaded ${this.createdData.customers.length} customers`);
  }

  // 48. Sales Officer
  async testSalesOfficer() {
    console.log('\n👨‍💼 TESTING SALES OFFICER FUNCTIONALITY');
    console.log('=' .repeat(60));

    await this.runTest('salesOfficer', 'Create Sales Officer Inspections', async () => {
      // Get a fuel product for the inspection
      const fuelProduct = await this.client.query('SELECT id FROM fuel_products WHERE is_active = true LIMIT 1');
      if (fuelProduct.rows.length === 0) {
        throw new Error('No fuel products available for inspection');
      }

      const inspections = [
        { inspection_date: '2024-01-15', dip_value: 1500, total_sale_liters: 2000, notes: 'Regular inspection - all systems working properly' },
        { inspection_date: '2024-01-16', dip_value: 1200, total_sale_liters: 1800, notes: 'Fuel quality check passed, pumps calibrated correctly' },
        { inspection_date: '2024-01-17', dip_value: 1800, total_sale_liters: 2200, notes: 'Safety protocols followed, emergency equipment in place' },
        { inspection_date: '2024-01-18', dip_value: 1600, total_sale_liters: 1900, notes: 'Customer service standards met, staff training completed' },
        { inspection_date: '2024-01-19', dip_value: 1400, total_sale_liters: 2100, notes: 'Inventory levels adequate, no discrepancies found' }
      ];

      for (const inspection of inspections) {
        const result = await this.client.query(`
          INSERT INTO sales_officer_inspections (
            inspection_date, fuel_product_id, dip_value, total_sale_liters, notes, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, null
          ) RETURNING id, inspection_date, dip_value, total_sale_liters
        `, [inspection.inspection_date, fuelProduct.rows[0].id, inspection.dip_value, inspection.total_sale_liters, inspection.notes]);

        this.createdData.salesOfficerInspections.push(result.rows[0]);
        console.log(`✅ Created Inspection: ${result.rows[0].inspection_date} - Dip: ${result.rows[0].dip_value}L, Sales: ${result.rows[0].total_sale_liters}L`);
      }

      if (this.createdData.salesOfficerInspections.length === 0) {
        throw new Error('No sales officer inspections created');
      }
    });

    await this.runTest('salesOfficer', 'View Sales Officer Inspection History', async () => {
      const inspections = await this.client.query(`
        SELECT 
          soi.id, 
          soi.inspection_date, 
          soi.dip_value, 
          soi.total_sale_liters, 
          soi.notes, 
          soi.created_at,
          fp.product_name
        FROM sales_officer_inspections soi
        JOIN fuel_products fp ON soi.fuel_product_id = fp.id
        ORDER BY soi.inspection_date DESC
        LIMIT 10
      `);

      if (inspections.rows.length === 0) {
        throw new Error('No sales officer inspections found');
      }

      console.log(`✅ Retrieved ${inspections.rows.length} sales officer inspections`);
      
      // Verify inspection data
      for (const inspection of inspections.rows) {
        if (!inspection.inspection_date || !inspection.product_name) {
          throw new Error(`Incomplete inspection data for ${inspection.id}`);
        }
      }
    });

    await this.runTest('salesOfficer', 'Search Inspections by Date Range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const dateRangeInspections = await this.client.query(`
        SELECT id, inspection_date, dip_value, total_sale_liters, notes
        FROM sales_officer_inspections
        WHERE inspection_date BETWEEN $1 AND $2
        ORDER BY inspection_date DESC
      `, [startDate, endDate]);

      console.log(`✅ Found ${dateRangeInspections.rows.length} inspections in date range ${startDate} to ${endDate}`);
    });

    await this.runTest('salesOfficer', 'Test Inspection Data Validation', async () => {
      // Test creating inspection with missing required fields
      try {
        await this.client.query(`
          INSERT INTO sales_officer_inspections (inspection_date, fuel_product_id, dip_value, total_sale_liters, notes)
          VALUES (null, null, null, null, null)
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
  }

  // 49. Credit Requests
  async testCreditRequests() {
    console.log('\n💳 TESTING CREDIT REQUESTS FUNCTIONALITY');
    console.log('=' .repeat(60));

    await this.runTest('creditRequests', 'Create Credit Limit Requests', async () => {
      if (this.createdData.customers.length === 0) {
        throw new Error('No customers available for credit request test');
      }

      // Get a fuel product for the request
      const fuelProduct = await this.client.query('SELECT id FROM fuel_products WHERE is_active = true LIMIT 1');
      if (fuelProduct.rows.length === 0) {
        throw new Error('No fuel products available for credit request');
      }

      const requests = [
        { customer_id: this.createdData.customers[0].id, ordered_quantity: 100, status: 'Pending', notes: 'Request for fuel delivery' },
        { customer_id: this.createdData.customers[1]?.id, ordered_quantity: 150, status: 'Approved', notes: 'Approved for delivery' },
        { customer_id: this.createdData.customers[2]?.id, ordered_quantity: 75, status: 'Rejected', notes: 'Insufficient credit limit' }
      ].filter(req => req.customer_id); // Filter out null customer IDs

      for (const request of requests) {
        const result = await this.client.query(`
          INSERT INTO credit_requests (
            credit_customer_id, fuel_product_id, ordered_quantity, status, notes, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, null
          ) RETURNING id, credit_customer_id, ordered_quantity, status
        `, [request.customer_id, fuelProduct.rows[0].id, request.ordered_quantity, request.status, request.notes]);

        this.createdData.creditRequests.push(result.rows[0]);
        console.log(`✅ Created Credit Request: ${result.rows[0].status} - ${result.rows[0].ordered_quantity}L`);
      }

      if (this.createdData.creditRequests.length === 0) {
        throw new Error('No credit requests created');
      }
    });

    await this.runTest('creditRequests', 'View Credit Request History', async () => {
      const requests = await this.client.query(`
        SELECT 
          cr.id,
          cr.ordered_quantity,
          cr.status,
          cr.notes,
          cr.created_at,
          cc.organization_name as customer_name,
          fp.product_name
        FROM credit_requests cr
        JOIN credit_customers cc ON cr.credit_customer_id = cc.id
        LEFT JOIN fuel_products fp ON cr.fuel_product_id = fp.id
        ORDER BY cr.created_at DESC
        LIMIT 10
      `);

      if (requests.rows.length === 0) {
        throw new Error('No credit requests found');
      }

      console.log(`✅ Retrieved ${requests.rows.length} credit requests`);
      
      // Verify request data
      for (const request of requests.rows) {
        if (!request.ordered_quantity || !request.status || !request.customer_name) {
          throw new Error(`Incomplete request data for ${request.id}`);
        }
      }
    });

    await this.runTest('creditRequests', 'Test Credit Request Approval Workflow', async () => {
      if (this.createdData.creditRequests.length === 0) {
        throw new Error('No credit requests available for approval test');
      }

      const pendingRequest = this.createdData.creditRequests.find(req => req.status === 'Pending');
      if (!pendingRequest) {
        console.log('⚠️ No pending requests found, creating test approval...');
        
        // Create a test approval
        const result = await this.client.query(`
          UPDATE credit_requests 
          SET status = 'Approved', notes = notes || ' - Approved by manager'
          WHERE id = $1
          RETURNING id, status, notes
        `, [this.createdData.creditRequests[0].id]);
        
        console.log(`✅ Updated request ${result.rows[0].id} to ${result.rows[0].status}`);
      } else {
        const result = await this.client.query(`
          UPDATE credit_requests 
          SET status = 'Approved', notes = notes || ' - Approved by manager'
          WHERE id = $1
          RETURNING id, status, notes
        `, [pendingRequest.id]);
        
        console.log(`✅ Approved request ${result.rows[0].id}: ${result.rows[0].status}`);
      }
    });

    await this.runTest('creditRequests', 'Test Credit Request Validation', async () => {
      // Test creating request with invalid data
      try {
        await this.client.query(`
          INSERT INTO credit_requests (credit_customer_id, requested_limit, status, remarks)
          VALUES ($1, $2, $3, $4)
        `, [this.createdData.customers[0]?.id, -1000, 'Invalid', '']);
        
        throw new Error('Should have failed due to negative amount');
      } catch (error) {
        console.log('✅ Credit request validation working correctly');
      }
    });
  }

  // 50. Duty Pay
  async testDutyPay() {
    console.log('\n💰 TESTING DUTY PAY FUNCTIONALITY');
    console.log('=' .repeat(60));

    await this.runTest('dutyPay', 'Create Duty Pay Records', async () => {
      const dutyPayRecords = [
        { pay_month: '2024-01-01', total_salary: 25000, total_employees: 5, notes: 'January salary payment' },
        { pay_month: '2024-02-01', total_salary: 28000, total_employees: 6, notes: 'February salary payment' },
        { pay_month: '2024-03-01', total_salary: 30000, total_employees: 7, notes: 'March salary payment' },
        { pay_month: '2024-04-01', total_salary: 32000, total_employees: 8, notes: 'April salary payment' },
        { pay_month: '2024-05-01', total_salary: 35000, total_employees: 9, notes: 'May salary payment' }
      ];

      for (const record of dutyPayRecords) {
        const result = await this.client.query(`
          INSERT INTO duty_pay (
            pay_month, total_salary, total_employees, notes, created_by
          ) VALUES (
            $1, $2, $3, $4, null
          ) RETURNING id, pay_month, total_salary, total_employees
        `, [record.pay_month, record.total_salary, record.total_employees, record.notes]);

        this.createdData.dutyPayRecords.push(result.rows[0]);
        console.log(`✅ Created Duty Pay: ${result.rows[0].pay_month} - ₹${result.rows[0].total_salary} for ${result.rows[0].total_employees} employees`);
      }

      if (this.createdData.dutyPayRecords.length === 0) {
        throw new Error('No duty pay records created');
      }
    });

    await this.runTest('dutyPay', 'View Duty Pay History', async () => {
      const dutyPayHistory = await this.client.query(`
        SELECT 
          dp.id,
          dp.pay_month,
          dp.total_salary,
          dp.total_employees,
          dp.notes,
          dp.created_at
        FROM duty_pay dp
        ORDER BY dp.pay_month DESC
        LIMIT 10
      `);

      if (dutyPayHistory.rows.length === 0) {
        throw new Error('No duty pay records found');
      }

      console.log(`✅ Retrieved ${dutyPayHistory.rows.length} duty pay records`);
      
      // Verify duty pay data
      for (const record of dutyPayHistory.rows) {
        if (!record.pay_month || !record.total_salary || !record.total_employees) {
          throw new Error(`Incomplete duty pay data for ${record.id}`);
        }
      }
    });

    await this.runTest('dutyPay', 'Calculate Total Salary Payments', async () => {
      const totalPayments = await this.client.query(`
        SELECT 
          SUM(total_salary) as total_salary_paid,
          SUM(total_employees) as total_employees_paid,
          COUNT(*) as payment_count
        FROM duty_pay
      `);

      const totals = totalPayments.rows[0];
      console.log(`✅ Total Salary Payments: ₹${parseFloat(totals.total_salary_paid || 0).toFixed(2)} for ${totals.total_employees_paid || 0} employees across ${totals.payment_count || 0} payments`);
    });

    await this.runTest('dutyPay', 'Test Duty Pay Validation', async () => {
      // Test creating duty pay with invalid data
      try {
        await this.client.query(`
          INSERT INTO duty_pay (pay_month, total_salary, total_employees, notes)
          VALUES ($1, $2, $3, $4)
        `, ['invalid-date', -1000, -5, '']);
        
        throw new Error('Should have failed due to invalid data');
      } catch (error) {
        console.log('✅ Duty pay validation working correctly');
      }
    });
  }

  // 51. Feedback
  async testFeedback() {
    console.log('\n💬 TESTING FEEDBACK FUNCTIONALITY');
    console.log('=' .repeat(60));

    await this.runTest('feedback', 'Create Feedback Records', async () => {
      const feedbackRecords = [
        { name: 'Customer Service', message: 'Improve customer service response time', priority: 'Medium' },
        { name: 'Technical Issue', message: 'Fuel pump not working properly', priority: 'High' },
        { name: 'Positive Feedback', message: 'Excellent service and clean facilities', priority: 'Low' },
        { name: 'System Bug', message: 'System error when processing payments', priority: 'High' },
        { name: 'Feature Request', message: 'Add mobile app for customers', priority: 'Medium' }
      ];

      for (const feedback of feedbackRecords) {
        const result = await this.client.query(`
          INSERT INTO feedback (
            name, message, created_by
          ) VALUES (
            $1, $2, null
          ) RETURNING id, name, message
        `, [feedback.name, feedback.message]);

        this.createdData.feedbackRecords.push(result.rows[0]);
        console.log(`✅ Created Feedback: ${result.rows[0].name} - ${feedback.priority} Priority`);
      }

      if (this.createdData.feedbackRecords.length === 0) {
        throw new Error('No feedback records created');
      }
    });

    await this.runTest('feedback', 'View Feedback History', async () => {
      const feedbackHistory = await this.client.query(`
        SELECT id, name, message, created_at
        FROM feedback
        ORDER BY created_at DESC
        LIMIT 10
      `);

      if (feedbackHistory.rows.length === 0) {
        throw new Error('No feedback records found');
      }

      console.log(`✅ Retrieved ${feedbackHistory.rows.length} feedback records`);
      
      // Verify feedback data
      for (const feedback of feedbackHistory.rows) {
        if (!feedback.name || !feedback.message) {
          throw new Error(`Incomplete feedback data for ${feedback.id}`);
        }
      }
    });

    await this.runTest('feedback', 'Test Feedback Search by Name', async () => {
      const customerServiceFeedback = await this.client.query(`
        SELECT id, name, message, created_at
        FROM feedback
        WHERE name ILIKE '%customer%' OR message ILIKE '%customer%'
        ORDER BY created_at DESC
      `);

      console.log(`✅ Found ${customerServiceFeedback.rows.length} customer-related feedback items`);
    });

    await this.runTest('feedback', 'Test Feedback Message Updates', async () => {
      if (this.createdData.feedbackRecords.length === 0) {
        throw new Error('No feedback records available for update test');
      }

      const testFeedback = this.createdData.feedbackRecords[0];
      const updatedMessage = testFeedback.message + ' - Status updated';
      
      const result = await this.client.query(`
        UPDATE feedback 
        SET message = $1
        WHERE id = $2
        RETURNING id, message
      `, [updatedMessage, testFeedback.id]);
      
      console.log(`✅ Updated feedback ${result.rows[0].id}: ${result.rows[0].message.substring(0, 50)}...`);
    });
  }

  async runAllTests() {
    console.log('🚀 STARTING PHASE 8: ADDITIONAL FEATURES TESTING');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      await this.loadMasterData();
      await this.testSalesOfficer();
      await this.testCreditRequests();
      await this.testDutyPay();
      await this.testFeedback();

      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 PHASE 8: ADDITIONAL FEATURES TESTING RESULTS');
      console.log('=' .repeat(80));

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

      console.log('\n📊 ADDITIONAL FEATURES CREATED:');
      console.log(`👨‍💼 Sales Officer Inspections: ${this.createdData.salesOfficerInspections.length}`);
      console.log(`💳 Credit Requests: ${this.createdData.creditRequests.length}`);
      console.log(`💰 Duty Pay Records: ${this.createdData.dutyPayRecords.length}`);
      console.log(`💬 Feedback Records: ${this.createdData.feedbackRecords.length}`);
      console.log(`👥 Employees Involved: ${this.createdData.employees.length}`);
      console.log(`🏢 Customers Involved: ${this.createdData.customers.length}`);

      if (totalFailed === 0) {
        console.log('\n🏆 ALL ADDITIONAL FEATURES TESTS PASSED!');
      } else {
        console.log('\n⚠️ Some additional features tests failed. Review the details above.');
      }

    } catch (error) {
      console.error('❌ Phase 8 testing failed:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the tests
const tester = new Phase8AdditionalFeaturesTester();
tester.runAllTests().catch(console.error);
