import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Droplet,
  CreditCard,
  ShoppingCart,
  FileText,
  TrendingUp,
  Package,
  Settings,
  DollarSign,
  UserCheck,
  Calendar,
  Receipt,
  AlertCircle,
  Truck,
  Building,
  Building2,
  Fuel,
  Store,
  Clock,
  Wallet,
  MapPin,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureKey } from "@/lib/features";

type SidebarItem = {
  title: string;
  url: string;
  icon?: any;
  featureKey?: FeatureKey;
};

export function AppSidebar() {
  // Always-expanded sidebar (ignore collapsed state)
  const { isAdmin, isSuperAdmin } = useUserRole();
  const { signOut, user: currentUser } = useAuth();
  const [masterOpen, setMasterOpen] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [dayBusinessOpen, setDayBusinessOpen] = useState(false);
  const [productStockOpen, setProductStockOpen] = useState(false);
  const [relationalOpen, setRelationalOpen] = useState(false);
  const { hasFeature, isLoading: isLoadingFeatures, isError: featureError, features, migrationsRun, refetch: refetchFeatures } = useFeatureAccess();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout after 2 seconds to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const allowFeature = (featureKey?: FeatureKey) => {
    // If no feature key specified, always allow
    if (!featureKey) return true;

    // Debug logging
    if (featureKey === 'dashboard' || featureKey === 'fuel_products') {
      console.log(`[AppSidebar] allowFeature(${featureKey}): isLoading=${isLoadingFeatures}, error=${featureError}, features.length=${features?.length}, migrationsRun=${migrationsRun}`);
    }

    // If still loading and we haven't hit timeout, do NOT allow yet (prevent fail-open)
    if (isLoadingFeatures && !loadingTimeout) {
      if (featureKey === 'dashboard') console.log(`[AppSidebar] Still loading - temporarily hiding ${featureKey}`);
      return false;
    }

    // Fail-open ONLY if there's a real error AND no features loaded (system not configured)
    // This handles the case where the API failed and we couldn't load feature catalog
    if (featureError && (!features || features.length === 0)) {
      console.warn(`[AppSidebar] Feature API error, no features loaded - hiding ${featureKey} (no fail-open)`);
      return false;
    }

    // If features successfully loaded but empty, check migrationsRun flag:
    // - migrationsRun: false = migrations not run → fail-open (show all)
    // - migrationsRun: true = migrations run but all disabled → deny access (hide all)
    // - migrationsRun: null = unknown → fail-open (backward compatible)
    if (!isLoadingFeatures && !featureError && (!features || features.length === 0)) {
      if (migrationsRun === false) {
        // Migrations not run - do not fail-open; hide until configured
        console.warn(`[AppSidebar] Migrations not run - hiding ${featureKey}`);
        return false;
      }
      if (migrationsRun === true) {
        // Migrations run but empty = ALL features disabled - hide this feature
        console.log(`[AppSidebar] Migrations run but empty features - ALL disabled, hiding ${featureKey}`);
        return false;
      }
      // migrationsRun is null (unknown) - fail-open (backward compatible)
      console.warn(`[AppSidebar] Empty catalog, migrationsRun unknown - allowing ${featureKey} (fail-open)`);
      return true;
    }

    // If we have features loaded, check the actual permission
    // This will return false if feature is explicitly disabled (allowed: false)
    const allowed = hasFeature(featureKey);
    if (featureKey === 'dashboard' || featureKey === 'fuel_products') {
      console.log(`[AppSidebar] Feature ${featureKey}: hasFeature() returned ${allowed}, checking featureMap...`);
      const entry = features?.find(f => f.featureKey === featureKey);
      console.log(`[AppSidebar] Feature ${featureKey}: entry in features array:`, entry ? { allowed: entry.allowed, featureKey: entry.featureKey } : 'NOT FOUND');
    }
    if (!allowed) {
      console.log(`[AppSidebar] Feature ${featureKey} is disabled (allowed=false) - hiding from sidebar`);
    } else {
      console.log(`[AppSidebar] Feature ${featureKey} is ENABLED (allowed=true) - showing in sidebar`);
    }
    return allowed;
  };

  // Check if user has any enabled features
  const hasAnyFeatures = useMemo(() => {
    // If still loading and haven't timed out, assume features exist
    if (isLoadingFeatures && !loadingTimeout) return true;

    // If error and no features loaded, fail-open
    if (featureError && (!features || features.length === 0)) return true;

    // If no features loaded, check if it's intentional (empty catalog = no access)
    if (!features || features.length === 0) return false;

    if (!hasFeature || typeof hasFeature !== 'function') return true;

    // Check if user has at least one enabled feature
    const enabledFeatures = features.filter(f => f.allowed);
    return enabledFeatures.length > 0;
  }, [hasFeature, featureError, loadingTimeout, isLoadingFeatures, features]);

  // Build Master section - Temporarily visible to all users for testing
  const masterItems: SidebarItem[] = [

    { title: "Fuel Products", url: "/master/fuel-products", icon: Fuel, featureKey: "fuel_products" },
    { title: "Lubricants", url: "/master/lubricants", icon: Droplet, featureKey: "lubricants" },
    { title: "Credit Customer", url: "/master/credit-customer", icon: Users, featureKey: "credit_customers" },
    { title: "Employees", url: "/master/employees", icon: Users, featureKey: "employees" },
    { title: "Expense Types", url: "/master/expense-types", icon: Receipt, featureKey: "expense_types" },
    { title: "Busi. Crd/Debit Party", url: "/master/busi-crd-debit-party", icon: FileText, featureKey: "business_parties" },
    { title: "Vendor", url: "/master/vendor", icon: Store, featureKey: "vendors" },
    { title: "Swipe Machines", url: "/master/swipe-machines", icon: CreditCard, featureKey: "swipe_machines" },
    { title: "Expiry Items", url: "/master/expiry-items", icon: Calendar, featureKey: "expiry_items" },
    { title: "Tank & Nozzel", url: "/master/tank-nozzel", icon: Settings, featureKey: "tank_nozzle" },
    { title: "Pump Setting", url: "/master/pump-setting", icon: Settings, featureKey: "pump_settings" },
    { title: "DutyPay Shift", url: "/master/dutypay-shift", icon: Clock, featureKey: "duty_pay_shift" },
    { title: "Print Templates", url: "/master/print-templates", icon: FileText, featureKey: "print_templates" },
    { title: "Guest Entry", url: "/master/guest-entry", icon: Users, featureKey: "guest_entry" },
    { title: "Denominations", url: "/master/denominations", icon: Wallet, featureKey: "denominations" },
  ];

  // Show Organization settings ONLY for developer account, not for tenant super admins
  const isDevUser = currentUser?.email === 'dev@developer.local' || currentUser?.username === 'dev';
  if (isDevUser) {
    masterItems.unshift({ title: "Organization", url: "/organization-settings", icon: Building2 });
  }

  // Helper function to check if a section has any enabled features
  const hasAnyEnabledInSection = useCallback((items: SidebarItem[]) => {
    // Filter items that have feature keys (skip items like Organization without featureKey)
    const itemsWithFeatures = items.filter(item => item.featureKey);
    if (itemsWithFeatures.length === 0) return false; // No features to check

    // Check if at least one feature in the section is enabled
    return itemsWithFeatures.some(item => allowFeature(item.featureKey));
  }, [allowFeature]);

  // Helper to check if Invoice section has enabled features
  const hasInvoiceFeatures = useMemo(() => {
    return allowFeature("liquid_purchase") || allowFeature("lubs_purchase");
  }, [allowFeature]);

  // Helper to check if Day Business section has enabled features
  const hasDayBusinessFeatures = useMemo(() => {
    return allowFeature("day_assignings") || allowFeature("daily_sale_rate") ||
      allowFeature("sale_entry") || allowFeature("lub_sale") ||
      allowFeature("swipe") || allowFeature("credit_sale") ||
      allowFeature("expenses") || allowFeature("recovery") ||
      allowFeature("employee_cash_recovery") || allowFeature("day_opening_stock") ||
      allowFeature("day_settlement");
  }, [allowFeature]);

  // Helper to check if Product Stock section has enabled features
  const hasProductStockFeatures = useMemo(() => {
    return allowFeature("stock_report") || allowFeature("lub_loss") ||
      allowFeature("lubs_stock") || allowFeature("minimum_stock");
  }, [allowFeature]);

  // Helper to check if Relational section has enabled features
  const hasRelationalFeatures = useMemo(() => {
    return allowFeature("interest_transactions") || allowFeature("sheet_records") ||
      allowFeature("day_cash_report") || allowFeature("tanker_sale") ||
      allowFeature("guest_sales") || allowFeature("attendance") ||
      allowFeature("duty_pay") || allowFeature("sales_officer") ||
      allowFeature("credit_requests") || allowFeature("expiry_items") ||
      allowFeature("feedback");
  }, [allowFeature]);

  // White background with black text
  const activeClass = "bg-blue-50 text-blue-700 font-medium";
  const idleClass = "text-gray-900 hover:bg-gray-50";
  const groupClass = "text-gray-900 font-medium hover:bg-gray-50 cursor-pointer px-3 py-2 rounded flex items-center justify-between w-full text-left";

  // CRITICAL: Debug logging useEffect MUST be called BEFORE any early returns
  // This ensures consistent hook ordering across renders
  useEffect(() => {
    console.log(`[AppSidebar] Render state:`, {
      isLoadingFeatures,
      featureError,
      featuresCount: features?.length || 0,
      migrationsRun,
      enabledFeaturesCount: features?.filter(f => f.allowed).length || 0,
      disabledFeaturesCount: features?.filter(f => !f.allowed).length || 0,
    });
    if (features && features.length > 0) {
      const dashboardFeature = features.find(f => f.featureKey === 'dashboard');
      console.log(`[AppSidebar] Dashboard feature:`, dashboardFeature);
      const firstFewFeatures = features.slice(0, 5);
      console.log(`[AppSidebar] First 5 features:`, firstFewFeatures.map(f => ({ key: f.featureKey, allowed: f.allowed })));
    }
  }, [features, isLoadingFeatures, featureError, migrationsRun]);

  // Early return for loading state - AFTER all hooks are called
  if (isLoadingFeatures && !featureError && !loadingTimeout) {
    return (
      <Sidebar className="w-64 border-r border-gray-200 bg-white">
        <SidebarContent className="px-3 py-4 space-y-0.5">
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading workspace…</span>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-64 border-r border-gray-200 bg-white">
      <SidebarContent className="px-3 py-4 space-y-0.5">
        {/* Brand header */}
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <img src="/brand-logo.png" alt="Brand" className="h-6 w-auto" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-sm font-semibold truncate">Ramkrishna Service Centre</span>
        </div>
        {/* Standard Menu Items - HIDDEN for Developer User */}
        {!isDevUser && (
          <>
            {/* 1. Dashboard */}
            {allowFeature("dashboard") && (
              <NavLink to="/" end className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                <span>Dashboard</span>
              </NavLink>
            )}

            {/* 2. Master (collapsible) */}
            {hasAnyEnabledInSection(masterItems) && (
              <div>
                <button className={groupClass} onClick={() => setMasterOpen((v) => !v)}>
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-600" /> Master
                  </span>
                  {masterOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {masterOpen && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {masterItems.filter((item) => !item.featureKey || allowFeature(item.featureKey)).map((item) => (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}
                      >
                        {item.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Organization (separate, only for Super Admin) */}
            {isSuperAdmin && allowFeature(undefined) && (
              <NavLink to="/organization-settings" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Organization</span>
              </NavLink>
            )}

            {/* 3. Invoice (collapsible) */}
            {hasInvoiceFeatures && (
              <div>
                <button className={groupClass} onClick={() => setInvoiceOpen((v) => !v)}>
                  <span className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-blue-600" /> Invoice
                  </span>
                  {invoiceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {invoiceOpen && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {allowFeature("liquid_purchase") && (
                      <NavLink to="/invoice/liquid-purchase" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Liquid Purchase</NavLink>
                    )}
                    {allowFeature("lubs_purchase") && (
                      <NavLink to="/invoice/lubs-purchase" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Lubs Purchase</NavLink>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. Day Business (collapsible) */}
            {hasDayBusinessFeatures && (
              <div>
                <button className={groupClass} onClick={() => setDayBusinessOpen((v) => !v)}>
                  <span className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-blue-600" /> Day Business
                  </span>
                  {dayBusinessOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {dayBusinessOpen && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {allowFeature("day_assignings") && (
                      <NavLink to="/day-assignings" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Day Assignings</NavLink>
                    )}
                    {allowFeature("daily_sale_rate") && (
                      <NavLink to="/daily-sale-rate" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Daily Sale Rate</NavLink>
                    )}
                    {allowFeature("sale_entry") && (
                      <NavLink to="/sale-entry" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Sale Entry</NavLink>
                    )}
                    {allowFeature("lub_sale") && (
                      <NavLink to="/lub-sale" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Lubricants</NavLink>
                    )}
                    {allowFeature("swipe") && (
                      <NavLink to="/swipe-new" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Swipe</NavLink>
                    )}
                    {allowFeature("credit_sale") && (
                      <NavLink to="/credit-sale-new" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Credit Sale</NavLink>
                    )}
                    {allowFeature("expenses") && (
                      <NavLink to="/daily-expenses" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Expenses</NavLink>
                    )}
                    {allowFeature("recovery") && (
                      <NavLink to="/recovery" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Recovery</NavLink>
                    )}
                    {allowFeature("employee_cash_recovery") && (
                      <NavLink to="/employee-cash-recovery" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Emp Cash Recovery</NavLink>
                    )}
                    {allowFeature("day_opening_stock") && (
                      <NavLink to="/day-opening-stock" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>DayOpening Stock</NavLink>
                    )}
                    {allowFeature("day_settlement") && (
                      <NavLink to="/settlement" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Day Settlement</NavLink>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. Statement Generation */}
            {allowFeature("statement_generation") && (
              <NavLink to="/statements" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Statement Generation</span>
              </NavLink>
            )}

            {/* 6. Product Stock (collapsible) */}
            {hasProductStockFeatures && (
              <div>
                <button className={groupClass} onClick={() => setProductStockOpen((v) => !v)}>
                  <span className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-blue-600" /> Product Stock
                  </span>
                  {productStockOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {productStockOpen && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {allowFeature("stock_report") && (
                      <NavLink to="/stock-report" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Stock Report</NavLink>
                    )}
                    {allowFeature("lub_loss") && (
                      <NavLink to="/lub-loss" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Lub Loss</NavLink>
                    )}
                    {allowFeature("lubs_stock") && (
                      <NavLink to="/lubs-stock" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Lubs Stock</NavLink>
                    )}
                    {allowFeature("minimum_stock") && (
                      <NavLink to="/minimum-stock" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Minimum stock</NavLink>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 7. Shift Sheet Entry */}
            {allowFeature("shift_sheet_entry") && (
              <NavLink to="/shift-sheet-entry" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Shift Sheet Entry</span>
              </NavLink>
            )}

            {/* 8. Busi. Cr/Dr Trxns */}
            {allowFeature("business_crdr_transactions") && (
              <NavLink to="/busi-crdr-trxn" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Busi. Cr/Dr Trxns</span>
              </NavLink>
            )}

            {/* 9. Vendor Transaction */}
            {allowFeature("vendor_transactions") && (
              <NavLink to="/vendor-transaction" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span>Vendor Transaction</span>
              </NavLink>
            )}

            {/* 10. Reports */}
            {allowFeature("reports") && (
              <NavLink to="/reports" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Reports</span>
              </NavLink>
            )}

            {/* 11. Generate SaleInvoice */}
            {allowFeature("generate_sale_invoice") && (
              <NavLink to="/sale-invoice" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <Receipt className="h-4 w-4 text-blue-600" />
                <span>Generate SaleInvoice</span>
              </NavLink>
            )}

            {/* 12. Generated Invoices */}
            {allowFeature("generated_invoices") && (
              <NavLink to="/generated-invoices" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Generated Invoices</span>
              </NavLink>
            )}

            {/* 13. Credit Limit Reports */}
            {allowFeature("credit_limit_reports") && (
              <NavLink to="/credit-limit" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? activeClass : idleClass}`}>
                <Receipt className="h-4 w-4 text-blue-600" />
                <span>Credit Limit Reports</span>
              </NavLink>
            )}

            {/* 14. Relational features (collapsible) */}
            {hasRelationalFeatures && (
              <div>
                <button className={groupClass} onClick={() => setRelationalOpen((v) => !v)}>
                  <span className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-600" /> Relational features
                  </span>
                  {relationalOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {relationalOpen && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {allowFeature("interest_transactions") && (
                      <NavLink to="/relational/interest-trans" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Interest Trans</NavLink>
                    )}
                    {allowFeature("sheet_records") && (
                      <NavLink to="/relational/sheet-records" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Sheet Records</NavLink>
                    )}
                    {allowFeature("day_cash_report") && (
                      <NavLink to="/relational/day-cash-report" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Day cash report</NavLink>
                    )}
                    {allowFeature("tanker_sale") && (
                      <NavLink to="/tanker-sale" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Tanker sale</NavLink>
                    )}
                    {allowFeature("guest_sales") && (
                      <NavLink to="/guest-sales" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Guest Sales</NavLink>
                    )}
                    {allowFeature("attendance") && (
                      <NavLink to="/attendance-report" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Attendance</NavLink>
                    )}
                    {allowFeature("duty_pay") && (
                      <NavLink to="/duty-pay" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Duty Pay</NavLink>
                    )}
                    {allowFeature("sales_officer") && (
                      <NavLink to="/sales-officer" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Sales Officer</NavLink>
                    )}
                    {allowFeature("credit_requests") && (
                      <NavLink to="/credit-requests" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Credit Requests</NavLink>
                    )}
                    {allowFeature("expiry_items") && (
                      <NavLink to="/relational/expiry-items" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Expiry Items</NavLink>
                    )}
                    {allowFeature("feedback") && (
                      <NavLink to="/feedback" className={({ isActive }) => `block px-3 py-1.5 rounded text-sm ${isActive ? activeClass : idleClass}`}>Feedback</NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Developer Mode - ONLY visible for dev user (username: dev, email: dev@developer.local) */}
        {(() => {
          // Only show Developer Mode for the specific dev account
          const isDevUser = currentUser?.email === 'dev@developer.local' || currentUser?.username === 'dev';

          if (!isDevUser) return null;

          return (
            <div className="mt-4 pt-4 border-t-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 shadow-sm">
              <NavLink
                to="/developer-mode"
                className={({ isActive }) => `flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'}`}
              >
                <ShieldCheck className="h-5 w-5" />
                <span>🔧 Developer Mode</span>
              </NavLink>
              <div className="text-xs text-blue-800 px-4 mt-2 font-semibold">
                👥 View & Control All Users
              </div>
            </div>
          );
        })()}

        {/* Refresh Features Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              refetchFeatures();
              console.log('[AppSidebar] Manually refreshing feature access...');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
            title="Refresh your feature permissions (useful after admin changes them)"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Permissions</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="mt-2">
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50 w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
