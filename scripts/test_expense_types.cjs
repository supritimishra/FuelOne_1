require('dotenv').config();
const { Client } = require('pg');

async function testExpenseTypes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Test inserting an expense type
    const testData = {
      expense_type_name: 'Test Expense Type',
      effect_for: 'Employee',
      options: 'Test options'
    };

    console.log('Testing expense types insert...');
    const insertResult = await client.query(
      'INSERT INTO expense_types (expense_type_name, effect_for, options) VALUES ($1, $2, $3) RETURNING *',
      [testData.expense_type_name, testData.effect_for, testData.options]
    );

    console.log('Insert successful:', insertResult.rows[0]);

    // Clean up test data
    await client.query('DELETE FROM expense_types WHERE expense_type_name = $1', ['Test Expense Type']);
    console.log('Test data cleaned up');

    console.log('✅ Expense types functionality working correctly');

  } catch (error) {
    console.error('❌ Expense types test failed:', error.message);
  } finally {
    await client.end();
  }
}

testExpenseTypes();