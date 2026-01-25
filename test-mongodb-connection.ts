import { connectToDatabase, getCollection, disconnectDatabase } from './server/db-mongodb.js';

async function testMongoDBConnection() {
  console.log('🧪 Testing MongoDB Connection and Master Data Setup\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Connect to MongoDB
    console.log('\n📋 Test 1: Connecting to MongoDB...');
    const db = await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully');
    console.log(`   Database: ${db.databaseName}`);

    // Test 2: List collections
    console.log('\n📋 Test 2: Listing existing collections...');
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Test 3: Create sample Fuel Product
    console.log('\n📋 Test 3: Testing Fuel Products collection...');
    const fuelProductsCol = await getCollection('fuel_products');
    
    // Check if any products exist
    const existingCount = await fuelProductsCol.countDocuments();
    console.log(`   Current fuel products count: ${existingCount}`);

    if (existingCount === 0) {
      console.log('   Creating sample fuel products...');
      const sampleProducts = [
        {
          productName: 'Petrol',
          shortName: 'PTR',
          gstPercentage: 18,
          tdsPercentage: 1,
          wgtPercentage: 0.5,
          lfrn: 'LFR001',
          isActive: true,
          createdAt: new Date(),
        },
        {
          productName: 'Diesel',
          shortName: 'DSL',
          gstPercentage: 18,
          tdsPercentage: 1,
          wgtPercentage: 0.5,
          lfrn: 'LFR002',
          isActive: true,
          createdAt: new Date(),
        },
        {
          productName: 'Premium Petrol',
          shortName: 'PPRT',
          gstPercentage: 18,
          tdsPercentage: 1,
          wgtPercentage: 0.5,
          lfrn: 'LFR003',
          isActive: true,
          createdAt: new Date(),
        }
      ];

      const result = await fuelProductsCol.insertMany(sampleProducts);
      console.log(`✅ Created ${result.insertedCount} sample fuel products`);
    } else {
      console.log('   Fuel products already exist, skipping creation');
    }

    // Test 4: Query Fuel Products
    console.log('\n📋 Test 4: Querying fuel products...');
    const products = await fuelProductsCol.find({ isActive: true }).limit(5).toArray();
    console.log(`✅ Retrieved ${products.length} fuel products:`);
    products.forEach(p => console.log(`   - ${p.productName} (${p.shortName})`));

    // Test 5: Test Lubricants collection
    console.log('\n📋 Test 5: Testing Lubricants collection...');
    const lubricantsCol = await getCollection('lubricants');
    const lubCount = await lubricantsCol.countDocuments();
    console.log(`   Current lubricants count: ${lubCount}`);

    if (lubCount === 0) {
      console.log('   Creating sample lubricants...');
      const sampleLubricants = [
        {
          lubricantName: 'Engine Oil 5W-30',
          productCode: 'EO5W30',
          mrpRate: 500,
          saleRate: 450,
          gstPercentage: 18,
          currentStock: 100,
          minimumStock: 20,
          isActive: true,
          createdAt: new Date(),
        },
        {
          lubricantName: 'Gear Oil 75W-90',
          productCode: 'GO75W90',
          mrpRate: 600,
          saleRate: 550,
          gstPercentage: 18,
          currentStock: 50,
          minimumStock: 10,
          isActive: true,
          createdAt: new Date(),
        }
      ];

      const result = await lubricantsCol.insertMany(sampleLubricants);
      console.log(`✅ Created ${result.insertedCount} sample lubricants`);
    } else {
      console.log('   Lubricants already exist, skipping creation');
    }

    // Test 6: Test Credit Customers collection
    console.log('\n📋 Test 6: Testing Credit Customers collection...');
    const creditCustomersCol = await getCollection('credit_customers');
    const customerCount = await creditCustomersCol.countDocuments();
    console.log(`   Current credit customers count: ${customerCount}`);

    // Test 7: Test Employees collection
    console.log('\n📋 Test 7: Testing Employees collection...');
    const employeesCol = await getCollection('employees');
    const empCount = await employeesCol.countDocuments();
    console.log(`   Current employees count: ${empCount}`);

    // Test 8: Test Vendors collection
    console.log('\n📋 Test 8: Testing Vendors collection...');
    const vendorsCol = await getCollection('vendors');
    const vendorCount = await vendorsCol.countDocuments();
    console.log(`   Current vendors count: ${vendorCount}`);

    // Test 9: Verify indexes
    console.log('\n📋 Test 9: Verifying indexes...');
    const fuelProductIndexes = await fuelProductsCol.indexes();
    console.log(`✅ Fuel Products indexes: ${fuelProductIndexes.length}`);
    fuelProductIndexes.forEach(idx => {
      const keys = Object.keys(idx.key).join(', ');
      console.log(`   - ${idx.name}: ${keys}${idx.unique ? ' (unique)' : ''}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ MongoDB Connection: SUCCESS`);
    console.log(`✅ Database: ${db.databaseName}`);
    console.log(`✅ Collections Available: ${collections.length}`);
    console.log(`✅ Fuel Products: ${existingCount} (${existingCount === 0 ? 'sample data created' : 'existing'})`);
    console.log(`✅ Lubricants: ${lubCount} (${lubCount === 0 ? 'sample data created' : 'existing'})`);
    console.log(`✅ Credit Customers: ${customerCount}`);
    console.log(`✅ Employees: ${empCount}`);
    console.log(`✅ Vendors: ${vendorCount}`);
    console.log('\n🎉 All MongoDB tests passed successfully!\n');

  } catch (error) {
    console.error('\n❌ MongoDB Test Failed:', error);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testMongoDBConnection();
