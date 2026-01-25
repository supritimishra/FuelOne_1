import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import path from 'path';

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const sampleParties = [
  {
    partyName: 'HALDER',
    partyType: 'Cash',
    phoneNumber: '0',
    email: '',
    address: '',
    description: '',
    openingBalance: 0,
    openingDate: new Date('2025-07-07'),
    openingType: 'Receivable',
    isActive: true,
    createdAt: new Date('2025-09-05T06:44:37'),
  },
  {
    partyName: 'BABU SONA',
    partyType: 'Cash',
    phoneNumber: '0',
    email: '',
    address: '',
    description: '',
    openingBalance: 0,
    openingDate: new Date('2025-07-15'),
    openingType: 'Receivable',
    isActive: true,
    createdAt: new Date('2025-09-03T04:07:52'),
  },
  {
    partyName: 'INDUS TOWER',
    partyType: 'Cash',
    phoneNumber: '0',
    email: '',
    address: '',
    description: '',
    openingBalance: 0,
    openingDate: new Date('2025-07-07'),
    openingType: 'Receivable',
    isActive: true,
    createdAt: new Date('2025-09-03T04:07:15'),
  },
  {
    partyName: 'SANJAY MANAGAR',
    partyType: 'Cash',
    phoneNumber: '0',
    email: '',
    address: '',
    description: '',
    openingBalance: 0,
    openingDate: new Date('2025-08-04'),
    openingType: 'Receivable',
    isActive: true,
    createdAt: new Date('2025-09-03T04:06:43'),
  },
  {
    partyName: 'DEB KUMAR',
    partyType: 'Cash',
    phoneNumber: '0',
    email: '',
    address: '',
    description: '',
    openingBalance: 0,
    openingDate: new Date('2025-07-01'),
    openingType: 'Receivable',
    isActive: true,
    createdAt: new Date('2025-07-21T06:50:33'),
  },
  {
    partyName: 'State Bank of India',
    partyType: 'Bank',
    phoneNumber: '1800-425-3800',
    email: 'sbi.care@sbi.co.in',
    address: 'Mumbai, Maharashtra',
    description: 'Main banking partner',
    openingBalance: 50000.00,
    openingDate: new Date('2025-04-01'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-04-01T10:00:00'),
  },
  {
    partyName: 'HDFC Bank',
    partyType: 'Bank',
    phoneNumber: '1800-202-6161',
    email: 'hdfcbank@hdfc.com',
    address: 'Delhi, India',
    description: 'Secondary banking account',
    openingBalance: 25000.00,
    openingDate: new Date('2025-04-15'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-04-15T09:30:00'),
  },
  {
    partyName: 'Reliance Petroleum',
    partyType: 'Creditor',
    phoneNumber: '022-4567-8900',
    email: 'petroleum@reliance.com',
    address: 'Jamnagar, Gujarat',
    description: 'Fuel supplier',
    openingBalance: 150000.00,
    openingDate: new Date('2025-03-01'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-03-01T08:00:00'),
  },
  {
    partyName: 'Indian Oil Corporation',
    partyType: 'Creditor',
    phoneNumber: '1800-233-3555',
    email: 'iocl@indianoil.in',
    address: 'New Delhi, India',
    description: 'Primary fuel supplier',
    openingBalance: 200000.00,
    openingDate: new Date('2025-03-15'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-03-15T07:45:00'),
  },
  {
    partyName: 'Rajesh Kumar - Owner',
    partyType: 'Owner',
    phoneNumber: '9876543210',
    email: 'rajesh.owner@fuelone.com',
    address: 'Bangalore, Karnataka',
    description: 'Business owner capital account',
    openingBalance: 500000.00,
    openingDate: new Date('2025-01-01'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00'),
  },
  {
    partyName: 'Bharat Tankers Ltd',
    partyType: 'Tanker',
    phoneNumber: '9123456789',
    email: 'info@bharattankers.com',
    address: 'Pune, Maharashtra',
    description: 'Fuel transportation partner',
    openingBalance: 30000.00,
    openingDate: new Date('2025-02-01'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-02-01T10:15:00'),
  },
  {
    partyName: 'Capital Investment Account',
    partyType: 'Capital',
    phoneNumber: '',
    email: '',
    address: '',
    description: 'Initial capital investment',
    openingBalance: 1000000.00,
    openingDate: new Date('2025-01-01'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00'),
  },
  {
    partyName: 'Petty Cash Account',
    partyType: 'Cash',
    phoneNumber: '',
    email: '',
    address: '',
    description: 'Daily operations cash',
    openingBalance: 10000.00,
    openingDate: new Date('2025-01-01'),
    openingType: 'Receivable',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00'),
  },
  {
    partyName: 'Axis Bank',
    partyType: 'Bank',
    phoneNumber: '1860-419-5555',
    email: 'customer.care@axisbank.com',
    address: 'Mumbai, Maharashtra',
    description: 'Loan account',
    openingBalance: 75000.00,
    openingDate: new Date('2025-05-01'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-05-01T11:00:00'),
  },
  {
    partyName: 'Shell India',
    partyType: 'Creditor',
    phoneNumber: '1800-103-8758',
    email: 'customercare@shell.com',
    address: 'Chennai, Tamil Nadu',
    description: 'Lubricants supplier',
    openingBalance: 45000.00,
    openingDate: new Date('2025-04-10'),
    openingType: 'Payable',
    isActive: true,
    createdAt: new Date('2025-04-10T09:00:00'),
  },
];

async function seedBusinessParties() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const dbName = process.env.DB_NAME || 'fuelmanagement';
    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);
    
    const collection = db.collection('business_parties');
    
    // Clear existing data (optional)
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing records`);
    
    // Insert sample data
    const result = await collection.insertMany(sampleParties);
    console.log(`Successfully inserted ${result.insertedCount} business parties`);
    
    // Verify insertion
    const count = await collection.countDocuments();
    console.log(`Total business parties in database: ${count}`);
    
  } catch (error) {
    console.error('Error seeding business parties:', error);
    throw error;
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedBusinessParties()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
