export type FeatureDescriptor = {
  label: string;
  group: string;
  paths: string[];
};

export const FEATURE_CATALOG = {
  credit_customer_balance: {
    label: "Credit Customer Balance",
    group: "day_business",
    paths: ["/credit-customer-balance"],
  },
  // Backend-known keys without routed screens yet – add to catalog to prevent warnings
  tank_dips: {
    label: "Tank Dips",
    group: "day_business",
    paths: [],
  },
  ne_pol_sales: {
    label: "NE POL Sales",
    group: "day_business",
    paths: [],
  },
  tank_transfers: {
    label: "Tank Transfers",
    group: "product_stock",
    paths: [],
  },
  tank_dips_report: {
    label: "Tank Dips Report",
    group: "reports",
    paths: [],
  },
  today_sales: {
    label: "Today Sales",
    group: "reports",
    paths: [],
  },
  dashboard: {
    label: "Dashboard",
    group: "core",
    paths: ["/"],
  },
  fuel_products: {
    label: "Fuel Products",
    group: "master",
    paths: ["/master/fuel-products", "/fuel-products"],
  },
  lubricants: {
    label: "Lubricants",
    group: "master",
    paths: ["/master/lubricants"],
  },
  credit_customers: {
    label: "Credit Customer",
    group: "master",
    paths: ["/master/credit-customer", "/credit-customers"],
  },
  employees: {
    label: "Employees",
    group: "master",
    paths: ["/master/employees", "/employees"],
  },
  expense_types: {
    label: "Expense Types",
    group: "master",
    paths: ["/master/expense-types", "/expense-types"],
  },
  business_parties: {
    label: "Business Parties",
    group: "master",
    paths: ["/master/busi-crd-debit-party"],
  },
  vendors: {
    label: "Vendors",
    group: "master",
    paths: ["/master/vendor", "/vendors"],
  },
  swipe_machines: {
    label: "Swipe Machines",
    group: "master",
    paths: ["/master/swipe-machines", "/swipe-machines"],
  },
  expiry_items: {
    label: "Expiry Items",
    group: "master",
    paths: ["/master/expiry-items", "/relational/expiry-items", "/expiry-items"],
  },
  tank_nozzle: {
    label: "Tank & Nozzle",
    group: "master",
    paths: ["/master/tank-nozzel", "/master/tank/add-nozzle/:tankId"],
  },
  pump_settings: {
    label: "Pump Settings",
    group: "master",
    paths: ["/master/pump-setting", "/pump-settings"],
  },
  duty_pay_shift: {
    label: "Duty Pay Shift",
    group: "master",
    paths: ["/master/dutypay-shift"],
  },
  print_templates: {
    label: "Print Templates",
    group: "master",
    paths: ["/master/print-templates"],
  },
  guest_entry: {
    label: "Guest Entry",
    group: "master",
    paths: ["/master/guest-entry"],
  },
  denominations: {
    label: "Denominations",
    group: "master",
    paths: ["/master/denominations", "/denominations"],
  },
  liquid_purchase: {
    label: "Liquid Purchase",
    group: "invoice",
    paths: ["/invoice/liquid-purchase"],
  },
  lubs_purchase: {
    label: "Lubs Purchase",
    group: "invoice",
    paths: ["/invoice/lubs-purchase"],
  },
  day_assignings: {
    label: "Day Assignings",
    group: "day_business",
    paths: ["/day-assignings", "/day-business/day-assignings"],
  },
  daily_sale_rate: {
    label: "Daily Sale Rate",
    group: "day_business",
    paths: ["/daily-sale-rate", "/day-business/daily-sale-rate"],
  },
  sale_entry: {
    label: "Sale Entry",
    group: "day_business",
    paths: ["/sale-entry", "/day-business/sale-entry", "/daily-sale"],
  },
  lub_sale: {
    label: "Lub Sale",
    group: "day_business",
    paths: ["/lub-sale", "/day-business/lubricants"],
  },
  swipe: {
    label: "Swipe",
    group: "day_business",
    paths: ["/swipe-sale", "/swipe", "/swipe-new", "/day-business/swipe"],
  },
  credit_sale: {
    label: "Credit Sale",
    group: "day_business",
    paths: ["/credit-sale", "/credit-sale-new", "/day-business/credit-sale"],
  },
  expenses: {
    label: "Expenses",
    group: "day_business",
    paths: ["/daily-expenses", "/day-business/expenses"],
  },
  recovery: {
    label: "Recovery",
    group: "day_business",
    paths: ["/recovery", "/day-business/recovery"],
  },
  employee_cash_recovery: {
    label: "Employee Cash Recovery",
    group: "day_business",
    paths: ["/employee-cash-recovery", "/day-business/emp-cash-recovery"],
  },
  day_opening_stock: {
    label: "Day Opening Stock",
    group: "day_business",
    paths: ["/day-opening-stock", "/day-business/dayopening-stock", "/opening-stock"],
  },
  day_settlement: {
    label: "Day Settlement",
    group: "day_business",
    paths: ["/settlement", "/day-business/day-settlement"],
  },
  statement_generation: {
    label: "Statement Generation",
    group: "reports",
    paths: ["/statements"],
  },
  stock_report: {
    label: "Stock Report",
    group: "product_stock",
    paths: ["/stock-report", "/product-stock/stock-report"],
  },
  lub_loss: {
    label: "Lub Loss",
    group: "product_stock",
    paths: ["/lub-loss", "/product-stock/lub-loss"],
  },
  lubs_stock: {
    label: "Lubs Stock",
    group: "product_stock",
    paths: ["/lubs-stock", "/product-stock/lubs-stock"],
  },
  minimum_stock: {
    label: "Minimum Stock",
    group: "product_stock",
    paths: ["/minimum-stock", "/product-stock/minimum-stock"],
  },
  shift_sheet_entry: {
    label: "Shift Sheet Entry",
    group: "day_business",
    paths: ["/shift-sheet-entry"],
  },
  business_crdr_transactions: {
    label: "Business Cr/Dr Transactions",
    group: "relational",
    paths: ["/busi-crdr-trxn"],
  },
  vendor_transactions: {
    label: "Vendor Transactions",
    group: "relational",
    paths: ["/vendor-transaction", "/vendor-transactions"],
  },
  reports: {
    label: "Reports",
    group: "reports",
    paths: ["/reports", "/sales-report", "/daily-report", "/purchase-report"],
  },
  generate_sale_invoice: {
    label: "Generate Sale Invoice",
    group: "reports",
    paths: ["/generate-saleinvoice", "/sale-invoice"],
  },
  generated_invoices: {
    label: "Generated Invoices",
    group: "reports",
    paths: ["/generated-invoice", "/generated-invoices"],
  },
  credit_limit_reports: {
    label: "Credit Limit Reports",
    group: "credit",
    paths: ["/credit-limit"],
  },
  interest_transactions: {
    label: "Interest Transactions",
    group: "relational",
    paths: ["/interest-trans", "/interest-trans-advanced", "/relational/interest-trans", "/relational/interest-trans-advanced"],
  },
  sheet_records: {
    label: "Sheet Records",
    group: "relational",
    paths: ["/sheet-records", "/sheet-records-enhanced", "/relational/sheet-records", "/relational/sheet-records-enhanced"],
  },
  day_cash_report: {
    label: "Day Cash Report",
    group: "reports",
    paths: ["/day-cash-report", "/relational/day-cash-report"],
  },
  tanker_sale: {
    label: "Tanker Sale",
    group: "relational",
    paths: ["/tanker-sale", "/relational/tanker-sale", "/relational/tanker-sale-enhanced", "/tanker-sale-enhanced", "/tanker-sale-simple", "/tanker-sale-enhanced-simple", "/tanker-sale-new"],
  },
  guest_sales: {
    label: "Guest Sales",
    group: "relational",
    paths: ["/guest-sales", "/relational/guest-sales"],
  },
  attendance: {
    label: "Attendance",
    group: "relational",
    paths: ["/attendance-report", "/relational/attendance"],
  },
  duty_pay: {
    label: "Duty Pay",
    group: "relational",
    paths: ["/duty-pay", "/relational/duty-pay"],
  },
  sales_officer: {
    label: "Sales Officer",
    group: "relational",
    paths: ["/sales-officer", "/relational/sales-officer"],
  },
  credit_requests: {
    label: "Credit Requests",
    group: "credit",
    paths: ["/credit-requests", "/relational/credit-requests"],
  },
  feedback: {
    label: "Feedback",
    group: "support",
    paths: ["/feedback", "/relational/feedback"],
  },
  developer_mode: {
    label: "Developer Mode",
    group: "admin",
    paths: ["/developer-mode"],
  },
} as const satisfies Record<string, FeatureDescriptor>;

export type FeatureKey = keyof typeof FEATURE_CATALOG;

export const FEATURE_KEYS = Object.keys(FEATURE_CATALOG) as FeatureKey[];

export function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_KEYS.includes(value as FeatureKey);
}

export function getFeatureDescriptor(key: FeatureKey): FeatureDescriptor {
  return FEATURE_CATALOG[key];
}

