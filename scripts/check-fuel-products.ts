import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function checkFuelProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('URI:', MONGODB_URI);
    
    const db = client.db('fuelone');
    const collection = db.collection('fuel_products');
    
    const products = await collection.find({}).toArray();
    
    console.log(`\nFound ${products.length} products:\n`);
    
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  _id: ${product._id}`);
      console.log(`  product_name: ${product.product_name}`);
      console.log(`  short_name: ${product.short_name}`);
      console.log(`  lfrn: ${product.lfrn}`);
      console.log(`  gst_percentage: ${product.gst_percentage}`);
      console.log(`  tds_percentage: ${product.tds_percentage}`);
      console.log(`  wgt_percentage: ${product.wgt_percentage}`);
      console.log(`  created_at: ${product.created_at}`);
      console.log('---');
    });
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    await client.close();
    process.exit(1);
  }
}

checkFuelProducts();
