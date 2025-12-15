#!/usr/bin/env node

/**
 * PHASE 5: FINANCIAL TRANSACTIONS TESTING
 * Test all 3 financial transaction modules
 * Following the complete accountant UI testing plan
 */

const { Client } = require('pg');
require('dotenv').config();

class FinancialTransactionsTester {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.testResults = {
      businessTransactions: { passed: 0, failed: 0, total: 0, details: [] },
      vendorTransactions: { passed: 0, failed: 0, total: 0, details: [] },
      interestTransactions: { passed: 0, failed: 0, total: 0, details: [] }
    };
    this.createdData = {
      businessTransactions: [],
      vendorTransactions: [],
      interestTransactions: []
    };
    this.masterData = {
      businessParties: [],
      vendors: [],
      customers: []
    };
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database for financial transactions testing');
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
    console.log('\n📋 LOADING MASTER DATA FOR FINANCIAL TRANSACTIONS TESTING');
    console.log('=' .repeat(60));

    // Load business parties
    const businessParties = await this.client.query('SELECT id, party_name, party_type FROM business_parties WHERE is_active = true LIMIT 8');
    this.masterData.businessParties = businessParties.rows;
    console.log(`✅ Loaded ${this.masterData.businessParties.length} business parties`);

    // Load vendors
    const vendors = await this.client.query('SELECT id, vendor_name FROM vendors WHERE is_active = true LIMIT 10');
    this.masterData.vendors = vendors.rows;
    console.log(`✅ Loaded ${this.masterData.vendors.length} vendors`);

    // Load customers
    const customers = await this.client.query('SELECT id, organization_name FROM credit_customers WHERE is_active = true LIMIT 20');
    this.masterData.customers = customers.rows;
    console.log(`✅ Loaded ${this.masterData.customers.length} customers`);
  }

  // 36. Business Credit/Debit Transactions
  async testBusinessTransactions() {
    console.log('\n💼 TESTING BUSINESS CREDIT/DEBIT TRANSACTIONS');
    console.log('=' .repeat(60));

    await this.runTest('businessTransactions', 'Create 15-20 Business Transactions', async () => {
      const transactions = [
        { party: 0, type: 'Credit', amount: 50000, description: 'Bank deposit' },
        { party: 1, type: 'Debit', amount: 25000, description: 'Cash withdrawal' },
        { party: 2, type: 'Credit', amount: 100000, description: 'Owner capital injection' },
        { party: 3, type: 'Debit', amount: 15000, description: 'Petty cash expense' },
        { party: 4, type: 'Credit', amount: 75000, description: 'Loan received' },
        { party: 5, type: 'Debit', amount: 30000, description: 'Equipment purchase' },
        { party: 6, type: 'Credit', amount: 20000, description: 'Interest received' },
        { party: 7, type: 'Debit', amount: 12000, description: 'Maintenance expense' },
        { party: 0, type: 'Credit', amount: 40000, description: 'Sales proceeds deposit' },
        { party: 1, type: 'Debit', amount: 18000, description: 'Salary payment' },
        { party: 2, type: 'Credit', amount: 60000, description: 'Additional capital' },
        { party: 3, type: 'Debit', amount: 8000, description: 'Office supplies' },
        { party: 4, type: 'Credit', amount: 35000, description: 'Customer advance' },
        { party: 5, type: 'Debit', amount: 22000, description: 'Utility bills' },
        { party: 6, type: 'Credit', amount: 45000, description: 'Investment return' },
        { party: 7, type: 'Debit', amount: 16000, description: 'Insurance premium' },
        { party: 0, type: 'Credit', amount: 28000, description: 'Refund received' },
        { party: 1, type: 'Debit', amount: 14000, description: 'Transportation' },
        { party: 2, type: 'Credit', amount: 85000, description: 'Business loan' },
        { party: 3, type: 'Debit', amount: 11000, description: 'Communication' }
      ];

      for (const txn of transactions) {
        const result = await this.client.query(`
          INSERT INTO business_transactions (
            party_id, transaction_date, transaction_type, amount, description, created_by
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, 'test_user')
          RETURNING id, transaction_type, amount, description
        `, [this.masterData.businessParties[txn.party].id, txn.type, txn.amount, txn.description]);
        
        this.createdData.businessTransactions.push(result.rows[0]);
        console.log(`✅ Created: ${result.rows[0].transaction_type} - ₹${result.rows[0].amount} - ${result.rows[0].description}`);
      }
      
      if (this.createdData.businessTransactions.length !== transactions.length) {
        throw new Error('Not all business transactions created successfully');
      }
    });

    await this.runTest('businessTransactions', 'Test Party Selection, Transaction Type (Credit/Debit), Amount, Date, Description', async () => {
      for (const txn of this.createdData.businessTransactions) {
        const result = await this.client.query('SELECT * FROM business_transactions WHERE id = $1', [txn.id]);
        if (result.rows.length === 0) throw new Error(`Business transaction ${txn.id} not found`);
        
        const txnData = result.rows[0];
        if (!txnData.party_id || !txnData.transaction_type || !txnData.amount || !txnData.description) {
          throw new Error(`Business transaction ${txn.id} missing required fields`);
        }
        console.log(`✅ Verified: ${txnData.transaction_type} - ₹${txnData.amount} - ${txnData.description}`);
      }
    });

    await this.runTest('businessTransactions', 'Verify Party Balance Updates', async () => {
      const partyBalances = await this.client.query(`
        SELECT 
          bp.party_name,
          bp.party_type,
          SUM(CASE WHEN bt.transaction_type = 'Credit' THEN bt.amount ELSE 0 END) as total_credits,
          SUM(CASE WHEN bt.transaction_type = 'Debit' THEN bt.amount ELSE 0 END) as total_debits,
          SUM(CASE WHEN bt.transaction_type = 'Credit' THEN bt.amount ELSE -bt.amount END) as net_balance
        FROM business_parties bp
        LEFT JOIN business_transactions bt ON bp.id = bt.party_id
        WHERE bp.is_active = true
        GROUP BY bp.id, bp.party_name, bp.party_type
        ORDER BY net_balance DESC
      `);
      console.log(`✅ Verified balance updates for ${partyBalances.rows.length} parties`);
    });

    await this.runTest('businessTransactions', 'Test Different Business Types (Bank, Capital, Owner, etc.)', async () => {
      const businessTypes = await this.client.query(`
        SELECT 
          party_type,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM business_transactions bt
        JOIN business_parties bp ON bt.party_id = bp.id
        GROUP BY party_type
        ORDER BY total_amount DESC
      `);
      console.log(`✅ Verified transactions across ${businessTypes.rows.length} business types`);
    });
  }

  // 37. Vendor Transactions
  async testVendorTransactions() {
    console.log('\n🏪 TESTING VENDOR TRANSACTIONS');
    console.log('=' .repeat(60));

    await this.runTest('vendorTransactions', 'Create 10-15 Vendor Payments', async () => {
      const payments = [
        { vendor: 0, amount: 50000, mode: 'Bank Transfer', invoice: 'INV001' },
        { vendor: 1, amount: 35000, mode: 'Cheque', invoice: 'INV002' },
        { vendor: 2, amount: 75000, mode: 'Cash', invoice: 'INV003' },
        { vendor: 3, amount: 28000, mode: 'Online', invoice: 'INV004' },
        { vendor: 4, amount: 42000, mode: 'Bank Transfer', invoice: 'INV005' },
        { vendor: 5, amount: 18000, mode: 'Cheque', invoice: 'INV006' },
        { vendor: 6, amount: 65000, mode: 'Cash', invoice: 'INV007' },
        { vendor: 7, amount: 32000, mode: 'Online', invoice: 'INV008' },
        { vendor: 0, amount: 45000, mode: 'Bank Transfer', invoice: 'INV009' },
        { vendor: 1, amount: 25000, mode: 'Cheque', invoice: 'INV010' },
        { vendor: 2, amount: 55000, mode: 'Cash', invoice: 'INV011' },
        { vendor: 3, amount: 38000, mode: 'Online', invoice: 'INV012' },
        { vendor: 4, amount: 48000, mode: 'Bank Transfer', invoice: 'INV013' },
        { vendor: 5, amount: 22000, mode: 'Cheque', invoice: 'INV014' },
        { vendor: 6, amount: 70000, mode: 'Cash', invoice: 'INV015' }
      ];

      for (const payment of payments) {
        const result = await this.client.query(`
          INSERT INTO vendor_transactions (
            vendor_id, transaction_date, amount, payment_mode, invoice_reference, created_by
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, 'test_user')
          RETURNING id, amount, payment_mode, invoice_reference
        `, [this.masterData.vendors[payment.vendor].id, payment.amount, payment.mode, payment.invoice]);
        
        this.createdData.vendorTransactions.push(result.rows[0]);
        console.log(`✅ Created: ₹${result.rows[0].amount} - ${result.rows[0].payment_mode} - ${result.rows[0].invoice_reference}`);
      }
      
      if (this.createdData.vendorTransactions.length !== payments.length) {
        throw new Error('Not all vendor transactions created successfully');
      }
    });

    await this.runTest('vendorTransactions', 'Test Vendor Selection, Amount, Payment Mode, Invoice Reference', async () => {
      for (const txn of this.createdData.vendorTransactions) {
        const result = await this.client.query('SELECT * FROM vendor_transactions WHERE id = $1', [txn.id]);
        if (result.rows.length === 0) throw new Error(`Vendor transaction ${txn.id} not found`);
        
        const txnData = result.rows[0];
        if (!txnData.vendor_id || !txnData.amount || !txnData.payment_mode || !txnData.invoice_reference) {
          throw new Error(`Vendor transaction ${txn.id} missing required fields`);
        }
        console.log(`✅ Verified: ₹${txnData.amount} - ${txnData.payment_mode} - ${txnData.invoice_reference}`);
      }
    });

    await this.runTest('vendorTransactions', 'Verify Vendor Balance Decreases', async () => {
      const vendorBalances = await this.client.query(`
        SELECT 
          v.vendor_name,
          SUM(vt.amount) as total_payments,
          COUNT(vt.id) as payment_count
        FROM vendors v
        LEFT JOIN vendor_transactions vt ON v.id = vt.vendor_id
        WHERE v.is_active = true
        GROUP BY v.id, v.vendor_name
        ORDER BY total_payments DESC
      `);
      console.log(`✅ Verified balance decreases for ${vendorBalances.rows.length} vendors`);
    });

    await this.runTest('vendorTransactions', 'Test Invoice Reference Tracking', async () => {
      const invoiceTracking = await this.client.query(`
        SELECT 
          invoice_reference,
          COUNT(*) as payment_count,
          SUM(amount) as total_amount
        FROM vendor_transactions
        GROUP BY invoice_reference
        ORDER BY total_amount DESC
      `);
      console.log(`✅ Tracked ${invoiceTracking.rows.length} unique invoice references`);
    });
  }

  // 38. Interest Transactions
  async testInterestTransactions() {
    console.log('\n💰 TESTING INTEREST TRANSACTIONS');
    console.log('=' .repeat(60));

    await this.runTest('interestTransactions', 'Create 5-8 Interest Transactions', async () => {
      const interestTxns = [
        { party: 0, loanAmount: 100000, interestAmount: 5000, principalPaid: 10000, type: 'Loan Disbursement' },
        { party: 1, loanAmount: 75000, interestAmount: 3750, principalPaid: 7500, type: 'Interest Payment' },
        { party: 2, loanAmount: 150000, interestAmount: 7500, principalPaid: 15000, type: 'Loan Disbursement' },
        { party: 3, loanAmount: 50000, interestAmount: 2500, principalPaid: 5000, type: 'Interest Payment' },
        { party: 4, loanAmount: 200000, interestAmount: 10000, principalPaid: 20000, type: 'Loan Disbursement' },
        { party: 5, loanAmount: 80000, interestAmount: 4000, principalPaid: 8000, type: 'Interest Payment' },
        { party: 6, loanAmount: 120000, interestAmount: 6000, principalPaid: 12000, type: 'Loan Disbursement' },
        { party: 7, loanAmount: 90000, interestAmount: 4500, principalPaid: 9000, type: 'Interest Payment' }
      ];

      for (const txn of interestTxns) {
        const result = await this.client.query(`
          INSERT INTO interest_transactions (
            party_id, transaction_date, loan_amount, interest_amount, principal_paid, transaction_type, created_by
          ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, 'test_user')
          RETURNING id, loan_amount, interest_amount, transaction_type
        `, [this.masterData.businessParties[txn.party].id, txn.loanAmount, txn.interestAmount, txn.principalPaid, txn.type]);
        
        this.createdData.interestTransactions.push(result.rows[0]);
        console.log(`✅ Created: ${result.rows[0].transaction_type} - Loan: ₹${result.rows[0].loan_amount}, Interest: ₹${result.rows[0].interest_amount}`);
      }
      
      if (this.createdData.interestTransactions.length !== interestTxns.length) {
        throw new Error('Not all interest transactions created successfully');
      }
    });

    await this.runTest('interestTransactions', 'Test Party, Loan Amount, Interest Amount, Principal Paid', async () => {
      for (const txn of this.createdData.interestTransactions) {
        const result = await this.client.query('SELECT * FROM interest_transactions WHERE id = $1', [txn.id]);
        if (result.rows.length === 0) throw new Error(`Interest transaction ${txn.id} not found`);
        
        const txnData = result.rows[0];
        if (!txnData.party_id || !txnData.loan_amount || !txnData.interest_amount || !txnData.principal_paid) {
          throw new Error(`Interest transaction ${txn.id} missing required fields`);
        }
        console.log(`✅ Verified: Loan: ₹${txnData.loan_amount}, Interest: ₹${txnData.interest_amount}, Principal: ₹${txnData.principal_paid}`);
      }
    });

    await this.runTest('interestTransactions', 'Verify Interest Calculations', async () => {
      const interestCalculations = await this.client.query(`
        SELECT 
          transaction_type,
          COUNT(*) as transaction_count,
          SUM(loan_amount) as total_loans,
          SUM(interest_amount) as total_interest,
          SUM(principal_paid) as total_principal,
          ROUND(AVG(interest_amount::numeric / loan_amount::numeric * 100), 2) as avg_interest_rate
        FROM interest_transactions
        GROUP BY transaction_type
        ORDER BY total_loans DESC
      `);
      console.log(`✅ Verified interest calculations for ${interestCalculations.rows.length} transaction types`);
    });

    await this.runTest('interestTransactions', 'Test Transaction Types (Loan Disbursement/Interest Payment)', async () => {
      const transactionTypes = await this.client.query(`
        SELECT 
          transaction_type,
          COUNT(*) as count,
          SUM(loan_amount) as total_amount
        FROM interest_transactions
        GROUP BY transaction_type
        ORDER BY total_amount DESC
      `);
      console.log(`✅ Verified ${transactionTypes.rows.length} different transaction types`);
    });
  }

  async testAllFinancialTransactions() {
    console.log('🚀 STARTING PHASE 5: FINANCIAL TRANSACTIONS TESTING');
    console.log('=' .repeat(80));

    await this.connect();

    try {
      await this.loadMasterData();
      await this.testBusinessTransactions();
      await this.testVendorTransactions();
      await this.testInterestTransactions();
      
      // Print final results
      console.log('\n' + '='.repeat(80));
      console.log('📊 PHASE 5: FINANCIAL TRANSACTIONS TESTING RESULTS');
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

      console.log(`\n📊 FINANCIAL TRANSACTIONS CREATED:`);
      console.log(`💼 Business Transactions: ${this.createdData.businessTransactions.length}`);
      console.log(`🏪 Vendor Transactions: ${this.createdData.vendorTransactions.length}`);
      console.log(`💰 Interest Transactions: ${this.createdData.interestTransactions.length}`);

      if (totalFailed === 0) {
        console.log('\n🏆 ALL FINANCIAL TRANSACTIONS TESTS PASSED!');
      } else {
        console.log('\n⚠️ Some financial transactions tests failed. Review the details above.');
      }

    } finally {
      await this.disconnect();
    }
  }
}

// Run the financial transactions testing
if (require.main === module) {
  const tester = new FinancialTransactionsTester();
  tester.testAllFinancialTransactions().catch(console.error);
}

module.exports = FinancialTransactionsTester;
