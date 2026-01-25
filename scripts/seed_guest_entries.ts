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

const customerNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vijay Singh',
  'Anita Mehta', 'Rahul Verma', 'Pooja Gupta', 'Sanjay Desai', 'Kavita Nair',
  'Manoj Joshi', 'Deepa Iyer', 'Arun Pandey', 'Rekha Bose', 'Sunil Kapoor',
  'Meera Chatterjee', 'Kiran Agarwal', 'Ravi Menon', 'Sunita Rao', 'Ashok Pillai',
  'Lakshmi Krishnan', 'Dinesh Shah', 'Neha Sinha', 'Prakash Mishra', 'Swati Kulkarni',
  'Gopal Naidu', 'Anjali Varma', 'Vikram Chawla', 'Radha Jain', 'Harish Yadav'
];

const offerTypes = [
  'Per 1 ltr', 'Per 100 Rs', 'Per 1 ltr', 'Per 100 Rs', 'Per 1 ltr',
  'Per 100 Rs', 'Per 1 ltr', 'Per 100 Rs', 'Per 1 ltr', 'Per 100 Rs'
];

const vehicleNumbers = [
  'KA01AB1234', 'MH02CD5678', 'DL03EF9012', 'TN04GH3456', 'KL05IJ7890',
  'GJ06KL1234', 'RJ07MN5678', 'UP08OP9012', 'WB09QR3456', 'AP10ST7890',
  'HR11UV1234', 'PB12WX5678', 'MP13YZ9012', 'TS14AA3456', 'OR15BB7890',
  'JH16CC1234', 'CH17DD5678', 'UK18EE9012', 'BR19FF3456', 'AS20GG7890',
  'KA21HH1234', 'MH22II5678', 'DL23JJ9012', 'TN24KK3456', 'KL25LL7890',
  'GJ26MM1234', 'RJ27NN5678', 'UP28OO9012', 'WB29PP3456', 'AP30QQ7890'
];

const gstNumbers = [
  '29ABCDE1234F1Z5', '27FGHIJ5678K2Y4', '07KLMNO9012L3X3', '33PQRST3456M4W2',
  '32UVWXY7890N5V1', '24ZABCD1234O6U9', '08EFGHI5678P7T8', '09JKLMN9012Q8S7',
  '19OPQRS3456R9R6', '28TUVWX7890S0Q5', '06YZABC1234T1P4', '03DEFGH5678U2O3',
  '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
];

function generatePhoneNumber(): string {
  const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function getRandomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

function getRandomDiscountAmount(): number {
  const discounts = [0, 0, 0, 50, 100, 150, 200, 250, 300, 500];
  return discounts[Math.floor(Math.random() * discounts.length)];
}

async function seedGuestEntries() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('guest_entries');

    // Check if collection already has data
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Collection already has ${count} documents. Skipping seed.`);
      return;
    }

    const guestEntries = [];
    
    for (let i = 0; i < 30; i++) {
      const saleDate = getRandomDate(90);
      const discountAmount = getRandomDiscountAmount();
      const hasGst = Math.random() > 0.5;
      
      guestEntries.push({
        sale_date: saleDate,
        customer_name: customerNames[i],
        mobile_number: generatePhoneNumber(),
        discount_amount: discountAmount,
        offer_type: offerTypes[i % offerTypes.length],
        gst_tin_no: hasGst ? gstNumbers[i] : '',
        vehicle_number: vehicleNumbers[i],
        status: Math.random() > 0.1 ? 'ACTIVATED' : 'DEACTIVATED',
        created_at: new Date(saleDate.getTime() - 60000), // 1 minute before sale
        created_by: 'admin@fuelone.com',
        created_by_name: 'Super Admin',
        updated_at: saleDate,
      });
    }

    const result = await collection.insertMany(guestEntries);
    console.log(`✅ Successfully inserted ${result.insertedCount} guest entries`);

    // Create indexes
    await collection.createIndex({ sale_date: -1 });
    await collection.createIndex({ customer_name: 1 });
    await collection.createIndex({ mobile_number: 1 });
    await collection.createIndex({ vehicle_number: 1 });
    await collection.createIndex({ created_at: -1 });
    await collection.createIndex({ status: 1 });
    console.log('✅ Indexes created successfully');

  } catch (error) {
    console.error('❌ Error seeding guest entries:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedGuestEntries()
  .then(() => {
    console.log('🎉 Guest entries seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
