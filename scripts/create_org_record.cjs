const { Client } = require('pg');
require('dotenv').config();

async function createOrgRecord() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if organization record exists
    const checkResult = await client.query('SELECT COUNT(*) FROM organization_details');
    const count = parseInt(checkResult.rows[0].count);
    
    if (count === 0) {
      console.log('No organization records found, creating default record...');
      
      const insertResult = await client.query(`
        INSERT INTO organization_details (
          organization_name, 
          phone_number, 
          email,
          address,
          bank_name,
          gst_number
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `, [
        'Ramkrishna Service Centre', 
        '', 
        '',
        '',
        '',
        ''
      ]);
      
      console.log('Created default organization record with ID:', insertResult.rows[0].id);
    } else {
      console.log('Organization record already exists, count:', count);
      
      // Show the existing record
      const existingResult = await client.query('SELECT * FROM organization_details LIMIT 1');
      console.log('Existing record:', JSON.stringify(existingResult.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

createOrgRecord();