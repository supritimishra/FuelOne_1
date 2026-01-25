import { MongoClient, Db, Collection } from 'mongodb';
import { config } from "dotenv";
import path from "path";

// Load .local.env file
config({ path: path.resolve(process.cwd(), '.local.env') });

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provision a database?",
  );
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (mongoDb) {
    return mongoDb;
  }

  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
    
    mongoDb = mongoClient.db(process.env.DB_NAME || 'fuelone');
    
    // Create indexes for better performance
    await createIndexes(mongoDb);
    
    return mongoDb;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  if (!mongoDb) {
    return connectToDatabase();
  }
  return mongoDb;
}

export async function getCollection(name: string): Promise<Collection> {
  const db = await getDatabase();
  return db.collection(name);
}

export async function createIndexes(db: Db) {
  try {
    // Users indexes
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ username: 1 }, { unique: true, sparse: true });

    // Tenants indexes
    const tenants = db.collection('tenants');
    await tenants.createIndex({ tenantDbName: 1 }, { unique: true });
    await tenants.createIndex({ superAdminEmail: 1 }, { unique: true });

    // Tenant Users indexes
    const tenantUsers = db.collection('tenant_users');
    await tenantUsers.createIndex({ tenantId: 1, userEmail: 1 });
    await tenantUsers.createIndex({ userEmail: 1 });

    // Fuel Products indexes
    const fuelProducts = db.collection('fuel_products');
    await fuelProducts.createIndex({ productName: 1 });

    // Lubricants indexes
    const lubricants = db.collection('lubricants');
    await lubricants.createIndex({ lubricantName: 1 });

    // Credit Customers indexes
    const creditCustomers = db.collection('credit_customers');
    await creditCustomers.createIndex({ organization_name: 1 });
    await creditCustomers.createIndex({ email: 1 }, { sparse: true });
    await creditCustomers.createIndex({ phone_number: 1 }, { sparse: true });
    await creditCustomers.createIndex({ tin_gst_no: 1 }, { sparse: true });
    await creditCustomers.createIndex({ registered_date: -1 });
    await creditCustomers.createIndex({ is_active: 1 });

    // Vendors indexes
    const vendors = db.collection('vendors');
    await vendors.createIndex({ vendorName: 1 });

    // Employees indexes
    const employees = db.collection('employees');
    await employees.createIndex({ employeeName: 1 });
    await employees.createIndex({ employee_name: 1 });
    await employees.createIndex({ employee_number: 1 });

    // Business Parties indexes
    const businessParties = db.collection('business_parties');
    await businessParties.createIndex({ partyName: 1 }, { unique: true });

    // Swipe Machines indexes
    const swipeMachines = db.collection('swipe_machines');
    await swipeMachines.createIndex({ machineId: 1 });

    // Tanks indexes
    const tanks = db.collection('tanks');
    await tanks.createIndex({ tankNumber: 1 });

    // Nozzles indexes
    const nozzles = db.collection('nozzles');
    await nozzles.createIndex({ nozzleNumber: 1 });

    // Guest Sales indexes
    const guestSales = db.collection('guest_sales');
    await guestSales.createIndex({ saleDate: -1 });
    await guestSales.createIndex({ mobileNumber: 1 });

    // Credit Sales indexes
    const creditSales = db.collection('credit_sales');
    await creditSales.createIndex({ creditCustomerId: 1 });
    await creditSales.createIndex({ saleDate: -1 });

    // Liquid Purchases indexes
    const liquidPurchases = db.collection('liquid_purchases');
    await liquidPurchases.createIndex({ vendorId: 1 });
    await liquidPurchases.createIndex({ date: -1 });

    // Activity Logs indexes
    const activityLogs = db.collection('activity_logs');
    await activityLogs.createIndex({ userId: 1 });
    await activityLogs.createIndex({ createdAt: -1 });

    // Duty Pay Records indexes
    const dutyPayRecords = db.collection('duty_pay_records');
    await dutyPayRecords.createIndex({ pay_month: -1 });
    await dutyPayRecords.createIndex({ created_at: -1 });

    // Duty Shifts indexes
    const dutyShifts = db.collection('duty_shifts');
    await dutyShifts.createIndex({ shift_name: 1 });
    await dutyShifts.createIndex({ created_at: -1 });
    await dutyShifts.createIndex({ is_active: 1 });

    // Guest Entries indexes
    const guestEntries = db.collection('guest_entries');
    await guestEntries.createIndex({ sale_date: -1 });
    await guestEntries.createIndex({ customer_name: 1 });
    await guestEntries.createIndex({ mobile_number: 1 });
    await guestEntries.createIndex({ vehicle_number: 1 });
    await guestEntries.createIndex({ created_at: -1 });
    await guestEntries.createIndex({ status: 1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.warn('⚠️ Error creating indexes:', error);
    // Don't throw - indexes can be created manually later
  }
}

export async function disconnectDatabase() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
    console.log('✅ Disconnected from MongoDB');
  }
}

// Export database object for backward compatibility
export const db = {
  select: async (...args: any[]) => {
    // This is a placeholder for compatibility
    const database = await getDatabase();
    return database;
  }
};

export { mongoClient, mongoDb };
