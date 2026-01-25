import "dotenv/config";
import { config } from "dotenv";
import path from "path";
import { MongoClient, ObjectId } from 'mongodb';

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fuelone';

async function seedTanksData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    
    // First, ensure fuel products exist
    const productsCollection = db.collection('fuel_products');
    
    // Clear and recreate products for clean state
    await productsCollection.deleteMany({});
    console.log('Cleared existing fuel products');
    
    console.log('Creating fuel products...');
    const productResults = await productsCollection.insertMany([
      {
        product_name: 'Extra Premium',
        short_name: 'XP',
        gst_percentage: 18,
        tds_percentage: 2,
        wgt_percentage: 1,
        lfrn: 'LFRN001',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_name: 'High Speed Desi',
        short_name: 'HSD',
        gst_percentage: 18,
        tds_percentage: 2,
        wgt_percentage: 1,
        lfrn: 'LFRN002',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        product_name: 'Motor Spirit',
        short_name: 'MS',
        gst_percentage: 18,
        tds_percentage: 2,
        wgt_percentage: 1,
        lfrn: 'LFRN003',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    
    const productIds = Object.values(productResults.insertedIds);
    const petrolId = productIds[0] as ObjectId;
    const dieselId = productIds[1] as ObjectId;
    const premiumId = productIds[2] as ObjectId;
    
    console.log('✅ Fuel products created');
    console.log('Product IDs:', { petrolId, dieselId, premiumId });

    // Now create tanks
    const tanksCollection = db.collection('tanks');
    
    // Clear existing tanks (optional - remove if you want to keep existing data)
    await tanksCollection.deleteMany({});
    console.log('Cleared existing tanks');

    const tanksData = [
      {
        tankNumber: 'TANK-1',
        fuelProductId: petrolId,
        capacity: 20,
        currentStock: 15.5,
        nozzles: ['Nozzle 1', 'Nozzle 2'],
        isActive: true,
        createdAt: new Date('2024-12-11T01:02:10'),
        updatedAt: new Date('2024-12-17T03:24:39'),
        createdBy: 'Super Admin',
        updatedBy: 'Super Admin',
      },
      {
        tankNumber: 'TANK-2',
        fuelProductId: dieselId,
        capacity: 20,
        currentStock: 18.2,
        nozzles: ['Nozzle 3', 'Nozzle 4'],
        isActive: true,
        createdAt: new Date('2024-12-11T01:02:41'),
        updatedAt: new Date('2024-12-17T03:24:52'),
        createdBy: 'Super Admin',
        updatedBy: 'Super Admin',
      },
      {
        tankNumber: 'TANK-3',
        fuelProductId: premiumId,
        capacity: 15,
        currentStock: 12.8,
        nozzles: ['Nozzle 5'],
        isActive: true,
        createdAt: new Date('2024-12-11T01:03:03'),
        updatedAt: new Date('2024-12-17T03:25:05'),
        createdBy: 'Super Admin',
        updatedBy: 'Super Admin',
      },
    ];

    const result = await tanksCollection.insertMany(tanksData);
    console.log(`✅ Inserted ${result.insertedCount} tanks`);
    
    const tankIds = Object.values(result.insertedIds);
    const tank1Id = tankIds[0] as ObjectId;
    const tank2Id = tankIds[1] as ObjectId;
    const tank3Id = tankIds[2] as ObjectId;
    
    // Create nozzles for each tank
    const nozzlesCollection = db.collection('nozzles');
    await nozzlesCollection.deleteMany({});
    console.log('Cleared existing nozzles');
    
    const nozzlesData = [
      {
        nozzleNumber: 'XP1',
        tankId: tank1Id,
        fuelProductId: petrolId,
        pumpStation: 'Pump 1',
        isActive: true,
        createdBy: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nozzleNumber: 'XP2',
        tankId: tank1Id,
        fuelProductId: petrolId,
        pumpStation: 'Pump 1',
        isActive: true,
        createdBy: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nozzleNumber: 'HSD1',
        tankId: tank2Id,
        fuelProductId: dieselId,
        pumpStation: 'Pump 2',
        isActive: true,
        createdBy: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nozzleNumber: 'HSD2',
        tankId: tank2Id,
        fuelProductId: dieselId,
        pumpStation: 'Pump 2',
        isActive: true,
        createdBy: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nozzleNumber: 'MS1',
        tankId: tank3Id,
        fuelProductId: premiumId,
        pumpStation: 'Pump 3',
        isActive: true,
        createdBy: 'Super Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    const nozzleResult = await nozzlesCollection.insertMany(nozzlesData);
    console.log(`✅ Inserted ${nozzleResult.insertedCount} nozzles`);
    
    // Display the inserted data with product names
    const tanks = await tanksCollection.find({}).toArray();
    console.log('\n📊 Tanks in database:');
    
    for (const tank of tanks) {
      const product = await productsCollection.findOne({ _id: tank.fuelProductId });
      const tankNozzles = await nozzlesCollection.find({ tankId: tank._id }).toArray();
      const nozzleNumbers = tankNozzles.map(n => n.nozzleNumber).join(', ');
      console.log(`${tanks.indexOf(tank) + 1}. ${tank.tankNumber} - Capacity: ${tank.capacity}KL - Stock: ${tank.currentStock}KL - Product: ${product?.product_name || 'N/A'} - Nozzles: ${nozzleNumbers || 'None'}`);
    }

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the seed function
seedTanksData().catch(console.error);
