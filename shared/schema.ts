import { pgTable, uuid, text, timestamp, date, numeric, boolean, varchar, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// MULTI-TENANT TABLES (Master Database)
// ========================================

// Tenants Table - Stores metadata for each isolated database
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantDbName: text("tenant_db_name").notNull().unique(),
  organizationName: text("organization_name").notNull(),
  superAdminUserId: uuid("super_admin_user_id"), // Will be set after user creation
  superAdminEmail: text("super_admin_email").notNull().unique(),
  connectionString: text("connection_string").notNull(),
  status: text("status").notNull().default('active'), // 'active', 'suspended', 'deleted'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenant = typeof tenants.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;

// Tenant Users Mapping - Links users to their tenant (in master DB)
export const tenantUsers = pgTable("tenant_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userEmail: text("user_email").notNull(),
  userId: uuid("user_id").notNull(), // User ID in tenant's database
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTenantUserSchema = createInsertSchema(tenantUsers).omit({ id: true, createdAt: true });
export type InsertTenantUser = typeof tenantUsers.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;

// ========================================
// TENANT DATABASE TABLES
// ========================================

// Users Table (replacing Supabase auth.users)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User Roles Table
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'super_admin', 'manager', 'dsm'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true });
export type InsertUserRole = typeof userRoles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;

// Feature Permissions Table
export const featurePermissions = pgTable("feature_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureKey: text("feature_key").notNull().unique(),
  label: text("label").notNull(),
  featureGroup: text("feature_group"),
  description: text("description"),
  defaultEnabled: boolean("default_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeaturePermissionSchema = createInsertSchema(featurePermissions).omit({ id: true, createdAt: true });
export type InsertFeaturePermission = typeof featurePermissions.$inferInsert;
export type FeaturePermission = typeof featurePermissions.$inferSelect;

// User Feature Access Table
export const userFeatureAccess = pgTable("user_feature_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureId: uuid("feature_id").notNull().references(() => featurePermissions.id, { onDelete: "cascade" }),
  allowed: boolean("allowed").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userFeatureIdx: uniqueIndex("user_feature_access_user_feature_idx").on(table.userId, table.featureId),
}));

export const insertUserFeatureAccessSchema = createInsertSchema(userFeatureAccess).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserFeatureAccess = typeof userFeatureAccess.$inferInsert;
export type UserFeatureAccess = typeof userFeatureAccess.$inferSelect;

// Password Reset Tokens Table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Organization Details Table
export const organizationDetails = pgTable("organization_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationName: text("organization_name").notNull(),
  ownerName: text("owner_name"),
  address: text("address"),
  phoneNumber: text("phone_number"),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  branchName: text("branch_name"),
  upiId: text("upi_id"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrganizationDetailsSchema = createInsertSchema(organizationDetails).omit({ id: true, createdAt: true });
export type InsertOrganizationDetails = typeof organizationDetails.$inferInsert;
export type OrganizationDetails = typeof organizationDetails.$inferSelect;

// Employees Table
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeName: text("employee_name").notNull(),
  designation: text("designation"),
  phoneNumber: text("phone_number"),
  mobileNumber: text("mobile_number"),
  address: text("address"),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  joiningDate: date("joining_date"),
  joinDate: date("join_date"),
  employeeNumber: text("employee_number"),
  phoneNo: text("phone_no"),
  idProofNo: text("id_proof_no"),
  salaryType: text("salary_type"),
  hasPf: boolean("has_pf"),
  hasEsi: boolean("has_esi"),
  hasIncomeTax: boolean("has_income_tax"),
  description: text("description"),
  imageUrl: text("image_url"),
  status: text("status").default('Active'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export type InsertEmployee = typeof employees.$inferInsert;
export type Employee = typeof employees.$inferSelect;

// Duty Shifts Table
export const dutyShifts = pgTable("duty_shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  shiftName: text("shift_name").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  duties: integer("duties"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDutyShiftSchema = createInsertSchema(dutyShifts).omit({ id: true, createdAt: true });
export type InsertDutyShift = typeof dutyShifts.$inferInsert;
export type DutyShift = typeof dutyShifts.$inferSelect;

// Duty Pay Table
export const dutyPay = pgTable("duty_pay", {
  id: uuid("id").primaryKey().defaultRandom(),
  payMonth: date("pay_month").notNull(),
  totalSalary: numeric("total_salary", { precision: 12, scale: 2 }),
  totalEmployees: integer("total_employees"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertDutyPaySchema = createInsertSchema(dutyPay).omit({ id: true, createdAt: true });
export type InsertDutyPay = typeof dutyPay.$inferInsert;
export type DutyPay = typeof dutyPay.$inferSelect;

export const dutyPayRecords = pgTable("duty_pay_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  salaryDate: date("salary_date").notNull(),
  employeeId: uuid("employee_id").references(() => employees.id),
  shift: text("shift"),
  dutySalary: numeric("duty_salary", { precision: 12, scale: 2 }),
  grossSalary: numeric("gross_salary", { precision: 12, scale: 2 }),
  pf: numeric("pf", { precision: 12, scale: 2 }),
  esi: numeric("esi", { precision: 12, scale: 2 }),
  loanDeduction: numeric("loan_deduction", { precision: 12, scale: 2 }),
  advanceDeduction: numeric("advance_deduction", { precision: 12, scale: 2 }),
  businessShortage: numeric("business_shortage", { precision: 12, scale: 2 }),
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }),
  payMode: text("pay_mode"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDutyPayRecordSchema = createInsertSchema(dutyPayRecords).omit({ id: true, createdAt: true });
export type InsertDutyPayRecord = typeof dutyPayRecords.$inferInsert;
export type DutyPayRecord = typeof dutyPayRecords.$inferSelect;


// Fuel Products Table (aligning with UI requirements)
export const fuelProducts = pgTable("fuel_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  productName: text("product_name").notNull(),
  shortName: text("short_name").notNull(),
  gstPercentage: numeric("gst_percentage", { precision: 5, scale: 2 }),
  tdsPercentage: numeric("tds_percentage", { precision: 5, scale: 2 }),
  wgtPercentage: numeric("wgt_percentage", { precision: 5, scale: 2 }),
  lfrn: text("lfrn").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFuelProductSchema = createInsertSchema(fuelProducts).omit({ id: true, createdAt: true });
export type InsertFuelProduct = typeof fuelProducts.$inferInsert;
export type FuelProduct = typeof fuelProducts.$inferSelect;

// Tanks Table
export const tanks = pgTable("tanks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tankNumber: text("tank_number").notNull(),
  fuelProductId: uuid("fuel_product_id").references(() => fuelProducts.id),
  capacity: numeric("capacity", { precision: 12, scale: 3 }),
  currentStock: numeric("current_stock", { precision: 12, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTankSchema = createInsertSchema(tanks).omit({ id: true, createdAt: true });
export type InsertTank = typeof tanks.$inferInsert;
export type Tank = typeof tanks.$inferSelect;

// Tank Daily Readings Table
export const tankDailyReadings = pgTable("tank_daily_readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  readingDate: date("reading_date").notNull().default(sql`CURRENT_DATE`),
  tankId: text("tank_id"), // Changed from uuid to text to support mock/legacy IDs
  openingStock: numeric("opening_stock", { precision: 12, scale: 3 }),
  stockReceived: numeric("stock_received", { precision: 12, scale: 3 }).default("0"),
  meterSale: numeric("meter_sale", { precision: 12, scale: 3 }).default("0"),
  closingStock: numeric("closing_stock", { precision: 12, scale: 3 }),
  dipReading: numeric("dip_reading", { precision: 12, scale: 3 }),
  testing: numeric("testing", { precision: 12, scale: 3 }).default("0"),
  variation: numeric("variation", { precision: 12, scale: 3 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertTankDailyReadingSchema = createInsertSchema(tankDailyReadings).omit({ id: true, createdAt: true });
export type InsertTankDailyReading = typeof tankDailyReadings.$inferInsert;
export type TankDailyReading = typeof tankDailyReadings.$inferSelect;

// Nozzles Table
export const nozzles = pgTable("nozzles", {
  id: uuid("id").primaryKey().defaultRandom(),
  nozzleNumber: text("nozzle_number").notNull(),
  tankId: uuid("tank_id").references(() => tanks.id),
  fuelProductId: uuid("fuel_product_id").references(() => fuelProducts.id),
  pumpStation: text("pump_station"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNozzleSchema = createInsertSchema(nozzles).omit({ id: true, createdAt: true });
export type InsertNozzle = typeof nozzles.$inferInsert;
export type Nozzle = typeof nozzles.$inferSelect;

// Lubricants Table (adds gst_percentage, mrp_rate; retains minimum_stock/current_stock)
export const lubricants = pgTable("lubricants", {
  id: uuid("id").primaryKey().defaultRandom(),
  lubricantName: text("lubricant_name").notNull(),
  productCode: text("product_code"),
  mrpRate: numeric("mrp_rate", { precision: 10, scale: 2 }),
  saleRate: numeric("sale_rate", { precision: 10, scale: 2 }),
  gstPercentage: numeric("gst_percentage", { precision: 5, scale: 2 }),
  currentStock: integer("current_stock").default(0),
  minimumStock: integer("minimum_stock"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLubricantSchema = createInsertSchema(lubricants).omit({ id: true, createdAt: true });
export type InsertLubricant = typeof lubricants.$inferInsert;
export type Lubricant = typeof lubricants.$inferSelect;

// Credit Customers Table
export const creditCustomers = pgTable("credit_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationName: text("organization_name").notNull(),
  phoneNumber: text("phone_number"),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  address: text("address"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }),
  lastPaymentDate: date("last_payment_date"),
  registeredDate: date("registered_date"),
  tinGstNo: text("tin_gst_no"),
  representativeName: text("representative_name"),
  organizationAddress: text("organization_address"),
  advanceNo: text("advance_no"),
  imageUrl: text("image_url"),
  altPhoneNo: text("alt_phone_no"),
  username: text("username"),
  passwordHash: text("password_hash"),
  openingDate: date("opening_date"),
  balanceType: text("balance_type"),
  penaltyInterest: boolean("penalty_interest"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }),
  offerType: text("offer_type"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCreditCustomerSchema = createInsertSchema(creditCustomers).omit({ id: true, createdAt: true });
export type InsertCreditCustomer = typeof creditCustomers.$inferInsert;
export type CreditCustomer = typeof creditCustomers.$inferSelect;

// Vendors Table
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorName: text("vendor_name").notNull(),
  vendorType: text("vendor_type"), // 'Liquid', 'Lubricant', 'Both'
  contactPerson: text("contact_person"),
  phoneNumber: text("phone_number"),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  address: text("address"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }),
  openingDate: date("opening_date"),
  openingType: text("opening_type"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export type InsertVendor = typeof vendors.$inferInsert;
export type Vendor = typeof vendors.$inferSelect;

// Expense Types Table
export const expenseTypes = pgTable("expense_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseTypeName: text("expense_type_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseTypeSchema = createInsertSchema(expenseTypes).omit({ id: true, createdAt: true });
export type InsertExpenseType = typeof expenseTypes.$inferInsert;
export type ExpenseType = typeof expenseTypes.$inferSelect;

// Business Parties Table
export const businessParties = pgTable("business_parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  partyName: text("party_name").notNull().unique(),
  partyType: text("party_type"),
  contactPerson: text("contact_person"),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  address: text("address"),
  description: text("description"),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }),
  openingDate: date("opening_date"),
  openingType: text("opening_type"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBusinessPartySchema = createInsertSchema(businessParties).omit({ id: true, createdAt: true });
export type InsertBusinessParty = typeof businessParties.$inferInsert;
export type BusinessParty = typeof businessParties.$inferSelect;

// Liquid Purchases Table
export const liquidPurchases = pgTable("liquid_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  invoiceDate: date("invoice_date"),
  invoiceNo: text("invoice_no").notNull(),
  description: text("description"),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  imageUrl: text("image_url"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLiquidPurchaseSchema = createInsertSchema(liquidPurchases).omit({ id: true, createdAt: true });
export type InsertLiquidPurchase = typeof liquidPurchases.$inferInsert;
export type LiquidPurchase = typeof liquidPurchases.$inferSelect;

// Liquid Purchase Items Table
export const liquidPurchaseItems = pgTable("liquid_purchase_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id").notNull().references(() => liquidPurchases.id),
  productName: text("product_name").notNull(),
  purchaseRate: numeric("purchase_rate", { precision: 10, scale: 2 }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  vat: numeric("vat", { precision: 12, scale: 2 }),
  otherTaxes: numeric("other_taxes", { precision: 12, scale: 2 }),
  tcs: numeric("tcs", { precision: 12, scale: 2 }),
  itemTotal: numeric("item_total", { precision: 12, scale: 2 }),
  cess: numeric("cess", { precision: 12, scale: 2 }),
  addVat: numeric("add_vat", { precision: 12, scale: 2 }),
  invDensity: numeric("inv_density", { precision: 10, scale: 2 }),
  measuredDensity: numeric("measured_density", { precision: 12, scale: 2 }),
  variDensity: numeric("vari_density", { precision: 12, scale: 2 }),
  other: numeric("other", { precision: 12, scale: 2 }),
  lfr: numeric("lfr", { precision: 12, scale: 2 }),
  dc: numeric("dc", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLiquidPurchaseItemSchema = createInsertSchema(liquidPurchaseItems).omit({ id: true, createdAt: true });
export type InsertLiquidPurchaseItem = typeof liquidPurchaseItems.$inferInsert;
export type LiquidPurchaseItem = typeof liquidPurchaseItems.$inferSelect;

// Lubricant Purchases Table
export const lubPurchases = pgTable("lub_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  invoiceDate: date("invoice_date"),
  invoiceNo: text("invoice_no").notNull(),
  description: text("description"),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  imageUrl: text("image_url"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLubPurchaseSchema = createInsertSchema(lubPurchases).omit({ id: true, createdAt: true });
export type InsertLubPurchase = typeof lubPurchases.$inferInsert;
export type LubPurchase = typeof lubPurchases.$inferSelect;

// Sheet Records Table
export const sheetRecords = pgTable("sheet_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").default(sql`CURRENT_DATE`),
  sheetName: text("sheet_name"),
  openReading: numeric("open_reading", { precision: 12, scale: 3 }).default(sql`0`),
  closeReading: numeric("close_reading", { precision: 12, scale: 3 }).default(sql`0`),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSheetRecordSchema = createInsertSchema(sheetRecords).omit({ id: true, createdAt: true });
export type InsertSheetRecord = typeof sheetRecords.$inferInsert;
export type SheetRecord = typeof sheetRecords.$inferSelect;

// Day Cash Movements Table
export const dayCashMovements = pgTable("day_cash_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").default(sql`CURRENT_DATE`),
  inflows: numeric("inflows", { precision: 12, scale: 2 }).default(sql`0`),
  outflows: numeric("outflows", { precision: 12, scale: 2 }).default(sql`0`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDayCashMovementSchema = createInsertSchema(dayCashMovements).omit({ id: true, createdAt: true });
export type InsertDayCashMovement = typeof dayCashMovements.$inferInsert;
export type DayCashMovement = typeof dayCashMovements.$inferSelect;

// Expiry Items Table
export const expiryItems = pgTable("expiry_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemName: text("item_name").notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  category: text("category"),
  status: text("status").default('Active'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpiryItemSchema = createInsertSchema(expiryItems).omit({ id: true, createdAt: true });
export type InsertExpiryItem = typeof expiryItems.$inferInsert;
export type ExpiryItem = typeof expiryItems.$inferSelect;

export const expiryCategories = pgTable("expiry_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryName: text("category_name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpiryCategorySchema = createInsertSchema(expiryCategories).omit({ id: true, createdAt: true });
export type InsertExpiryCategory = typeof expiryCategories.$inferInsert;
export type ExpiryCategory = typeof expiryCategories.$inferSelect;

// Sale Entries Table
export const saleEntries = pgTable("sale_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleDate: date("sale_date").notNull().default(sql`CURRENT_DATE`),
  shiftId: uuid("shift_id").references(() => dutyShifts.id),
  pumpStation: text("pump_station"),
  nozzleId: uuid("nozzle_id").references(() => nozzles.id),
  fuelProductId: uuid("fuel_product_id").references(() => fuelProducts.id),
  openingReading: numeric("opening_reading", { precision: 12, scale: 3 }),
  closingReading: numeric("closing_reading", { precision: 12, scale: 3 }),
  quantity: numeric("quantity", { precision: 12, scale: 3 }),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }),
  netSaleAmount: numeric("net_sale_amount", { precision: 12, scale: 2 }),
  employeeId: uuid("employee_id"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertSaleEntrySchema = createInsertSchema(saleEntries).omit({ id: true, createdAt: true, quantity: true, netSaleAmount: true });
export type InsertSaleEntry = typeof saleEntries.$inferInsert;
export type SaleEntry = typeof saleEntries.$inferSelect;

// Lub Sales Table (Daily Operations)
export const lubSales = pgTable("lub_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleDate: date("sale_date").notNull(),
  shift: text("shift"), // 'S-1' or 'S-2'
  employeeId: uuid("employee_id").references(() => employees.id),
  product: text("product").notNull(),
  saleRate: numeric("sale_rate", { precision: 10, scale: 2 }).default(sql`0`),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default(sql`0`),
  discount: numeric("discount", { precision: 10, scale: 2 }).default(sql`0`),
  amount: numeric("amount", { precision: 12, scale: 2 }).default(sql`0`),
  description: text("description"),
  saleType: text("sale_type").default('Cash'), // 'Cash' or 'Credit'
  gst: numeric("gst", { precision: 5, scale: 2 }),
  customerName: text("customer_name"),
  tinGstNo: text("tin_gst_no"),
  billNo: text("bill_no"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLubSaleSchema = createInsertSchema(lubSales).omit({ id: true, createdAt: true });
export type InsertLubSale = typeof lubSales.$inferInsert;
export type LubSale = typeof lubSales.$inferSelect;

// App Config Table
export const appConfig = pgTable("app_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  configKey: text("config_key").unique().notNull(),
  configValue: text("config_value"),
  configType: text("config_type").default('string'),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppConfigSchema = createInsertSchema(appConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppConfig = typeof appConfig.$inferInsert;
export type AppConfig = typeof appConfig.$inferSelect;

// User Logs Table
export const userLogs = pgTable("user_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  module: text("module"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserLogSchema = createInsertSchema(userLogs).omit({ id: true, createdAt: true });
export type InsertUserLog = typeof userLogs.$inferInsert;
export type UserLog = typeof userLogs.$inferSelect;

// System Settings Table
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingName: text("setting_name").unique().notNull(),
  settingValue: text("setting_value"),
  settingCategory: text("setting_category"),
  description: text("description"),
  isEditable: boolean("is_editable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Lubricant Sales Table
export const lubricantSales = pgTable("lubricant_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleDate: date("sale_date").notNull().default(sql`CURRENT_DATE`),
  lubricantId: uuid("lubricant_id").references(() => lubricants.id),
  saleRate: numeric("sale_rate", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  saleType: text("sale_type"), // 'Cash', 'Credit'
  creditCustomerId: uuid("credit_customer_id").references(() => creditCustomers.id),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  employeeId: uuid("employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertLubricantSaleSchema = createInsertSchema(lubricantSales).omit({ id: true, createdAt: true, totalAmount: true });
export type InsertLubricantSale = typeof lubricantSales.$inferInsert;
export type LubricantSale = typeof lubricantSales.$inferSelect;

// Lubricant Loss Table
export const lubricantLoss = pgTable("lubricant_loss", {
  id: uuid("id").primaryKey().defaultRandom(),
  lossDate: date("loss_date").notNull().default(sql`CURRENT_DATE`),
  lubricantId: uuid("lubricant_id").notNull().references(() => lubricants.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertLubricantLossSchema = createInsertSchema(lubricantLoss).omit({ id: true, createdAt: true });
export type InsertLubricantLoss = typeof lubricantLoss.$inferInsert;
export type LubricantLoss = typeof lubricantLoss.$inferSelect;

// Credit Sales Table
export const creditSales = pgTable("credit_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleDate: date("sale_date").notNull().default(sql`CURRENT_DATE`),
  creditCustomerId: uuid("credit_customer_id").notNull().references(() => creditCustomers.id),
  vehicleNumber: text("vehicle_number"),
  fuelProductId: uuid("fuel_product_id").references(() => fuelProducts.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  employeeId: uuid("employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertCreditSaleSchema = createInsertSchema(creditSales).omit({ id: true, createdAt: true, totalAmount: true });
export type InsertCreditSale = typeof creditSales.$inferInsert;
export type CreditSale = typeof creditSales.$inferSelect;

// Swipe Transactions Table
export const swipeTransactions = pgTable("swipe_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionDate: date("transaction_date").notNull().default(sql`CURRENT_DATE`),
  employeeId: uuid("employee_id").references(() => employees.id),
  swipeType: text("swipe_type"),
  swipeMode: text("swipe_mode"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  batchNumber: text("batch_number"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertSwipeTransactionSchema = createInsertSchema(swipeTransactions).omit({ id: true, createdAt: true });
export type InsertSwipeTransaction = typeof swipeTransactions.$inferInsert;
export type SwipeTransaction = typeof swipeTransactions.$inferSelect;

// Swipe Machines Table
export const swipeMachines = pgTable("swipe_machines", {
  id: uuid("id").primaryKey().defaultRandom(),
  machineName: text("machine_name").notNull(),
  machineType: text("machine_type").notNull(), // 'Card', 'UPI'
  provider: text("provider").notNull(), // 'HDFC', 'SBI', 'PhonePe', etc.
  machineId: text("machine_id"), // Serial number or identifier
  status: text("status").notNull().default("Active"), // 'Active', 'Inactive'
  attachType: text("attach_type"), // 'Bank', 'Vendor', or null
  bankType: text("bank_type"), // Bank name if attach_type is 'Bank'
  vendorId: uuid("vendor_id").references(() => vendors.id), // Vendor ID if attach_type is 'Vendor'
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertSwipeMachineSchema = createInsertSchema(swipeMachines).omit({ id: true, createdAt: true });
export type InsertSwipeMachine = typeof swipeMachines.$inferInsert;
export type SwipeMachine = typeof swipeMachines.$inferSelect;

// Expenses Table
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseDate: date("expense_date").notNull().default(sql`CURRENT_DATE`),
  expenseTypeId: uuid("expense_type_id").references(() => expenseTypes.id),
  flowType: text("flow_type"), // 'Inflow', 'Outflow'
  paymentMode: text("payment_mode"), // 'Cash', 'Bank', 'UPI'
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  employeeId: uuid("employee_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type InsertExpense = typeof expenses.$inferInsert;
export type Expense = typeof expenses.$inferSelect;

// Recoveries Table
export const recoveries = pgTable("recoveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  recoveryDate: date("recovery_date").notNull().default(sql`CURRENT_DATE`),
  creditCustomerId: uuid("credit_customer_id").notNull().references(() => creditCustomers.id),
  receivedAmount: numeric("received_amount", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  paymentMode: text("payment_mode"), // 'Cash', 'Bank', 'UPI'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertRecoverySchema = createInsertSchema(recoveries).omit({ id: true, createdAt: true });
export type InsertRecovery = typeof recoveries.$inferInsert;
export type Recovery = typeof recoveries.$inferSelect;

// Employee Cash Recovery Table
export const employeeCashRecovery = pgTable("employee_cash_recovery", {
  id: uuid("id").primaryKey().defaultRandom(),
  recoveryDate: date("recovery_date").notNull().default(sql`CURRENT_DATE`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  balanceAmount: numeric("balance_amount", { precision: 12, scale: 2 }),
  collectionAmount: numeric("collection_amount", { precision: 12, scale: 2 }).notNull(),
  shortageAmount: numeric("shortage_amount", { precision: 12, scale: 2 }).default("0"),
  totalRecoveryCash: numeric("total_recovery_cash", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertEmployeeCashRecoverySchema = createInsertSchema(employeeCashRecovery).omit({ id: true, createdAt: true, totalRecoveryCash: true });
export type InsertEmployeeCashRecovery = typeof employeeCashRecovery.$inferInsert;
export type EmployeeCashRecovery = typeof employeeCashRecovery.$inferSelect;

// Day Settlements Table
export const daySettlements = pgTable("day_settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  settlementDate: date("settlement_date").notNull().default(sql`CURRENT_DATE`),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }),
  meterSale: numeric("meter_sale", { precision: 12, scale: 2 }),
  lubricantSale: numeric("lubricant_sale", { precision: 12, scale: 2 }),
  totalSale: numeric("total_sale", { precision: 12, scale: 2 }),
  creditAmount: numeric("credit_amount", { precision: 12, scale: 2 }),
  expenses: numeric("expenses", { precision: 12, scale: 2 }),
  shortage: numeric("shortage", { precision: 12, scale: 2 }).default("0"),
  closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertDaySettlementSchema = createInsertSchema(daySettlements).omit({ id: true, createdAt: true, totalSale: true });
export type InsertDaySettlement = typeof daySettlements.$inferInsert;
export type DaySettlement = typeof daySettlements.$inferSelect;

// Daily Sale Rates Table
export const dailySaleRates = pgTable("daily_sale_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  rateDate: date("rate_date").notNull().default(sql`CURRENT_DATE`),
  fuelProductId: uuid("fuel_product_id").notNull().references(() => fuelProducts.id),
  openRate: numeric("open_rate", { precision: 10, scale: 2 }),
  closeRate: numeric("close_rate", { precision: 10, scale: 2 }),
  variationAmount: numeric("variation_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertDailySaleRateSchema = createInsertSchema(dailySaleRates).omit({ id: true, createdAt: true });
export type InsertDailySaleRate = typeof dailySaleRates.$inferInsert;
export type DailySaleRate = typeof dailySaleRates.$inferSelect;

// Vendor Invoices Table
export const vendorInvoices = pgTable("vendor_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceDate: date("invoice_date").notNull().default(sql`CURRENT_DATE`),
  invoiceNumber: text("invoice_number").notNull(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  invoiceType: text("invoice_type"), // 'Liquid', 'Lubricant'
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  paymentStatus: text("payment_status").default('Pending'), // 'Pending', 'Paid', 'Partial'
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertVendorInvoiceSchema = createInsertSchema(vendorInvoices).omit({ id: true, createdAt: true, totalAmount: true });
export type InsertVendorInvoice = typeof vendorInvoices.$inferInsert;
export type VendorInvoice = typeof vendorInvoices.$inferSelect;

// Tanker Sales Table
export const tankerSales = pgTable("tanker_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleDate: date("sale_date").notNull().default(sql`CURRENT_DATE`),
  fuelProductId: uuid("fuel_product_id").notNull().references(() => fuelProducts.id),
  beforeDipStock: numeric("before_dip_stock", { precision: 12, scale: 3 }),
  grossStock: numeric("gross_stock", { precision: 12, scale: 3 }),
  tankerSaleQuantity: numeric("tanker_sale_quantity", { precision: 12, scale: 3 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertTankerSaleSchema = createInsertSchema(tankerSales).omit({ id: true, createdAt: true });
export type InsertTankerSale = typeof tankerSales.$inferInsert;
export type TankerSale = typeof tankerSales.$inferSelect;

// Guest Sales Table
export const guestSales = pgTable("guest_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleDate: date("sale_date").notNull().default(sql`CURRENT_DATE`),
  customerName: text("customer_name"),
  mobileNumber: text("mobile_number"),
  billNo: text("bill_no"),
  shift: text("shift"), // 'S-1', 'S-2'
  vehicleNumber: text("vehicle_number"),
  fuelProductId: uuid("fuel_product_id").notNull().references(() => fuelProducts.id),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  paymentMode: text("payment_mode"), // 'Cash', 'UPI', 'Card'
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  description: text("description"),
  employeeId: uuid("employee_id").references(() => employees.id),
  gstNumber: text("gst_number"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertGuestSaleSchema = createInsertSchema(guestSales).omit({ id: true, createdAt: true, totalAmount: true });
export type InsertGuestSale = typeof guestSales.$inferInsert;
export type GuestSale = typeof guestSales.$inferSelect;

// Interest Transactions Table
export const interestTransactions = pgTable("interest_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionDate: date("transaction_date").notNull().default(sql`CURRENT_DATE`),
  transactionType: text("transaction_type"), // 'Loan Taken', 'Loan Given', 'Interest Paid', 'Interest Received'
  partyName: text("party_name").notNull(),
  loanAmount: numeric("loan_amount", { precision: 12, scale: 2 }),
  interestAmount: numeric("interest_amount", { precision: 12, scale: 2 }),
  principalPaid: numeric("principal_paid", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertInterestTransactionSchema = createInsertSchema(interestTransactions).omit({ id: true, createdAt: true });
export type InsertInterestTransaction = typeof interestTransactions.$inferInsert;
export type InterestTransaction = typeof interestTransactions.$inferSelect;

// Vendor Transactions Table
export const vendorTransactions = pgTable("vendor_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionDate: date("transaction_date").notNull().default(sql`CURRENT_DATE`),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  transactionType: text("transaction_type"), // 'Credit', 'Debit'
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: text("payment_mode"), // 'Cash', 'Bank', 'UPI'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertVendorTransactionSchema = createInsertSchema(vendorTransactions).omit({ id: true, createdAt: true });
export type InsertVendorTransaction = typeof vendorTransactions.$inferInsert;
export type VendorTransaction = typeof vendorTransactions.$inferSelect;

// Business Transactions Table
export const businessTransactions = pgTable("business_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionDate: date("transaction_date").notNull().default(sql`CURRENT_DATE`),
  transactionType: text("transaction_type"), // 'Credit', 'Debit'
  partyName: text("party_name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertBusinessTransactionSchema = createInsertSchema(businessTransactions).omit({ id: true, createdAt: true });
export type InsertBusinessTransaction = typeof businessTransactions.$inferInsert;
export type BusinessTransaction = typeof businessTransactions.$inferSelect;

// Credit Requests Table
export const creditRequests = pgTable("credit_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestDate: date("request_date").notNull().default(sql`CURRENT_DATE`),
  creditCustomerId: uuid("credit_customer_id").notNull().references(() => creditCustomers.id),
  fuelProductId: uuid("fuel_product_id").references(() => fuelProducts.id),
  orderedQuantity: numeric("ordered_quantity", { precision: 12, scale: 3 }),
  status: text("status").default('Pending'), // 'Pending', 'Approved', 'Rejected'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertCreditRequestSchema = createInsertSchema(creditRequests).omit({ id: true, createdAt: true });
export type InsertCreditRequest = typeof creditRequests.$inferInsert;
export type CreditRequest = typeof creditRequests.$inferSelect;

// Attendance Table
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  attendanceDate: date("attendance_date").notNull().default(sql`CURRENT_DATE`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  status: text("status"), // 'Present', 'Absent', 'Half Day', 'Leave'
  shiftId: uuid("shift_id").references(() => dutyShifts.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export type InsertAttendance = typeof attendance.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;

// Sales Officer Inspections Table
export const salesOfficerInspections = pgTable("sales_officer_inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  inspectionDate: date("inspection_date").notNull().default(sql`CURRENT_DATE`),
  fuelProductId: uuid("fuel_product_id").notNull().references(() => fuelProducts.id),
  dipValue: numeric("dip_value", { precision: 12, scale: 3 }),
  totalSaleLiters: numeric("total_sale_liters", { precision: 12, scale: 3 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertSalesOfficerInspectionSchema = createInsertSchema(salesOfficerInspections).omit({ id: true, createdAt: true });
export type InsertSalesOfficerInspection = typeof salesOfficerInspections.$inferInsert;
export type SalesOfficerInspection = typeof salesOfficerInspections.$inferSelect;

// Denominations Table (for cash management)
export const denominations = pgTable("denominations", {
  id: uuid("id").primaryKey().defaultRandom(),
  denominationDate: date("denomination_date").notNull().default(sql`CURRENT_DATE`),
  note2000: integer("note_2000").default(0),
  note500: integer("note_500").default(0),
  note200: integer("note_200").default(0),
  note100: integer("note_100").default(0),
  note50: integer("note_50").default(0),
  note20: integer("note_20").default(0),
  note10: integer("note_10").default(0),
  coin10: integer("coin_10").default(0),
  coin5: integer("coin_5").default(0),
  coin2: integer("coin_2").default(0),
  coin1: integer("coin_1").default(0),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertDenominationSchema = createInsertSchema(denominations).omit({ id: true, createdAt: true, totalAmount: true });
export type InsertDenomination = typeof denominations.$inferInsert;
export type Denomination = typeof denominations.$inferSelect;

// Activity Logs Table (for auditing)
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(), // e.g., 'CREATE', 'UPDATE', 'DELETE', 'SETTLEMENT_SUBMIT'
  entity: text("entity").notNull(), // e.g., 'expenses', 'credit_sales'
  recordId: uuid("record_id"), // optional: the primary id of the affected record
  details: text("details"), // optional JSON string with extra info
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Print Templates Table
export const printTemplates = pgTable("print_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertPrintTemplateSchema = createInsertSchema(printTemplates).omit({ id: true, createdAt: true });
export type InsertPrintTemplate = typeof printTemplates.$inferInsert;
export type PrintTemplate = typeof printTemplates.$inferSelect;

// Feedback Table
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  mobileNumber: text("mobile_number"),
  rating: integer("rating"),
  message: text("message"), // We will treat this as comments
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });
export type InsertFeedback = typeof feedback.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;

// Opening Stock Table
export const openingStock = pgTable("opening_stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  product: text("product").notNull(),
  unit: text("unit"),
  openingStock: numeric("opening_stock", { precision: 12, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOpeningStockSchema = createInsertSchema(openingStock).omit({ id: true, createdAt: true });
export type OpeningStock = typeof openingStock.$inferSelect;
