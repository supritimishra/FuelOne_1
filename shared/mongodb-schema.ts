import { ObjectId } from 'mongodb';

// ========================================
// MASTER DATABASE COLLECTIONS
// ========================================

export interface Tenant {
  _id?: ObjectId;
  tenantDbName: string;
  organizationName: string;
  superAdminUserId?: string;
  superAdminEmail: string;
  connectionString?: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  _id?: ObjectId;
  tenantId: ObjectId | string;
  userEmail: string;
  userId: string;
  createdAt: Date;
}

// ========================================
// USER MANAGEMENT COLLECTIONS
// ========================================

export interface User {
  _id?: ObjectId;
  email: string;
  username?: string;
  passwordHash: string;
  fullName?: string;
  createdAt: Date;
}

export interface UserRole {
  _id?: ObjectId;
  userId: ObjectId | string;
  role: 'super_admin' | 'manager' | 'dsm' | 'user';
  createdAt: Date;
}

export interface FeaturePermission {
  _id?: ObjectId;
  featureKey: string;
  label: string;
  featureGroup?: string;
  description?: string;
  defaultEnabled: boolean;
  createdAt: Date;
}

export interface UserFeatureAccess {
  _id?: ObjectId;
  userId: ObjectId | string;
  featureId: ObjectId | string;
  allowed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  _id?: ObjectId;
  userId: ObjectId | string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// ========================================
// MASTER DATA COLLECTIONS
// ========================================

export interface FuelProduct {
  _id?: ObjectId;
  productName: string;
  shortName: string;
  gstPercentage?: number;
  tdsPercentage?: number;
  wgtPercentage?: number;
  lfrn: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Tank {
  _id?: ObjectId;
  tankNumber: string;
  fuelProductId?: ObjectId | string;
  capacity?: number;
  currentStock?: number;
  createdAt: Date;
}

export interface TankDailyReading {
  _id?: ObjectId;
  readingDate: Date;
  tankId?: ObjectId | string;
  openingStock?: number;
  stockReceived?: number;
  meterSale?: number;
  closingStock?: number;
  dipReading?: number;
  variation?: number;
  notes?: string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface Nozzle {
  _id?: ObjectId;
  nozzleNumber: string;
  tankId?: ObjectId | string;
  fuelProductId?: ObjectId | string;
  pumpStation?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Lubricant {
  _id?: ObjectId;
  lubricantName: string;
  productCode?: string;
  mrpRate?: number;
  saleRate?: number;
  gstPercentage?: number;
  currentStock: number;
  minimumStock?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CreditCustomer {
  _id?: ObjectId;
  organizationName: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  openingBalance?: number;
  currentBalance?: number;
  lastPaymentDate?: Date;
  registeredDate?: Date;
  tinGstNo?: string;
  representativeName?: string;
  organizationAddress?: string;
  advanceNo?: string;
  imageUrl?: string;
  altPhoneNo?: string;
  username?: string;
  passwordHash?: string;
  openingDate?: Date;
  balanceType?: string;
  penaltyInterest?: boolean;
  discountAmount?: number;
  offerType?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  _id?: ObjectId;
  vendorName: string;
  vendorType?: string; // 'Liquid', 'Lubricant', 'Both'
  contactPerson?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  openingBalance?: number;
  currentBalance?: number;
  openingDate?: Date;
  openingType?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  _id?: ObjectId;
  employeeName: string;
  designation?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  address?: string;
  salary?: number;
  joiningDate?: Date;
  joinDate?: Date;
  employeeNumber?: string;
  phoneNo?: string;
  idProofNo?: string;
  salaryType?: string;
  hasPf?: boolean;
  hasEsi?: boolean;
  hasIncomeTax?: boolean;
  description?: string;
  imageUrl?: string;
  status: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ExpenseType {
  _id?: ObjectId;
  expenseTypeName: string;
  createdAt: Date;
}

export interface BusinessParty {
  _id?: ObjectId;
  partyName: string;
  partyType?: string;
  contactPerson?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  description?: string;
  openingBalance?: number;
  currentBalance?: number;
  openingDate?: Date;
  openingType?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SwipeMachine {
  _id?: ObjectId;
  machineName: string;
  machineType: string; // 'Card', 'UPI'
  provider: string; // 'HDFC', 'SBI', 'PhonePe', etc.
  machineId?: string;
  status: string; // 'Active', 'Inactive'
  attachType?: string; // 'Bank', 'Vendor'
  bankType?: string;
  vendorId?: ObjectId | string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface DutyShift {
  _id?: ObjectId;
  shiftName: string;
  startTime?: string;
  endTime?: string;
  duties?: number;
  createdAt: Date;
}

export interface DutyPay {
  _id?: ObjectId;
  payMonth: Date;
  totalSalary?: number;
  totalEmployees?: number;
  notes?: string;
  createdAt: Date;
}

// ========================================
// SALES COLLECTIONS
// ========================================

export interface GuestSale {
  _id?: ObjectId;
  saleDate: Date;
  mobileNumber?: string;
  vehicleNumber?: string;
  totalAmount: number;
  paymentMode?: string;
  description?: string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface CreditSale {
  _id?: ObjectId;
  saleDate: Date;
  creditCustomerId: ObjectId | string;
  totalAmount: number;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface SwipeTransaction {
  _id?: ObjectId;
  transactionDate: Date;
  swipeMachineId: ObjectId | string;
  totalAmount: number;
  batchNumber?: string;
  createdAt: Date;
}

export interface TankerSale {
  _id?: ObjectId;
  saleDate: Date;
  fuelProductId?: ObjectId | string;
  customerName: string;
  vehicleNumber: string;
  quantity: number;
  totalAmount: number;
  createdAt: Date;
}

export interface LubricantSale {
  _id?: ObjectId;
  saleDate: Date;
  lubricantId?: ObjectId | string;
  saleRate?: number;
  quantity: number;
  discount?: number;
  saleType: string; // 'Cash', 'Credit'
  creditCustomerId?: ObjectId | string;
  totalAmount: number;
  employeeId?: ObjectId | string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface LubSale {
  _id?: ObjectId;
  saleDate: Date;
  shift?: string;
  employeeId?: ObjectId | string;
  product: string;
  saleRate?: number;
  quantity?: number;
  discount?: number;
  amount?: number;
  description?: string;
  saleType: string; // 'Cash' or 'Credit'
  gst?: number;
  createdAt: Date;
}

export interface SaleEntry {
  _id?: ObjectId;
  saleDate: Date;
  shiftId?: ObjectId | string;
  pumpStation?: string;
  nozzleId?: ObjectId | string;
  fuelProductId?: ObjectId | string;
  openingReading?: number;
  closingReading?: number;
  quantity?: number;
  pricePerUnit?: number;
  netSaleAmount?: number;
  employeeId?: ObjectId | string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

// ========================================
// PURCHASE COLLECTIONS
// ========================================

export interface LiquidPurchase {
  _id?: ObjectId;
  date: Date;
  invoiceDate?: Date;
  invoiceNo: string;
  description?: string;
  vendorId?: ObjectId | string;
  imageUrl?: string;
  amount?: number;
  createdAt: Date;
}

export interface LiquidPurchaseItem {
  _id?: ObjectId;
  purchaseId: ObjectId | string;
  productName: string;
  purchaseRate?: number;
  quantity?: number;
  cost?: number;
  vat?: number;
  otherTaxes?: number;
  tcs?: number;
  itemTotal?: number;
  cess?: number;
  addVat?: number;
  invDensity?: number;
  measuredDensity?: number;
  variDensity?: number;
  other?: number;
  lfr?: number;
  dc?: number;
  createdAt: Date;
}

export interface LubPurchase {
  _id?: ObjectId;
  date: Date;
  invoiceDate?: Date;
  invoiceNo: string;
  description?: string;
  vendorId?: ObjectId | string;
  imageUrl?: string;
  amount?: number;
  createdAt: Date;
}

// ========================================
// OPERATIONAL COLLECTIONS
// ========================================

export interface Expense {
  _id?: ObjectId;
  expenseDate: Date;
  expenseTypeId?: ObjectId | string;
  flowType?: string; // 'Inflow', 'Outflow'
  paymentMode?: string; // 'Cash', 'Bank', 'UPI'
  amount: number;
  description?: string;
  employeeId?: ObjectId | string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface Recovery {
  _id?: ObjectId;
  recoveryDate: Date;
  creditCustomerId: ObjectId | string;
  receivedAmount: number;
  discount?: number;
  paymentMode?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface DaySettlement {
  _id?: ObjectId;
  settlementDate: Date;
  openingBalance?: number;
  meterSale?: number;
  lubricantSale?: number;
  totalSale?: number;
  creditAmount?: number;
  expenses?: number;
  shortage?: number;
  closingBalance?: number;
  notes?: string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

// ========================================
// UTILITY COLLECTIONS
// ========================================

export interface Denomination {
  _id?: ObjectId;
  denominationDate: Date;
  note2000?: number;
  note500?: number;
  note200?: number;
  note100?: number;
  note50?: number;
  note20?: number;
  note10?: number;
  coin10?: number;
  coin5?: number;
  coin2?: number;
  coin1?: number;
  totalAmount?: number;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface ActivityLog {
  _id?: ObjectId;
  userId?: ObjectId | string;
  action: string; // 'CREATE', 'UPDATE', 'DELETE'
  entity: string; // 'expenses', 'credit_sales', etc.
  recordId?: ObjectId | string;
  details?: string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface PrintTemplate {
  _id?: ObjectId;
  name: string;
  content?: string;
  createdAt: Date;
  createdBy?: ObjectId | string;
}

export interface OrganizationDetails {
  _id?: ObjectId;
  organizationName: string;
  ownerName?: string;
  address?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  logoUrl?: string;
  createdAt: Date;
}

export interface AppConfig {
  _id?: ObjectId;
  configKey: string;
  configValue?: string;
  configType: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSetting {
  _id?: ObjectId;
  settingName: string;
  settingValue?: string;
  settingCategory?: string;
  description?: string;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
