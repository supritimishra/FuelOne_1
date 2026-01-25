import { getDatabase } from '../server/db-mongodb.js';

const INITIAL_DENOMINATIONS = [
  { value: '2000', status: 'ACTIVATED' },
  { value: '500', status: 'ACTIVATED' },
  { value: '200', status: 'ACTIVATED' },
  { value: '100', status: 'ACTIVATED' },
  { value: '50', status: 'ACTIVATED' },
  { value: '20', status: 'ACTIVATED' },
  { value: '10', status: 'ACTIVATED' },
];

async function seedDenominations() {
  try {
    console.log('Connecting to MongoDB...');
    const db = await getDatabase();
    const collection = db.collection('denominations');

    // Check if denominations already exist
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`Collection already has ${count} denominations. Skipping seed.`);
      process.exit(0);
    }

    console.log('Seeding denominations...');
    
    const denominationsWithMetadata = INITIAL_DENOMINATIONS.map(denom => ({
      ...denom,
      created_at: new Date(),
      created_by: 'system',
      created_by_name: 'System Admin',
      updated_at: new Date(),
    }));

    const result = await collection.insertMany(denominationsWithMetadata);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} denominations`);
    console.log('Denominations:', INITIAL_DENOMINATIONS.map(d => d.value).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding denominations:', error);
    process.exit(1);
  }
}

seedDenominations();
