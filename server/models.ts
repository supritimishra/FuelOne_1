import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 3.1 Interest Transactions
// ==========================================
export interface IInterestTransaction extends Document {
    transactionDate: Date;
    partyName: string;
    loanAmount?: number;
    interestAmount?: number;
    principalPaid?: number;
    transactionType: string;
    remarks?: string;
    paymentMode?: string;
    status?: string;
    settlementDate?: Date;
    createdBy?: string;
    createdAt: Date;
}

const InterestTransactionSchema = new Schema<IInterestTransaction>({
    transactionDate: { type: Date, required: true, default: Date.now },
    partyName: { type: String, required: true },
    loanAmount: { type: Number },
    interestAmount: { type: Number },
    principalPaid: { type: Number },
    transactionType: { type: String }, // 'Credit', 'Debit'
    remarks: { type: String },
    paymentMode: { type: String },
    status: { type: String, default: 'Pending' },
    settlementDate: { type: Date },
    createdBy: { type: String },
}, { timestamps: true });

export const InterestTransaction = mongoose.model<IInterestTransaction>('InterestTransaction', InterestTransactionSchema);

// ==========================================
// 3.2 Sheet Records
// ==========================================
export interface ISheetRecord extends Document {
    date: Date;
    sheetName?: string;
    openReading: number;
    closeReading: number;
    notes?: string;
    createdBy?: string;
}

const SheetRecordSchema = new Schema<ISheetRecord>({
    date: { type: Date, default: Date.now },
    sheetName: { type: String },
    openReading: { type: Number, default: 0 },
    closeReading: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: String },
}, { timestamps: true });

export const SheetRecord = mongoose.model<ISheetRecord>('SheetRecord', SheetRecordSchema);

// ==========================================
// 3.3 Day Cash Movements
// ==========================================
export interface IDayCashMovement extends Document {
    date: Date;
    inflows: number;
    outflows: number;
    notes?: string;
    createdAt: Date;
}

const DayCashMovementSchema = new Schema<IDayCashMovement>({
    date: { type: Date, default: Date.now },
    inflows: { type: Number, default: 0 },
    outflows: { type: Number, default: 0 },
    notes: { type: String },
}, { timestamps: true });

export const DayCashMovement = mongoose.model<IDayCashMovement>('DayCashMovement', DayCashMovementSchema);


// ==========================================
// 3.4 Tanker Sale
// ==========================================
export interface ITankerSale extends Document {
    saleDate: Date;
    fuelProductId: string; // Reference to Postgres ID
    tankId?: string; // Reference to Tank
    beforeDipStock?: number;
    grossStock?: number;
    tankerSaleQuantity: number;
    notes?: string;
    createdBy?: string;
}

const TankerSaleSchema = new Schema<ITankerSale>({
    saleDate: { type: Date, default: Date.now, required: true },
    fuelProductId: { type: String }, // Made optional
    tankId: { type: String }, // Added tankId
    beforeDipStock: { type: Number },
    grossStock: { type: Number },
    tankerSaleQuantity: { type: Number, required: true },
    notes: { type: String },
    createdBy: { type: String },
}, { timestamps: true });

export const TankerSale = mongoose.model<ITankerSale>('TankerSale', TankerSaleSchema);

// ==========================================
// 3.5 Guest Sales
// ==========================================
export interface IGuestSale extends Document {
    saleDate: Date;
    shift?: string;
    customerName: string;
    mobileNumber?: string;
    billNo?: string;
    vehicleNumber?: string;
    fuelProductId?: string; // Reference to Postgres ID
    pricePerUnit?: number;
    amount?: number;
    discount?: number;
    quantity?: number;
    totalAmount?: number;
    description?: string;
    paymentMode?: string;
    employeeId?: string; // Reference to Postgres ID
    gstNumber?: string;
    createdBy?: string;
}

const GuestSaleSchema = new Schema<IGuestSale>({
    saleDate: { type: Date, required: true },
    shift: { type: String },
    customerName: { type: String, required: true },
    mobileNumber: { type: String },
    billNo: { type: String },
    vehicleNumber: { type: String },
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
    createdBy: { type: String },
}, { timestamps: true });

export const GuestSale = mongoose.model<IGuestSale>('GuestSale', GuestSaleSchema);

// ==========================================
// 3.6 Attendance
// ==========================================
export interface IAttendance extends Document {
    attendanceDate: Date;
    employeeId: string; // Reference to Postgres ID
    status: string; // 'Present', 'Absent', 'Half Day'
    type?: string;
    shiftId?: string; // Reference to Postgres ID
    notes?: string;
    createdBy?: string;
}

const AttendanceSchema = new Schema<IAttendance>({
    attendanceDate: { type: Date, required: true },
    employeeId: { type: String, required: true },
    status: { type: String, required: true },
    type: { type: String },
    shiftId: { type: String },
    notes: { type: String },
    createdBy: { type: String },
}, { timestamps: true });

// Compound index for unique attendance per employee per day
AttendanceSchema.index({ attendanceDate: 1, employeeId: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

// ==========================================
// 3.7 Duty Pay
// ==========================================
export interface IDutyPayRecord extends Document {
    salaryDate: Date;
    employeeId: string; // Reference to Postgres ID
    shift?: string;
    dutySalary?: number;
    grossSalary?: number;
    pf?: number;
    esi?: number;
    loanDeduction?: number;
    advanceDeduction?: number;
    businessShortage?: number;
    netSalary?: number;
    payMode?: string;
}

const DutyPayRecordSchema = new Schema<IDutyPayRecord>({
    salaryDate: { type: Date, required: true },
    employeeId: { type: String, required: true },
    shift: { type: String },
    dutySalary: { type: Number },
    grossSalary: { type: Number },
    pf: { type: Number },
    esi: { type: Number },
    loanDeduction: { type: Number },
    advanceDeduction: { type: Number },
    businessShortage: { type: Number },
    netSalary: { type: Number },
    payMode: { type: String },
}, { timestamps: true });

export const DutyPayRecord = mongoose.model<IDutyPayRecord>('DutyPayRecord', DutyPayRecordSchema);

// ==========================================
// 3.8 Sales Officer
// ==========================================
export interface ISalesOfficerInspection extends Document {
    inspectionDate: Date;
    officerName: string;
    designation?: string;
    remarks?: string;
    tankId?: string; // Reference to Postgres ID
    fuelProductId?: string; // Reference to Postgres ID
    dipReading?: number;
    digitaMeterReading?: number; // typo in schema usually
    variance?: number;
    createdBy?: string;
}

const SalesOfficerInspectionSchema = new Schema<ISalesOfficerInspection>({
    inspectionDate: { type: Date, default: Date.now },
    officerName: { type: String, required: true },
    designation: { type: String },
    remarks: { type: String },
    tankId: { type: String },
    fuelProductId: { type: String },
    dipReading: { type: Number },
    digitaMeterReading: { type: Number },
    variance: { type: Number },
    createdBy: { type: String },
}, { timestamps: true });

export const SalesOfficerInspection = mongoose.model<ISalesOfficerInspection>('SalesOfficerInspection', SalesOfficerInspectionSchema);

// ==========================================
// 3.9 Credit Requests
// ==========================================
export interface ICreditRequest extends Document {
    requestDate: Date;
    creditCustomerId: string; // Reference to Postgres ID
    fuelProductId?: string; // Reference to Postgres ID
    quantity: number;
    status: string; // 'Pending', 'Approved', 'Rejected'
    description?: string;
    vehicleNumber?: string;
    createdBy?: string;
}

const CreditRequestSchema = new Schema<ICreditRequest>({
    requestDate: { type: Date, default: Date.now },
    creditCustomerId: { type: String, required: true },
    fuelProductId: { type: String },
    quantity: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    description: { type: String },
    vehicleNumber: { type: String },
    createdBy: { type: String },
}, { timestamps: true });

export const CreditRequest = mongoose.model<ICreditRequest>('CreditRequest', CreditRequestSchema);

// ==========================================
// 3.10 Expiry Items
// ==========================================
export interface IExpiryItem extends Document {
    itemName: string;
    issueDate?: Date;
    expiryDate?: Date;
    status?: string; // 'Active', 'Expired'
    createdAt: Date;
}

const ExpiryItemSchema = new Schema<IExpiryItem>({
    itemName: { type: String, required: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    status: { type: String, default: 'Active' },
}, { timestamps: true });

export const ExpiryItem = mongoose.model<IExpiryItem>('ExpiryItem', ExpiryItemSchema);

// ==========================================
// 3.11 Feedback
// ==========================================
export interface IFeedback extends Document {
    customerName?: string;
    mobileNumber?: string;
    rating: number;
    comments?: string;
    createdBy?: string;
}

const FeedbackSchema = new Schema<IFeedback>({
    customerName: { type: String },
    mobileNumber: { type: String },
    rating: { type: Number, required: true },
    comments: { type: String },
    createdBy: { type: String },
}, { timestamps: true });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

// ==========================================
// 3.12 Credit Customers (Organizations)
// ==========================================
export interface ICreditCustomer extends Document {
    organizationName: string;
    phoneNumber?: string;
    mobileNumber?: string;
    altPhone?: string; // New
    email?: string;
    address?: string; // organizationAddress alias
    creditLimit?: number;
    openingBalance?: number;
    currentBalance?: number;
    lastPaymentDate?: Date;
    registeredDate?: Date;
    tinGstNo?: string;
    representativeName?: string;
    organizationAddress?: string;
    advanceAmount?: number; // New
    username?: string; // New
    password?: string; // New
    openingDate?: Date; // New
    balanceType?: string; // New (Due/Excess)
    discountAmount?: number; // New
    offerType?: string; // New
    vehicles?: { vehicleNo: string; vehicleType: string }[]; // New
    penaltyInterest?: boolean; // New
    runInterest?: boolean; // New
    graceDays?: number; // New
    interestPercentage?: number; // New
    isActive?: boolean;
    createdAt: Date;
}

const CreditCustomerSchema = new Schema<ICreditCustomer>({
    _id: { type: String, required: true }, // Allow string UUIDs
    organizationName: { type: String, required: true },
    phoneNumber: { type: String },
    mobileNumber: { type: String },
    altPhone: { type: String },
    email: { type: String },
    address: { type: String },
    creditLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    registeredDate: { type: Date },
    tinGstNo: { type: String },
    representativeName: { type: String },
    organizationAddress: { type: String },
    advanceAmount: { type: Number },
    username: { type: String },
    password: { type: String },
    openingDate: { type: Date },
    balanceType: { type: String },
    discountAmount: { type: Number },
    vehicles: [{ vehicleNo: String, vehicleType: String }], // New
    penaltyInterest: { type: Boolean }, // New
    runInterest: { type: Boolean }, // New
    graceDays: { type: Number }, // New
    interestPercentage: { type: Number }, // New
    isActive: { type: Boolean, default: true },
    offerType: { type: String },
    image: { type: String }, // Base64 or URL
}, { timestamps: true });

export const CreditCustomer = mongoose.model<ICreditCustomer>('CreditCustomer', CreditCustomerSchema);

// ==========================================
// 3.13 Fuel Products (MongoDB)
// ==========================================
export interface IFuelProduct extends Document {
    productName: string;
    shortName: string;
    gstPercentage?: number;
    tdsPercentage?: number;
    wgtPercentage?: number;
    lfrn: string;
    isActive: boolean;
    createdAt: Date;
}

const FuelProductSchema = new Schema<IFuelProduct>({
    _id: { type: String, required: true }, // Allow string UUIDs from Postgres
    productName: { type: String, required: true },
    shortName: { type: String, required: true },
    gstPercentage: { type: Number },
    tdsPercentage: { type: Number },
    wgtPercentage: { type: Number },
    lfrn: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const FuelProduct = mongoose.model<IFuelProduct>('FuelProduct', FuelProductSchema);

// ==========================================
// 3.14 Lubricant Products (MongoDB)
// ==========================================
export interface ILubricantProduct extends Document {
    productName: string;
    gstPercentage?: number;
    hsnCode?: string;
    mrpRate?: number;
    saleRate?: number;
    minimumStock?: number;
    currentStock?: number;
    isActive: boolean;
    createdAt: Date;
}

const LubricantProductSchema = new Schema<ILubricantProduct>({
    _id: { type: String, required: true }, // Allow string UUIDs
    productName: { type: String, required: true },
    gstPercentage: { type: Number },
    hsnCode: { type: String },
    mrpRate: { type: Number },
    saleRate: { type: Number },
    minimumStock: { type: Number },
    currentStock: { type: Number },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const LubricantProduct = mongoose.model<ILubricantProduct>('LubricantProduct', LubricantProductSchema);

// ==========================================
// 3.15 Employees (MongoDB)
// ==========================================
export interface IEmployee extends Document {
    joinDate: Date;
    employeeName: string;
    employeeNumber?: string;
    mobileNumber?: string;
    idProofNumber?: string; // Aadhaar
    designation: string;
    salaryType: string; // 'Per Duty', 'Per Month'
    salary: number;
    image?: string; // Base64
    address?: string;
    description?: string;
    benefits?: {
        providentFund: boolean;
        incomeTax: boolean;
        esi: boolean;
    };
    isActive: boolean;
    createdAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
    _id: { type: String, required: true }, // Allow string UUIDs
    joinDate: { type: Date, required: true },
    employeeName: { type: String, required: true },
    employeeNumber: { type: String },
    mobileNumber: { type: String },
    idProofNumber: { type: String },
    designation: { type: String, required: true },
    salaryType: { type: String, required: true },
    salary: { type: Number, required: true },
    image: { type: String },
    address: { type: String },
    description: { type: String },
    benefits: {
        providentFund: { type: Boolean, default: false },
        incomeTax: { type: Boolean, default: false },
        esi: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);

// ==========================================
// 3.16 Expense Types (MongoDB)
// ==========================================
export interface IExpenseType extends Document {
    expenseName: string;
    effectType: string; // 'Employee', 'Profit'
    option?: string;
    isActive: boolean;
    createdAt: Date;
}

const ExpenseTypeSchema = new Schema<IExpenseType>({
    _id: { type: String, required: true },
    expenseName: { type: String, required: true },
    effectType: { type: String, required: true },
    option: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const ExpenseType = mongoose.model<IExpenseType>('ExpenseType', ExpenseTypeSchema);

// ==========================================
// 4.0 AUTHENTICATION & MULTI-TENANCY (MongoDB)
// ==========================================

// 4.1 Tenants (Master DB)
export interface ITenant extends Document {
    organizationName: string;
    superAdminEmail: string;
    superAdminUserId?: string;
    status: string; // 'active', 'suspended'
    createdAt: Date;
    connectionString?: string; // Kept for compatibility, though we might not use it in single-URI mode
}

const TenantSchema = new Schema<ITenant>({
    organizationName: { type: String, required: true },
    superAdminEmail: { type: String, required: true },
    superAdminUserId: { type: String },
    status: { type: String, default: 'active' },
    connectionString: { type: String },
}, { timestamps: true });

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);

// 4.2 Users (Per Tenant DB)
export interface IUser extends Document {
    email: string;
    username?: string;
    passwordHash: string;
    fullName?: string;
    roles: string[]; // ['super_admin', 'manager']
    status: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true },
    username: { type: String },
    passwordHash: { type: String, required: true },
    fullName: { type: String },
    roles: [{ type: String }],
    status: { type: String, default: 'active' },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

// 4.3 Tenant User Mapping (Master DB)
export interface ITenantUser extends Document {
    tenantId: string;
    userEmail: string;
    userId: string;
}

const TenantUserSchema = new Schema<ITenantUser>({
    tenantId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userId: { type: String, required: true },
}, { timestamps: true });

export const TenantUser = mongoose.model<ITenantUser>('TenantUser', TenantUserSchema);



// ==========================================
// 3.17 Tanks (MongoDB)
// ==========================================
export interface ITank extends Document {
    tankNumber: string;
    fuelProductId: string; // Reference to FuelProduct
    capacity: number;
    currentStock: number;
    isActive: boolean;
    createdAt: Date;
}

const TankSchema = new Schema<ITank>({
    _id: { type: String, required: true }, // Allow string UUIDs
    tankNumber: { type: String, required: true },
    fuelProductId: { type: String, required: true },
    capacity: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Tank = mongoose.model<ITank>('Tank', TankSchema);

// ==========================================
// 3.18 Nozzles (MongoDB)
// ==========================================
export interface INozzle extends Document {
    nozzleNumber: string;
    pumpStation: string; // 'P1', 'P2' etc
    tankId: string; // Reference to Tank
    fuelProductId: string; // Reference to FuelProduct
    isActive: boolean;
    createdAt: Date;
}

const NozzleSchema = new Schema<INozzle>({
    _id: { type: String, required: true }, // Allow string UUIDs
    nozzleNumber: { type: String, required: true },
    pumpStation: { type: String },
    tankId: { type: String },
    fuelProductId: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Nozzle = mongoose.model<INozzle>('Nozzle', NozzleSchema);

// ==========================================
// 3.19 Daily Sale Rates (MongoDB)
// ==========================================
export interface IDailySaleRate extends Document {
    rateDate: Date;
    fuelProductId: string; // Reference to FuelProduct
    openRate: number;
    closeRate: number;
    variationAmount?: number;
    createdBy?: string;
    createdAt: Date;
}

const DailySaleRateSchema = new Schema<IDailySaleRate>({
    rateDate: { type: Date, required: true },
    fuelProductId: { type: String, required: true },
    openRate: { type: Number, required: true },
    closeRate: { type: Number, required: true },
    variationAmount: { type: Number },
    createdBy: { type: String },
}, { timestamps: true });

export const DailySaleRate = mongoose.model<IDailySaleRate>('DailySaleRate', DailySaleRateSchema);

// ==========================================
// 3.20 Duty Shifts (MongoDB)
// ==========================================
export interface IDutyShift extends Document {
    shiftName: string;
    startTime: string;
    endTime: string;
    createdAt: Date;
}

const DutyShiftSchema = new Schema<IDutyShift>({
    _id: { type: String, required: true },
    shiftName: { type: String, required: true },
    startTime: { type: String },
    endTime: { type: String },
}, { timestamps: true });

export const DutyShift = mongoose.model<IDutyShift>('DutyShift', DutyShiftSchema);

// ==========================================
// 3.21 Sale Entries (MongoDB)
// ==========================================
export interface ISaleEntry extends Document {
    saleDate: Date;
    shiftId: string;
    pumpStation: string;
    nozzleId: string;
    fuelProductId: string;
    tankId?: string; // Optional linkage
    openingReading: number;
    closingReading: number;
    testQty?: number;
    pricePerUnit: number;
    quantity: number;
    netSaleAmount: number;
    employeeId: string;
    createdBy?: string;
    createdAt: Date;
}

const SaleEntrySchema = new Schema<ISaleEntry>({
    saleDate: { type: Date, required: true },
    shiftId: { type: String },
    pumpStation: { type: String },
    nozzleId: { type: String, required: true },
    fuelProductId: { type: String, required: true },
    tankId: { type: String },
    openingReading: { type: Number, required: true },
    closingReading: { type: Number, required: true },
    testQty: { type: Number, default: 0 },
    pricePerUnit: { type: Number, required: true },
    quantity: { type: Number, required: true },
    netSaleAmount: { type: Number, required: true },
    employeeId: { type: String, required: true },
    createdBy: { type: String },
}, { timestamps: true });

export const SaleEntry = mongoose.model<ISaleEntry>('SaleEntry', SaleEntrySchema);

// ==========================================
// 3.22 Tank Daily Readings (Sales Officer Report)
// ==========================================
export interface ITankDailyReading extends Document {
    readingDate: Date;
    tankId: string; // Reference to Tank
    openingStock: number;
    stockReceived: number;
    closingStock: number; // Dip Reading
    meterSale: number;
    testing: number;
    variation: number;
    notes?: string; // For nozzle readings JSON
    createdBy?: string;
    createdAt: Date;
}

const TankDailyReadingSchema = new Schema<ITankDailyReading>({
    readingDate: { type: Date, required: true },
    tankId: { type: String, required: true },
    openingStock: { type: Number, default: 0 },
    stockReceived: { type: Number, default: 0 },
    closingStock: { type: Number, required: true },
    meterSale: { type: Number, default: 0 },
    testing: { type: Number, default: 0 },
    variation: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: String },
}, { timestamps: true });

// Ensure one reading per tank per day
TankDailyReadingSchema.index({ readingDate: 1, tankId: 1 }, { unique: true });

export const TankDailyReading = mongoose.model<ITankDailyReading>('TankDailyReading', TankDailyReadingSchema);
