import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config({ path: '.local.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabaseTriggers() {
  console.log('🔧 Checking Database Triggers...\n');
  
  try {
    // Get all triggers
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_statement,
        action_timing,
        event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log(`Found ${triggersResult.rows.length} triggers:`);
    triggersResult.rows.forEach(trigger => {
      console.log(`\n📌 ${trigger.trigger_name}`);
      console.log(`   Table: ${trigger.event_object_table}`);
      console.log(`   Event: ${trigger.event_manipulation} ${trigger.action_timing}`);
      console.log(`   Statement: ${trigger.action_statement}`);
    });
    
    // Check trigger functions
    console.log('\n🔍 Checking Trigger Functions...');
    const functionsResult = await pool.query(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name LIKE '%trigger%' OR routine_name LIKE '%update%' OR routine_name LIKE '%balance%'
      ORDER BY routine_name
    `);
    
    console.log(`Found ${functionsResult.rows.length} trigger functions:`);
    functionsResult.rows.forEach(func => {
      console.log(`\n⚙️ ${func.routine_name}`);
      console.log(`   Definition: ${func.routine_definition?.substring(0, 200)}...`);
    });
    
    // Test recovery trigger specifically
    console.log('\n🧪 Testing Recovery Trigger...');
    
    // First, get a credit customer to test with
    const customerResult = await pool.query(`
      SELECT id, organization_name, current_balance 
      FROM credit_customers 
      LIMIT 1
    `);
    
    if (customerResult.rows.length > 0) {
      const customer = customerResult.rows[0];
      console.log(`Testing with customer: ${customer.organization_name} (Balance: ${customer.current_balance})`);
      
      // Insert a test recovery
      const testRecoveryResult = await pool.query(`
        INSERT INTO recoveries (recovery_date, credit_customer_id, received_amount, discount, payment_mode, notes)
        VALUES (CURRENT_DATE, $1, 100.00, 0, 'Cash', 'Test recovery for trigger check')
        RETURNING id
      `, [customer.id]);
      
      const recoveryId = testRecoveryResult.rows[0].id;
      console.log(`✅ Test recovery inserted with ID: ${recoveryId}`);
      
      // Check if customer balance was updated
      const updatedCustomerResult = await pool.query(`
        SELECT current_balance 
        FROM credit_customers 
        WHERE id = $1
      `, [customer.id]);
      
      const newBalance = updatedCustomerResult.rows[0].current_balance;
      console.log(`Customer balance after recovery: ${newBalance}`);
      
      if (newBalance !== customer.current_balance) {
        console.log('✅ Recovery trigger is working correctly - balance was updated');
      } else {
        console.log('❌ Recovery trigger may not be working - balance unchanged');
      }
      
      // Clean up test data
      await pool.query(`DELETE FROM recoveries WHERE id = $1`, [recoveryId]);
      console.log('🧹 Test recovery cleaned up');
      
    } else {
      console.log('❌ No credit customers found to test recovery trigger');
    }
    
    // Test other critical triggers
    console.log('\n🧪 Testing Other Critical Triggers...');
    
    // Test tank stock update on guest sale
    const tankResult = await pool.query(`
      SELECT id, current_stock 
      FROM tanks 
      WHERE is_active = true 
      LIMIT 1
    `);
    
    if (tankResult.rows.length > 0) {
      const tank = tankResult.rows[0];
      console.log(`Testing tank stock trigger with tank ${tank.id} (Stock: ${tank.current_stock})`);
      
      // Get a fuel product
      const productResult = await pool.query(`
        SELECT id FROM fuel_products WHERE is_active = true LIMIT 1
      `);
      
      if (productResult.rows.length > 0) {
        const productId = productResult.rows[0].id;
        
        // Insert a test guest sale
        const testSaleResult = await pool.query(`
          INSERT INTO guest_sales (sale_date, fuel_product_id, quantity, price_per_unit, total_amount)
          VALUES (CURRENT_DATE, $1, 10.00, 50.00, 500.00)
          RETURNING id
        `, [productId]);
        
        const saleId = testSaleResult.rows[0].id;
        console.log(`✅ Test guest sale inserted with ID: ${saleId}`);
        
        // Check if tank stock was updated (this might not work if tank doesn't have the fuel product)
        const updatedTankResult = await pool.query(`
          SELECT current_stock 
          FROM tanks 
          WHERE id = $1
        `, [tank.id]);
        
        const newStock = updatedTankResult.rows[0].current_stock;
        console.log(`Tank stock after sale: ${newStock}`);
        
        // Clean up test data
        await pool.query(`DELETE FROM guest_sales WHERE id = $1`, [saleId]);
        console.log('🧹 Test guest sale cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Trigger check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseTriggers();
