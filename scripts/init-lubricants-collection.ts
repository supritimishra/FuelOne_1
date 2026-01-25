/**
 * Script to initialize lubricants collection in MongoDB
 * Run with: node --loader ts-node/esm scripts/init-lubricants-collection.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.local.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fuelone';

async function initializeLubricantsCollection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Check if lubricants collection exists
    const collections = await db.listCollections({ name: 'lubricants' }).toArray();
    
    if (collections.length === 0) {
      console.log('📦 Creating lubricants collection...');
      await db.createCollection('lubricants');
      console.log('✅ Lubricants collection created');
    } else {
      console.log('✅ Lubricants collection already exists');
    }
    
    // Create indexes
    console.log('📑 Creating indexes...');
    const collection = db.collection('lubricants');
    
    await collection.createIndex({ lubricant_name: 1 });
    await collection.createIndex({ is_active: 1 });
    await collection.createIndex({ created_at: -1 });
    
    console.log('✅ Indexes created');
    
    // Check if collection is empty and add sample data
    const count = await collection.countDocuments();
    
    if (count === 0) {
      console.log('📝 Adding sample lubricants...');
      
      const sampleLubricants = [
        {
          lubricant_name: 'Engine Oil 5W-30',
          hsn_code: '27101990',
          gst_percentage: 18,
          mrp_rate: 500,
          sale_rate: 450,
          minimum_stock: 10,
          current_stock: 50,
          is_active: true,
          created_at: new Date(),
        },
        {
          lubricant_name: 'Engine Oil 20W-40',
          hsn_code: '27101990',
          gst_percentage: 18,
          mrp_rate: 450,
          sale_rate: 400,
          minimum_stock: 10,
          current_stock: 40,
          is_active: true,
          created_at: new Date(),
        },
        {
          lubricant_name: 'Gear Oil SAE 90',
          hsn_code: '27101990',
          gst_percentage: 18,
          mrp_rate: 300,
          sale_rate: 280,
          minimum_stock: 5,
          current_stock: 25,
          is_active: true,
          created_at: new Date(),
        },
        {
          lubricant_name: 'Brake Fluid DOT 4',
          hsn_code: '38200000',
          gst_percentage: 18,
          mrp_rate: 200,
          sale_rate: 180,
          minimum_stock: 5,
          current_stock: 20,
          is_active: true,
          created_at: new Date(),
        },
      ];
      
      await collection.insertMany(sampleLubricants);
      console.log(`✅ Added ${sampleLubricants.length} sample lubricants`);
    } else {
      console.log(`✅ Collection already has ${count} lubricants`);
    }
    
    // Display current lubricants
    console.log('\n📋 Current Lubricants:');
    const lubricants = await collection.find({ is_active: true }).toArray();
    lubricants.forEach((lub, index) => {
      console.log(`  ${index + 1}. ${lub.lubricant_name} - MRP: ₹${lub.mrp_rate}, Sale: ₹${lub.sale_rate}, Stock: ${lub.current_stock}`);
    });
    
    console.log('\n✅ Lubricants collection initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing lubricants collection:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the initialization
initializeLubricantsCollection();
