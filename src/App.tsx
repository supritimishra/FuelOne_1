import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Lubricants from "./pages/Lubricants";
import LubricantRates from "./pages/LubricantRates";
import CreditCustomers from "./pages/CreditCustomers";
import DailySale from "./pages/DailySale";
import ShiftEntry from "./pages/ShiftEntry";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import NoAccess from "./pages/NoAccess";
import SalesReport from "./pages/SalesReport";
import PurchaseReport from "./pages/PurchaseReport";
import StatementGeneration from "./pages/StatementGeneration";
import CreditCustomerBalance from "./pages/CreditCustomerBalance";
import SaleInvoice from "./pages/SaleInvoice";
import LiquidPurchase from "./pages/LiquidPurchase";
import LubsPurchase from "./pages/LubsPurchase";
import StockReport from "./pages/StockReport";
import StockVariation from "./pages/StockVariation";
import AttendanceReport from "./pages/AttendanceReport";
import CreditSale from "./pages/CreditSale";
import SwipeSale from "./pages/SwipeSale";
import GuestSale from "./pages/GuestSale";
import LubSale from "./pages/LubSale";
import SwipeUI from "./pages/SwipeUI";
import CreditSaleUI from "./pages/CreditSaleUI";
import TankerSaleSimple from "./pages/TankerSaleSimple";
import TankerSaleEnhanced from "./pages/TankerSaleEnhanced";
import TankerSaleEnhancedSimple from "./pages/TankerSaleEnhancedSimple";
import Settlement from "./pages/Settlement";
import OpeningStock from "./pages/OpeningStock";
import AddPurchaseStock from "./pages/AddPurchaseStock";
import MinimumStock from "./pages/MinimumStock";
import LubricantLoss from "./pages/LubricantLoss";
import LubsStock from "./pages/LubsStock";
import ExpiryItems from "./pages/ExpiryItems";
import ExpiryItemsEnhanced from "./pages/ExpiryItemsEnhanced";
import DayAssignings from "./pages/DayAssignings";
import DailySaleRate from "./pages/DailySaleRate";
import SaleEntry from "./pages/SaleEntry";
import DeleteSale from "./pages/DeleteSale";
import Recovery from "./pages/Recovery";
import CreditRequests from "./pages/CreditRequests";
import CreditLimitReport from "./pages/CreditLimitReport";
import OrganizationSettings from "./pages/admin/OrganizationSettings";
import FuelProducts from "./pages/admin/FuelProducts";
import Vendors from "./pages/admin/Vendors";
import TanksNozzles from "./pages/admin/TanksNozzles";
import AddNozzle from "./pages/admin/AddNozzle";
import PumpSetting from "./pages/admin/PumpSetting";
import Employees from "./pages/admin/Employees";
import SwipeMachines from "./pages/SwipeMachines";
import Denominations from "./pages/Denominations";
import ExpenseTypes from "./pages/admin/ExpenseTypes";
import BusinessParty from "./pages/admin/BusinessParty";
import Expenses from "./pages/Expenses";
import EmployeeCashRecovery from "./pages/EmployeeCashRecovery";
import Placeholder from "./pages/_Placeholder";
import InterestTransactions from "./pages/InterestTransactions";
import InterestTransactionsAdvanced from "./pages/InterestTransactionsAdvanced";
import PrintTemplates from "./pages/PrintTemplates";
import SheetRecords from "./pages/SheetRecords";
import SheetRecordsWorking from "./pages/SheetRecordsWorking";
import SheetRecordsEnhanced from "./pages/SheetRecordsEnhanced";
import DayCashReport from "./pages/DayCashReport";
import VendorTransactions from "./pages/VendorTransactions";
import VendorPayments from "./pages/VendorPayments";
import Feedback from "./pages/Feedback";
import DutyPay from "./pages/DutyPay";
import SalesOfficer from "./pages/SalesOfficer";
import BusinessTransactions from "./pages/BusinessTransactions";
import ShiftManagement from "./pages/admin/ShiftManagement";
import DailyReport from "./pages/DailyReport";
import TankDips from "./pages/TankDips";
import StockReconciliation from "./pages/StockReconciliation";
import TankTransfers from "./pages/TankTransfers";
import EmployeePerformance from "./pages/EmployeePerformance";
import ChangePassword from "./pages/ChangePassword";
import BackupData from "./pages/BackupData";
import RolePermissions from "./pages/admin/RolePermissions";
import MyBunks from "./pages/admin/MyBunks";
import BunkUsers from "./pages/admin/BunkUsers";
import { DeveloperModeGuard } from "./components/DeveloperModeGuard";
import ShiftSheetEntry from "./pages/ShiftSheetEntry";
import Reports from "./pages/Reports";
import GenerateSaleInvoice from "./pages/GenerateSaleInvoice";
import GeneratedInvoices from "./pages/GeneratedInvoices";
import ResetPassword from "./pages/ResetPassword";
import { FeatureGate } from "./components/FeatureGate";
import { FeatureKey } from "./lib/features";

const buildFeatureRoute = (
  featureKey: FeatureKey,
  element: React.ReactElement,
  options?: { requireAdmin?: boolean; requireSuperAdmin?: boolean }
) => {
  const content = (
    <FeatureGate featureKey={featureKey}>
      <DashboardLayout>{element}</DashboardLayout>
    </FeatureGate>
  );

  if (options?.requireAdmin) {
    return (
      <ProtectedRoute>
        <AdminRoute requireSuperAdmin={options?.requireSuperAdmin}>
          {content}
        </AdminRoute>
      </ProtectedRoute>
    );
  }

  return <ProtectedRoute>{content}</ProtectedRoute>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry failed queries (fail fast)
      retry: 0,
      // Don't block UI - allow queries to fail gracefully
      suspense: false,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Don't refetch on mount if data exists
      refetchOnMount: false,
      // Don't block on window focus
      refetchOnWindowFocus: false,
      // Use error boundary to catch errors
      throwOnError: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/no-access" element={<ProtectedRoute><NoAccess /></ProtectedRoute>} />
              <Route
                path="/"
                element={buildFeatureRoute("dashboard", <Dashboard />)}
              />
              {/* Daily Operations */}
              <Route path="/daily-sale" element={buildFeatureRoute("sale_entry", <DailySale />)} />
              <Route path="/shift-entry" element={buildFeatureRoute("shift_sheet_entry", <ShiftEntry />)} />
              <Route path="/credit-sale" element={buildFeatureRoute("credit_sale", <CreditSale />)} />
              <Route path="/swipe-sale" element={buildFeatureRoute("swipe", <SwipeSale />)} />
              <Route path="/guest-sales" element={buildFeatureRoute("guest_sales", <GuestSale />)} />
              <Route path="/guest-sale" element={buildFeatureRoute("guest_sales", <GuestSale />)} />
              <Route path="/tanker-sale" element={buildFeatureRoute("tanker_sale", <TankerSaleEnhanced />)} />
              <Route path="/settlement" element={buildFeatureRoute("day_settlement", <Settlement />)} />
              <Route path="/daily-expenses" element={buildFeatureRoute("expenses", <Expenses />)} />
              <Route path="/credit-customer-balance" element={buildFeatureRoute("credit_customer_balance", <CreditCustomerBalance />)} />
              {/* Preview routes for new UIs */}
              <Route path="/lub-sale" element={buildFeatureRoute("lub_sale", <LubSale />)} />
              <Route path="/swipe-new" element={buildFeatureRoute("swipe", <SwipeUI />)} />
              <Route path="/credit-sale-new" element={buildFeatureRoute("credit_sale", <CreditSaleUI />)} />
              {/* Aliases under Day Business */}
              <Route path="/day-business/day-assignings" element={buildFeatureRoute("day_assignings", <DayAssignings />)} />
              <Route path="/day-business/daily-sale-rate" element={buildFeatureRoute("daily_sale_rate", <DailySaleRate />)} />
              <Route path="/day-business/sale-entry" element={buildFeatureRoute("sale_entry", <SaleEntry />)} />
              <Route path="/day-business/delete-sale" element={buildFeatureRoute("sale_entry", <DeleteSale />)} />
              <Route path="/day-business/lubricants" element={buildFeatureRoute("lub_sale", <LubSale />)} />
              <Route path="/day-business/swipe" element={buildFeatureRoute("swipe", <SwipeSale />)} />
              <Route path="/day-business/credit-sale" element={buildFeatureRoute("credit_sale", <CreditSale />)} />
              <Route path="/day-business/expenses" element={buildFeatureRoute("expenses", <Expenses />)} />
              <Route path="/day-business/recovery" element={buildFeatureRoute("recovery", <Recovery />)} />
              <Route path="/day-business/emp-cash-recovery" element={buildFeatureRoute("employee_cash_recovery", <Placeholder title="Employee Cash Recovery" />)} />
              <Route path="/day-business/dayopening-stock" element={buildFeatureRoute("day_opening_stock", <OpeningStock />)} />
              <Route path="/day-business/day-settlement" element={buildFeatureRoute("day_settlement", <Settlement />)} />

              {/* Bare path aliases to match sidebar labels (Day Business) */}
              <Route path="/day-assignings" element={buildFeatureRoute("day_assignings", <DayAssignings />)} />
              <Route path="/daily-sale-rate" element={buildFeatureRoute("daily_sale_rate", <DailySaleRate />)} />
              <Route path="/sale-entry" element={buildFeatureRoute("sale_entry", <SaleEntry />)} />
              <Route path="/delete-sale" element={buildFeatureRoute("sale_entry", <DeleteSale />)} />
              <Route path="/swipe" element={buildFeatureRoute("swipe", <SwipeSale />)} />
              <Route path="/day-opening-stock" element={buildFeatureRoute("day_opening_stock", <OpeningStock />)} />

              <Route path="/opening-stock" element={buildFeatureRoute("day_opening_stock", <OpeningStock />)} />
              <Route path="/stock-dump/add" element={buildFeatureRoute("day_opening_stock", <AddPurchaseStock />)} />
              <Route path="/minimum-stock" element={buildFeatureRoute("minimum_stock", <MinimumStock />)} />
              <Route path="/stock-report" element={buildFeatureRoute("stock_report", <StockReport />)} />
              <Route path="/lubricants" element={buildFeatureRoute("lub_sale", <LubSale />)} />
              {/* Product Stock section */}
              <Route path="/product-stock/stock-report" element={buildFeatureRoute("stock_report", <StockReport />)} />
              <Route path="/product-stock/stock-variation" element={<ProtectedRoute><DashboardLayout><StockVariation /></DashboardLayout></ProtectedRoute>} />
              <Route path="/product-stock/tank-dips" element={<ProtectedRoute><DashboardLayout><TankDips /></DashboardLayout></ProtectedRoute>} />
              <Route path="/product-stock/stock-recon" element={<ProtectedRoute><DashboardLayout><StockReconciliation /></DashboardLayout></ProtectedRoute>} />
              <Route path="/product-stock/tank-transfer" element={<ProtectedRoute><DashboardLayout><TankTransfers /></DashboardLayout></ProtectedRoute>} />
              <Route path="/product-stock/lub-loss" element={buildFeatureRoute("lub_loss", <LubricantLoss />)} />
              <Route path="/product-stock/lubs-stock" element={buildFeatureRoute("lubs_stock", <LubsStock />)} />
              <Route path="/product-stock/minimum-stock" element={buildFeatureRoute("minimum_stock", <MinimumStock />)} />

              {/* Bare path aliases for product stock items referenced by sidebar */}
              <Route path="/lub-loss" element={buildFeatureRoute("lub_loss", <LubricantLoss />)} />
              <Route path="/lubs-stock" element={buildFeatureRoute("lubs_stock", <LubsStock />)} />
              <Route path="/minimum-stock" element={buildFeatureRoute("minimum_stock", <MinimumStock />)} />

              {/* Reports */}
              <Route path="/sale-invoice" element={buildFeatureRoute("generate_sale_invoice", <SaleInvoice />)} />
              <Route path="/sales-report" element={buildFeatureRoute("reports", <SalesReport />)} />
              <Route path="/daily-report" element={buildFeatureRoute("reports", <DailyReport />)} />
              <Route path="/purchase-report" element={buildFeatureRoute("reports", <PurchaseReport />)} />
              <Route path="/attendance-report" element={buildFeatureRoute("attendance", <AttendanceReport />)} />
              <Route path="/employee-performance" element={<ProtectedRoute><DashboardLayout><EmployeePerformance /></DashboardLayout></ProtectedRoute>} />
              <Route path="/vendor-payments" element={<ProtectedRoute><AdminRoute><DashboardLayout><VendorPayments /></DashboardLayout></AdminRoute></ProtectedRoute>} />
              {/* Reports landing and Statement Generation */}
              <Route path="/reports" element={buildFeatureRoute("reports", <Reports />)} />
              <Route path="/statements" element={buildFeatureRoute("statement_generation", <StatementGeneration />)} />
              <Route path="/change-password" element={<ProtectedRoute><DashboardLayout><ChangePassword /></DashboardLayout></ProtectedRoute>} />
              <Route path="/backup-data" element={<ProtectedRoute><AdminRoute><DashboardLayout><BackupData /></DashboardLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/feedback" element={buildFeatureRoute("feedback", <Feedback />)} />

              {/* Invoice section */}
              <Route path="/invoice/liquid-purchase" element={buildFeatureRoute("liquid_purchase", <LiquidPurchase />)} />
              <Route path="/invoice/lubs-purchase" element={buildFeatureRoute("lubs_purchase", <LubsPurchase />)} />

              {/* Other entries */}
              <Route path="/shift-sheet-entry" element={buildFeatureRoute("shift_sheet_entry", <ShiftSheetEntry />)} />
              <Route path="/busi-crdr-trxn" element={buildFeatureRoute("business_crdr_transactions", <BusinessTransactions />)} />
              <Route path="/vendor-transaction" element={buildFeatureRoute("vendor_transactions", <VendorTransactions />)} />

              {/* Generate/Generated Invoice */}
              <Route path="/generate-saleinvoice" element={buildFeatureRoute("generate_sale_invoice", <GenerateSaleInvoice />)} />
              <Route path="/generated-invoice" element={buildFeatureRoute("generated_invoices", <GeneratedInvoices />)} />
              {/* Alias for plural path used in sidebar */}
              <Route path="/generated-invoices" element={buildFeatureRoute("generated_invoices", <GeneratedInvoices />)} />

              {/* Master aliases */}



              <Route path="/master/fuel-products" element={buildFeatureRoute("fuel_products", <FuelProducts />)} />
              <Route path="/master/lubricants" element={buildFeatureRoute("lubricants", <Lubricants />)} />
              <Route path="/master/lubricant-rates" element={buildFeatureRoute("lubricants", <LubricantRates />)} />
              <Route path="/master/credit-customer" element={buildFeatureRoute("credit_customers", <CreditCustomers />)} />
              <Route path="/master/employees" element={buildFeatureRoute("employees", <Employees />)} />
              <Route path="/master/expense-types" element={buildFeatureRoute("expense_types", <ExpenseTypes />)} />
              <Route path="/master/busi-crd-debit-party" element={buildFeatureRoute("business_parties", <BusinessParty />)} />
              <Route path="/master/vendor" element={buildFeatureRoute("vendors", <Vendors />)} />
              <Route path="/master/swipe-machines" element={buildFeatureRoute("swipe_machines", <SwipeMachines />)} />
              <Route path="/master/expiry-items" element={buildFeatureRoute("expiry_items", <ExpiryItems />)} />
              <Route path="/master/tank-nozzel" element={buildFeatureRoute("tank_nozzle", <TanksNozzles />)} />
              <Route path="/master/tank/add-nozzle/:tankId" element={buildFeatureRoute("tank_nozzle", <AddNozzle />)} />
              <Route path="/master/pump-setting" element={buildFeatureRoute("pump_settings", <PumpSetting />)} />
              <Route path="/master/dutypay-shift" element={buildFeatureRoute("duty_pay_shift", <ShiftManagement />)} />
              <Route path="/master/print-templates" element={buildFeatureRoute("print_templates", <PrintTemplates />)} />
              <Route path="/master/guest-entry" element={buildFeatureRoute("guest_entry", <GuestSale />)} />
              <Route path="/master/denominations" element={buildFeatureRoute("denominations", <Denominations />)} />

              {/* Relational Features */}
              <Route path="/relational/interest-trans" element={buildFeatureRoute("interest_transactions", <InterestTransactions />)} />
              <Route path="/relational/interest-trans-advanced" element={buildFeatureRoute("interest_transactions", <InterestTransactionsAdvanced />)} />
              <Route path="/relational/sheet-records" element={buildFeatureRoute("sheet_records", <SheetRecordsEnhanced />)} />
              <Route path="/relational/sheet-records-enhanced" element={buildFeatureRoute("sheet_records", <SheetRecordsWorking />)} />
              <Route path="/relational/day-cash-report" element={buildFeatureRoute("day_cash_report", <DayCashReport />)} />
              <Route path="/relational/tanker-sale" element={buildFeatureRoute("tanker_sale", <TankerSaleEnhanced />)} />
              <Route path="/relational/tanker-sale-enhanced" element={buildFeatureRoute("tanker_sale", <TankerSaleEnhanced />)} />
              {/* Redirect legacy guest sale routes to new Guest Entry */}
              <Route path="/guest-sale" element={<Navigate to="/master/guest-entry" replace />} />
              <Route path="/relational/guest-sales" element={<Navigate to="/master/guest-entry" replace />} />
              <Route path="/relational/attendance" element={buildFeatureRoute("attendance", <AttendanceReport />)} />
              <Route path="/relational/duty-pay" element={buildFeatureRoute("duty_pay", <DutyPay />)} />
              <Route path="/relational/sales-officer" element={buildFeatureRoute("sales_officer", <SalesOfficer />)} />
              <Route path="/relational/credit-requests" element={buildFeatureRoute("credit_requests", <CreditRequests />)} />
              <Route path="/relational/expiry-items" element={buildFeatureRoute("expiry_items", <ExpiryItemsEnhanced />)} />
              <Route path="/relational/feedback" element={buildFeatureRoute("feedback", <Feedback />)} />

              {/* Bare path aliases for relational features referenced by sidebar */}
              <Route path="/interest-trans" element={buildFeatureRoute("interest_transactions", <InterestTransactions />)} />
              <Route path="/interest-trans-advanced" element={buildFeatureRoute("interest_transactions", <InterestTransactionsAdvanced />)} />
              <Route path="/sheet-records" element={buildFeatureRoute("sheet_records", <SheetRecordsWorking />)} />
              <Route path="/sheet-records-enhanced" element={buildFeatureRoute("sheet_records", <SheetRecordsWorking />)} />
              <Route path="/day-cash-report" element={buildFeatureRoute("day_cash_report", <DayCashReport />)} />
              <Route path="/tanker-sale" element={buildFeatureRoute("tanker_sale", <TankerSaleEnhanced />)} />
              <Route path="/tanker-sale-enhanced" element={buildFeatureRoute("tanker_sale", <TankerSaleEnhanced />)} />
              <Route path="/guest-sales" element={buildFeatureRoute("guest_sales", <GuestSale />)} />
              <Route path="/duty-pay" element={buildFeatureRoute("duty_pay", <DutyPay />)} />
              <Route path="/sales-officer" element={buildFeatureRoute("sales_officer", <SalesOfficer />)} />

              {/* Credit Management */}
              <Route path="/credit-customers" element={buildFeatureRoute("credit_customers", <CreditCustomers />)} />
              <Route path="/recovery" element={buildFeatureRoute("recovery", <Recovery />)} />
              <Route path="/employee-cash-recovery" element={buildFeatureRoute("employee_cash_recovery", <EmployeeCashRecovery />)} />
              <Route path="/credit-requests" element={buildFeatureRoute("credit_requests", <CreditRequests />)} />
              <Route path="/credit-limit" element={buildFeatureRoute("credit_limit_reports", <CreditLimitReport />)} />

              {/* Admin/Master Data */}
              <Route path="/organization-settings" element={<ProtectedRoute><AdminRoute requireSuperAdmin><DashboardLayout><OrganizationSettings /></DashboardLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/role-permissions" element={<ProtectedRoute><AdminRoute><DashboardLayout><RolePermissions /></DashboardLayout></AdminRoute></ProtectedRoute>} />
              {/* Developer Mode - ONLY accessible to dev user (username: dev, email: dev@developer.local) */}
              {/* Using single DeveloperModeGuard to prevent hook ordering issues */}
              <Route path="/developer-mode" element={<DeveloperModeGuard />} />
              <Route path="/my-bunks" element={<ProtectedRoute><AdminRoute><DashboardLayout><MyBunks /></DashboardLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/employees" element={buildFeatureRoute("employees", <Employees />, { requireAdmin: true })} />
              <Route path="/vendors" element={buildFeatureRoute("vendors", <Vendors />, { requireAdmin: true })} />
              <Route path="/fuel-products" element={buildFeatureRoute("fuel_products", <FuelProducts />, { requireAdmin: true })} />
              <Route path="/pump-settings" element={buildFeatureRoute("pump_settings", <PumpSetting />, { requireAdmin: true })} />
              <Route path="/swipe-machines" element={buildFeatureRoute("swipe_machines", <SwipeMachines />, { requireAdmin: true })} />
              <Route path="/shift-management" element={<ProtectedRoute><AdminRoute><DashboardLayout><ShiftManagement /></DashboardLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/expense-types" element={buildFeatureRoute("expense_types", <ExpenseTypes />, { requireAdmin: true })} />
              <Route path="/denominations" element={buildFeatureRoute("denominations", <Denominations />, { requireAdmin: true })} />
              <Route path="/bunk-users" element={<ProtectedRoute><DashboardLayout><BunkUsers /></DashboardLayout></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
