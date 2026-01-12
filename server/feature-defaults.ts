// Central definition of feature bundles used by Developer Mode
// Ensure these keys match those used in allowFeature() and the sidebar

export const BASIC_FEATURES: string[] = [
  // Always allow dashboard for basic access
  'dashboard',
  // Core daily accounting (meter → liters × rate = value)
  'fuel_products',
  'tank_nozzle',
  'daily_sale_rate',
  'sale_entry',
  // Stock control (dips/opening)
  'tank_dips',
  // Optional if you derive from dips; keep for explicit workflows
  'day_opening_stock',
  // Non-fuel revenues
  'lub_sale',
  'ne_pol_sales',
  // Money in/out
  'swipe',
  'recovery',
  'expenses',
  'denominations',
  // Credit & statements
  'credit_customer_balance',
  'credit_customers',
  'credit_sale',
  'statement_generation',
  // Daily close
  'day_settlement',
  'shift_sheet_entry',
  // Output
  'print_templates',
];

export const ADVANCED_FEATURES: string[] = [
  // Masters and procurement
  'vendors',
  'liquid_purchase',
  'lubs_purchase',
  'vendor_transactions',
  'business_crdr_transactions',
  // Reporting & analytics
  'reports',
  'credit_limit_reports',
  'interest_transactions',
  // Operations & HR
  'attendance',
  'duty_pay',
  'duty_pay_shift',
  // Compliance/audit
  'sales_officer',
  // Misc/auxiliary
  'generated_invoices',
  'generate_sale_invoice',
  'expiry_items',
  'pump_settings',
  'swipe_machines',
  'tank_transfers',
  'tank_dips_report',
  'today_sales',
  // Newly added missing features
  'lubricants',
  'employees',
  'expense_types',
  'business_parties',
  'guest_entry',
  'day_assignings',
  'employee_cash_recovery',
  'stock_report',
  'lub_loss',
  'lubs_stock',
  'minimum_stock',
  'sheet_records',
  'day_cash_report',
  'tanker_sale',
  'guest_sales',
  'credit_requests',
  'feedback',
];

export type FeatureBundle = 'basic' | 'advanced';

console.log('[FeatureDefaults] Loaded BASIC_FEATURES:', BASIC_FEATURES.length);
console.log('[FeatureDefaults] Loaded ADVANCED_FEATURES:', ADVANCED_FEATURES.length);
console.log('[FeatureDefaults] lubricants in ADVANCED:', ADVANCED_FEATURES.includes('lubricants'));



