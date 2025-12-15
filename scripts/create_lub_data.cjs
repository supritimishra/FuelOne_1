const { Client } = require('pg');
require('dotenv').config();

async function checkAndCreateData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check employees
    const employeesResult = await client.query('SELECT COUNT(*) FROM employees WHERE is_active = true');
    const employeeCount = parseInt(employeesResult.rows[0].count);
    console.log('Active employees:', employeeCount);
    
    if (employeeCount === 0) {
      console.log('Creating sample employees...');
      await client.query(`
        INSERT INTO employees (employee_name, designation, is_active, status) 
        VALUES 
        ('John Doe', 'Sales Assistant', true, 'Active'),
        ('Jane Smith', 'Cashier', true, 'Active'),
        ('Mike Johnson', 'Supervisor', true, 'Active')
      `);
      console.log('Created 3 sample employees');
    }
    
    // Check lubricants table exists and has data
    try {
      const lubricantsResult = await client.query('SELECT COUNT(*) FROM lubricants WHERE is_active = true');
      const lubricantCount = parseInt(lubricantsResult.rows[0].count);
      console.log('Active lubricants:', lubricantCount);
      
      if (lubricantCount === 0) {
        console.log('Creating sample lubricants...');
        await client.query(`
          INSERT INTO lubricants (product_name, brand, category, price_per_unit, is_active) 
          VALUES 
          ('Engine Oil 5W-30', 'Castrol', 'Engine Oil', 450.00, true),
          ('Gear Oil SAE 90', 'Mobil', 'Gear Oil', 280.00, true),
          ('Brake Fluid DOT 4', 'Bosch', 'Brake Fluid', 180.00, true)
        `);
        console.log('Created 3 sample lubricants');
      }
    } catch (lubError) {
      console.log('Lubricants table might not exist:', lubError.message);
      console.log('Using basic product names instead');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkAndCreateData();