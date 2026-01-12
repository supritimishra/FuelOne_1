const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Check nozzles table structure
    const nozzlesStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'nozzles' 
      ORDER BY ordinal_position
    `);
    console.log('Nozzles table structure:');
    nozzlesStructure.rows.forEach(row => {
      console.log('  -', row.column_name, '(' + row.data_type + ')');
    });
    
    // Check tanks table structure
    const tanksStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tanks' 
      ORDER BY ordinal_position
    `);
    console.log('\nTanks table structure:');
    tanksStructure.rows.forEach(row => {
      console.log('  -', row.column_name, '(' + row.data_type + ')');
    });
    
    // Check tank count
    const tanksCount = await client.query('SELECT COUNT(*) FROM tanks WHERE is_active = true');
    console.log('\nActive tanks count:', tanksCount.rows[0].count);
    
    // Get sample tanks
    const sampleTanks = await client.query('SELECT id, tank_name FROM tanks WHERE is_active = true LIMIT 5');
    console.log('Sample tanks:');
    sampleTanks.rows.forEach(tank => {
      console.log('  -', tank.id, ':', tank.tank_name);
    });
    
    // Check nozzles count
    const nozzlesCount = await client.query('SELECT COUNT(*) FROM nozzles WHERE is_active = true');
    console.log('\nActive nozzles count:', nozzlesCount.rows[0].count);
    
    // Get sample nozzles
    const sampleNozzles = await client.query('SELECT id, nozzle_number, pump_station, tank_id FROM nozzles WHERE is_active = true LIMIT 5');
    console.log('Sample nozzles:');
    sampleNozzles.rows.forEach(nozzle => {
      console.log('  -', nozzle.nozzle_number, 'at', nozzle.pump_station, 'connected to tank:', nozzle.tank_id);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();