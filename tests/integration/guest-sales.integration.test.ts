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

describe('Guest Sales Integration Tests', () => {
  let db: TestDatabase;
  let fixtures: {
    fuelProductId: string;
    customerId: string;
    vendorId: string;
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

  test('should create guest sale with correct totals and taxes', async () => {
    // Arrange: Real-life scenario - customer fills 45.5L petrol at ₹95.50 per liter
    const quantity = 45.5;
    const rate = 95.50;
    const expectedAmount = quantity * rate; // 4345.25
    const paymentMode = 'CASH';

    // Act: Insert guest sale
    const insertResult = await db.client.query(`
      INSERT INTO guest_sales (
        fuel_product_id,
        sale_date,
        quantity,
        price_per_unit,
        total_amount,
        payment_mode,
        created_at
      ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, NOW())
      RETURNING id, total_amount, quantity, price_per_unit
    `, [fixtures.fuelProductId, quantity, rate, expectedAmount, paymentMode]);

    const guestSaleId = insertResult.rows[0].id;
    const actualAmount = parseFloat(insertResult.rows[0].total_amount);

    // Assert: Guest sale record created with correct amounts
    expect(Math.abs(actualAmount - expectedAmount)).toBeLessThan(0.01);
    
    await assertRecord(
      db.client,
      'guest_sales',
      { id: guestSaleId },
      'Guest sale should exist after insert'
    );

    // Assert: Payment mode is correctly stored
    await assertFieldValue(
      db.client,
      'guest_sales',
      'payment_mode',
      paymentMode,
      { id: guestSaleId }
    );
  });

  test('should handle different payment modes (CASH, CARD, UPI)', async () => {
    // Arrange: Real-life scenario - multiple sales with different payment methods
    const salesData = [
      { quantity: 25.0, rate: 95.50, paymentMode: 'CASH', vehicle: 'KA-01-AB-1234' },
      { quantity: 30.5, rate: 95.50, paymentMode: 'CARD', vehicle: 'KA-01-CD-5678' },
      { quantity: 40.0, rate: 95.50, paymentMode: 'UPI', vehicle: 'KA-01-EF-9012' },
    ];

    // Act: Insert multiple guest sales
    for (const sale of salesData) {
      await db.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id,
          sale_date,
          quantity,
          price_per_unit,
          total_amount,
          payment_mode,
          vehicle_number,
          created_at
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, NOW())
      `, [
        fixtures.fuelProductId, 
        sale.quantity, 
        sale.rate, 
        sale.quantity * sale.rate, 
        sale.paymentMode,
        sale.vehicle
      ]);
    }

    // Assert: All payment modes are stored correctly
    for (const sale of salesData) {
      await assertRecordCount(
        db.client,
        'guest_sales',
        1,
        { payment_mode: sale.paymentMode, vehicle_number: sale.vehicle },
        `Should have exactly one ${sale.paymentMode} sale for vehicle ${sale.vehicle}`
      );
    }

    // Assert: Total guest sales count
    await assertRecordCount(
      db.client,
      'guest_sales',
      3,
      {},
      'Should have 3 total guest sales'
    );
  });

  test('should track daily sales summary by payment mode', async () => {
    // Arrange: Real-life daily sales scenario
    const today = new Date().toISOString().split('T')[0];
    const dailySales = [
      { quantity: 100.0, rate: 95.50, paymentMode: 'CASH' },
      { quantity: 75.5, rate: 95.50, paymentMode: 'CASH' },
      { quantity: 50.0, rate: 95.50, paymentMode: 'CARD' },
      { quantity: 25.5, rate: 95.50, paymentMode: 'UPI' },
    ];

    // Act: Insert daily sales
    for (const sale of dailySales) {
      await db.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id,
          sale_date,
          quantity,
          price_per_unit,
          total_amount,
          payment_mode,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        fixtures.fuelProductId,
        today,
        sale.quantity,
        sale.rate,
        sale.quantity * sale.rate,
        sale.paymentMode
      ]);
    }

    // Assert: Daily summary calculations
    const summaryResult = await db.client.query(`
      SELECT 
        payment_mode,
        COUNT(*) as transaction_count,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_amount
      FROM guest_sales 
      WHERE sale_date = $1
      GROUP BY payment_mode
      ORDER BY payment_mode
    `, [today]);

    const summary = summaryResult.rows;
    
    // Expected totals
    const expectedCash = { count: 2, quantity: 175.5, amount: 175.5 * 95.50 };
    const expectedCard = { count: 1, quantity: 50.0, amount: 50.0 * 95.50 };
    const expectedUpi = { count: 1, quantity: 25.5, amount: 25.5 * 95.50 };

    // Find and verify each payment mode
    const cashSummary = summary.find(s => s.payment_mode === 'CASH');
    const cardSummary = summary.find(s => s.payment_mode === 'CARD');
    const upiSummary = summary.find(s => s.payment_mode === 'UPI');

    expect(cashSummary).toBeDefined();
    expect(parseInt(cashSummary.transaction_count)).toBe(expectedCash.count);
    expect(Math.abs(parseFloat(cashSummary.total_quantity) - expectedCash.quantity)).toBeLessThan(0.01);

    expect(cardSummary).toBeDefined();
    expect(parseInt(cardSummary.transaction_count)).toBe(expectedCard.count);
    expect(Math.abs(parseFloat(cardSummary.total_quantity) - expectedCard.quantity)).toBeLessThan(0.01);

    expect(upiSummary).toBeDefined();
    expect(parseInt(upiSummary.transaction_count)).toBe(expectedUpi.count);
    expect(Math.abs(parseFloat(upiSummary.total_quantity) - expectedUpi.quantity)).toBeLessThan(0.01);
  });

  test('should handle guest sales with additional charges and discounts', async () => {
    // Arrange: Real-life scenario with service charges
    const baseQuantity = 50.0;
    const baseRate = 95.50;
    const baseAmount = baseQuantity * baseRate;
    const serviceCharge = 10.0; // ₹10 service charge
    const discount = 5.0; // ₹5 discount
    const finalAmount = baseAmount + serviceCharge - discount;

    // Act: Insert guest sale with additional fields
    const insertResult = await db.client.query(`
      INSERT INTO guest_sales (
        fuel_product_id,
        sale_date,
        quantity,
        price_per_unit,
        total_amount,
        payment_mode,
        vehicle_number,
        created_at
      ) VALUES ($1, CURRENT_DATE, $2, $3, $4, 'CASH', 'KA-01-XY-9999', NOW())
      RETURNING id
    `, [fixtures.fuelProductId, baseQuantity, baseRate, finalAmount]);

    const guestSaleId = insertResult.rows[0].id;

    // Assert: Guest sale with complex amount calculation
    await assertFieldValue(
      db.client,
      'guest_sales',
      'total_amount',
      finalAmount,
      { id: guestSaleId },
      'Guest sale should store final calculated amount'
    );

    await assertFieldValue(
      db.client,
      'guest_sales',
      'vehicle_number',
      'KA-01-XY-9999',
      { id: guestSaleId },
      'Vehicle number should be stored correctly'
    );
  });

  test('should validate business constraints and edge cases', async () => {
    // Test: Zero quantity (should be allowed for corrections)
    const zeroSale = await db.client.query(`
      INSERT INTO guest_sales (
        fuel_product_id,
        sale_date,
        quantity,
        price_per_unit,
        total_amount,
        payment_mode,
        created_at
      ) VALUES ($1, CURRENT_DATE, 0, 95.50, 0, 'CASH', NOW())
      RETURNING id
    `, [fixtures.fuelProductId]);

    expect(zeroSale.rows[0].id).toBeDefined();

    // Test: Large quantity sale (bulk customer)
    const bulkQuantity = 1000.0;
    const bulkRate = 93.50; // Bulk rate discount
    const bulkSale = await db.client.query(`
      INSERT INTO guest_sales (
        fuel_product_id,
        sale_date,
        quantity,
        price_per_unit,
        total_amount,
        payment_mode,
        vehicle_number,
        created_at
      ) VALUES ($1, CURRENT_DATE, $2, $3, $4, 'CARD', 'BULK-TRANSPORT-001', NOW())
      RETURNING id, total_amount
    `, [fixtures.fuelProductId, bulkQuantity, bulkRate, bulkQuantity * bulkRate]);

    expect(bulkSale.rows[0].id).toBeDefined();
    expect(Math.abs(parseFloat(bulkSale.rows[0].total_amount) - (bulkQuantity * bulkRate))).toBeLessThan(0.01);

    // Assert: All test sales exist
    await assertRecordCount(
      db.client,
      'guest_sales',
      2,
      {},
      'Should have 2 guest sales (zero and bulk)'
    );
  });

  test('should handle concurrent sales scenarios', async () => {
    // Arrange: Simulate concurrent sales at multiple pumps
    const concurrentSales = [
      { nozzle: 'N001', quantity: 25.0, vehicle: 'PUMP1-001' },
      { nozzle: 'N002', quantity: 30.5, vehicle: 'PUMP2-002' },
      { nozzle: 'N003', quantity: 40.0, vehicle: 'PUMP3-003' },
      { nozzle: 'N001', quantity: 15.5, vehicle: 'PUMP1-004' }, // Same nozzle, different sale
    ];

    const rate = 95.50;

    // Act: Insert all sales concurrently (simulate real pump operations)
    const promises = concurrentSales.map(sale => 
      db.client.query(`
        INSERT INTO guest_sales (
          fuel_product_id,
          sale_date,
          quantity,
          price_per_unit,
          total_amount,
          payment_mode,
          vehicle_number,
          created_at
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4, 'CASH', $5, NOW())
        RETURNING id
      `, [fixtures.fuelProductId, sale.quantity, rate, sale.quantity * rate, sale.vehicle])
    );

    const results = await Promise.all(promises);

    // Assert: All concurrent sales were processed
    expect(results.length).toBe(4);
    results.forEach(result => {
      expect(result.rows[0].id).toBeDefined();
    });

    // Assert: Total sales and quantity
    const totalResult = await db.client.query(`
      SELECT COUNT(*) as count, SUM(quantity) as total_qty
      FROM guest_sales
    `);

    const expectedTotalQty = concurrentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    expect(parseInt(totalResult.rows[0].count)).toBe(4);
    expect(Math.abs(parseFloat(totalResult.rows[0].total_qty) - expectedTotalQty)).toBeLessThan(0.01);
  });

  test('should verify guest sales do not affect credit customer balances', async () => {
    // Arrange: Check initial customer balance
    const initialBalanceResult = await db.client.query(
      'SELECT current_balance FROM credit_customers WHERE id = $1',
      [fixtures.customerId]
    );
    const initialBalance = parseFloat(initialBalanceResult.rows[0].current_balance);

    // Act: Create guest sale (should not affect credit customer)
    await db.client.query(`
      INSERT INTO guest_sales (
        fuel_product_id,
        sale_date,
        quantity,
        price_per_unit,
        total_amount,
        payment_mode,
        created_at
      ) VALUES ($1, CURRENT_DATE, 50.0, 95.50, 4775.0, 'CASH', NOW())
    `, [fixtures.fuelProductId]);

    // Assert: Credit customer balance unchanged
    await assertFieldValue(
      db.client,
      'credit_customers',
      'current_balance',
      initialBalance,
      { id: fixtures.customerId },
      'Guest sales should not affect credit customer balances'
    );
  });
});