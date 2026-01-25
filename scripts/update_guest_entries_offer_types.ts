import { MongoClient } from 'mongodb';
import { config } from "dotenv";
import path from "path";

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set");
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'fuelone';

async function updateOfferTypes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('guest_entries');

    // Get all entries
    const entries = await collection.find({}).toArray();
    console.log(`📊 Found ${entries.length} entries to update`);

    let updateCount = 0;
    const offerTypes = ['Per 1 ltr', 'Per 100 Rs'];

    // Update each entry with alternating offer types
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const newOfferType = offerTypes[i % 2];
      
      await collection.updateOne(
        { _id: entry._id },
        { $set: { offer_type: newOfferType } }
      );
      updateCount++;
    }

    console.log(`✅ Successfully updated ${updateCount} entries`);

  } catch (error) {
    console.error('❌ Error updating guest entries:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateOfferTypes()
  .then(() => {
    console.log('🎉 Update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });
