import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import path from 'path';

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'fuelone';

async function checkExpenseTypes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', DB_NAME);
    console.log('🔗 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

    const db = client.db(DB_NAME);
    const collection = db.collection('expense_types');

    // Count documents
    const count = await collection.countDocuments();
    console.log(`\n📊 Total expense_types documents: ${count}`);

    // Fetch all documents
    const types = await collection.find({}).toArray();
    
    console.log('\n📝 Expense Types Data:');
    console.log(JSON.stringify(types, null, 2));

    // List all collections in the database
    const collections = await db.listCollections().toArray();
    console.log('\n📚 All collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkExpenseTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
