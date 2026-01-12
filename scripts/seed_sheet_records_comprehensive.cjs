const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

// Sample data for realistic sheet records
const sheetNames = [
  'Daily Sales Sheet',
  'Fuel Stock Report',
  'Inventory Reconciliation',
  'Monthly Summary',
  'Tank Readings Log',
  'Shift End Report',
  'Cash Flow Statement',
  'Fuel Dispensing Log',
  'Daily Operations Sheet',
  'Stock Audit Report',
  'Sales Performance Sheet',
  'Equipment Check Log'
];

const noteTemplates = [
  'Regular shift closing completed',
  'Stock reconciliation needed - minor discrepancies found',
  'Manager review pending for approval',
  'Discrepancy found in Tank 2 readings',
  'All systems operational - no issues reported',
  'Fuel delivery received and recorded',
  'Cash count completed - all amounts verified',
  'Equipment maintenance scheduled for next week',
  'High volume day - all pumps functioning normally',
  'End of month closing procedures completed',
  'Customer complaint logged and resolved',
  'Safety inspection passed with flying colors',
  'Inventory levels below threshold - reorder needed',
  'New employee training completed successfully',
  'System backup completed successfully',
  'Emergency shutdown procedure tested',
  'Quality control check passed',
  'Environmental compliance verified',
  'Fuel quality test results within normal range',
  'Customer satisfaction survey conducted'
];

// Generate random date within last 3 months
function getRandomDate() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate random time for different shifts
function getRandomTime() {
  const shifts = [
    { start: 6, end: 11 },   // Morning
    { start: 12, end: 17 },  // Afternoon  
    { start: 18, end: 23 }   // Evening
  ];
  
  const shift = shifts[Math.floor(Math.random() * shifts.length)];
  const hour = shift.start + Math.floor(Math.random() * (shift.end - shift.start + 1));
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
}

// Generate realistic open/close readings
function getRealisticReadings() {
  const baseReading = 1000 + Math.floor(Math.random() * 8000); // 1000-8999
  const variance = 50 + Math.floor(Math.random() * 200); // 50-249 difference
  const openReading = baseReading;
  const closeReading = baseReading + variance;
  
  return { openReading, closeReading };
}

async function run() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Get existing users
    const usersResult = await client.query('SELECT id, full_name FROM users ORDER BY created_at');
    const users = usersResult.rows;
    console.log(`👥 Found ${users.length} existing users`);

    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing sheet records...');
    await client.query('DELETE FROM sheet_records WHERE sheet_name IN ($1)', [sheetNames.map(name => `'${name}'`).join(',')]);

    // Generate 18 sheet records
    const recordsToInsert = 18;
    console.log(`📝 Generating ${recordsToInsert} sheet records...`);

    for (let i = 0; i < recordsToInsert; i++) {
      const randomDate = getRandomDate();
      const randomTime = getRandomTime();
      const dateStr = randomDate.toISOString().slice(0, 10);
      const timestamp = `${dateStr} ${randomTime}`;
      
      const sheetName = sheetNames[Math.floor(Math.random() * sheetNames.length)];
      const note = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
      const { openReading, closeReading } = getRealisticReadings();
      
      // Randomly assign user or NULL (for "System" display)
      const createdBy = Math.random() > 0.3 && users.length > 0 
        ? users[Math.floor(Math.random() * users.length)].id 
        : null;

      const insertQuery = `
        INSERT INTO sheet_records (
          date, 
          sheet_name, 
          open_reading, 
          close_reading, 
          notes, 
          created_by, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, sheet_name, date
      `;

      const result = await client.query(insertQuery, [
        dateStr,
        sheetName,
        openReading,
        closeReading,
        note,
        createdBy,
        timestamp
      ]);

      console.log(`✅ Inserted record ${i + 1}/${recordsToInsert}: ${result.rows[0].sheet_name} (${result.rows[0].date})`);
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) as total FROM sheet_records');
    console.log(`\n📊 Total sheet records in database: ${countResult.rows[0].total}`);

    // Show recent records
    const recentResult = await client.query(`
      SELECT 
        sr.sheet_name,
        sr.date,
        CASE 
          WHEN EXTRACT(HOUR FROM sr.created_at) < 12 THEN 'Morning'
          WHEN EXTRACT(HOUR FROM sr.created_at) < 18 THEN 'Afternoon'
          ELSE 'Evening'
        END as shift,
        COALESCE(u.full_name, 'System') as employee
      FROM sheet_records sr
      LEFT JOIN users u ON u.id = sr.created_by
      ORDER BY sr.created_at DESC
      LIMIT 5
    `);

    console.log('\n📋 Recent records:');
    recentResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.sheet_name} | ${row.date} | ${row.shift} | ${row.employee}`);
    });

    console.log('\n🎉 Sheet records seeding completed successfully!');
    console.log('💡 You can now test the UI at /relational/sheet-records');

  } catch (err) {
    console.error('❌ Seeding error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
