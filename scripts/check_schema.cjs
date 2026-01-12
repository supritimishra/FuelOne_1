const { Client } = require('pg');
require('dotenv').config();

async function checkTrigger() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Checking trigger function implementation:');
    
    const result = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'update_customer_balance_on_sale'
    `);
    
    if (result.rows.length > 0) {
      console.log('Function found:');
      console.log(result.rows[0].prosrc);
    } else {
      console.log('Function not found');
    }
    
    console.log('\nChecking triggers on credit_sales:');
    const triggerResult = await client.query(`
      SELECT tgname, tgtype, tgenabled
      FROM pg_trigger 
      WHERE tgrelid = 'credit_sales'::regclass
    `);
    
    console.table(triggerResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTrigger();