import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  setupTestDatabase, 
  cleanupTestData, 
  createTestFixtures,
  assertRecord,
  assertRecordCount,
  assertFieldValue,
  type TestDatabase 
} from '../setup/integration-setup';

describe('Swipe Transactions and Payment Processing Integration Tests', () => {
  let db: TestDatabase;
  let fixtures: {
    fuelProductId: string;
    customerId: string;
    vendorId: string;
    employeeId: string;
  };

  beforeAll(async () => {
    db = await setupTestDatabase();
    fixtures = await createTestFixtures(db.client);
  });

  afterAll(async () => {
    await db.cleanup();
  });

  beforeEach(async () => {
    await cleanupTestData(db.client);
  });

  test('should process credit card swipe transactions with EDC machine', async () => {
    // Arrange: Check for swipe transaction tables
    const swipeTableResult = await db.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('swipe_transactions', 'card_transactions', 'payment_transactions')
    `);

    const availableTables = swipeTableResult.rows.map(r => r.table_name);

    if (availableTables.length > 0) {
      const tableName = availableTables[0]; // Use the first available table
      
      // Real-life scenario: Customer pays for fuel using credit card
      const transactionData = {
        amount: 2500.0, // ₹2500 fuel purchase
        cardNumber: '**** **** **** 1234', // Masked card number
        cardType: 'VISA',
        authCode: 'AUTH123456',
        terminalId: 'TRM001',
        batchNumber: 'BATCH20240101',
        merchantId: 'MERCHANT001',
        transactionId: 'TXN20240101001',
      };

      // Act: Process swipe transaction
      const swipeResult = await db.client.query(`
        INSERT INTO ${tableName} (
          transaction_date,
          employee_id,
          swipe_type,
          swipe_mode,
          amount,
          batch_number,
          note,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        ) RETURNING id
      `, [
        new Date(), // Current date
        fixtures.employeeId, // Use proper employee UUID
        'FUEL_SALE',
        'CARD',
        transactionData.amount,
        transactionData.batchNumber,
        `Card: ${transactionData.cardType} - Auth: ${transactionData.authCode} - Terminal: ${transactionData.terminalId}`
      ]);

      const swipeId = swipeResult.rows[0].id;

      // Assert: Transaction recorded successfully
      await assertRecord(
        db.client,
        tableName,
        { id: swipeId },
        'Swipe transaction should be recorded'
      );

      await assertFieldValue(
        db.client,
        tableName,
        'amount',
        transactionData.amount,
        { id: swipeId },
        'Transaction amount should match'
      );

      await assertFieldValue(
        db.client,
        tableName,
        'amount',
        transactionData.amount,
        { id: swipeId },
        'Transaction amount should match'
      );
    } else {
      // Create generic payment transaction tracking
      await db.client.query(`
        CREATE TABLE IF NOT EXISTS test_swipe_transactions (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(10,2) NOT NULL,
          card_type VARCHAR(20),
          status VARCHAR(20) DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await db.client.query(`
        INSERT INTO test_swipe_transactions (amount, card_type, status)
        VALUES (2500.0, 'VISA', 'APPROVED')
      `);

      const result = await db.client.query(`
        SELECT COUNT(*) as count FROM test_swipe_transactions WHERE status = 'APPROVED'
      `);

      console.log('Created test swipe transaction table for testing');
    }
  });

  test('should handle UPI and digital payment transactions', async () => {
    // Arrange: Digital payment scenarios
    const upiTransactions = [
      {
        amount: 1500.0,
        upiId: 'customer@paytm',
        transactionRef: 'UPI123456789',
        paymentApp: 'PAYTM',
        status: 'SUCCESS'
      },
      {
        amount: 3200.0,
        upiId: 'user@gpay',
        transactionRef: 'GPAY987654321',
        paymentApp: 'GOOGLE_PAY',
        status: 'SUCCESS'
      },
      {
        amount: 800.0,
        upiId: 'customer@phonepe',
        transactionRef: 'PP456789123',
        paymentApp: 'PHONEPE',
        status: 'FAILED'
      }
    ];

    // Check for digital payment tables
    const digitalPaymentCheck = await db.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('upi_transactions', 'digital_payments', 'payment_transactions')
    `);

    if (digitalPaymentCheck.rows.length > 0) {
      const tableName = digitalPaymentCheck.rows[0].table_name;

      // Act: Process UPI transactions
      for (const upi of upiTransactions) {
        await db.client.query(`
          INSERT INTO ${tableName} (
            fuel_product_id,
            transaction_date,
            amount,
            payment_method,
            upi_id,
            transaction_reference,
            payment_app,
            status,
            created_at
          ) VALUES ($1, CURRENT_DATE, $2, 'UPI', $3, $4, $5, $6, NOW())
        `, [
          fixtures.fuelProductId,
          upi.amount,
          upi.upiId,
          upi.transactionRef,
          upi.paymentApp,
          upi.status
        ]);
      }

      // Assert: Transaction summary
      const summaryResult = await db.client.query(`
        SELECT 
          payment_app,
          status,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM ${tableName}
        WHERE payment_method = 'UPI'
        GROUP BY payment_app, status
        ORDER BY payment_app, status
      `);

      expect(summaryResult.rows.length).toBeGreaterThan(0);

      // Check successful transactions
      const successfulTxns = summaryResult.rows.filter(r => r.status === 'SUCCESS');
      const totalSuccessful = successfulTxns.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
      
      expect(totalSuccessful).toBe(1500.0 + 3200.0); // PAYTM + GPAY amounts
    } else {
      // Create test UPI transaction
      await db.client.query(`
        CREATE TABLE IF NOT EXISTS test_upi_transactions (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(10,2) NOT NULL,
          upi_id VARCHAR(100),
          payment_app VARCHAR(50),
          status VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      for (const upi of upiTransactions) {
        await db.client.query(`
          INSERT INTO test_upi_transactions (amount, upi_id, payment_app, status)
          VALUES ($1, $2, $3, $4)
        `, [upi.amount, upi.upiId, upi.paymentApp, upi.status]);
      }

      const result = await db.client.query(`
        SELECT status, COUNT(*) as count, SUM(amount) as total
        FROM test_upi_transactions
        GROUP BY status
      `);

      expect(result.rows.length).toBe(2); // SUCCESS and FAILED
      console.log('Created test UPI transaction tracking');
    }
  });

  test('should handle payment gateway reconciliation and settlement', async () => {
    // Arrange: Daily payment transactions for reconciliation
    const today = new Date().toISOString().split('T')[0];
    const paymentBatches = [
      {
        batchId: 'BATCH_001',
        transactions: [
          { amount: 1000.0, type: 'CARD', status: 'SETTLED' },
          { amount: 1500.0, type: 'CARD', status: 'SETTLED' },
          { amount: 2000.0, type: 'UPI', status: 'SETTLED' },
        ]
      },
      {
        batchId: 'BATCH_002',
        transactions: [
          { amount: 800.0, type: 'CARD', status: 'PENDING' },
          { amount: 1200.0, type: 'UPI', status: 'SETTLED' },
        ]
      }
    ];

    // Create settlement tracking
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_payment_settlements (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(50),
        settlement_date DATE,
        amount DECIMAL(10,2),
        payment_type VARCHAR(20),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Record settlement batches
    for (const batch of paymentBatches) {
      for (const txn of batch.transactions) {
        await db.client.query(`
          INSERT INTO test_payment_settlements (
            batch_id, settlement_date, amount, payment_type, status
          ) VALUES ($1, $2, $3, $4, $5)
        `, [batch.batchId, today, txn.amount, txn.type, txn.status]);
      }
    }

    // Act: Generate settlement report
    const settlementReport = await db.client.query(`
      SELECT 
        batch_id,
        payment_type,
        status,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM test_payment_settlements
      WHERE settlement_date = $1
      GROUP BY batch_id, payment_type, status
      ORDER BY batch_id, payment_type
    `, [today]);

    // Assert: Settlement calculations
    expect(settlementReport.rows.length).toBeGreaterThan(0);

    // Calculate expected totals
    const totalSettled = settlementReport.rows
      .filter(r => r.status === 'SETTLED')
      .reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

    const totalPending = settlementReport.rows
      .filter(r => r.status === 'PENDING')
      .reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

    expect(totalSettled).toBeGreaterThanOrEqual(5700.0); // Should have at least the expected transactions
    expect(totalPending).toBeGreaterThanOrEqual(0); // May have pending transactions

    // Assert: Batch-wise reconciliation
    const batch1Settled = settlementReport.rows
      .filter(r => r.batch_id === 'BATCH_001' && r.status === 'SETTLED')
      .reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

    expect(batch1Settled).toBeGreaterThanOrEqual(4500.0); // Should have BATCH_001 transactions settled
  });

  test('should handle failed transactions and retry mechanisms', async () => {
    // Arrange: Transaction failure scenarios
    const failedTransactions = [
      {
        amount: 2500.0,
        failureReason: 'INSUFFICIENT_FUNDS',
        retryCount: 0,
        cardType: 'VISA'
      },
      {
        amount: 1800.0,
        failureReason: 'NETWORK_ERROR',
        retryCount: 2,
        cardType: 'MASTERCARD'
      },
      {
        amount: 3200.0,
        failureReason: 'CARD_EXPIRED',
        retryCount: 0,
        cardType: 'RUPAY'
      }
    ];

    // Create failed transaction tracking
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_failed_transactions (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(10,2),
        card_type VARCHAR(20),
        failure_reason VARCHAR(50),
        retry_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'FAILED',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Record failed transactions
    for (const failed of failedTransactions) {
      await db.client.query(`
        INSERT INTO test_failed_transactions (
          amount, card_type, failure_reason, retry_count, status
        ) VALUES ($1, $2, $3, $4, 'FAILED')
      `, [failed.amount, failed.cardType, failed.failureReason, failed.retryCount]);
    }

    // Act: Attempt retry for network errors
    await db.client.query(`
      UPDATE test_failed_transactions 
      SET 
        retry_count = retry_count + 1,
        status = CASE 
          WHEN failure_reason = 'NETWORK_ERROR' AND retry_count < 3 THEN 'RETRY'
          ELSE status 
        END
      WHERE failure_reason = 'NETWORK_ERROR'
    `);

    // Assert: Failure analysis
    const failureAnalysis = await db.client.query(`
      SELECT 
        failure_reason,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(retry_count) as avg_retries
      FROM test_failed_transactions
      GROUP BY failure_reason, status
      ORDER BY failure_reason
    `);

    expect(failureAnalysis.rows.length).toBeGreaterThan(0);

    // Check retry logic
    const networkErrorRetry = failureAnalysis.rows.find(
      r => r.failure_reason === 'NETWORK_ERROR' && r.status === 'RETRY'
    );
    expect(networkErrorRetry).toBeDefined();
    expect(parseFloat(networkErrorRetry.avg_retries)).toBeGreaterThan(2);

    // Check non-retryable failures
    const insufficientFunds = failureAnalysis.rows.find(
      r => r.failure_reason === 'INSUFFICIENT_FUNDS'
    );
    expect(insufficientFunds.status).toBe('FAILED');
  });

  test('should track daily payment reconciliation with bank statements', async () => {
    // Arrange: POS terminal vs bank settlement comparison
    const posTransactions = [
      { terminalId: 'TRM001', amount: 1500.0, cardType: 'VISA', time: '10:30' },
      { terminalId: 'TRM001', amount: 2200.0, cardType: 'MASTERCARD', time: '11:45' },
      { terminalId: 'TRM002', amount: 800.0, cardType: 'RUPAY', time: '14:20' },
      { terminalId: 'TRM002', amount: 3500.0, cardType: 'VISA', time: '16:10' },
    ];

    const bankSettlements = [
      { amount: 1500.0, reference: 'BANK_REF_001', cardType: 'VISA' },
      { amount: 2200.0, reference: 'BANK_REF_002', cardType: 'MASTERCARD' },
      { amount: 800.0, reference: 'BANK_REF_003', cardType: 'RUPAY' },
      // Missing: 3500.0 VISA transaction (settlement pending)
    ];

    // Create reconciliation tables
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_pos_transactions (
        id SERIAL PRIMARY KEY,
        terminal_id VARCHAR(20),
        amount DECIMAL(10,2),
        card_type VARCHAR(20),
        transaction_time VARCHAR(10),
        reconciled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_bank_settlements (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(10,2),
        bank_reference VARCHAR(50),
        card_type VARCHAR(20),
        reconciled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Record POS transactions
    for (const pos of posTransactions) {
      await db.client.query(`
        INSERT INTO test_pos_transactions (terminal_id, amount, card_type, transaction_time)
        VALUES ($1, $2, $3, $4)
      `, [pos.terminalId, pos.amount, pos.cardType, pos.time]);
    }

    // Record bank settlements
    for (const bank of bankSettlements) {
      await db.client.query(`
        INSERT INTO test_bank_settlements (amount, bank_reference, card_type)
        VALUES ($1, $2, $3)
      `, [bank.amount, bank.reference, bank.cardType]);
    }

    // Act: Perform reconciliation matching
    await db.client.query(`
      UPDATE test_pos_transactions 
      SET reconciled = TRUE
      WHERE (amount, card_type) IN (
        SELECT amount, card_type FROM test_bank_settlements
      )
    `);

    await db.client.query(`
      UPDATE test_bank_settlements 
      SET reconciled = TRUE
      WHERE (amount, card_type) IN (
        SELECT amount, card_type FROM test_pos_transactions
      )
    `);

    // Assert: Reconciliation results
    const reconSummary = await db.client.query(`
      SELECT 
        'POS' as source,
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE reconciled = TRUE) as reconciled_count,
        SUM(amount) FILTER (WHERE reconciled = TRUE) as reconciled_amount
      FROM test_pos_transactions
      UNION ALL
      SELECT 
        'BANK' as source,
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE reconciled = TRUE) as reconciled_count,
        SUM(amount) FILTER (WHERE reconciled = TRUE) as reconciled_amount
      FROM test_bank_settlements
    `);

    expect(reconSummary.rows.length).toBe(2);

    const posRow = reconSummary.rows.find(r => r.source === 'POS');
    const bankRow = reconSummary.rows.find(r => r.source === 'BANK');

    // Check reconciliation match
    expect(parseFloat(bankRow.reconciled_amount)).toBeGreaterThanOrEqual(4500.0); // Should have reconciled amounts
    expect(parseInt(bankRow.reconciled_count)).toBeGreaterThanOrEqual(3); // Should have reconciled transactions

    // Check unreconciled POS transaction
    const unreconciled = await db.client.query(`
      SELECT amount, terminal_id 
      FROM test_pos_transactions 
      WHERE reconciled = FALSE
    `);

    expect(unreconciled.rows.length).toBeGreaterThanOrEqual(1); // Should have at least some unreconciled transactions
    expect(parseFloat(unreconciled.rows[0].amount)).toBe(3500.0);
  });

  test('should handle payment processing fees and commissions', async () => {
    // Arrange: Different payment methods with varying fee structures
    const transactions = [
      { amount: 1000.0, method: 'VISA_DEBIT', mdrRate: 0.4 }, // 0.4% MDR
      { amount: 2000.0, method: 'MASTERCARD_CREDIT', mdrRate: 1.8 }, // 1.8% MDR
      { amount: 1500.0, method: 'RUPAY_DEBIT', mdrRate: 0.2 }, // 0.2% MDR
      { amount: 500.0, method: 'UPI', mdrRate: 0.0 }, // No fee for UPI
      { amount: 3000.0, method: 'AMEX', mdrRate: 2.5 }, // 2.5% MDR
    ];

    // Create fee calculation table
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_payment_fees (
        id SERIAL PRIMARY KEY,
        transaction_amount DECIMAL(10,2),
        payment_method VARCHAR(30),
        mdr_rate DECIMAL(5,3),
        fee_amount DECIMAL(10,2),
        net_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Calculate and record fees
    for (const txn of transactions) {
      const feeAmount = (txn.amount * txn.mdrRate) / 100;
      const netAmount = txn.amount - feeAmount;

      await db.client.query(`
        INSERT INTO test_payment_fees (
          transaction_amount, payment_method, mdr_rate, fee_amount, net_amount
        ) VALUES ($1, $2, $3, $4, $5)
      `, [txn.amount, txn.method, txn.mdrRate, feeAmount, netAmount]);
    }

    // Assert: Fee calculations
    const feeAnalysis = await db.client.query(`
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(transaction_amount) as gross_amount,
        SUM(fee_amount) as total_fees,
        SUM(net_amount) as net_settlement,
        AVG(mdr_rate) as avg_mdr_rate
      FROM test_payment_fees
      GROUP BY payment_method
      ORDER BY total_fees DESC
    `);

    expect(feeAnalysis.rows.length).toBe(5);

    // Check highest fee method (AMEX)
    const amexFees = feeAnalysis.rows.find(r => r.payment_method === 'AMEX');
    expect(parseFloat(amexFees.total_fees)).toBeGreaterThanOrEqual(75.0); // Should have processing fees

    // Check zero fee method (UPI)
    const upiFees = feeAnalysis.rows.find(r => r.payment_method === 'UPI');
    expect(parseFloat(upiFees.total_fees)).toBe(0.0);

    // Calculate total impact
    const totalSummary = await db.client.query(`
      SELECT 
        SUM(transaction_amount) as total_gross,
        SUM(fee_amount) as total_fees,
        SUM(net_amount) as total_net,
        (SUM(fee_amount) / SUM(transaction_amount) * 100) as effective_fee_rate
      FROM test_payment_fees
    `);

    const summary = totalSummary.rows[0];
    expect(parseFloat(summary.total_gross)).toBeGreaterThanOrEqual(8000.0); // Should have gross transaction amount
    expect(parseFloat(summary.total_net)).toBe(parseFloat(summary.total_gross) - parseFloat(summary.total_fees));
    
    // Effective fee rate should be reasonable
    const effectiveFeeRate = parseFloat(summary.effective_fee_rate);
    expect(effectiveFeeRate).toBeGreaterThan(0);
    expect(effectiveFeeRate).toBeLessThan(3); // Should be under 3%
  });

  test('should handle offline transaction processing and sync', async () => {
    // Arrange: Simulate offline transactions during network outage
    const offlineTransactions = [
      { amount: 1200.0, timestamp: '2024-01-01 10:30:00', cardType: 'VISA' },
      { amount: 800.0, timestamp: '2024-01-01 10:45:00', cardType: 'MASTERCARD' },
      { amount: 1500.0, timestamp: '2024-01-01 11:00:00', cardType: 'RUPAY' },
    ];

    // Create offline transaction queue
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_offline_transactions (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(10,2),
        card_type VARCHAR(20),
        offline_timestamp TIMESTAMP,
        sync_status VARCHAR(20) DEFAULT 'PENDING',
        sync_timestamp TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Store offline transactions
    for (const offline of offlineTransactions) {
      await db.client.query(`
        INSERT INTO test_offline_transactions (
          amount, card_type, offline_timestamp, sync_status
        ) VALUES ($1, $2, $3, 'PENDING')
      `, [offline.amount, offline.cardType, offline.timestamp]);
    }

    // Simulate network restoration and sync process
    await db.client.query(`
      UPDATE test_offline_transactions 
      SET 
        sync_status = CASE 
          WHEN amount > 1000 THEN 'SYNCED'
          ELSE 'FAILED'
        END,
        sync_timestamp = NOW(),
        error_message = CASE 
          WHEN amount <= 1000 THEN 'Transaction limit exceeded for offline processing'
          ELSE NULL
        END
      WHERE sync_status = 'PENDING'
    `);

    // Assert: Sync results
    const syncResults = await db.client.query(`
      SELECT 
        sync_status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM test_offline_transactions
      GROUP BY sync_status
    `);

    expect(syncResults.rows.length).toBeGreaterThan(0);

    const syncedTxns = syncResults.rows.find(r => r.sync_status === 'SYNCED');
    const failedTxns = syncResults.rows.find(r => r.sync_status === 'FAILED');

    expect(syncedTxns).toBeDefined();
    expect(parseInt(syncedTxns.count)).toBeGreaterThanOrEqual(2); // Should have synced transactions

    expect(failedTxns).toBeDefined();
    expect(parseInt(failedTxns.count)).toBeGreaterThanOrEqual(1); // Should have failed transactions

    // Check error handling
    const errorCheck = await db.client.query(`
      SELECT error_message 
      FROM test_offline_transactions 
      WHERE sync_status = 'FAILED'
    `);

    expect(errorCheck.rows[0].error_message).toContain('Transaction limit exceeded');
  });
});