import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.local.env') });

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME || 'fuelone';

async function seedSwipeMachines() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const swipeMachinesCollection = db.collection('swipe_machines');
    const vendorsCollection = db.collection('vendors');

    // Get some vendor IDs for seed data
    const vendors = await vendorsCollection.find({ isActive: true }).limit(5).toArray();
    const vendorIds = vendors.map(v => v._id.toString());

    // Clear existing data (optional)
    // await swipeMachinesCollection.deleteMany({});
    // console.log('Cleared existing swipe machines');

    // Sample swipe machines data
    const swipeMachines = [
      {
        machineName: 'PNB Card Machine 001',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-001',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB',
        vendorId: null,
        createdAt: new Date('2024-01-15'),
      },
      {
        machineName: 'PNB Current Account Machine',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-002',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB current',
        vendorId: null,
        createdAt: new Date('2024-02-01'),
      },
      {
        machineName: 'Vendor Payment Terminal 1',
        machineType: 'Card',
        provider: 'HDFC',
        machineId: 'HDFC-VT-001',
        status: 'Active',
        attachType: 'Vendor',
        bankType: null,
        vendorId: vendorIds[0] || null,
        createdAt: new Date('2024-02-15'),
      },
      {
        machineName: 'PNB Main Counter Machine',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-003',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB',
        vendorId: null,
        createdAt: new Date('2024-03-01'),
      },
      {
        machineName: 'Vendor Payment Terminal 2',
        machineType: 'Card',
        provider: 'ICICI',
        machineId: 'ICICI-VT-001',
        status: 'Active',
        attachType: 'Vendor',
        bankType: null,
        vendorId: vendorIds[1] || null,
        createdAt: new Date('2024-03-10'),
      },
      {
        machineName: 'PNB Current Office Machine',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-004',
        status: 'Inactive',
        attachType: 'Bank',
        bankType: 'PNB current',
        vendorId: null,
        createdAt: new Date('2024-03-20'),
      },
      {
        machineName: 'Backup Card Terminal',
        machineType: 'Card',
        provider: 'SBI',
        machineId: 'SBI-CT-001',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB',
        vendorId: null,
        createdAt: new Date('2024-04-01'),
      },
      {
        machineName: 'Vendor Payment Terminal 3',
        machineType: 'Card',
        provider: 'Axis',
        machineId: 'AXIS-VT-001',
        status: 'Active',
        attachType: 'Vendor',
        bankType: null,
        vendorId: vendorIds[2] || null,
        createdAt: new Date('2024-04-15'),
      },
      {
        machineName: 'PNB Secondary Machine',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-005',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB current',
        vendorId: null,
        createdAt: new Date('2024-05-01'),
      },
      {
        machineName: 'Mobile Swipe Terminal',
        machineType: 'Card',
        provider: 'Paytm',
        machineId: 'PAYTM-MST-001',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB',
        vendorId: null,
        createdAt: new Date('2024-05-10'),
      },
      {
        machineName: 'Vendor Payment Terminal 4',
        machineType: 'Card',
        provider: 'HDFC',
        machineId: 'HDFC-VT-002',
        status: 'Inactive',
        attachType: 'Vendor',
        bankType: null,
        vendorId: vendorIds[3] || null,
        createdAt: new Date('2024-05-20'),
      },
      {
        machineName: 'PNB Express Counter Machine',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-006',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB',
        vendorId: null,
        createdAt: new Date('2024-06-01'),
      },
      {
        machineName: 'Vendor Payment Terminal 5',
        machineType: 'Card',
        provider: 'ICICI',
        machineId: 'ICICI-VT-002',
        status: 'Active',
        attachType: 'Vendor',
        bankType: null,
        vendorId: vendorIds[4] || null,
        createdAt: new Date('2024-06-15'),
      },
      {
        machineName: 'PNB Current Backup Terminal',
        machineType: 'Card',
        provider: 'PNB',
        machineId: 'PNB-SM-007',
        status: 'Active',
        attachType: 'Bank',
        bankType: 'PNB current',
        vendorId: null,
        createdAt: new Date('2024-07-01'),
      },
      {
        machineName: 'Emergency Swipe Machine',
        machineType: 'Card',
        provider: 'Other',
        machineId: 'EMG-SM-001',
        status: 'Inactive',
        attachType: 'Bank',
        bankType: 'PNB',
        vendorId: null,
        createdAt: new Date('2024-07-10'),
      },
    ];

    const result = await swipeMachinesCollection.insertMany(swipeMachines);
    console.log(`✓ Successfully inserted ${result.insertedCount} swipe machines`);

    // Display summary
    const activeCount = swipeMachines.filter(m => m.status === 'Active').length;
    const bankCount = swipeMachines.filter(m => m.attachType === 'Bank').length;
    const vendorCount = swipeMachines.filter(m => m.attachType === 'Vendor').length;
    
    console.log('\nSummary:');
    console.log(`- Total machines: ${swipeMachines.length}`);
    console.log(`- Active machines: ${activeCount}`);
    console.log(`- Inactive machines: ${swipeMachines.length - activeCount}`);
    console.log(`- Bank attached: ${bankCount}`);
    console.log(`- Vendor attached: ${vendorCount}`);

  } catch (error) {
    console.error('Error seeding swipe machines:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seed function
seedSwipeMachines()
  .then(() => {
    console.log('\n✓ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  });
