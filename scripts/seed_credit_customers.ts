import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'fuelone';

async function seedCreditCustomers() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('credit_customers');

    // Sample credit customers data
    const sampleCustomers = [
      {
        registered_date: '2026-01-01',
        organization_name: 'ABC Transport Ltd',
        tin_gst_no: 'GST12345ABC',
        representative_name: 'Rajesh Kumar',
        organization_address: '123 Transport Nagar, Delhi',
        advance_no: '5000',
        phone_number: '9876543210',
        mobile_number: '9876543210',
        alt_phone_no: '9876543211',
        credit_limit: 100000,
        username: 'abc_transport',
        password: 'pass123',
        email: 'rajesh@abctransport.com',
        opening_balance: 15000,
        opening_date: '2026-01-01',
        balance_type: 'Credit',
        current_balance: 15000,
        penalty_interest: true,
        run_interest: 'Yes',
        grace_days: 30,
        interest_percentage: 12,
        discount_amount: 2,
        offer_type: 'Per 1 ltr',
        vehicle_no: 'DL01AB1234',
        vehicle_type: 'Truck',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        registered_date: '2026-01-02',
        organization_name: 'XYZ Logistics Pvt Ltd',
        tin_gst_no: 'GST67890XYZ',
        representative_name: 'Priya Sharma',
        organization_address: '456 Logistics Park, Mumbai',
        advance_no: '10000',
        phone_number: '9876543220',
        mobile_number: '9876543220',
        alt_phone_no: '9876543221',
        credit_limit: 150000,
        username: 'xyz_logistics',
        password: 'pass456',
        email: 'priya@xyzlogistics.com',
        opening_balance: 25000,
        opening_date: '2026-01-02',
        balance_type: 'Credit',
        current_balance: 25000,
        penalty_interest: true,
        run_interest: 'Yes',
        grace_days: 45,
        interest_percentage: 10,
        discount_amount: 3,
        offer_type: 'Per 1 ltr',
        vehicle_no: 'MH02CD5678',
        vehicle_type: 'Truck',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        registered_date: '2026-01-03',
        organization_name: 'DEF Courier Services',
        tin_gst_no: 'GST11223DEF',
        representative_name: 'Amit Patel',
        organization_address: '789 Business District, Bangalore',
        advance_no: '3000',
        phone_number: '9876543230',
        mobile_number: '9876543230',
        alt_phone_no: '',
        credit_limit: 75000,
        username: 'def_courier',
        password: 'pass789',
        email: 'amit@defcourier.com',
        opening_balance: 8000,
        opening_date: '2026-01-03',
        balance_type: 'Credit',
        current_balance: 8000,
        penalty_interest: false,
        run_interest: 'No',
        grace_days: 0,
        interest_percentage: 0,
        discount_amount: 1.5,
        offer_type: 'Per Transaction',
        vehicle_no: 'KA03EF9012',
        vehicle_type: 'Car',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        registered_date: '2026-01-04',
        organization_name: 'GHI Freight Movers',
        tin_gst_no: 'GST44556GHI',
        representative_name: 'Sunita Reddy',
        organization_address: '321 Industrial Area, Hyderabad',
        advance_no: '7500',
        phone_number: '9876543240',
        mobile_number: '9876543240',
        alt_phone_no: '9876543241',
        credit_limit: 200000,
        username: 'ghi_freight',
        password: 'pass321',
        email: 'sunita@ghifreight.com',
        opening_balance: 35000,
        opening_date: '2026-01-04',
        balance_type: 'Debit',
        current_balance: 35000,
        penalty_interest: true,
        run_interest: 'Yes',
        grace_days: 60,
        interest_percentage: 15,
        discount_amount: 4,
        offer_type: 'Per 1 ltr',
        vehicle_no: 'TS04GH3456',
        vehicle_type: 'Truck',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        registered_date: '2026-01-05',
        organization_name: 'JKL Express Services',
        tin_gst_no: 'GST77889JKL',
        representative_name: 'Vikram Singh',
        organization_address: '654 Highway Road, Pune',
        advance_no: '2000',
        phone_number: '9876543250',
        mobile_number: '9876543250',
        alt_phone_no: '',
        credit_limit: 50000,
        username: 'jkl_express',
        password: 'pass654',
        email: 'vikram@jklexpress.com',
        opening_balance: 5000,
        opening_date: '2026-01-05',
        balance_type: 'Credit',
        current_balance: 5000,
        penalty_interest: false,
        run_interest: 'No',
        grace_days: 0,
        interest_percentage: 0,
        discount_amount: 1,
        offer_type: 'Per 1 ltr',
        vehicle_no: 'MH12IJ7890',
        vehicle_type: 'Bike',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        registered_date: '2026-01-06',
        organization_name: 'MNO Cargo Solutions',
        tin_gst_no: 'GST99001MNO',
        representative_name: 'Meera Joshi',
        organization_address: '987 Port Area, Chennai',
        advance_no: '12000',
        phone_number: '9876543260',
        mobile_number: '9876543260',
        alt_phone_no: '9876543261',
        credit_limit: 180000,
        username: 'mno_cargo',
        password: 'pass987',
        email: 'meera@mnocargo.com',
        opening_balance: 42000,
        opening_date: '2026-01-06',
        balance_type: 'Credit',
        current_balance: 42000,
        penalty_interest: true,
        run_interest: 'Yes',
        grace_days: 30,
        interest_percentage: 11,
        discount_amount: 2.5,
        offer_type: 'Per 1 ltr',
        vehicle_no: 'TN05KL1234',
        vehicle_type: 'Truck',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing credit customers...');
    await collection.deleteMany({});

    // Insert sample data
    console.log('📝 Inserting sample credit customers...');
    const result = await collection.insertMany(sampleCustomers);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} credit customers`);
    
    // Display inserted data
    console.log('\n📋 Inserted Customers:');
    sampleCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.organization_name} - ${customer.phone_number}`);
    });

  } catch (error) {
    console.error('❌ Error seeding credit customers:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the seed function
seedCreditCustomers();
