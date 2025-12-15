require('dotenv').config();
const { Client } = require('pg');

(async function(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('🔗 Connected to database for verification\n');

    // Get total count
    const totalResult = await client.query('SELECT COUNT(*) as total FROM sheet_records');
    console.log(`📊 Total Sheet Records: ${totalResult.rows[0].total}\n`);

    // Get records with full details
    const recordsResult = await client.query(`
      SELECT 
        sr.id,
        sr.date,
        sr.sheet_name,
        sr.open_reading,
        sr.close_reading,
        sr.notes,
        sr.created_at,
        CASE 
          WHEN EXTRACT(HOUR FROM sr.created_at) < 12 THEN 'Morning'
          WHEN EXTRACT(HOUR FROM sr.created_at) < 18 THEN 'Afternoon'
          ELSE 'Evening'
        END as shift,
        COALESCE(u.full_name, 'System') as employee
      FROM sheet_records sr
      LEFT JOIN users u ON u.id = sr.created_by
      ORDER BY sr.created_at DESC
    `);

    const records = recordsResult.rows;

    // Date range analysis
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

    const last30Days = records.filter(r => new Date(r.date) >= thirtyDaysAgo).length;
    const days30to60 = records.filter(r => {
      const date = new Date(r.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    }).length;
    const days60to90 = records.filter(r => {
      const date = new Date(r.date);
      return date >= ninetyDaysAgo && date < sixtyDaysAgo;
    }).length;

    console.log('📅 Date Range Distribution:');
    console.log(`   Last 30 days: ${last30Days} records`);
    console.log(`   30-60 days ago: ${days30to60} records`);
    console.log(`   60-90 days ago: ${days60to90} records\n`);

    // Shift distribution
    const shiftCounts = records.reduce((acc, record) => {
      acc[record.shift] = (acc[record.shift] || 0) + 1;
      return acc;
    }, {});

    console.log('⏰ Shift Distribution:');
    Object.entries(shiftCounts).forEach(([shift, count]) => {
      console.log(`   ${shift}: ${count} records`);
    });
    console.log('');

    // Employee distribution
    const employeeCounts = records.reduce((acc, record) => {
      acc[record.employee] = (acc[record.employee] || 0) + 1;
      return acc;
    }, {});

    console.log('👥 Employee Distribution:');
    Object.entries(employeeCounts).forEach(([employee, count]) => {
      console.log(`   ${employee}: ${count} records`);
    });
    console.log('');

    // Unique sheet names
    const uniqueSheetNames = [...new Set(records.map(r => r.sheet_name))];
    console.log('📋 Unique Sheet Names:');
    uniqueSheetNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });
    console.log('');

    // Sample records for verification
    console.log('🔍 Sample Records (Latest 5):');
    records.slice(0, 5).forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.sheet_name}`);
      console.log(`      Date: ${record.date} | Shift: ${record.shift} | Employee: ${record.employee}`);
      console.log(`      Readings: ${record.open_reading} → ${record.close_reading}`);
      console.log(`      Notes: ${record.notes || 'No notes'}`);
      console.log('');
    });

    // Search test keywords
    const searchKeywords = ['review', 'pending', 'complete', 'urgent', 'discrepancy', 'reconciliation'];
    console.log('🔍 Search Keyword Analysis:');
    searchKeywords.forEach(keyword => {
      const matches = records.filter(r => 
        r.sheet_name.toLowerCase().includes(keyword) || 
        (r.notes && r.notes.toLowerCase().includes(keyword))
      ).length;
      console.log(`   "${keyword}": ${matches} records`);
    });
    console.log('');

    // Data quality checks
    console.log('✅ Data Quality Checks:');
    const withNotes = records.filter(r => r.notes && r.notes.trim().length > 0).length;
    const withoutNotes = records.length - withNotes;
    console.log(`   Records with notes: ${withNotes}`);
    console.log(`   Records without notes: ${withoutNotes}`);
    
    const systemRecords = records.filter(r => r.employee === 'System').length;
    const userRecords = records.length - systemRecords;
    console.log(`   Records by users: ${userRecords}`);
    console.log(`   Records by system: ${systemRecords}`);

    console.log('\n🎉 Verification completed successfully!');
    console.log('💡 You can now test the UI at /relational/sheet-records');

  } catch (err) {
    console.error('❌ Verification error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
