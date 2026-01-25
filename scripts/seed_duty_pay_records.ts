/**
 * Seed Duty Pay Records
 * 
 * This script populates the duty_pay_records collection in MongoDB
 * with comprehensive sample data ensuring all fields are filled.
 */

import { config } from "dotenv";
import path from "path";
import { getDatabase } from "../server/db-mongodb.js";

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

async function seedDutyPayRecords() {
  console.log('🌱 Seeding Duty Pay Records...\n');

  try {
    const db = await getDatabase();
    const collection = db.collection('duty_pay_records');

    // Clear existing data (optional - comment out if you want to preserve existing data)
    await collection.deleteMany({});
    console.log('🗑️  Cleared existing duty pay records');

    // Generate sample duty pay records for the past 12 months
    const currentDate = new Date();
    const records = [];

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = monthDate.toISOString().slice(0, 10); // YYYY-MM-DD format
      
      // Generate 1-3 records per month
      const recordsPerMonth = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < recordsPerMonth; j++) {
        const totalEmployees = Math.floor(Math.random() * 15) + 5; // 5-20 employees
        const avgSalary = 15000 + Math.floor(Math.random() * 35000); // 15k-50k per employee
        const totalSalary = totalEmployees * avgSalary;
        
        records.push({
          pay_month: monthStr,
          total_salary: totalSalary,
          total_employees: totalEmployees,
          notes: `Salary disbursement for ${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })} - Batch ${j + 1}`,
          created_at: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5 + j), // Created on 5th, 6th, 7th etc.
          created_by: j === 0 ? 'Admin' : j === 1 ? 'Manager' : 'Accountant',
        });
      }
    }

    // Add some records with specific details
    const specificRecords = [
      {
        pay_month: '2026-01-01',
        total_salary: 450000,
        total_employees: 15,
        notes: 'January 2026 - Regular monthly payroll with New Year bonus',
        created_at: new Date('2026-01-05'),
        created_by: 'Admin',
      },
      {
        pay_month: '2025-12-01',
        total_salary: 520000,
        total_employees: 16,
        notes: 'December 2025 - Includes year-end bonuses and overtime payments',
        created_at: new Date('2025-12-05'),
        created_by: 'Manager',
      },
      {
        pay_month: '2025-11-01',
        total_salary: 385000,
        total_employees: 14,
        notes: 'November 2025 - Standard monthly salary disbursement',
        created_at: new Date('2025-11-05'),
        created_by: 'Accountant',
      },
      {
        pay_month: '2025-10-01',
        total_salary: 405000,
        total_employees: 15,
        notes: 'October 2025 - Includes Diwali festival advance payments',
        created_at: new Date('2025-10-05'),
        created_by: 'Admin',
      },
      {
        pay_month: '2025-09-01',
        total_salary: 372000,
        total_employees: 13,
        notes: 'September 2025 - Regular payroll processing',
        created_at: new Date('2025-09-05'),
        created_by: 'Manager',
      },
      {
        pay_month: '2025-08-01',
        total_salary: 390000,
        total_employees: 14,
        notes: 'August 2025 - Includes overtime for peak season operations',
        created_at: new Date('2025-08-05'),
        created_by: 'Accountant',
      },
      {
        pay_month: '2025-07-01',
        total_salary: 425000,
        total_employees: 15,
        notes: 'July 2025 - Mid-year salary review adjustments included',
        created_at: new Date('2025-07-05'),
        created_by: 'Admin',
      },
      {
        pay_month: '2025-06-01',
        total_salary: 368000,
        total_employees: 13,
        notes: 'June 2025 - Standard monthly payroll',
        created_at: new Date('2025-06-05'),
        created_by: 'Manager',
      },
      {
        pay_month: '2025-05-01',
        total_salary: 395000,
        total_employees: 14,
        notes: 'May 2025 - Includes performance bonuses for Q1',
        created_at: new Date('2025-05-05'),
        created_by: 'Admin',
      },
      {
        pay_month: '2025-04-01',
        total_salary: 412000,
        total_employees: 15,
        notes: 'April 2025 - New financial year - standard payroll',
        created_at: new Date('2025-04-05'),
        created_by: 'Accountant',
      },
    ];

    // Combine random and specific records
    const allRecords = [...records, ...specificRecords];

    // Insert all records
    if (allRecords.length > 0) {
      const result = await collection.insertMany(allRecords);
      console.log(`✅ Successfully inserted ${result.insertedCount} duty pay records\n`);
      
      // Display summary
      console.log('📊 Summary of seeded data:');
      console.log(`   Total Records: ${result.insertedCount}`);
      
      const totalSalarySum = allRecords.reduce((sum, r) => sum + r.total_salary, 0);
      const totalEmployeesSum = allRecords.reduce((sum, r) => sum + r.total_employees, 0);
      
      console.log(`   Total Salary Amount: ₹${totalSalarySum.toLocaleString('en-IN')}`);
      console.log(`   Average per record: ₹${Math.round(totalSalarySum / result.insertedCount).toLocaleString('en-IN')}`);
      console.log(`   Total Employee Count (sum): ${totalEmployeesSum}`);
      console.log(`   Average Employees per record: ${Math.round(totalEmployeesSum / result.insertedCount)}`);
      
      // Show sample records
      console.log('\n📝 Sample Records:');
      allRecords.slice(0, 5).forEach((record, idx) => {
        const date = new Date(record.pay_month);
        console.log(`   ${idx + 1}. ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
        console.log(`      Total Salary: ₹${record.total_salary.toLocaleString('en-IN')}`);
        console.log(`      Employees: ${record.total_employees}`);
        console.log(`      Notes: ${record.notes}`);
        console.log(`      Created By: ${record.created_by}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No records to insert');
    }

    console.log('✅ Duty Pay Records seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding duty pay records:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDutyPayRecords();
