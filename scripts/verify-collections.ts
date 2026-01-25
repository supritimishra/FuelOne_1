import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { MongoClient } from 'mongodb';

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fuelone';

async function verifyCollections() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections in fuelone database:');
    collections.forEach((coll, idx) => {
      console.log(`${idx + 1}. ${coll.name}`);
    });
    
    // Check nozzles collection
    const nozzlesCollection = db.collection('nozzles');
    const nozzlesCount = await nozzlesCollection.countDocuments();
    console.log(`\n✅ Nozzles collection exists with ${nozzlesCount} documents`);
    
    // Check tanks collection
    const tanksCollection = db.collection('tanks');
    const tanksCount = await tanksCollection.countDocuments();
    console.log(`✅ Tanks collection exists with ${tanksCount} documents`);
    
    // Check fuel_products collection
    const productsCollection = db.collection('fuel_products');
    const productsCount = await productsCollection.countDocuments();
    console.log(`✅ Fuel products collection exists with ${productsCount} documents`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the verification
verifyCollections().catch(console.error);
