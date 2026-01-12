/**
 * Comprehensive Error Testing Script
 * 
 * This script tests error handling across all API endpoints and pages
 * to ensure robust error management throughout the application.
 */

import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

const { Pool } = pkg;
dotenv.config({ path: '.local.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class ErrorTestingSuite {
  constructor() {
    this.results = [];
    this.baseUrl = 'http://localhost:5000';
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Error Testing Suite...');
    console.log('================================================');

    // Test API endpoints
    await this.testAPIEndpoints();
    
    // Test database operations
    await this.testDatabaseOperations();
    
    // Test error scenarios
    await this.testErrorScenarios();
    
    // Generate report
    this.generateReport();
  }

  async testAPIEndpoints() {
    console.log('\n📡 Testing API Endpoints...');
    
    const endpoints = [
      { path: '/api/fuel-products', method: 'GET' },
      { path: '/api/employees', method: 'GET' },
      { path: '/api/credit-customers', method: 'GET' },
      { path: '/api/tanks', method: 'GET' },
      { path: '/api/nozzles', method: 'GET' },
      { path: '/api/expenses', method: 'GET' },
      { path: '/api/recoveries', method: 'GET' },
      { path: '/api/daily-sale-rates', method: 'GET' },
      { path: '/api/denominations', method: 'GET' },
      { path: '/api/duty-shifts', method: 'GET' },
      { path: '/api/today-sales', method: 'GET' },
      { path: '/api/lubricants', method: 'GET' },
      { path: '/api/sales-officer-inspections', method: 'GET' },
      { path: '/api/vendor-transactions', method: 'GET' },
      { path: '/api/business-transactions', method: 'GET' },
      { path: '/api/user-roles', method: 'GET' },
      { path: '/api/vendor-invoices', method: 'GET' },
      { path: '/api/tank-transfers', method: 'GET' },
      { path: '/api/tank-dips', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint.path, endpoint.method);
    }
  }

  async testEndpoint(path, method) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });

      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.addResult({
          endpoint: path,
          test: `${method} Request`,
          status: 'PASS',
          response: data,
          duration
        });
        console.log(`✅ ${method} ${path} - ${duration}ms`);
      } else {
        this.addResult({
          endpoint: path,
          test: `${method} Request`,
          status: 'FAIL',
          error: `HTTP ${response.status}: ${response.statusText}`,
          duration
        });
        console.log(`❌ ${method} ${path} - HTTP ${response.status}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult({
        endpoint: path,
        test: `${method} Request`,
        status: 'FAIL',
        error: error.message,
        duration
      });
      console.log(`❌ ${method} ${path} - ${error.message}`);
    }
  }

  async testDatabaseOperations() {
    console.log('\n🗄️ Testing Database Operations...');

    const operations = [
      {
        name: 'Basic Connection',
        query: 'SELECT 1 as test',
        expected: true
      },
      {
        name: 'Table Existence Check',
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'employees', 'fuel_products', 'tanks', 'nozzles')
        `,
        expected: true
      },
      {
        name: 'Column Existence Check',
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'expenses' 
          AND column_name IN ('id', 'expense_date', 'expense_type_id', 'amount')
        `,
        expected: true
      },
      {
        name: 'Foreign Key Check',
        query: `
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_schema = 'public' 
          AND constraint_type = 'FOREIGN KEY'
          LIMIT 5
        `,
        expected: true
      },
      {
        name: 'Trigger Check',
        query: `
          SELECT trigger_name 
          FROM information_schema.triggers 
          WHERE trigger_schema = 'public'
          LIMIT 5
        `,
        expected: true
      }
    ];

    for (const operation of operations) {
      await this.testDatabaseOperation(operation);
    }
  }

  async testDatabaseOperation(operation) {
    const startTime = Date.now();
    
    try {
      const result = await pool.query(operation.query);
      const duration = Date.now() - startTime;
      
      if (result.rows.length > 0 || operation.name === 'Basic Connection') {
        this.addResult({
          endpoint: 'Database',
          test: operation.name,
          status: 'PASS',
          response: { rowCount: result.rows.length },
          duration
        });
        console.log(`✅ ${operation.name} - ${result.rows.length} rows - ${duration}ms`);
      } else {
        this.addResult({
          endpoint: 'Database',
          test: operation.name,
          status: 'FAIL',
          error: 'No results returned',
          duration
        });
        console.log(`❌ ${operation.name} - No results`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult({
        endpoint: 'Database',
        test: operation.name,
        status: 'FAIL',
        error: error.message,
        duration
      });
      console.log(`❌ ${operation.name} - ${error.message}`);
    }
  }

  async testErrorScenarios() {
    console.log('\n🚨 Testing Error Scenarios...');

    const errorTests = [
      {
        name: 'Invalid UUID Format',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expense_date: '2024-01-01',
              expense_type_id: 'invalid-uuid',
              amount: 100
            })
          });
          return response.status === 400 || response.status === 422;
        }
      },
      {
        name: 'Missing Required Fields',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          return response.status === 400 || response.status === 422;
        }
      },
      {
        name: 'Invalid Data Types',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expense_date: '2024-01-01',
              expense_type_id: '00000000-0000-0000-0000-000000000000',
              amount: 'not-a-number'
            })
          });
          return response.status === 400 || response.status === 422;
        }
      },
      {
        name: 'Non-existent Resource',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/non-existent-endpoint`);
          return response.status === 404;
        }
      }
    ];

    for (const errorTest of errorTests) {
      await this.testErrorScenario(errorTest);
    }
  }

  async testErrorScenario(errorTest) {
    const startTime = Date.now();
    
    try {
      const result = await errorTest.test();
      const duration = Date.now() - startTime;
      
      if (result) {
        this.addResult({
          endpoint: 'Error Handling',
          test: errorTest.name,
          status: 'PASS',
          duration
        });
        console.log(`✅ ${errorTest.name} - Error handled correctly - ${duration}ms`);
      } else {
        this.addResult({
          endpoint: 'Error Handling',
          test: errorTest.name,
          status: 'FAIL',
          error: 'Error not handled as expected',
          duration
        });
        console.log(`❌ ${errorTest.name} - Error not handled correctly`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult({
        endpoint: 'Error Handling',
        test: errorTest.name,
        status: 'FAIL',
        error: error.message,
        duration
      });
      console.log(`❌ ${errorTest.name} - ${error.message}`);
    }
  }

  addResult(result) {
    this.results.push(result);
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIP').length;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`Skipped: ${skippedTests} (${((skippedTests / totalTests) * 100).toFixed(1)}%)`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  - ${result.endpoint}: ${result.test}`);
          console.log(`    Error: ${result.error}`);
        });
    }

    // Group results by endpoint
    const resultsByEndpoint = this.results.reduce((acc, result) => {
      if (!acc[result.endpoint]) {
        acc[result.endpoint] = [];
      }
      acc[result.endpoint].push(result);
      return acc;
    }, {});

    console.log('\n📈 RESULTS BY ENDPOINT:');
    Object.entries(resultsByEndpoint).forEach(([endpoint, results]) => {
      const passed = results.filter(r => r.status === 'PASS').length;
      const total = results.length;
      const percentage = ((passed / total) * 100).toFixed(1);
      console.log(`  ${endpoint}: ${passed}/${total} (${percentage}%)`);
    });

    // Performance analysis
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const slowTests = this.results.filter(r => r.duration > 1000);
    
    console.log(`\n⏱️ PERFORMANCE:`);
    console.log(`  Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`  Slow Tests (>1s): ${slowTests.length}`);
    
    if (slowTests.length > 0) {
      console.log('  Slow Tests:');
      slowTests.forEach(test => {
        console.log(`    - ${test.endpoint}: ${test.test} (${test.duration}ms)`);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
        avgDuration: avgDuration.toFixed(0) + 'ms'
      },
      results: this.results,
      resultsByEndpoint,
      slowTests: slowTests.map(t => ({
        endpoint: t.endpoint,
        test: t.test,
        duration: t.duration
      }))
    };

    fs.writeFileSync('error-testing-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to error-testing-report.json');

    // Overall status
    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Error handling is working correctly.');
    } else {
      console.log(`\n⚠️ ${failedTests} tests failed. Please review and fix the issues.`);
    }
  }
}

// Run the test suite
async function runErrorTests() {
  const testSuite = new ErrorTestingSuite();
  
  try {
    await testSuite.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await pool.end();
  }
}

runErrorTests();
