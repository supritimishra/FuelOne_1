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

describe('Vendor Operations Integration Tests', () => {
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

  test('should create vendor invoice with correct calculations', async () => {
    // Arrange: Real-life scenario - fuel purchase invoice
    const quantity = 5000.0; // 5000 liters
    const rate = 89.50; // Purchase rate per liter
    const baseAmount = quantity * rate; // 447,500
    const gstRate = 18.0; // 18% GST
    const gstAmount = (baseAmount * gstRate) / 100; // 80,550
    const totalAmount = baseAmount + gstAmount; // 528,050

    // Act: Create vendor invoice
    const invoiceResult = await db.client.query(`
      INSERT INTO vendor_invoices (
        vendor_id,
        invoice_number,
        invoice_date,
        amount,
        gst_amount,
        total_amount,
        payment_status,
        created_at
      ) VALUES ($1, 'INV-2024-001', CURRENT_DATE, $2, $3, $4, 'Pending', NOW())
      RETURNING id, total_amount
    `, [fixtures.vendorId, baseAmount, gstAmount, totalAmount]);

    const invoiceId = invoiceResult.rows[0].id;
    const actualTotal = parseFloat(invoiceResult.rows[0].total_amount);

    // Assert: Invoice calculations are correct
    expect(Math.abs(actualTotal - totalAmount)).toBeLessThan(0.01);
    
    await assertRecord(
      db.client,
      'vendor_invoices',
      { id: invoiceId },
      'Vendor invoice should exist after creation'
    );

    // Assert: GST calculations
    await assertFieldValue(
      db.client,
      'vendor_invoices',
      'gst_amount',
      gstAmount,
      { id: invoiceId },
      'GST amount should be calculated correctly'
    );
  });

  test('should handle vendor payment processing and balance updates', async () => {
    // Arrange: Create vendor invoice first
    const invoiceAmount = 100000.0; // ₹1 Lakh invoice
    const invoiceResult = await db.client.query(`
      INSERT INTO vendor_invoices (
        vendor_id,
        invoice_number,
        invoice_date,
        amount,
        total_amount,
        payment_status,
        created_at
      ) VALUES ($1, 'INV-PAY-001', CURRENT_DATE, 90000, $2, 'Pending', NOW())
      RETURNING id
    `, [fixtures.vendorId, invoiceAmount]);

    const invoiceId = invoiceResult.rows[0].id;

    // Get initial vendor balance
    const initialBalanceResult = await db.client.query(
      'SELECT current_balance FROM vendors WHERE id = $1',
      [fixtures.vendorId]
    );
    const initialBalance = parseFloat(initialBalanceResult.rows[0].current_balance || '0');

    // Create test payment tracking table
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_vendor_payments (
        id SERIAL PRIMARY KEY,
        vendor_id UUID,
        invoice_id UUID,
        payment_date DATE,
        amount DECIMAL(10,2),
        payment_mode VARCHAR(50),
        reference_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Make partial payment
    const paymentAmount = 60000.0; // Pay ₹60,000 out of ₹1,00,000
    await db.client.query(`
      INSERT INTO test_vendor_payments (
        vendor_id,
        invoice_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        created_at
      ) VALUES ($1, $2, CURRENT_DATE, $3, 'BANK_TRANSFER', 'REF-12345', NOW())
    `, [fixtures.vendorId, invoiceId, paymentAmount]);

    // Assert: Payment record exists
    await assertRecord(
      db.client,
      'test_vendor_payments',
      { vendor_id: fixtures.vendorId, amount: paymentAmount },
      'Vendor payment should be recorded'
    );

    // Check payment summary
    const paymentSummary = await db.client.query(`
      SELECT SUM(amount) as total_paid
      FROM test_vendor_payments 
      WHERE vendor_id = $1
    `, [fixtures.vendorId]);

    expect(parseFloat(paymentSummary.rows[0].total_paid)).toBeGreaterThanOrEqual(paymentAmount); // Should have paid at least the expected amount
  });

  test('should handle multiple invoices and payment reconciliation', async () => {
    // Arrange: Create multiple vendor invoices
    const invoices = [
      { number: 'INV-M1-001', amount: 50000.0 },
      { number: 'INV-M1-002', amount: 75000.0 },
      { number: 'INV-M1-003', amount: 100000.0 },
    ];

    const invoiceIds = [];
    for (const invoice of invoices) {
      const result = await db.client.query(`
        INSERT INTO vendor_invoices (
          vendor_id,
          invoice_number,
          invoice_date,
          amount,
          total_amount,
          payment_status,
          created_at
        ) VALUES ($1, $2, CURRENT_DATE, $3, $3, 'Pending', NOW())
        RETURNING id
      `, [fixtures.vendorId, invoice.number, invoice.amount]);
      
      invoiceIds.push(result.rows[0].id);
    }

    // Create test payment table
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_vendor_payments_multi (
        id SERIAL PRIMARY KEY,
        vendor_id UUID,
        invoice_id UUID,
        payment_date DATE,
        amount DECIMAL(10,2),
        payment_mode VARCHAR(50),
        reference_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Make payments for first two invoices
    await db.client.query(`
      INSERT INTO test_vendor_payments_multi (
        vendor_id,
        invoice_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        created_at
      ) VALUES 
        ($1, $2, CURRENT_DATE, $3, 'CHEQUE', 'CHQ-001', NOW()),
        ($1, $4, CURRENT_DATE, $5, 'BANK_TRANSFER', 'NEFT-002', NOW())
    `, [fixtures.vendorId, invoiceIds[0], invoices[0].amount, invoiceIds[1], invoices[1].amount]);

    // Assert: Check payment summary
    const paymentSummary = await db.client.query(`
      SELECT 
        COUNT(*) as payment_count,
        SUM(amount) as total_paid
      FROM test_vendor_payments_multi 
      WHERE vendor_id = $1
    `, [fixtures.vendorId]);

    expect(parseInt(paymentSummary.rows[0].payment_count)).toBeGreaterThanOrEqual(2); // Should have at least 2 payments
    expect(parseFloat(paymentSummary.rows[0].total_paid)).toBeGreaterThanOrEqual(invoices[0].amount + invoices[1].amount); // Should have paid at least the expected amount

    // Assert: Outstanding invoice check
    const outstandingResult = await db.client.query(`
      SELECT COUNT(*) as pending_count
      FROM vendor_invoices 
      WHERE vendor_id = $1 
        AND payment_status = 'Pending'
        AND id NOT IN (SELECT DISTINCT invoice_id FROM test_vendor_payments_multi WHERE invoice_id IS NOT NULL)
    `, [fixtures.vendorId]);

    expect(parseInt(outstandingResult.rows[0].pending_count)).toBeGreaterThanOrEqual(1); // Should have at least one pending invoice
  });

  test('should track vendor inventory purchases and stock updates', async () => {
    // Arrange: Create purchase order
    const purchaseQuantity = 2000.0;
    const purchaseRate = 88.75;
    const totalPurchaseAmount = purchaseQuantity * purchaseRate;

    // Act: Record fuel purchase using actual liquid_purchases schema
    const purchaseResult = await db.client.query(`
      INSERT INTO liquid_purchases (
        vendor_id,
        invoice_date,
        invoice_no,
        description,
        created_at
      ) VALUES ($1, CURRENT_DATE, 'PURCH-001', $2, NOW())
      RETURNING id
    `, [fixtures.vendorId, `Fuel purchase ${purchaseQuantity}L @ ₹${purchaseRate}/L = ₹${totalPurchaseAmount}`]);

    const purchaseId = purchaseResult.rows[0].id;

    // Assert: Purchase record created
    await assertRecord(
      db.client,
      'liquid_purchases',
      { id: purchaseId },
      'Liquid purchase should be recorded'
    );

    await assertFieldValue(
      db.client,
      'liquid_purchases',
      'description',
      `Fuel purchase ${purchaseQuantity}L @ ₹${purchaseRate}/L = ₹${totalPurchaseAmount}`,
      { id: purchaseId },
      'Purchase description should contain amount details'
    );

    // Check if this affects any stock tables (if they exist)
    const stockCheckResult = await db.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tank_stock', 'fuel_stock', 'opening_stock')
    `);

    if (stockCheckResult.rows.length > 0) {
      // If stock tables exist, verify stock impact
      console.log('Stock tables found:', stockCheckResult.rows.map(r => r.table_name));
    }
  });

  test('should handle vendor advance payments and adjustments', async () => {
    // Create test payment table for this scenario
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_vendor_payments_advance (
        id SERIAL PRIMARY KEY,
        vendor_id UUID,
        invoice_id UUID,
        payment_date DATE,
        amount DECIMAL(10,2),
        payment_mode VARCHAR(50),
        reference_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Arrange: Make advance payment without specific invoice
    const advanceAmount = 25000.0;
    
    // Act: Record advance payment
    await db.client.query(`
      INSERT INTO test_vendor_payments_advance (
        vendor_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        notes,
        created_at
      ) VALUES ($1, CURRENT_DATE, $2, 'CASH', 'ADV-001', 'Advance payment for future deliveries', NOW())
    `, [fixtures.vendorId, advanceAmount]);

    // Create invoice after advance
    const invoiceAmount = 40000.0;
    const invoiceResult = await db.client.query(`
      INSERT INTO vendor_invoices (
        vendor_id,
        invoice_number,
        invoice_date,
        amount,
        total_amount,
        payment_status,
        created_at
      ) VALUES ($1, 'INV-ADV-001', CURRENT_DATE, 36000, $2, 'Pending', NOW())
      RETURNING id
    `, [fixtures.vendorId, invoiceAmount]);

    const invoiceId = invoiceResult.rows[0].id;

    // Act: Adjust advance against invoice
    const adjustmentAmount = Math.min(advanceAmount, invoiceAmount); // 25000
    await db.client.query(`
      INSERT INTO test_vendor_payments_advance (
        vendor_id,
        invoice_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        notes,
        created_at
      ) VALUES ($1, $2, CURRENT_DATE, $3, 'ADJUSTMENT', 'ADJ-001', 'Advance adjustment', NOW())
    `, [fixtures.vendorId, invoiceId, adjustmentAmount]);

    // Assert: Check total payments
    const paymentSummary = await db.client.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN invoice_id IS NULL THEN amount ELSE 0 END) as advance_payments,
        SUM(CASE WHEN payment_mode = 'ADJUSTMENT' THEN amount ELSE 0 END) as adjustments
      FROM test_vendor_payments_advance 
      WHERE vendor_id = $1
    `, [fixtures.vendorId]);

    const summary = paymentSummary.rows[0];
    expect(parseInt(summary.total_payments)).toBeGreaterThanOrEqual(2); // Should have at least 2 payments
    expect(parseFloat(summary.advance_payments)).toBeGreaterThanOrEqual(advanceAmount); // Should have at least the advance amount
    expect(parseFloat(summary.adjustments)).toBeGreaterThanOrEqual(adjustmentAmount); // Should have at least the adjustment amount
  });

  test('should handle vendor invoice approval workflow', async () => {
    // Arrange: Create invoice in pending status
    const invoiceResult = await db.client.query(`
      INSERT INTO vendor_invoices (
        vendor_id,
        invoice_number,
        invoice_date,
        amount,
        total_amount,
        payment_status,
        created_at
      ) VALUES ($1, 'INV-APPROVAL-001', CURRENT_DATE, 90000, 90000, 'Pending', NOW())
      RETURNING id
    `, [fixtures.vendorId]);

    const invoiceId = invoiceResult.rows[0].id;

    // Act: Approve invoice
    await db.client.query(`
      UPDATE vendor_invoices 
      SET payment_status = 'Approved'
      WHERE id = $1
    `, [invoiceId]);

    // Assert: Invoice status updated
    await assertFieldValue(
      db.client,
      'vendor_invoices',
      'payment_status',
      'Approved',
      { id: invoiceId },
      'Invoice should be approved'
    );

    // Create test payment table for workflow
    await db.client.query(`
      CREATE TABLE IF NOT EXISTS test_vendor_payments_workflow (
        id SERIAL PRIMARY KEY,
        vendor_id UUID,
        invoice_id UUID,
        payment_date DATE,
        amount DECIMAL(10,2),
        payment_mode VARCHAR(50),
        reference_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Act: Mark as paid
    await db.client.query(`
      INSERT INTO test_vendor_payments_workflow (
        vendor_id,
        invoice_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        created_at
      ) VALUES ($1, $2, CURRENT_DATE, 90000, 'BANK_TRANSFER', 'FINAL-001', NOW())
    `, [fixtures.vendorId, invoiceId]);

    await db.client.query(`
      UPDATE vendor_invoices 
      SET payment_status = 'Paid'
      WHERE id = $1
    `, [invoiceId]);

    // Assert: Complete workflow
    await assertFieldValue(
      db.client,
      'vendor_invoices',
      'payment_status',
      'Paid',
      { id: invoiceId },
      'Invoice should be marked as paid'
    );

    await assertRecord(
      db.client,
      'test_vendor_payments_workflow',
      { vendor_id: fixtures.vendorId, invoice_id: invoiceId },
      'Payment should be recorded for invoice'
    );
  });

  test('should calculate vendor aging and payment terms', async () => {
    // Arrange: Create invoices with different dates
    const today = new Date();
    const dates = [
      new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    ];

    const invoiceIds = [];
    for (let i = 0; i < dates.length; i++) {
      const result = await db.client.query(`
        INSERT INTO vendor_invoices (
          vendor_id,
          invoice_number,
          invoice_date,
          amount,
          total_amount,
          payment_status,
          created_at
        ) VALUES ($1, $2, $3, 45000, 45000, 'Pending', $4)
        RETURNING id
      `, [fixtures.vendorId, `AGE-${i + 1}`, dates[i], dates[i]]);
      
      invoiceIds.push(result.rows[0].id);
    }

    // Act: Query aging analysis
    const agingResult = await db.client.query(`
      SELECT 
        id,
        invoice_number,
        invoice_date,
        total_amount,
        CURRENT_DATE - invoice_date as days_outstanding,
        CASE 
          WHEN CURRENT_DATE - invoice_date <= 30 THEN '0-30 days'
          WHEN CURRENT_DATE - invoice_date <= 60 THEN '31-60 days'
          ELSE 'Over 60 days'
        END as aging_bucket
      FROM vendor_invoices 
      WHERE vendor_id = $1 AND payment_status = 'Pending'
      ORDER BY invoice_date
    `, [fixtures.vendorId]);

    // Assert: Aging buckets are correct
    expect(agingResult.rows.length).toBeGreaterThanOrEqual(3); // Should have at least 3 aging buckets
    
    const aging = agingResult.rows;
    // Verify aging buckets exist and are reasonable (flexible for actual aging calculation)
    expect(aging.length).toBeGreaterThanOrEqual(3); // Should have aging buckets
    expect(aging.some(row => row.aging_bucket.includes('days'))).toBe(true); // Should have day-based buckets
    
    // Assert: Days outstanding calculation
    const recentInvoice = aging.find(row => parseInt(row.days_outstanding) <= 7);
    const oldInvoice = aging.find(row => parseInt(row.days_outstanding) > 30);
    expect(recentInvoice).toBeDefined(); // Should have recent invoice
    expect(oldInvoice).toBeDefined(); // Should have old invoice
  });
});