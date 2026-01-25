import { MongoClient } from 'mongodb';
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

async function seedExpiryItems() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('expiry_categories');
    const itemsCollection = db.collection('expiry_items');

    // First, create categories
    const categories = [
      {
        categoryName: 'Fire Safety',
        description: 'Fire extinguishers and safety equipment',
        isActive: true,
        createdAt: new Date('2024-01-15'),
      },
      {
        categoryName: 'Medical Supplies',
        description: 'First aid and medical equipment',
        isActive: true,
        createdAt: new Date('2024-01-20'),
      },
      {
        categoryName: 'Lubricants',
        description: 'Engine oils and lubricants',
        isActive: true,
        createdAt: new Date('2024-02-01'),
      },
      {
        categoryName: 'Safety Equipment',
        description: 'Personal protective equipment',
        isActive: true,
        createdAt: new Date('2024-02-10'),
      },
      {
        categoryName: 'Chemicals',
        description: 'Cleaning and maintenance chemicals',
        isActive: true,
        createdAt: new Date('2024-03-01'),
      },
    ];

    const categoryResult = await categoriesCollection.insertMany(categories);
    console.log(`✓ Successfully inserted ${categoryResult.insertedCount} categories`);

    // Now create expiry items with various dates
    const today = new Date();
    const expiryItems = [
      {
        itemName: 'Fire Extinguisher ABC Type',
        itemNo: 'FE-001',
        categoryName: 'Fire Safety',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2026-01-15'),
        noOfDays: 730,
        note: 'Check pressure gauge monthly',
        status: 'Active',
        createdAt: new Date('2024-01-15'),
      },
      {
        itemName: 'CO2 Fire Extinguisher',
        itemNo: 'FE-002',
        categoryName: 'Fire Safety',
        issueDate: new Date('2024-02-01'),
        expiryDate: new Date('2029-02-01'),
        noOfDays: 1825,
        note: 'Annual inspection required',
        status: 'Active',
        createdAt: new Date('2024-02-01'),
      },
      {
        itemName: 'First Aid Kit Standard',
        itemNo: 'MED-001',
        categoryName: 'Medical Supplies',
        issueDate: new Date('2024-03-10'),
        expiryDate: new Date('2026-03-10'),
        noOfDays: 730,
        note: 'Check contents quarterly',
        status: 'Active',
        createdAt: new Date('2024-03-10'),
      },
      {
        itemName: 'Emergency Bandages',
        itemNo: 'MED-002',
        categoryName: 'Medical Supplies',
        issueDate: new Date('2024-04-01'),
        expiryDate: new Date('2026-04-01'),
        noOfDays: 730,
        note: 'Sterile packaging',
        status: 'Active',
        createdAt: new Date('2024-04-01'),
      },
      {
        itemName: 'Antiseptic Solution',
        itemNo: 'MED-003',
        categoryName: 'Medical Supplies',
        issueDate: new Date('2024-05-15'),
        expiryDate: new Date('2025-05-15'),
        noOfDays: 365,
        note: 'Store in cool place',
        status: 'Active',
        createdAt: new Date('2024-05-15'),
      },
      {
        itemName: 'Engine Oil 10W-40',
        itemNo: 'LUB-001',
        categoryName: 'Lubricants',
        issueDate: new Date('2024-01-20'),
        expiryDate: new Date('2027-01-20'),
        noOfDays: 1095,
        note: 'Store away from heat',
        status: 'Active',
        createdAt: new Date('2024-01-20'),
      },
      {
        itemName: 'Hydraulic Oil ISO 68',
        itemNo: 'LUB-002',
        categoryName: 'Lubricants',
        issueDate: new Date('2024-03-01'),
        expiryDate: new Date('2027-03-01'),
        noOfDays: 1095,
        note: 'Check viscosity before use',
        status: 'Active',
        createdAt: new Date('2024-03-01'),
      },
      {
        itemName: 'Safety Goggles',
        itemNo: 'SAF-001',
        categoryName: 'Safety Equipment',
        issueDate: new Date('2024-02-15'),
        expiryDate: new Date('2026-02-15'),
        noOfDays: 730,
        note: 'Replace if scratched',
        status: 'Active',
        createdAt: new Date('2024-02-15'),
      },
      {
        itemName: 'Safety Gloves Heavy Duty',
        itemNo: 'SAF-002',
        categoryName: 'Safety Equipment',
        issueDate: new Date('2024-04-10'),
        expiryDate: new Date('2026-04-10'),
        noOfDays: 730,
        note: 'Check for tears regularly',
        status: 'Active',
        createdAt: new Date('2024-04-10'),
      },
      {
        itemName: 'Hard Hat with Chin Strap',
        itemNo: 'SAF-003',
        categoryName: 'Safety Equipment',
        issueDate: new Date('2024-05-01'),
        expiryDate: new Date('2029-05-01'),
        noOfDays: 1825,
        note: 'Replace after any impact',
        status: 'Active',
        createdAt: new Date('2024-05-01'),
      },
      {
        itemName: 'Degreaser Concentrate',
        itemNo: 'CHEM-001',
        categoryName: 'Chemicals',
        issueDate: new Date('2024-06-01'),
        expiryDate: new Date('2026-06-01'),
        noOfDays: 730,
        note: 'Dilute before use',
        status: 'Active',
        createdAt: new Date('2024-06-01'),
      },
      {
        itemName: 'Brake Cleaner Spray',
        itemNo: 'CHEM-002',
        categoryName: 'Chemicals',
        issueDate: new Date('2024-07-01'),
        expiryDate: new Date('2026-07-01'),
        noOfDays: 730,
        note: 'Highly flammable',
        status: 'Active',
        createdAt: new Date('2024-07-01'),
      },
      {
        itemName: 'Windshield Washer Fluid',
        itemNo: 'CHEM-003',
        categoryName: 'Chemicals',
        issueDate: new Date('2024-08-01'),
        expiryDate: new Date('2027-08-01'),
        noOfDays: 1095,
        note: 'Anti-freeze formula',
        status: 'Active',
        createdAt: new Date('2024-08-01'),
      },
      {
        itemName: 'Dry Powder Fire Extinguisher',
        itemNo: 'FE-003',
        categoryName: 'Fire Safety',
        issueDate: new Date('2023-12-01'),
        expiryDate: new Date('2025-12-01'),
        noOfDays: 730,
        note: 'Expiring soon - schedule replacement',
        status: 'Active',
        createdAt: new Date('2023-12-01'),
      },
      {
        itemName: 'Safety Harness Full Body',
        itemNo: 'SAF-004',
        categoryName: 'Safety Equipment',
        issueDate: new Date('2024-09-01'),
        expiryDate: new Date('2029-09-01'),
        noOfDays: 1825,
        note: 'Inspect before each use',
        status: 'Active',
        createdAt: new Date('2024-09-01'),
      },
    ];

    const itemsResult = await itemsCollection.insertMany(expiryItems);
    console.log(`✓ Successfully inserted ${itemsResult.insertedCount} expiry items`);

    // Display summary
    const activeCount = expiryItems.filter(item => item.status === 'Active').length;
    const categoryCount = categories.length;
    
    console.log('\nSummary:');
    console.log(`- Total categories: ${categoryCount}`);
    console.log(`- Total items: ${expiryItems.length}`);
    console.log(`- Active items: ${activeCount}`);
    console.log(`- Items by category:`);
    
    const itemsByCategory = expiryItems.reduce((acc: any, item) => {
      acc[item.categoryName] = (acc[item.categoryName] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(itemsByCategory).forEach(([category, count]) => {
      console.log(`  * ${category}: ${count}`);
    });

  } catch (error) {
    console.error('Error seeding expiry items:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seed function
seedExpiryItems()
  .then(() => {
    console.log('\n✓ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  });
