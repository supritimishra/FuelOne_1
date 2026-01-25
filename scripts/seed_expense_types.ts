import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fuelone';

async function seedExpenseTypes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('expense_types');

    // Sample data based on the screenshot
    const expenseTypes = [
      {
        _id: randomUUID(),
        expense_type_name: 'METROLOGY',
        effect_for: 'Profit',
        options: 'Income',
        is_active: true,
        created_at: new Date('2025-12-20T08:21:19'),
        createdAt: new Date('2025-12-20T08:21:19'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'sankar bhata van',
        effect_for: 'Employee',
        options: 'Benefit',
        is_active: true,
        created_at: new Date('2025-11-02T05:28:18'),
        createdAt: new Date('2025-11-02T05:28:18'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'CHADA',
        effect_for: 'Employee',
        options: 'Benefit',
        is_active: true,
        created_at: new Date('2025-10-15T06:19:12'),
        createdAt: new Date('2025-10-15T06:19:12'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'DADA EXPENSES',
        effect_for: 'Profit',
        options: 'Income',
        is_active: true,
        created_at: new Date('2025-09-21T04:32:32'),
        createdAt: new Date('2025-09-21T04:32:32'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'alomgir earthin',
        effect_for: 'Employee',
        options: 'Salary',
        is_active: true,
        created_at: new Date('2025-09-07T04:45:33'),
        createdAt: new Date('2025-09-07T04:45:33'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'Office Rent',
        effect_for: 'Profit',
        options: 'Income',
        is_active: true,
        created_at: new Date('2025-08-15T10:30:00'),
        createdAt: new Date('2025-08-15T10:30:00'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'Electricity Bill',
        effect_for: 'Profit',
        options: 'Income',
        is_active: true,
        created_at: new Date('2025-08-10T09:15:00'),
        createdAt: new Date('2025-08-10T09:15:00'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'Staff Bonus',
        effect_for: 'Employee',
        options: 'Benefit',
        is_active: true,
        created_at: new Date('2025-07-20T14:45:00'),
        createdAt: new Date('2025-07-20T14:45:00'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'Vehicle Maintenance',
        effect_for: 'Profit',
        options: 'Income',
        is_active: true,
        created_at: new Date('2025-07-05T11:20:00'),
        createdAt: new Date('2025-07-05T11:20:00'),
      },
      {
        _id: randomUUID(),
        expense_type_name: 'Employee Advance',
        effect_for: 'Employee',
        options: 'Loan',
        is_active: true,
        created_at: new Date('2025-06-25T16:30:00'),
        createdAt: new Date('2025-06-25T16:30:00'),
      },
    ];

    // Clear existing data (optional)
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing records`);

    // Insert new data
    const result = await collection.insertMany(expenseTypes);
    console.log(`✅ Inserted ${result.insertedCount} expense types`);

    // Verify the data
    const count = await collection.countDocuments();
    console.log(`📊 Total expense types in collection: ${count}`);

    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding expense types:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

seedExpenseTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
