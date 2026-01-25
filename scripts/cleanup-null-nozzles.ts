import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { MongoClient } from 'mongodb';

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fuelone';

async function cleanupNullNozzles() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const nozzlesCollection = db.collection('nozzles');
    
    // Find nozzles with null nozzleNumber
    const nullNozzles = await nozzlesCollection.find({
      $or: [
        { nozzleNumber: null },
        { nozzleNumber: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${nullNozzles.length} nozzles with null nozzleNumber`);
    
    if (nullNozzles.length > 0) {
      // Delete nozzles with null nozzleNumber
      const deleteResult = await nozzlesCollection.deleteMany({
        $or: [
          { nozzleNumber: null },
          { nozzleNumber: { $exists: false } }
        ]
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} nozzles with null nozzleNumber`);
    }
    
    // Show remaining nozzles
    const remainingNozzles = await nozzlesCollection.find({}).toArray();
    console.log(`\n📊 Remaining nozzles: ${remainingNozzles.length}`);
    
    remainingNozzles.forEach((nozzle, idx) => {
      console.log(`${idx + 1}. ${nozzle.nozzleNumber || 'NO NAME'} - Tank: ${nozzle.tankId || 'N/A'} - Active: ${nozzle.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error cleaning up nozzles:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the cleanup function
cleanupNullNozzles().catch(console.error);
