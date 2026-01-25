/**
 * Seed Duty Shifts
 * 
 * This script populates the duty_shifts collection in MongoDB
 * with comprehensive sample data ensuring all fields are filled.
 */

import { config } from "dotenv";
import path from "path";
import { getDatabase } from "../server/db-mongodb.js";

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

async function seedDutyShifts() {
  console.log('🌱 Seeding Duty Shifts...\n');

  try {
    const db = await getDatabase();
    const collection = db.collection('duty_shifts');

    // Clear existing data (optional - comment out if you want to preserve existing data)
    await collection.deleteMany({});
    console.log('🗑️  Cleared existing duty shifts');

    // Comprehensive shift data
    const shifts = [
      {
        shift_name: 'Day Shift',
        start_time: '06:00',
        end_time: '14:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-01-01'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Evening Shift',
        start_time: '14:00',
        end_time: '22:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-01-01'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Night Shift',
        start_time: '22:00',
        end_time: '06:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-01-01'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Morning Shift',
        start_time: '07:00',
        end_time: '15:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-01-05'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Afternoon Shift',
        start_time: '15:00',
        end_time: '23:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-01-05'),
        created_by: 'Manager',
      },
      {
        shift_name: 'General Shift',
        start_time: '09:00',
        end_time: '18:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-01-10'),
        created_by: 'Admin',
      },
      {
        shift_name: '24 Hours Shift',
        start_time: '00:00',
        end_time: '23:59',
        duties: 3,
        is_active: true,
        created_at: new Date('2025-01-15'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Split Shift A',
        start_time: '05:00',
        end_time: '13:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-02-01'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Split Shift B',
        start_time: '13:00',
        end_time: '21:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-02-01'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Weekend Day Shift',
        start_time: '08:00',
        end_time: '16:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-03-01'),
        created_by: 'Admin',
      },
      {
        shift_name: 'Weekend Night Shift',
        start_time: '20:00',
        end_time: '04:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-03-01'),
        created_by: 'Admin',
      },
      {
        shift_name: 'Flexible Shift',
        start_time: '10:00',
        end_time: '19:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-04-01'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Early Morning Shift',
        start_time: '04:00',
        end_time: '12:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-05-01'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Late Night Shift',
        start_time: '23:00',
        end_time: '07:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-05-01'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Rotating Shift A',
        start_time: '06:00',
        end_time: '14:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-06-01'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Rotating Shift B',
        start_time: '14:00',
        end_time: '22:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-06-01'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Rotating Shift C',
        start_time: '22:00',
        end_time: '06:00',
        duties: 1,
        is_active: true,
        created_at: new Date('2025-06-01'),
        created_by: 'Manager',
      },
      {
        shift_name: 'Premium Shift',
        start_time: '18:00',
        end_time: '02:00',
        duties: 2,
        is_active: true,
        created_at: new Date('2025-07-01'),
        created_by: 'Admin',
      },
      {
        shift_name: 'Extended Day Shift',
        start_time: '08:00',
        end_time: '20:00',
        duties: 2,
        is_active: true,
        created_at: new Date('2025-08-01'),
        created_by: 'Super Admin',
      },
      {
        shift_name: 'Short Shift',
        start_time: '12:00',
        end_time: '16:00',
        duties: 1,
        is_active: false,
        created_at: new Date('2025-09-01'),
        created_by: 'Manager',
      },
    ];

    // Insert all shifts
    if (shifts.length > 0) {
      const result = await collection.insertMany(shifts);
      console.log(`✅ Successfully inserted ${result.insertedCount} duty shifts\n`);
      
      // Display summary
      console.log('📊 Summary of seeded data:');
      console.log(`   Total Shifts: ${result.insertedCount}`);
      console.log(`   Active Shifts: ${shifts.filter(s => s.is_active).length}`);
      console.log(`   Inactive Shifts: ${shifts.filter(s => !s.is_active).length}`);
      
      const totalDuties = shifts.reduce((sum, s) => sum + s.duties, 0);
      console.log(`   Total Duties (sum): ${totalDuties}`);
      console.log(`   Average Duties per shift: ${(totalDuties / result.insertedCount).toFixed(2)}`);
      
      // Show sample shifts
      console.log('\n📝 Sample Shifts:');
      shifts.slice(0, 5).forEach((shift, idx) => {
        console.log(`   ${idx + 1}. ${shift.shift_name}`);
        console.log(`      Time: ${shift.start_time} - ${shift.end_time}`);
        console.log(`      Duties: ${shift.duties}`);
        console.log(`      Status: ${shift.is_active ? 'Active' : 'Inactive'}`);
        console.log(`      Created By: ${shift.created_by}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No shifts to insert');
    }

    console.log('✅ Duty Shifts seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding duty shifts:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDutyShifts();
