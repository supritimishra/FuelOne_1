import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://syntropylabworks_db_user:QArml7uLnqqg496U@cluster0.zlqfhe8.mongodb.net/fuelone";

const GuestSaleSchema = new mongoose.Schema({
    saleDate: { type: Date, required: true },
    shift: { type: String },
    customerName: { type: String, required: true },
    mobileNumber: { type: String },
    billNo: { type: String },
    vehicleNumber: { type: String },
    vehicleNumbers: [{ type: String }],
    fuelProductId: { type: String },
    pricePerUnit: { type: Number },
    amount: { type: Number },
    discount: { type: Number, default: 0 },
    quantity: { type: Number },
    totalAmount: { type: Number },
    description: { type: String },
    paymentMode: { type: String },
    employeeId: { type: String },
    gstNumber: { type: String },
    offerType: { type: String },
    status: { type: String, default: 'active' },
    createdBy: { type: String },
}, { timestamps: true });

const GuestSale = mongoose.model('GuestSale', GuestSaleSchema);

const sampleData = [
    {
        saleDate: new Date('2026-01-20'),
        customerName: 'Rajesh Kumar',
        mobileNumber: '9876543210',
        discount: 50,
        totalAmount: 50,
        offerType: 'flat',
        gstNumber: 'GST123456789',
        vehicleNumbers: ['KA01AB1234', 'KA02CD5678'],
        status: 'active',
    },
    {
        saleDate: new Date('2026-01-21'),
        customerName: 'Priya Sharma',
        mobileNumber: '9876543211',
        discount: 10,
        totalAmount: 10,
        offerType: 'percentage',
        gstNumber: 'GST987654321',
        vehicleNumbers: ['KA03EF9012'],
        status: 'active',
    },
    {
        saleDate: new Date('2026-01-22'),
        customerName: 'Amit Patel',
        mobileNumber: '9876543212',
        discount: 100,
        totalAmount: 100,
        offerType: 'flat',
        gstNumber: '',
        vehicleNumbers: ['KA04GH3456', 'KA05IJ7890', 'KA06KL1234'],
        status: 'active',
    },
    {
        saleDate: new Date('2026-01-23'),
        customerName: 'Sneha Reddy',
        mobileNumber: '9876543213',
        discount: 15,
        totalAmount: 15,
        offerType: 'percentage',
        gstNumber: 'GST456789123',
        vehicleNumbers: ['KA07MN5678'],
        status: 'inactive',
    },
    {
        saleDate: new Date('2026-01-24'),
        customerName: 'Vikram Singh',
        mobileNumber: '9876543214',
        discount: 75,
        totalAmount: 75,
        offerType: 'flat',
        gstNumber: 'GST321654987',
        vehicleNumbers: ['KA08OP9012', 'KA09QR3456'],
        status: 'active',
    },
    {
        saleDate: new Date('2026-01-25'),
        customerName: 'Meera Iyer',
        mobileNumber: '9876543215',
        discount: 5,
        totalAmount: 5,
        offerType: 'percentage',
        gstNumber: '',
        vehicleNumbers: ['KA10ST7890'],
        status: 'active',
    },
];

async function addGuestSalesData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if data already exists
        const existingCount = await GuestSale.countDocuments();
        console.log(`Current guest sales count: ${existingCount}`);

        if (existingCount >= 5) {
            console.log('✅ Guest sales data already exists. Skipping insertion.');
            await mongoose.connection.close();
            return;
        }

        console.log('Adding sample guest sales data...');
        const result = await GuestSale.insertMany(sampleData);
        console.log(`✅ Added ${result.length} guest sale entries`);

        // Display the added data
        console.log('\nAdded guest sales:');
        result.forEach((sale, idx) => {
            console.log(`${idx + 1}. ${sale.customerName} - ${sale.mobileNumber} - ${sale.vehicleNumbers.join(', ')}`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Script completed successfully');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addGuestSalesData();
