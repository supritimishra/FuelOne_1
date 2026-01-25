import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function seedPumpStations() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('fuelone');
    const collection = db.collection('pump_stations');

    // Check if pump stations already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing pump stations`);
      console.log('Clearing existing pump stations...');
      await collection.deleteMany({});
    }

    // Seed pump stations
    const pumpStations = [
      { pump: 'P1', pumpName: 'DU1', isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: 'System' },
      { pump: 'P2', pumpName: 'DU2', isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: 'System' },
      { pump: 'P3', pumpName: 'DU3', isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: 'System' },
      { pump: 'P4', pumpName: 'DU4', isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: 'System' },
      { pump: 'P5', pumpName: 'DU5', isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: 'System' },
    ];

    const result = await collection.insertMany(pumpStations);
    console.log(`✅ Successfully inserted ${result.insertedCount} pump stations`);

    // Display the inserted pump stations
    const allStations = await collection.find({}).toArray();
    console.log('\n📋 Pump Stations:');
    allStations.forEach(station => {
      console.log(`   ${station.pump} - ${station.pumpName} (${station.isActive ? 'Active' : 'Inactive'})`);
    });

  } catch (error) {
    console.error('❌ Error seeding pump stations:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

seedPumpStations();
