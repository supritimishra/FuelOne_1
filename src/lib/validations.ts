import { z } from "zod";

// Organization Settings validation
export const organizationSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  contact_number: z.string().regex(/^[0-9]{10}$/, "Contact number must be 10 digits").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  tin_gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format").optional().or(z.literal("")),
  sms_api_key: z.string().max(500, "API key must be less than 500 characters").optional().or(z.literal("")),
  bank_name: z.string().max(100, "Bank name must be less than 100 characters").optional().or(z.literal("")),
  bank_address: z.string().max(500, "Bank address must be less than 500 characters").optional().or(z.literal("")),
});

// Fuel Products validation
export const fuelProductSchema = z.object({
  product_name: z.string().min(1, "Product name is required").max(100, "Product name must be less than 100 characters"),
  short_name: z.string().min(1, "Short name is required").max(20, "Short name must be less than 20 characters"),
  lfrn: z.string().min(1, "LFR/KL is required").max(50, "LFR/KL must be less than 50 characters"),
  // GST is optional (no *)
  gst_percentage: z.number().min(0, "GST cannot be negative").max(100, "GST cannot exceed 100%").optional(),
  // VAT(WGT) and TCS(TDS) are required
  tds_percentage: z.number().min(0, "TCS cannot be negative").max(100, "TCS cannot exceed 100%"),
  wgt_percentage: z.number().min(0, "VAT cannot be negative").max(100, "VAT cannot exceed 100%"),
});

// Vendor validation
export const vendorSchema = z.object({
  vendor_name: z.string().min(1, "Vendor name is required").max(100, "Vendor name must be less than 100 characters"),
  phone_number: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional().or(z.literal("")),
  gst_tin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST/TIN format").optional().or(z.literal("")),
  vendor_type: z.enum(["Liquids", "Lubricants"]).optional(),
  opening_balance: z.number().min(0, "Opening balance cannot be negative"),
});

// Tank validation
export const tankSchema = z.object({
  tank_name: z.string().min(1, "Tank name is required").max(50, "Tank name must be less than 50 characters"),
  tank_capacity: z.number().min(1, "Tank capacity must be at least 1").max(1000000, "Tank capacity is too large"),
  current_stock: z.number().min(0, "Current stock cannot be negative"),
});

// Nozzle validation
export const nozzleSchema = z.object({
  nozzle_number: z.string().min(1, "Nozzle number is required").max(20, "Nozzle number must be less than 20 characters"),
  pump_station: z.string().max(50, "Pump station must be less than 50 characters").optional().or(z.literal("")),
});

// Credit Customer validation
export const creditCustomerSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required").max(100, "Organization name must be less than 100 characters"),
  mobile_number: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional().or(z.literal("")),
  phone_number: z.string().regex(/^[0-9]{10,11}$/, "Phone number must be 10-11 digits").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal("")),
  address: z.string().max(500, "Address must be less than 500 characters").optional().or(z.literal("")),
  credit_limit: z.number().min(0, "Credit limit cannot be negative").max(99999999.99, "Credit limit is too large"),
  opening_balance: z.number().max(99999999.99, "Opening balance is too large"),
});

// Sale Entry validation
export const saleEntrySchema = z.object({
  quantity: z.number().min(0.01, "Quantity must be positive").max(999999.99, "Quantity is too large"),
  price_per_unit: z.number().min(0.01, "Price must be positive").max(99999.99, "Price is too large"),
  opening_reading: z.number().min(0, "Opening reading cannot be negative").max(9999999.99, "Opening reading is too large"),
  closing_reading: z.number().min(0, "Closing reading cannot be negative").max(9999999.99, "Closing reading is too large"),
}).refine(data => data.closing_reading >= data.opening_reading, {
  message: "Closing reading must be greater than or equal to opening reading",
  path: ["closing_reading"],
});

// Guest Sale validation
export const guestSaleSchema = z.object({
  vehicle_number: z.string().max(20, "Vehicle number must be less than 20 characters").optional().or(z.literal("")),
  mobile_number: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional().or(z.literal("")),
  fuel_product_id: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive").max(999999.99, "Quantity is too large"),
  price_per_unit: z.number().min(0.01, "Price must be positive").max(99999.99, "Price is too large"),
  discount: z.number().min(0, "Discount cannot be negative").max(100000, "Discount is too large").optional(),
  payment_mode: z.enum(["Cash", "Card", "UPI", "Other"]).optional(),
});

// Credit Sale validation
export const creditSaleSchema = z.object({
  credit_customer_id: z.string().uuid("Invalid customer"),
  vehicle_number: z.string().max(20, "Vehicle number must be less than 20 characters").optional().or(z.literal("")),
  fuel_product_id: z.string().uuid("Invalid fuel product"),
  quantity: z.number().min(0.01, "Quantity must be positive").max(999999.99, "Quantity is too large"),
  price_per_unit: z.number().min(0.01, "Price must be positive").max(99999.99, "Price is too large"),
});

// Swipe Transaction validation
export const swipeTransactionSchema = z.object({
  swipe_type: z.enum(["Paytm", "PhonePe", "Fastag", "Other"]).optional(),
  swipe_mode: z.enum(["QR", "Card", "UPI"]).optional(),
  batch_number: z.string().max(50, "Batch number must be less than 50 characters").optional().or(z.literal("")),
  amount: z.number().min(0.01, "Amount must be positive").max(99999999.99, "Amount is too large"),
  employee_id: z.string().uuid("Invalid employee").optional(),
});

// Tanker Sale validation
export const tankerSaleSchema = z.object({
  fuel_product_id: z.string().uuid("Invalid fuel product"),
  before_dip_stock: z.number().min(0, "Before dip stock cannot be negative").max(999999.99, "Stock value is too large"),
  tanker_sale_quantity: z.number().min(0.01, "Quantity must be positive").max(999999.99, "Quantity is too large"),
  gross_stock: z.number().min(0, "Gross stock cannot be negative").max(999999.99, "Stock value is too large"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")),
});

// Lubricant Sale validation
export const lubricantSaleSchema = z.object({
  lubricant_id: z.string().uuid("Invalid lubricant"),
  quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(10000, "Quantity is too large"),
  sale_rate: z.number().min(0.01, "Sale rate must be positive").max(99999.99, "Sale rate is too large"),
  discount: z.number().min(0, "Discount cannot be negative").max(100000, "Discount is too large"),
  sale_type: z.enum(["Cash", "Credit"]),
  credit_customer_id: z.string().uuid("Invalid customer").optional(),
  employee_id: z.string().uuid("Invalid employee").optional(),
});

// Employee validation
export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  designation: z.string().max(50, "Designation must be less than 50 characters").optional().or(z.literal("")),
  mobile_number: z.string().regex(/^[0-9]{10}$/, "Mobile number must be 10 digits").optional().or(z.literal("")),
  salary_type: z.enum(["Monthly", "Daily", "Hourly"]).optional(),
  salary: z.number().min(0, "Salary cannot be negative").max(9999999.99, "Salary is too large"),
  pf_amount: z.number().min(0, "PF amount cannot be negative").max(999999.99, "PF amount is too large"),
  esi_amount: z.number().min(0, "ESI amount cannot be negative").max(999999.99, "ESI amount is too large"),
  income_tax: z.number().min(0, "Income tax cannot be negative").max(999999.99, "Income tax is too large"),
});

// Recovery validation
export const recoverySchema = z.object({
  credit_customer_id: z.string().uuid("Invalid customer"),
  received_amount: z.number().min(0.01, "Amount must be positive").max(99999999.99, "Amount is too large"),
  discount: z.number().min(0, "Discount cannot be negative").max(99999999.99, "Discount is too large"),
  payment_mode: z.enum(["Cash", "Bank Transfer", "Cheque", "Card", "UPI"]).optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")),
});

// Day Settlement validation
export const daySettlementSchema = z.object({
  opening_balance: z.number().min(0, "Opening balance cannot be negative").max(99999999.99, "Balance is too large"),
  meter_sale: z.number().min(0, "Meter sale cannot be negative").max(99999999.99, "Sale is too large"),
  lubricant_sale: z.number().min(0, "Lubricant sale cannot be negative").max(99999999.99, "Sale is too large"),
  credit_amount: z.number().min(0, "Credit amount cannot be negative").max(99999999.99, "Amount is too large"),
  total_sale: z.number().min(0, "Total sale cannot be negative").max(99999999.99, "Sale is too large"),
  expenses: z.number().min(0, "Expenses cannot be negative").max(99999999.99, "Expenses is too large"),
  closing_balance: z.number().min(0, "Closing balance cannot be negative").max(99999999.99, "Balance is too large"),
  shortage: z.number().max(99999999.99, "Shortage value is too large"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional().or(z.literal("")),
});

// Expense validation
export const expenseSchema = z.object({
  expense_type_id: z.string().uuid("Invalid expense type"),
  amount: z.number().min(0.01, "Amount must be positive").max(99999999.99, "Amount is too large"),
  payment_mode: z.enum(["Cash", "Bank Transfer", "Card", "UPI"]).optional(),
  flow_type: z.enum(["In", "Out"]).optional(),
  employee_id: z.string().uuid("Invalid employee").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")),
});

// Lubricant Product validation
export const lubricantSchema = z.object({
  lubricant_name: z.string().min(1, "Lubricant name is required").max(100, "Lubricant name must be less than 100 characters"),
  hsn_code: z.string().max(20, "HSN code must be less than 20 characters").optional().or(z.literal("")),
  mrp_rate: z.coerce.number().min(0, "MRP cannot be negative").max(99999.99, "MRP is too large").optional(),
  sale_rate: z.coerce.number().min(0, "Sale rate cannot be negative").max(99999.99, "Sale rate is too large").optional(),
  gst_percentage: z.coerce.number().min(0, "GST cannot be negative").max(100, "GST cannot exceed 100%").optional(),
  minimum_stock: z.coerce.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative").max(100000, "Quantity is too large").optional(),
  current_stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(100000, "Stock is too large").optional(),
  is_active: z.boolean().optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
export type FuelProductFormValues = z.infer<typeof fuelProductSchema>;
export type VendorFormValues = z.infer<typeof vendorSchema>;
export type TankFormValues = z.infer<typeof tankSchema>;
export type NozzleFormValues = z.infer<typeof nozzleSchema>;
export type CreditCustomerFormValues = z.infer<typeof creditCustomerSchema>;
export type SaleEntryFormValues = z.infer<typeof saleEntrySchema>;
export type GuestSaleFormValues = z.infer<typeof guestSaleSchema>;
export type CreditSaleFormValues = z.infer<typeof creditSaleSchema>;
export type SwipeTransactionFormValues = z.infer<typeof swipeTransactionSchema>;
export type TankerSaleFormValues = z.infer<typeof tankerSaleSchema>;
export type LubricantSaleFormValues = z.infer<typeof lubricantSaleSchema>;
export type EmployeeFormValues = z.infer<typeof employeeSchema>;
export type RecoveryFormValues = z.infer<typeof recoverySchema>;
export type DaySettlementFormValues = z.infer<typeof daySettlementSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type LubricantFormValues = z.infer<typeof lubricantSchema>;
