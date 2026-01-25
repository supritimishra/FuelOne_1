import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://syntropylabworks_db_user:QArml7uLnqqg496U@cluster0.zlqfhe8.mongodb.net/fuelone';

async function checkAndAddPumps() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db('fuelone');
    const pumpsCollection = db.collection('pumps');
    
    // Check existing pumps
    const existingPumps = await pumpsCollection.find({}).toArray();
    console.log(`\n📊 Found ${existingPumps.length} existing pumps`);
    
    if (existingPumps.length > 0) {
      console.log('\nExisting pumps:');
      existingPumps.forEach((pump, i) => {
        console.log(`  ${i + 1}. ${pump.pump} - ${pump.pump_name} (${pump.status || 'ACTIVE'})`);
      });
    } else {
      console.log('\n⚠️  No pumps found. Adding sample pumps...\n');
      
      const samplePumps = [
        { pump: 'P1', pump_name: 'Pump Station 1', status: 'ACTIVE', created_at: new Date(), created_by: 'system' },
        { pump: 'P2', pump_name: 'Pump Station 2', status: 'ACTIVE', created_at: new Date(), created_by: 'system' },
        { pump: 'P3', pump_name: 'Pump Station 3', status: 'ACTIVE', created_at: new Date(), created_by: 'system' },
        { pump: 'P4', pump_name: 'Pump Station 4', status: 'ACTIVE', created_at: new Date(), created_by: 'system' },
      ];
      
      const result = await pumpsCollection.insertMany(samplePumps);
      console.log(`✓ Added ${result.insertedCount} sample pumps:`);
      samplePumps.forEach((pump, i) => {
        console.log(`  ${i + 1}. ${pump.pump} - ${pump.pump_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✓ Connection closed');
  }
}

checkAndAddPumps();
