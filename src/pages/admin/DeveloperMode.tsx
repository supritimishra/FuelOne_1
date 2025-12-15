import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { handleAPIError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCcw, Save, ShieldCheck, Users, UserCircle, LogOut, Plus, Activity, Database, Building2, Clock, ChevronDown, ChevronRight, Trash2, Key, Lock, Ban, Calendar, Download, HardDrive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TenantUser = {
  id: string;
  email: string;
  username?: string | null;
  fullName?: string | null;
  roles?: string[];
  userId?: string;
  createdAt?: string;
};

type Membership = {
  tenantId: string;
  organizationName: string;
  userId: string;
};

type MasterUser = {
  email: string;
  username?: string | null;
  fullName?: string | null;
  memberships: Membership[];
};

type FeatureCatalogItem = {
  id: string;
  featureKey: string;
  label: string;
  featureGroup?: string | null;
  description?: string | null;
  defaultEnabled: boolean;
};

type UserFeatureAssignment = FeatureCatalogItem & {
  allowed: boolean;
  isOverride?: boolean;
};

const GROUP_LABELS: Record<string, string> = {
  core: "Core Overview",
  master: "Master Data",
  invoice: "Invoices & Purchases",
  day_business: "Day Business",
  product_stock: "Product Stock",
  reports: "Reports",
  relational: "Relational Modules",
  credit: "Credit Management",
  support: "Support Tools",
  admin: "Administration",
  general: "General",
};

const FALLBACK_GROUP = "general";

// Sidebar Structure - Exact match to left sidebar layout
// This defines the exact order and hierarchy as it appears in the sidebar
interface SidebarItem {
  section: string;
  featureKey?: string | null;
  isGroup?: boolean;
  level: number;
  isSuperAdminOnly?: boolean;
}

const SIDEBAR_STRUCTURE: SidebarItem[] = [
  // A) Dashboard
  { section: "Dashboard", featureKey: "dashboard", level: 0 },

  // B) Master (with sub-items)
  { section: "Master", isGroup: true, level: 0 },
  { section: "Organization", featureKey: null, level: 1, isSuperAdminOnly: true }, // No feature key - super admin only
  { section: "Fuel Products", featureKey: "fuel_products", level: 1 },
  { section: "Lubricants", featureKey: "lubricants", level: 1 },
  { section: "Credit Customer", featureKey: "credit_customers", level: 1 },
  { section: "Employees", featureKey: "employees", level: 1 },
  { section: "Expense Types", featureKey: "expense_types", level: 1 },
  { section: "Busi. Crd/Debit Party", featureKey: "business_parties", level: 1 },
  { section: "Vendor", featureKey: "vendors", level: 1 },
  { section: "Swipe Machines", featureKey: "swipe_machines", level: 1 },
  { section: "Expiry Items", featureKey: "expiry_items", level: 1 },
  { section: "Tank & Nozzel", featureKey: "tank_nozzle", level: 1 },
  { section: "Pump Setting", featureKey: "pump_settings", level: 1 },
  { section: "DutyPay Shift", featureKey: "duty_pay_shift", level: 1 },
  { section: "Print Templates", featureKey: "print_templates", level: 1 },
  { section: "Guest Entry", featureKey: "guest_entry", level: 1 },
  { section: "Denominations", featureKey: "denominations", level: 1 },

  // C) Invoice (with sub-items)
  { section: "Invoice", isGroup: true, level: 0 },
  { section: "Liquid Purchase", featureKey: "liquid_purchase", level: 1 },
  { section: "Lubs Purchase", featureKey: "lubs_purchase", level: 1 },

  // D) Day Business (with sub-items)
  { section: "Day Business", isGroup: true, level: 0 },
  { section: "Day Assignings", featureKey: "day_assignings", level: 1 },
  { section: "Daily Sale Rate", featureKey: "daily_sale_rate", level: 1 },
  { section: "Sale Entry", featureKey: "sale_entry", level: 1 },
  { section: "Lubricants", featureKey: "lub_sale", level: 1 },
  { section: "Swipe", featureKey: "swipe", level: 1 },
  { section: "Credit Sale", featureKey: "credit_sale", level: 1 },
  { section: "Expenses", featureKey: "expenses", level: 1 },
  { section: "Recovery", featureKey: "recovery", level: 1 },
  { section: "Emp Cash Recovery", featureKey: "employee_cash_recovery", level: 1 },
  { section: "DayOpening Stock", featureKey: "day_opening_stock", level: 1 },
  { section: "Day Settlement", featureKey: "day_settlement", level: 1 },

  // E) Statement Generation
  { section: "Statement Generation", featureKey: "statement_generation", level: 0 },

  // F) Product Stock (with sub-items)
  { section: "Product Stock", isGroup: true, level: 0 },
  { section: "Stock Report", featureKey: "stock_report", level: 1 },
  { section: "Lub Loss", featureKey: "lub_loss", level: 1 },
  { section: "Lubs Stock", featureKey: "lubs_stock", level: 1 },
  { section: "Minimum stock", featureKey: "minimum_stock", level: 1 },

  // G) Shift Sheet Entry
  { section: "Shift Sheet Entry", featureKey: "shift_sheet_entry", level: 0 },

  // H) Busi. Cr/Dr Trxns
  { section: "Busi. Cr/Dr Trxns", featureKey: "business_crdr_transactions", level: 0 },

  // I) Vendor Transaction
  { section: "Vendor Transaction", featureKey: "vendor_transactions", level: 0 },

  // J) Reports
  { section: "Reports", featureKey: "reports", level: 0 },

  // K) Generate SaleInvoice
  { section: "Generate SaleInvoice", featureKey: "generate_sale_invoice", level: 0 },

  // L) Generated Invoices
  { section: "Generated Invoices", featureKey: "generated_invoices", level: 0 },

  // M) Credit Limit Reports
  { section: "Credit Limit Reports", featureKey: "credit_limit_reports", level: 0 },

  // N) Relational Features (with sub-items)
  { section: "Relational Features", isGroup: true, level: 0 },
  { section: "Interest Trans", featureKey: "interest_transactions", level: 1 },
  { section: "Sheet Records", featureKey: "sheet_records", level: 1 },
  { section: "Day cash report", featureKey: "day_cash_report", level: 1 },
  { section: "Tanker sale", featureKey: "tanker_sale", level: 1 },
  { section: "Guest Sales", featureKey: "guest_sales", level: 1 },
  { section: "Attendance", featureKey: "attendance", level: 1 },
  { section: "Duty Pay", featureKey: "duty_pay", level: 1 },
  { section: "Sales Officer", featureKey: "sales_officer", level: 1 },
  { section: "Credit Requests", featureKey: "credit_requests", level: 1 },
  { section: "Expiry Items", featureKey: "expiry_items", level: 1 },
  { section: "Feedback", featureKey: "feedback", level: 1 },
];

const fetchUsers = async (): Promise<TenantUser[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const response = await fetchWithTimeout(
    "/api/users",
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, message: data?.error || "Failed to load users" };
  }

  return data?.users ?? [];
};

const fetchMasterUsers = async (): Promise<MasterUser[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const response = await fetchWithTimeout(
    "/api/developer-mode/master-users?includeTest=1",
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load users" };
  }

  return data?.users ?? [];
};

const fetchFeatureCatalog = async (): Promise<FeatureCatalogItem[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const response = await fetchWithTimeout(
    "/api/developer-mode/features",
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load feature catalog" };
  }

  return data?.features ?? [];
};

const fetchUserFeatures = async (userId: string, tenantId?: string): Promise<UserFeatureAssignment[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const isScoped = Boolean(tenantId);
  const url = isScoped
    ? `/api/developer-mode/users/${userId}/features?tenantId=${encodeURIComponent(tenantId!)}`
    : `/api/developer-mode/users/${userId}/features`;
  const headers: Record<string, string> = {};
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  const response = await fetchWithTimeout(
    url,
    { credentials: "include", headers },
    10000
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load user features" };
  }

  // Admin endpoint returns a feature map; normalize to array for UI
  if (data.features && !Array.isArray(data.features)) {
    const features = Object.entries<Record<string, boolean>>(data.features).map(([featureKey, allowed]) => ({
      featureKey,
      allowed: Boolean(allowed),
      defaultEnabled: false,
    } as unknown as UserFeatureAssignment));

    const enabledCount = features.filter(f => f.allowed).length;
    console.log(`[DeveloperMode] fetchUserFeatures: Received ${features.length} features, ${enabledCount} enabled for userId ${userId}, tenantId ${tenantId}`);
    if (enabledCount === 0 && features.length > 0) {
      console.warn(`[DeveloperMode] WARNING: All features are disabled! This might be incorrect. Sample features:`,
        features.slice(0, 5).map(f => `${f.featureKey}=${f.allowed}`).join(', ')
      );
    }

    return features;
  }

  return data?.features ?? [];
};

type SystemHealth = {
  totalTenants: number;
  totalUsers: number;
  databaseStatus: 'connected' | 'error';
  lastSyncTime: string;
};

const fetchSystemHealth = async (): Promise<SystemHealth> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const response = await fetchWithTimeout(
    "/api/developer-mode/system-health",
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load system health" };
  }

  return {
    totalTenants: data.totalTenants || 0,
    totalUsers: data.totalUsers || 0,
    databaseStatus: data.databaseStatus || 'error',
    lastSyncTime: data.lastSyncTime || new Date().toISOString(),
  };
};

type Tenant = {
  id: string;
  organizationName: string;
  createdAt: string;
  userCount: number;
};

type TenantUserListItem = {
  email: string;
  userId: string;
  createdAt: string;
};

const fetchTenants = async (): Promise<Tenant[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const response = await fetchWithTimeout(
    "/api/developer-mode/tenants",
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load tenants" };
  }

  return data?.tenants ?? [];
};

const fetchTenantUsers = async (tenantId: string): Promise<TenantUserListItem[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const response = await fetchWithTimeout(
    `/api/developer-mode/tenants/${tenantId}/users`,
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load tenant users" };
  }

  return data?.users ?? [];
};

type AuditLog = {
  developerEmail: string;
  targetUserEmail: string;
  featureKey: string | null;
  action: string;
  createdAt: string;
};

const fetchAuditLogs = async (userEmail?: string): Promise<AuditLog[]> => {
  const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
  const url = userEmail
    ? `/api/developer-mode/audit-logs?userEmail=${encodeURIComponent(userEmail)}&limit=50`
    : `/api/developer-mode/audit-logs?limit=50`;
  const response = await fetchWithTimeout(
    url,
    { credentials: "include" },
    10000 // 10 second timeout
  );
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw { status: response.status, message: data?.error || "Failed to load audit logs" };
  }

  return data?.logs ?? [];
};

export default function DeveloperMode() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  // Note: ProtectedRoute and DeveloperModeRoute already handle auth checks,
  // so we can safely assume user is authenticated when this component renders
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    username: "",
    fullName: "",
    password: "",
    role: "manager",
  });
  const [createNewOrg, setCreateNewOrg] = useState(false);
  const newOrgEmailRef = useRef<HTMLInputElement | null>(null);
  const newUserEmailRef = useRef<HTMLInputElement | null>(null);
  const [newOrgForm, setNewOrgForm] = useState({ organizationName: "", superAdminEmail: "", superAdminPassword: "", superAdminUsername: "", superAdminFullName: "" });
  const isAdditionalUserForNewOrg = useMemo(() => {
    if (!createNewOrg) return false;
    const a = String(newOrgForm.superAdminEmail || '').trim().toLowerCase();
    const b = String(newUserForm.email || '').trim().toLowerCase();
    return a !== '' && b !== '' && a !== b;
  }, [createNewOrg, newOrgForm.superAdminEmail, newUserForm.email]);
  const [activeTab, setActiveTab] = useState("user-management");

  useEffect(() => {
    if (showAddUser) {
      setSearch("");
      // Focus the first input inside the dialog to avoid typing into the list search
      setTimeout(() => {
        if (createNewOrg) {
          newOrgEmailRef.current?.focus();
        } else {
          newUserEmailRef.current?.focus();
        }
      }, 0);
    }
  }, [showAddUser, createNewOrg]);

  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers, error: usersError } = useQuery({
    queryKey: ["developer-mode-users"],
    queryFn: fetchUsers,
    refetchInterval: 10000, // Auto-refresh every 10 seconds to catch new users
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
  });

  useEffect(() => {
    if (usersError) {
      const info = handleAPIError(usersError, "Load users");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [usersError, toast]);

  const { data: featureCatalog = [], isLoading: isLoadingCatalog, error: featureCatalogError } = useQuery({
    queryKey: ["developer-mode-feature-catalog"],
    queryFn: fetchFeatureCatalog,
  });

  useEffect(() => {
    if (featureCatalogError) {
      const info = handleAPIError(featureCatalogError, "Load feature catalog");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [featureCatalogError, toast]);

  // Distinct users across tenants (master list)
  const { data: masterUsers = [], isLoading: isLoadingMasterUsers, isError: isErrorMasterUsers, error: errorMasterUsers, refetch: refetchMasterUsers } = useQuery({
    queryKey: ["developer-mode-master-users"],
    queryFn: fetchMasterUsers,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });

  useEffect(() => {
    if (errorMasterUsers) {
      console.error('[DeveloperMode] Failed to load master users:', errorMasterUsers);
      const info = handleAPIError(errorMasterUsers, "Load users");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [errorMasterUsers, toast]);

  // System Health
  const { data: systemHealth, isLoading: isLoadingSystemHealth, refetch: refetchSystemHealth, error: systemHealthError } = useQuery({
    queryKey: ["developer-mode-system-health"],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (systemHealthError) {
      const info = handleAPIError(systemHealthError, "Load system health");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [systemHealthError, toast]);

  // Tenant Management
  const { data: tenants = [], isLoading: isLoadingTenants, refetch: refetchTenants, error: tenantsError } = useQuery({
    queryKey: ["developer-mode-tenants"],
    queryFn: fetchTenants,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (tenantsError) {
      const info = handleAPIError(tenantsError, "Load tenants");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [tenantsError, toast]);

  const [expandedTenantIds, setExpandedTenantIds] = useState<Set<string>>(new Set());
  const [tenantUsersMap, setTenantUsersMap] = useState<Map<string, { users: TenantUserListItem[], isLoading: boolean }>>(new Map());
  const [auditLogSearch, setAuditLogSearch] = useState<string>("");

  // User action dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [showPasswordInfoDialog, setShowPasswordInfoDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showBackupsList, setShowBackupsList] = useState(false);

  // Form states
  const [passwordChangeForm, setPasswordChangeForm] = useState({ newPassword: "", confirmPassword: "" });
  const [retentionForm, setRetentionForm] = useState({ retentionDays: null as number | null });
  const [backupForm, setBackupForm] = useState({ backupAllData: true, fromDate: "", toDate: "" });

  // Data states
  const [userRetentionPolicy, setUserRetentionPolicy] = useState<any>(null);
  const [userBackups, setUserBackups] = useState<any[]>([]);
  const [passwordInfo, setPasswordInfo] = useState<any>(null);

  // Bulk operations states
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [showBulkRetentionDialog, setShowBulkRetentionDialog] = useState(false);
  const [bulkOperationsPending, setBulkOperationsPending] = useState(false);
  const [showBulkPasswordChangeDialog, setShowBulkPasswordChangeDialog] = useState(false);

  const toggleTenantExpansion = async (tenantId: string) => {
    const isExpanded = expandedTenantIds.has(tenantId);
    const newExpanded = new Set(expandedTenantIds);

    if (isExpanded) {
      newExpanded.delete(tenantId);
    } else {
      newExpanded.add(tenantId);

      // Load users if not already loaded
      if (!tenantUsersMap.has(tenantId)) {
        setTenantUsersMap(prev => new Map(prev).set(tenantId, { users: [], isLoading: true }));

        try {
          const users = await fetchTenantUsers(tenantId);
          setTenantUsersMap(prev => new Map(prev).set(tenantId, { users, isLoading: false }));
        } catch (error) {
          console.error('Failed to load tenant users:', error);
          setTenantUsersMap(prev => new Map(prev).set(tenantId, { users: [], isLoading: false }));
        }
      }
    }

    setExpandedTenantIds(newExpanded);
  };

  // Audit Logs
  const { data: auditLogs = [], isLoading: isLoadingAuditLogs, refetch: refetchAuditLogs, error: auditLogsError } = useQuery({
    queryKey: ["developer-mode-audit-logs", auditLogSearch],
    queryFn: () => fetchAuditLogs(auditLogSearch || undefined),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (auditLogsError) {
      const info = handleAPIError(auditLogsError, "Load audit logs");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [auditLogsError, toast]);

  const filteredAuditLogs = useMemo(() => {
    if (!Array.isArray(auditLogs)) return [];
    if (!auditLogSearch.trim()) return auditLogs;
    const searchLower = auditLogSearch.trim().toLowerCase();
    return auditLogs.filter((log) =>
      log.targetUserEmail.toLowerCase().includes(searchLower) ||
      log.developerEmail.toLowerCase().includes(searchLower) ||
      (log.featureKey && log.featureKey.toLowerCase().includes(searchLower))
    );
  }, [auditLogs, auditLogSearch]);

  // Map email -> dev tenant user id
  const emailToDevUserId = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(users)) {
      users.forEach((u) => {
        if (u.email) map.set(u.email.toLowerCase(), u.id);
      });
    }
    return map;
  }, [users]);

  useEffect(() => {
    if (!selectedEmail && Array.isArray(masterUsers) && masterUsers.length > 0) {
      const first = masterUsers[0];
      setSelectedEmail(first.email);
      const memberships = first.memberships || [];
      // Find the first non-dev tenant membership, or use the first one
      const nonDev = memberships.find((m) => m.tenantId !== (currentUser as any)?.tenantId);
      const targetMembership = nonDev || memberships[0];

      // Use the userId from the membership, not from dev tenant's user list
      const targetUserId = targetMembership?.userId || null;
      const targetTenantId = targetMembership?.tenantId || null;

      setSelectedUserId(targetUserId);
      setSelectedTenantId(targetTenantId);

      console.log('[DeveloperMode] Auto-selected first user:', {
        email: first.email,
        userId: targetUserId,
        tenantId: targetTenantId,
        organization: targetMembership?.organizationName
      });
    }
  }, [masterUsers, selectedEmail, currentUser]);

  const {
    data: userFeatures = [],
    isLoading: isLoadingUserFeatures,
    refetch: refetchUserFeatures,
    error: userFeaturesError,
  } = useQuery({
    queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId],
    queryFn: () => fetchUserFeatures(selectedUserId as string, selectedTenantId as string),
    enabled: Boolean(selectedUserId && selectedTenantId),
  });

  useEffect(() => {
    if (userFeaturesError) {
      const info = handleAPIError(userFeaturesError, "Load user features");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  }, [userFeaturesError, toast]);

  useEffect(() => {
    if (!Array.isArray(userFeatures) || userFeatures.length === 0) {
      setBaseline({});
      setDraft({});
      return;
    }

    const next: Record<string, boolean> = {};
    userFeatures.forEach((feature) => {
      next[feature.featureKey] = feature.allowed;
    });

    setBaseline(next);
    setDraft({ ...next });
  }, [userFeatures]);

  const selectedMasterUser = useMemo(() => {
    if (!selectedEmail || !Array.isArray(masterUsers)) return null;
    return masterUsers.find((u) => (u.email || '').toLowerCase() === (selectedEmail || '').toLowerCase()) ?? null;
  }, [masterUsers, selectedEmail]);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(masterUsers)) return [];
    const base = masterUsers; // include all users (dev and test included when includeTest=1)
    const query = search.trim().toLowerCase();
    if (!query) return base as any[];
    return base.filter((user) => {
      const haystack = [user.fullName, user.email, user.username]
        .filter(Boolean)
        .map((value) => (value as string).toLowerCase())
        .join(" ");
      return haystack.includes(query);
    }) as any[];
  }, [masterUsers, search]);

  // Group features according to exact sidebar structure
  type GroupedFeatureItem = {
    section: string;
    isGroup?: boolean;
    level: number;
    feature?: UserFeatureAssignment;
    children?: Array<{ section: string; feature: UserFeatureAssignment | null; isSuperAdminOnly?: boolean }>;
  };

  const groupedFeatures = useMemo(() => {
    if (!Array.isArray(userFeatures) || userFeatures.length === 0) return [] as GroupedFeatureItem[];

    // Create a map of featureKey -> feature for quick lookup
    const featureMap = new Map<string, UserFeatureAssignment>();
    userFeatures.forEach((feature) => {
      featureMap.set(feature.featureKey, feature);
    });

    // Build structure matching sidebar exactly
    const result: GroupedFeatureItem[] = [];
    let currentGroup: GroupedFeatureItem | null = null;

    SIDEBAR_STRUCTURE.forEach((item) => {
      if (item.isGroup) {
        // Start a new group
        currentGroup = {
          section: item.section,
          isGroup: true,
          level: item.level,
          children: [],
        };
        result.push(currentGroup);
      } else if (item.featureKey) {
        // Check if feature exists in userFeatures
        const feature = featureMap.get(item.featureKey);
        if (feature) {
          if (currentGroup && item.level === 1) {
            // Add as child of current group
            currentGroup.children!.push({
              section: item.section,
              feature,
            });
          } else {
            // Standalone feature - close previous group
            currentGroup = null;
            result.push({
              section: item.section,
              level: item.level,
              feature,
            });
          }
        }
      } else if (item.section === "Organization") {
        // Organization - special case (no feature key)
        if (currentGroup && item.level === 1) {
          currentGroup.children!.push({
            section: item.section,
            feature: null,
            isSuperAdminOnly: true,
          });
        }
      }
    });

    return result;
  }, [userFeatures]);

  // Helper to detect the special developer account (superior, not configurable)
  const isDeveloperUser = (u: MasterUser | TenantUser | null | undefined) => {
    if (!u) return false;
    const email = (('email' in u ? u.email : '') || '').toLowerCase();
    const username = (('username' in u ? u.username : '') || '').toLowerCase();
    return email === 'dev@developer.local' || username === 'dev';
  };

  const dirty = useMemo(() => {
    const baselineKeys = Object.keys(baseline);
    if (baselineKeys.length === 0 && Object.keys(draft).length === 0) {
      return false;
    }

    return baselineKeys.some((key) => baseline[key] !== draft[key]);
  }, [baseline, draft]);

  const mutation = useMutation({
    mutationFn: async ({ userId, features }: { userId: string; features: { featureKey: string; allowed: boolean }[] }) => {
      const url = selectedTenantId
        ? `/api/developer-mode/users/${userId}/features?tenantId=${encodeURIComponent(selectedTenantId)}`
        : `/api/developer-mode/users/${userId}/features`;
      const response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to update feature access" };
      }

      return data?.features as UserFeatureAssignment[];
    },
    onSuccess: (features) => {
      console.log(`[DeveloperMode] ========== SAVE SUCCESS ==========`);
      console.log(`[DeveloperMode] Response received: ${features.length} features`);

      // Check dashboard in response
      const dashboardInResponse = features.find((f: any) => f.featureKey?.toLowerCase() === 'dashboard');
      if (dashboardInResponse) {
        console.log(`[DeveloperMode] ✅ Dashboard in response: allowed=${dashboardInResponse.allowed}`);
      } else {
        console.error(`[DeveloperMode] ❌ Dashboard NOT FOUND in response!`);
      }

      const enabledCount = features.filter((f: any) => f.allowed).length;
      const disabledCount = features.filter((f: any) => !f.allowed).length;
      console.log(`[DeveloperMode] Response: ${enabledCount} enabled, ${disabledCount} disabled`);
      console.log(`[DeveloperMode] First 10 features from response:`, features.slice(0, 10).map((f: any) => `${f.featureKey}=${f.allowed}`));

      toast({
        title: "Feature access updated",
        description: "User permissions saved. The user will need to refresh their browser (F5) to see changes immediately."
      });
      const next: Record<string, boolean> = {};
      features.forEach((feature: any) => {
        next[feature.featureKey] = feature.allowed;
      });
      setBaseline(next);
      setDraft({ ...next });

      console.log(`[DeveloperMode] Updated baseline and draft. Dashboard in baseline: ${next.dashboard ?? 'NOT SET'}`);
      console.log(`[DeveloperMode] ===================================`);

      // Invalidate the developer mode query for this user and tenant
      queryClient.invalidateQueries({ queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId] });

      // CRITICAL: Invalidate the feature-access cache for ALL users
      // This ensures that when the target user refreshes or remounts, they get fresh data
      queryClient.invalidateQueries({ queryKey: ["feature-access"] });

      // Also remove ALL cached queries to force fresh fetch
      queryClient.removeQueries({ queryKey: ["feature-access", "v1"] });
      queryClient.removeQueries({ queryKey: ["feature-access"] });

      // Set all feature-access queries as stale immediately
      queryClient.setQueriesData({ queryKey: ["feature-access"] }, undefined);

      console.log(`[DeveloperMode] Cache invalidated for feature-access. Target user should see changes after refreshing (F5) or when window regains focus.`);
    },
    onError: (error) => {
      const info = handleAPIError(error, "Update feature access");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  const handleToggleFeature = (featureKey: string, nextValue: boolean) => {
    console.log(`[DeveloperMode] Toggling ${featureKey} to ${nextValue} (type: ${typeof nextValue})`);
    setDraft((prev) => {
      const updated = { ...prev, [featureKey]: Boolean(nextValue) }; // Explicitly convert to boolean
      console.log(`[DeveloperMode] Draft updated - ${featureKey}: ${updated[featureKey]} (type: ${typeof updated[featureKey]})`);
      // Log current draft state for dashboard
      if (featureKey.toLowerCase() === 'dashboard') {
        console.log(`[DeveloperMode] Dashboard in draft:`, updated.dashboard, `(hasOwnProperty: ${updated.hasOwnProperty('dashboard')})`);
      }
      return updated;
    });
  };

  const handleToggleGroup = (sectionName: string, nextValue: boolean) => {
    setDraft((prev) => {
      const updated = { ...prev };
      // Find the group in the sidebar structure
      const groupIndex = SIDEBAR_STRUCTURE.findIndex(item => item.section === sectionName && item.isGroup);
      if (groupIndex !== -1 && Array.isArray(userFeatures)) {
        // Find all children of this group
        for (let i = groupIndex + 1; i < SIDEBAR_STRUCTURE.length; i++) {
          const item = SIDEBAR_STRUCTURE[i];
          if (item.level === 1 && item.featureKey) {
            // This is a child of the group
            const feature = userFeatures.find(f => f.featureKey === item.featureKey);
            if (feature) {
              updated[feature.featureKey] = nextValue;
            }
          } else if (item.level === 0 || item.isGroup) {
            // Reached next top-level item, stop
            break;
          }
        }
      }
      return updated;
    });
  };

  const handleEnableAll = (value: boolean) => {
    if (!Array.isArray(userFeatures)) return;
    console.log(`[DeveloperMode] handleEnableAll(${value}) - updating ${userFeatures.length} features`);
    // Log a few keys to see what we're working with
    console.log(`[DeveloperMode] Sample keys in userFeatures:`, userFeatures.slice(0, 5).map(f => f.featureKey));

    setDraft((prev) => {
      const updated = { ...prev };
      userFeatures.forEach((feature) => {
        updated[feature.featureKey] = value;
        // console.log(`[DeveloperMode] Setting ${feature.featureKey} to ${value}`);
      });
      console.log(`[DeveloperMode] Updated draft keys count:`, Object.keys(updated).length);
      console.log(`[DeveloperMode] Sample draft values after update:`,
        Object.entries(updated).slice(0, 5).map(([k, v]) => `${k}=${v}`)
      );
      return updated;
    });
  };

  const handleResetToDefaults = () => {
    if (!Array.isArray(userFeatures)) return;
    const next: Record<string, boolean> = {};
    userFeatures.forEach((feature) => {
      // Reset to the server's current truth, not UI defaults
      next[feature.featureKey] = Boolean(feature.allowed);
    });
    setDraft(next);
  };

  const handleRevert = () => {
    setDraft({ ...baseline });
  };

  const handleSave = () => {
    if (!selectedUserId || !Array.isArray(userFeatures) || userFeatures.length === 0) {
      console.warn('[DeveloperMode] Cannot save: no selectedUserId or userFeatures empty');
      return;
    }

    console.log(`[DeveloperMode] ========== PREPARING SAVE ==========`);
    console.log(`[DeveloperMode] Draft state keys: ${Object.keys(draft).length}`);
    console.log(`[DeveloperMode] Draft state (all):`, draft);
    console.log(`[DeveloperMode] User features count: ${userFeatures.length}`);

    const payload = userFeatures.map((feature) => {
      // CRITICAL FIX: Check if the key EXISTS in draft (even if value is false)
      // The ?? operator treats false as falsy, so we need to check hasOwnProperty or !== undefined
      let allowed: boolean;
      if (draft.hasOwnProperty(feature.featureKey)) {
        // Key exists in draft - use that value (even if false)
        const draftValue = draft[feature.featureKey];
        allowed = Boolean(draftValue);
        // CRITICAL: Log to verify false values are not being lost
        if (feature.featureKey.toLowerCase() === 'dashboard') {
          console.log(`[DeveloperMode] Dashboard in payload: draftValue=${draftValue} (type: ${typeof draftValue}), allowed=${allowed}`);
        }
      } else {
        // Key doesn't exist in draft - fallback strictly to current allowed
        allowed = Boolean(feature.allowed);
        if (feature.featureKey.toLowerCase() === 'dashboard') {
          console.log(`[DeveloperMode] Dashboard NOT in draft, using fallback: allowed=${allowed} (from feature.allowed=${feature.allowed})`);
        }
      }

      return {
        featureKey: feature.featureKey,
        allowed,
      };
    });

    // Log what we're sending
    const enabledInPayload = payload.filter(p => p.allowed).length;
    const disabledInPayload = payload.filter(p => !p.allowed).length;
    console.log(`[DeveloperMode] ========== SAVING FEATURES ==========`);
    console.log(`[DeveloperMode] User: ${selectedUserId}`);
    console.log(`[DeveloperMode] Total features: ${payload.length}`);
    console.log(`[DeveloperMode] Enabled: ${enabledInPayload}`);
    console.log(`[DeveloperMode] Disabled: ${disabledInPayload}`);
    console.log(`[DeveloperMode] Draft state keys:`, Object.keys(draft).length);
    console.log(`[DeveloperMode] Draft state (first 10):`, Object.fromEntries(Object.entries(draft).slice(0, 10)));

    // Check if dashboard is in the payload and its value
    const dashboardFeature = payload.find(p => p.featureKey.toLowerCase() === 'dashboard');
    if (dashboardFeature) {
      console.log(`[DeveloperMode] ✅ Dashboard in payload: allowed=${dashboardFeature.allowed}`);
      const dashboardInDraft = draft.hasOwnProperty('dashboard') ? draft.dashboard : 'NOT IN DRAFT';
      console.log(`[DeveloperMode] Dashboard in draft: ${dashboardInDraft}`);
    } else {
      console.error(`[DeveloperMode] ❌ Dashboard NOT FOUND in payload!`);
      console.log(`[DeveloperMode] Available feature keys:`, payload.map(p => p.featureKey).filter(k => k.toLowerCase().includes('dash')));
    }
    console.log(`[DeveloperMode] Full payload (first 10):`, payload.slice(0, 10));
    console.log(`[DeveloperMode] =======================================`);

    mutation.mutate({ userId: selectedUserId, features: payload });
  };

  const switchUserMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await fetch("/api/auth/switch-user", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw { status: response.status, message: data?.error || "Failed to switch user" };
      }

      return data;
    },
    onSuccess: async () => {
      toast({
        title: "User switched",
        description: "You are now viewing as the selected user.",
      });
      await refreshUser();
      navigate("/");
      window.location.reload();
    },
    onError: (error) => {
      const info = handleAPIError(error, "Switch user");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  const isBusy = mutation.isPending || isLoadingCatalog || isLoadingUserFeatures;

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to delete user" };
      }
      return data;
    },
    onSuccess: async () => {
      toast({ title: "User deleted", description: "User has been permanently deleted from all tenants." });
      setShowDeleteDialog(false);
      setSelectedEmail(null);
      setSelectedUserId(null);
      await refetchMasterUsers();
      await refetchUsers();
    },
    onError: (error: any) => {
      const info = handleAPIError(error, "Delete user");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ userEmail, newPassword }: { userEmail: string; newPassword: string }) => {
      const encodedEmail = encodeURIComponent(userEmail);
      const url = `/api/developer-mode/users/${encodedEmail}/password`;

      console.log(`[Frontend] Changing password for ${userEmail} (URL: ${url})`);

      // Use fetchWithTimeout with 15 second timeout for password changes
      // (backend uses 8s overall timeout, this gives buffer for response)
      const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
      const response = await fetchWithTimeout(
        url,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        },
        15000 // 15 second timeout (backend uses 8s overall timeout)
      );

      // Handle network errors
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorData?.details || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw { status: response.status, message: errorMessage };
      }

      const data = await response.json();
      if (!data?.ok) {
        throw { status: response.status, message: data?.error || data?.details || "Failed to change password" };
      }

      // Show warnings if not all tenants were updated
      if (data.warnings && data.warnings.length > 0) {
        console.warn(`[Frontend] Password change warnings:`, data.warnings);
        toast({
          title: "Password changed with warnings",
          description: `Updated in ${data.updatedInTenants} of ${data.totalTenants} tenant(s). Some tenants failed: ${data.warnings.join(', ')}`,
          variant: "default",
        });
      }

      return data;
    },
    onSuccess: (data) => {
      const message = data.warnings && data.warnings.length > 0
        ? `Password updated in ${data.updatedInTenants} tenant(s). Some tenants had errors.`
        : `Password changed successfully in ${data.updatedInTenants || 'all'} tenant(s).`;

      toast({
        title: "Password changed",
        description: message
      });
      setShowPasswordChangeDialog(false);
      setPasswordChangeForm({ newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      console.error(`[Frontend] Password change error:`, error);
      const info = handleAPIError(error, "Change password");
      toast({
        title: info.title,
        description: info.description || `Failed to change password. ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userEmail, status }: { userEmail: string; status: string }) => {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to update status" };
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: "Status updated", description: "User account status has been updated." });
      setShowStatusDialog(false);
      refetchMasterUsers();
    },
    onError: (error: any) => {
      const info = handleAPIError(error, "Update status");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  // Force logout mutation
  const forceLogoutMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}/force-logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to force logout" };
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Force logout initiated",
        description: "User will need to login again. Existing tokens remain valid until expiry."
      });
    },
    onError: (error: any) => {
      const info = handleAPIError(error, "Force logout");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  // Fetch retention policy
  const fetchRetentionPolicy = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}/retention-policy`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data?.ok) {
        setUserRetentionPolicy(data.policy);
      }
    } catch (err) {
      console.error('Failed to fetch retention policy:', err);
    }
  };

  // Set retention policy mutation
  const setRetentionMutation = useMutation({
    mutationFn: async ({ userEmail, retentionDays }: { userEmail: string; retentionDays: number | null }) => {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}/retention-policy`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionDays }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to set retention policy" };
      }
      return data;
    },
    onSuccess: async () => {
      toast({ title: "Retention policy set", description: "Data retention policy has been updated." });
      setShowRetentionDialog(false);
      if (selectedEmail) {
        await fetchRetentionPolicy(selectedEmail);
      }
    },
    onError: (error: any) => {
      const info = handleAPIError(error, "Set retention policy");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  // Fetch backups
  const fetchBackups = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}/backups`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data?.ok) {
        setUserBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    }
  };

  // View password info mutation
  const fetchPasswordInfo = async (userEmail: string) => {
    try {
      // Get password change history from audit logs
      const response = await fetch(`/api/developer-mode/audit-logs?targetUser=${encodeURIComponent(userEmail)}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data?.ok) {
        const passwordChanges = data.logs
          .filter((log: any) => log.action === 'password_changed' || log.action === 'password_reset')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setPasswordInfo({
          userEmail,
          lastChanged: passwordChanges.length > 0 ? passwordChanges[0].createdAt : null,
          changeCount: passwordChanges.length,
          changeHistory: passwordChanges.slice(0, 5), // Last 5 changes
        });
        setShowPasswordInfoDialog(true);
      }
    } catch (err) {
      console.error('Failed to fetch password info:', err);
      toast({
        title: "Failed to load password info",
        description: "Could not retrieve password change history",
        variant: "destructive"
      });
    }
  };

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async ({ userEmail, backupAllData, fromDate, toDate }: { userEmail: string; backupAllData: boolean; fromDate?: string; toDate?: string }) => {
      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(userEmail)}/backup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupAllData, fromDate, toDate }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to create backup" };
      }
      return data;
    },
    onSuccess: async () => {
      toast({ title: "Backup created", description: "User data backup has been created successfully." });
      setShowBackupDialog(false);
      setBackupForm({ backupAllData: true, fromDate: "", toDate: "" });
      if (selectedEmail) {
        await fetchBackups(selectedEmail);
      }
    },
    onError: (error: any) => {
      const info = handleAPIError(error, "Create backup");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  // Load retention policy and backups when user is selected
  useEffect(() => {
    if (selectedEmail && !isDeveloperUser(selectedMasterUser)) {
      fetchRetentionPolicy(selectedEmail);
      fetchBackups(selectedEmail);
    }
  }, [selectedEmail, selectedMasterUser]);

  // Bulk operations handlers
  const handleBulkForceLogout = async () => {
    setBulkOperationsPending(true);
    try {
      const emails = Array.from(bulkSelectedUsers);
      const results = [];

      for (const email of emails) {
        try {
          const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(email)}/force-logout`, {
            method: "POST",
            credentials: "include",
          });
          const data = await response.json();
          if (response.ok && data?.ok) {
            results.push({ email, success: true });
          } else {
            results.push({ email, success: false, error: data?.error });
          }
        } catch (err: any) {
          results.push({ email, success: false, error: err?.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Bulk Force Logout",
        description: `${successCount} of ${emails.length} users logged out successfully.`,
        variant: successCount === emails.length ? "default" : "destructive",
      });

      if (successCount === emails.length) {
        setBulkSelectedUsers(new Set());
      }
    } catch (error: any) {
      toast({
        title: "Bulk operation failed",
        description: error?.message || "Failed to perform bulk force logout",
        variant: "destructive",
      });
    } finally {
      setBulkOperationsPending(false);
    }
  };

  const addUserMutation = useMutation({
    mutationFn: async (userData: { email: string; username?: string; fullName?: string; password: string; role: string }) => {
      let targetTenantId = selectedTenantId;
      if (createNewOrg) {
        if (!newOrgForm.organizationName || !newOrgForm.superAdminEmail) {
          throw { status: 400, message: "Organization name and super admin email are required" };
        }
        const createTenantRes = await fetch(`/api/developer-mode/tenants`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationName: newOrgForm.organizationName,
            superAdminEmail: newOrgForm.superAdminEmail,
            superAdminPassword: newOrgForm.superAdminPassword || undefined,
            superAdminUsername: newOrgForm.superAdminUsername || undefined,
            superAdminFullName: newOrgForm.superAdminFullName || undefined,
          })
        });
        const createTenantData = await createTenantRes.json();
        if (createTenantRes.status === 202 && createTenantData?.ok && createTenantData?.provisioning) {
          // Start polling tenants list briefly until the new org appears
          toast({ title: "Provisioning organization...", description: "This may take a few seconds" });
          const start = Date.now();
          const MAX_WAIT = 40000; // 40s
          let foundId: string | null = null;
          while (Date.now() - start < MAX_WAIT) {
            try {
              const { fetchWithTimeout } = await import("@/utils/fetchWithTimeout");
              const resp = await fetchWithTimeout("/api/developer-mode/tenants", { credentials: "include" }, 10000);
              const data = await resp.json();
              const list = Array.isArray(data?.tenants) ? data.tenants : [];
              const match = list.find((t: any) => (t.organizationName || '').trim().toLowerCase() === newOrgForm.organizationName.trim().toLowerCase());
              if (match) { foundId = match.id; break; }
            } catch { }
            await new Promise(r => setTimeout(r, 1500));
          }
          if (!foundId) {
            throw { status: 504, message: "Organization is still provisioning. Please try again in a moment." };
          }
          targetTenantId = foundId;
        } else if (!createTenantRes.ok || !createTenantData?.ok) {
          throw { status: createTenantRes.status, message: createTenantData?.error || "Failed to create organization" };
        }
        if (!targetTenantId) {
          targetTenantId = createTenantData.tenant?.id;
        }

        // Set super admin password immediately after provisioning
        if (newOrgForm.superAdminPassword) {
          try {
            const resp = await fetch(`/api/developer-mode/users/${encodeURIComponent(newOrgForm.superAdminEmail)}/password`, {
              method: 'PUT',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPassword: newOrgForm.superAdminPassword })
            });
            const data = await resp.json();
            if (!resp.ok || !data?.ok) {
              throw new Error(data?.error || 'Failed to set super admin password');
            }
          } catch (e) {
            console.error('[DeveloperMode] Failed to set super admin password', e);
            toast({ title: 'Warning', description: 'Organization created, but failed to set super admin password. Please set it from Developer Mode.', variant: 'destructive' });
          }
        }

        // Ensure master mapping exists for the new super admin so it appears in Registered Users immediately
        try {
          const mapResp = await fetch(`/api/developer-mode/tenant-users/map`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newOrgForm.superAdminEmail, tenantId: targetTenantId })
          });
          await mapResp.json().catch(() => ({}));
        } catch { }

        // If an additional user email+password is provided and it's different from the super admin,
        // create that user now so they can log in immediately.
        const additionalEmail = String(newUserForm.email || '').trim().toLowerCase();
        const additionalPwd = String(newUserForm.password || '').trim();
        if (additionalEmail && additionalPwd && additionalEmail !== String(newOrgForm.superAdminEmail || '').trim().toLowerCase()) {
          try {
            const createUserResp = await fetch(`/api/developer-mode/tenants/${targetTenantId}/users`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: additionalEmail,
                username: newUserForm.username || undefined,
                fullName: newUserForm.fullName || undefined,
                password: additionalPwd,
                role: newUserForm.role === 'super_admin' ? 'manager' : newUserForm.role // prevent second super_admin by default
              })
            });
            const createdUserData = await createUserResp.json();
            if (!createUserResp.ok || !createdUserData?.ok) {
              throw new Error(createdUserData?.error || 'Failed to create additional user');
            }
          } catch (e) {
            console.error('[DeveloperMode] Failed to create additional user for new org', e);
            toast({ title: 'Warning', description: 'Org created. Could not create the additional user automatically. Please add them under existing organization.', variant: 'destructive' });
          }
        }
      }

      if (!targetTenantId) {
        throw { status: 400, message: "Please select or create an organization first" };
      }

      // If creating a new org and no additional user email provided OR email equals super admin,
      // skip creating a duplicate/extra user and finish after provisioning.
      const userEmailTrim = String(userData.email || '').trim().toLowerCase();
      const superAdminEmailTrim = String(newOrgForm.superAdminEmail || '').trim().toLowerCase();
      const noAdditionalUser = !userEmailTrim;
      const sameAsSuperAdmin = userEmailTrim && userEmailTrim === superAdminEmailTrim;
      if (createNewOrg && (noAdditionalUser || sameAsSuperAdmin)) {
        toast({ title: "Organization created", description: "Super admin account is already provisioned. No extra user created." });
        await queryClient.invalidateQueries({ queryKey: ["developer-mode-tenants"] });
        await queryClient.invalidateQueries({ queryKey: ["developer-mode-master-users"] });
        setShowAddUser(false);
        setNewUserForm({ email: "", username: "", fullName: "", password: "", role: "manager" });
        setCreateNewOrg(false);
        setNewOrgForm({ organizationName: "", superAdminEmail: "", superAdminPassword: "", superAdminUsername: "", superAdminFullName: "" });
        return { ok: true } as any;
      }

      // If creating an additional user for a brand-new org, restrict role to non-super-admin
      const safeRole = (isAdditionalUserForNewOrg && newUserForm.role === 'super_admin') ? 'manager' : newUserForm.role;

      const response = await fetch(`/api/developer-mode/tenants/${targetTenantId}/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userData, role: safeRole }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw { status: response.status, message: data?.error || "Failed to create user" };
      }
      return data;
    },
    onSuccess: async () => {
      toast({ title: "User created", description: createNewOrg ? "Organization created and user added successfully." : "User has been added successfully and will appear in the list." });
      // Immediately refetch users to show the new user
      await queryClient.invalidateQueries({ queryKey: ["developer-mode-users"] });
      await queryClient.invalidateQueries({ queryKey: ["developer-mode-master-users"] });
      await refetchUsers();
      await refetchMasterUsers();
      setSearch("");
      setShowAddUser(false);
      setNewUserForm({ email: "", username: "", fullName: "", password: "", role: "manager" });
      setCreateNewOrg(false);
      setNewOrgForm({ organizationName: "", superAdminEmail: "", superAdminPassword: "", superAdminUsername: "", superAdminFullName: "" });
    },
    onError: (error: any) => {
      const info = handleAPIError(error, "Create user");
      toast({ title: info.title, description: info.description, variant: "destructive" });
    },
  });

  // Note: No need to check authLoading or currentUser here because:
  // - ProtectedRoute already ensures user is authenticated
  // - DeveloperModeRoute already ensures user is the dev account
  // This prevents hook ordering issues from conditional rendering

  return (
    <div className="space-y-6">
      {/* User Switcher Section */}
      {currentUser && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Currently viewing as: <span className="text-blue-700">{currentUser.fullName || currentUser.email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Switch to another user to see their dashboard view
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {Array.isArray(users) && users.length > 0 && (
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
                    value={currentUser.id || ""}
                    onChange={(e) => {
                      const targetUserId = e.target.value;
                      if (targetUserId && targetUserId !== currentUser.id) {
                        const targetUser = users.find(u => u.id === targetUserId);
                        if (targetUser && confirm(`Switch to ${targetUser.fullName || targetUser.username || targetUser.email}? You will be logged in as that user.`)) {
                          switchUserMutation.mutate(targetUserId);
                        }
                      }
                    }}
                    disabled={switchUserMutation.isPending || isLoadingUsers}
                  >
                    <option value="">Select user to switch...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || user.username || user.email} {user.id === currentUser.id ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
              Developer Mode
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              <strong>🔧 System Control Panel - Above All Tenants & Organizations</strong>
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="user-management">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system-health">
            <Activity className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="tenant-management">
            <Building2 className="h-4 w-4 mr-2" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="audit-logs">
            <Database className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="advanced-controls">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Advanced Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-management" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">User Management</h2>
              <p className="text-muted-foreground mt-1 max-w-3xl">
                <strong>Manage Registered Users:</strong> Select any user → Control which features they can access → Save changes.
                Unchecked features will be hidden from the user's left sidebar.
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredUsers.length} Registered User{filteredUsers.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="h-full border-2 border-blue-200">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span>Registered Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          setSearch("");
                          const response = await fetch('/api/developer-mode/sync-tenant-users', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          });
                          const data = await response.json();
                          if (!response.ok || !data?.ok) {
                            throw { status: response.status, message: data?.error || 'Sync failed' };
                          }
                          toast({ title: 'Synced registered users', description: `Inserted ${data.inserted}, updated ${data.updated}` });
                          await queryClient.invalidateQueries({ queryKey: ["developer-mode-master-users"] });
                          await queryClient.invalidateQueries({ queryKey: ["developer-mode-tenants"] });
                          await queryClient.invalidateQueries({ queryKey: ["developer-mode-users"] });
                        } catch (err: any) {
                          const info = handleAPIError(err, 'Sync users');
                          toast({ title: info.title, description: info.description, variant: 'destructive' });
                        }
                      }}
                    >
                      Sync
                    </Button>
                    <Badge className="bg-blue-600">{filteredUsers.length}</Badge>
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on any user to manage their access permissions
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={showAddUser} onOpenChange={(open) => { setShowAddUser(open); setSearch(""); }}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="sm" variant="default">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account. They will appear in the list immediately and you can control their feature access.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Mode selector: create user in existing org vs create new org */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="orgMode"
                              checked={!createNewOrg}
                              onChange={() => setCreateNewOrg(false)}
                            />
                            Create in existing organization
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="orgMode"
                              checked={createNewOrg}
                              onChange={() => setCreateNewOrg(true)}
                            />
                            Create new organization
                          </label>
                        </div>
                      </div>
                      {createNewOrg ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="orgName">Organization Name *</Label>
                            <Input id="orgName" placeholder="My Company" value={newOrgForm.organizationName} onChange={(e) => setNewOrgForm({ ...newOrgForm, organizationName: e.target.value })} disabled={addUserMutation.isPending} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgAdmin">Super Admin Email *</Label>
                            <Input id="orgAdmin" type="email" placeholder="admin@company.com" value={newOrgForm.superAdminEmail} onChange={(e) => { setSearch(""); setNewOrgForm({ ...newOrgForm, superAdminEmail: e.target.value }); }} disabled={addUserMutation.isPending} ref={newOrgEmailRef} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgAdminUsername">Super Admin Username (optional)</Label>
                            <Input id="orgAdminUsername" placeholder="username" value={newOrgForm.superAdminUsername} onChange={(e) => setNewOrgForm({ ...newOrgForm, superAdminUsername: e.target.value })} disabled={addUserMutation.isPending} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgAdminFullName">Super Admin Full Name (optional)</Label>
                            <Input id="orgAdminFullName" placeholder="Full Name" value={newOrgForm.superAdminFullName} onChange={(e) => setNewOrgForm({ ...newOrgForm, superAdminFullName: e.target.value })} disabled={addUserMutation.isPending} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orgAdminPwd">Super Admin Password *</Label>
                            <Input id="orgAdminPwd" type="password" placeholder="Enter password" value={newOrgForm.superAdminPassword} onChange={(e) => setNewOrgForm({ ...newOrgForm, superAdminPassword: e.target.value })} disabled={addUserMutation.isPending} />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="org">Organization *</Label>
                          <Select value={selectedTenantId || ''} onValueChange={(value) => setSelectedTenantId(value)} disabled={addUserMutation.isPending || !Array.isArray(tenants) || tenants.length === 0}>
                            <SelectTrigger id="org">
                              <SelectValue placeholder={Array.isArray(tenants) && tenants.length > 0 ? 'Select organization' : 'No organizations available'} />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(tenants) && tenants.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.organizationName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {!createNewOrg && (
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUserForm.email}
                            onChange={(e) => { setSearch(""); setNewUserForm({ ...newUserForm, email: e.target.value }); }}
                            ref={newUserEmailRef}
                            disabled={addUserMutation.isPending}
                          />
                        </div>
                      )}
                      {!createNewOrg && (
                        <div className="space-y-2">
                          <Label htmlFor="username">Username (optional)</Label>
                          <Input
                            id="username"
                            placeholder="username"
                            value={newUserForm.username}
                            onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                            disabled={addUserMutation.isPending}
                          />
                        </div>
                      )}
                      {!createNewOrg && (
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name (optional)</Label>
                          <Input
                            id="fullName"
                            placeholder="Full Name"
                            value={newUserForm.fullName}
                            onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                            disabled={addUserMutation.isPending}
                          />
                        </div>
                      )}
                      {!createNewOrg && (
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            disabled={addUserMutation.isPending}
                          />
                        </div>
                      )}
                      {!createNewOrg && (
                        <div className="space-y-2">
                          <Label htmlFor="role">Role *</Label>
                          <Select
                            value={newUserForm.role}
                            onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value })}
                            disabled={addUserMutation.isPending}
                          >
                            <SelectTrigger id="role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="dsm">DSM (Sales Officer)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddUser(false);
                            setNewUserForm({ email: "", username: "", fullName: "", password: "", role: "manager" });
                          }}
                          disabled={addUserMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (createNewOrg) {
                              if (!newOrgForm.organizationName || !newOrgForm.superAdminEmail || !newOrgForm.superAdminPassword) {
                                toast({ title: "Validation Error", description: "Organization name, super admin email, and password are required", variant: "destructive" });
                                return;
                              }
                              // For new org only, new user fields are optional; will be skipped if empty
                              addUserMutation.mutate(newUserForm);
                              return;
                            }
                            if (!selectedTenantId) {
                              toast({ title: "Select organization", description: "Please choose an organization to create the user in.", variant: "destructive" });
                              return;
                            }
                            if (!newUserForm.email || !newUserForm.password) {
                              toast({ title: "Validation Error", description: "Email and password are required", variant: "destructive" });
                              return;
                            }
                            addUserMutation.mutate(newUserForm);
                          }}
                          disabled={addUserMutation.isPending || (!createNewOrg && (!selectedTenantId || !newUserForm.email || !newUserForm.password))}
                        >
                          {addUserMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create User
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Input
                  placeholder="Search users by name, email, or username"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoComplete="off"
                />
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">
                    <strong>{filteredUsers.length}</strong> registered user{filteredUsers.length !== 1 ? 's' : ''} found
                    {filteredUsers.length > 0 && (
                      <span className="text-green-600 ml-1 font-semibold">
                        ✓ Auto-refreshes every 10 seconds
                      </span>
                    )}
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      refetchUsers();
                      refetchMasterUsers();
                      toast({ title: "Refreshing...", description: "Checking for new users..." });
                    }}
                    disabled={isLoadingUsers}
                    className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700"
                    title="Click to refresh and see newly created users immediately"
                  >
                    <RefreshCcw className={`h-3 w-3 mr-1 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    Refresh Now
                  </Button>
                </div>
                {!Array.isArray(masterUsers) || masterUsers.length === 0 ? (
                  <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                    <strong>⚠️ No users found:</strong> Use the "Add New User" button above to create user accounts.
                    <div className="mt-1 text-orange-700">💡 <strong>All new users</strong> (created anywhere in the system) will automatically appear here within 10 seconds.</div>
                  </div>
                ) : masterUsers.length >= 4 ? (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                    <strong>✅ {masterUsers.length} Users Found:</strong> All users across tenants are listed here.
                    <div className="mt-1 text-green-700">💡 Auto-refreshes every 10 seconds - new users will appear automatically. Click "Refresh Now" to check immediately.</div>
                  </div>
                ) : (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>✅ Auto-Refresh Enabled:</strong> New users added through registration or other methods will automatically appear in this list within 10 seconds.
                    <div className="mt-1 text-blue-700 font-semibold">💡 Click "Refresh Now" button above to see new users immediately!</div>
                  </div>
                )}
                <ScrollArea className="h-[540px]">
                  <div className="space-y-2 pr-2">
                    {isLoadingUsers || isLoadingMasterUsers ? (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="ml-2">Loading users...</span>
                      </div>
                    ) : isErrorMasterUsers ? (
                      <div className="rounded-md border border-red-200 bg-red-50 py-10 text-center text-sm text-red-800">
                        <div className="font-semibold mb-2">Failed to load users</div>
                        <div className="text-xs text-red-700">{String(errorMasterUsers || 'Unknown error')}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => refetchMasterUsers()}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                        {search ? (
                          <>
                            <div>No users match your search "{search}"</div>
                            <div className="mt-3 text-xs text-blue-600">
                              Try searching for: dev, rakhy, admin, or clear the search to see all users.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold mb-2">No users found in your organization.</div>
                            <div className="mt-3 text-xs text-orange-600">
                              <strong>To add users like jay@gmail.com or rickh5054@gmail.com:</strong>
                            </div>
                            <div className="mt-2 text-xs text-orange-700">
                              1. Click the <strong>"Add New User"</strong> button at the top
                            </div>
                            <div className="text-xs text-orange-700">
                              2. Enter their email and password
                            </div>
                            <div className="text-xs text-orange-700">
                              3. They will appear in this list immediately
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      filteredUsers.map((user: any) => {
                        const isSelected = (user.email || '').toLowerCase() === (selectedEmail || '').toLowerCase();
                        return (
                          <button
                            key={user.email}
                            type="button"
                            onClick={() => {
                              setSelectedEmail(user.email);
                              const memberships = user.memberships || [];
                              // Find the first non-dev tenant membership, or use the first one
                              const nonDev = memberships.find((m: Membership) => m.tenantId !== (currentUser as any)?.tenantId);
                              const targetMembership = nonDev || memberships[0];

                              // Use the userId from the membership, not from dev tenant's user list
                              // This ensures we get the correct userId for the user's actual tenant
                              const targetUserId = targetMembership?.userId || null;
                              const targetTenantId = targetMembership?.tenantId || null;

                              setSelectedUserId(targetUserId);
                              setSelectedTenantId(targetTenantId);

                              console.log('[DeveloperMode] Selected user:', {
                                email: user.email,
                                userId: targetUserId,
                                tenantId: targetTenantId,
                                organization: targetMembership?.organizationName
                              });
                            }}
                            className={cn(
                              "w-full rounded-lg border-2 px-3 py-3 text-left transition-all",
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">
                                {user.fullName || user.username || user.email}
                              </div>
                              {isSelected && (
                                <Badge className="bg-blue-600 text-white">Selected</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {user.email}
                            </div>
                            {user.memberships && user.memberships.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {user.memberships.map((m: Membership) => (
                                  <Badge key={m.tenantId} variant="outline" className="uppercase text-[10px]">
                                    {m.organizationName || m.tenantId}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="h-full border-2 border-green-200">
              <CardHeader className="bg-green-50 border-b space-y-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-700" />
                      Feature Access Control
                      {selectedMasterUser && !isDeveloperUser(selectedMasterUser) && Array.isArray(userFeatures) && (
                        <Badge variant="secondary" className="ml-2 text-base px-3 py-1">
                          {Object.values(draft).filter(v => v === true).length} / {userFeatures.length} enabled
                        </Badge>
                      )}
                    </CardTitle>
                    {selectedMasterUser ? (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCircle className="h-5 w-5 text-green-700" />
                          <span className="font-bold text-lg text-foreground">{selectedMasterUser.fullName || selectedMasterUser.username || selectedMasterUser.email}</span>
                        </div>
                        {isDeveloperUser(selectedMasterUser) ? (
                          <div className="text-sm text-red-600 font-semibold">
                            Developer account is superior and cannot be modified here.
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-muted-foreground mb-3">
                              <strong>Managing:</strong> Check ✅ = Feature visible in sidebar | Uncheck ❌ = Feature hidden from sidebar
                            </div>

                            {/* User Action Buttons */}
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Quick Actions:</div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => {
                                    if (!selectedUserId) return;
                                    if (!selectedTenantId) {
                                      toast({ title: 'Error', description: 'No tenant selected. Please select a user first.', variant: 'destructive' });
                                      return;
                                    }
                                    try {
                                      console.log(`[DeveloperMode] Applying Basic features for userId: ${selectedUserId}, tenantId: ${selectedTenantId}`);
                                      const headers: Record<string, string> = { 'X-Tenant-Id': selectedTenantId };
                                      const res = await fetch(`/api/admin/users/${selectedUserId}/apply-basic-features`, {
                                        method: 'POST',
                                        headers,
                                        credentials: 'include'
                                      });
                                      const data = await res.json().catch(() => null);
                                      if (!res.ok) {
                                        if (res.status === 403) throw new Error('Forbidden: Manager or Super Admin required');
                                        const errorMsg = data?.error || data?.connectionError || res.statusText || 'Failed to apply basic features';
                                        console.error(`[DeveloperMode] Apply Basic failed:`, errorMsg, data);
                                        throw new Error(errorMsg);
                                      }
                                      toast({ title: '✅ Basic features applied', description: data ? `${data.applied} features applied, ${data.disabled || 0} disabled` : undefined });
                                      if (selectedUserId && selectedTenantId) {
                                        // Wait longer for database to commit, then refetch multiple times
                                        console.log(`[DeveloperMode] Waiting for database commit...`);
                                        await new Promise(resolve => setTimeout(resolve, 1500));

                                        // Clear ALL related caches
                                        queryClient.removeQueries({ queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId] });
                                        queryClient.removeQueries({ queryKey: ["developer-mode-user-features"] });
                                        queryClient.invalidateQueries({ queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId] });

                                        // First refetch
                                        console.log(`[DeveloperMode] First refetch...`);
                                        const firstRefetch = await refetchUserFeatures();
                                        console.log(`[DeveloperMode] First refetch result:`, firstRefetch.data?.length || 0, 'features');

                                        // Wait and refetch again
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                        console.log(`[DeveloperMode] Second refetch...`);
                                        const secondRefetch = await refetchUserFeatures();
                                        console.log(`[DeveloperMode] Second refetch result:`, secondRefetch.data?.length || 0, 'features');

                                        // One more refetch to be sure
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        console.log(`[DeveloperMode] Third refetch...`);
                                        const thirdRefetch = await refetchUserFeatures();
                                        console.log(`[DeveloperMode] Third refetch result:`, thirdRefetch.data?.length || 0, 'features');

                                        // Log the enabled count
                                        if (thirdRefetch.data && Array.isArray(thirdRefetch.data)) {
                                          const enabledCount = thirdRefetch.data.filter((f: any) => f.allowed === true).length;
                                          console.log(`[DeveloperMode] ✅ Final enabled count: ${enabledCount} out of ${thirdRefetch.data.length} features`);
                                        }
                                      }
                                    } catch (e: any) {
                                      console.error(`[DeveloperMode] Apply Basic error:`, e);
                                      toast({
                                        title: '❌ Apply basic failed',
                                        description: e?.message || String(e),
                                        variant: 'destructive'
                                      });
                                    }
                                  }}
                                  disabled={!selectedUserId || isBusy || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}
                                  className="h-8 text-xs"
                                >
                                  Apply Basic
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => {
                                    if (!selectedUserId) return;
                                    try {
                                      const res = await fetch(`/api/admin/users/${selectedUserId}/apply-advanced-features`, { method: 'POST', headers: selectedTenantId ? { 'X-Tenant-Id': selectedTenantId } : undefined as any });
                                      const data = await res.json().catch(() => null);
                                      if (!res.ok) {
                                        if (res.status === 403) throw new Error('Forbidden: Manager or Super Admin required');
                                        throw new Error(data?.error || res.statusText || 'Failed to apply advanced features');
                                      }
                                      toast({ title: 'Advanced features applied' });
                                      if (selectedUserId && selectedTenantId) {
                                        queryClient.invalidateQueries({ queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId] });
                                      }
                                    } catch (e: any) {
                                      toast({ title: 'Apply advanced failed', description: e?.message || String(e), variant: 'destructive' });
                                    }
                                  }}
                                  disabled={!selectedUserId || isBusy || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}
                                  className="h-8 text-xs"
                                >
                                  Apply Advanced
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedEmail) fetchPasswordInfo(selectedEmail);
                                  }}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <Key className="h-3 w-3 mr-1" />
                                  View Password Info
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowPasswordChangeDialog(true)}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  Change Password
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowStatusDialog(true)}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Account Status
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedEmail && confirm(`Force logout ${selectedEmail}? They will need to login again.`)) {
                                      forceLogoutMutation.mutate(selectedEmail);
                                    }
                                  }}
                                  disabled={forceLogoutMutation.isPending || deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <LogOut className="h-3 w-3 mr-1" />
                                  Force Logout
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowRetentionDialog(true)}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Retention Policy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowBackupDialog(true)}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <HardDrive className="h-3 w-3 mr-1" />
                                  Create Backup
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowBackupsList(true);
                                    if (selectedEmail) fetchBackups(selectedEmail);
                                  }}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  View Backups
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setShowDeleteDialog(true)}
                                  disabled={deleteUserMutation.isPending}
                                  className="h-8 text-xs"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete User
                                </Button>
                              </div>
                            </div>
                            {/* Tenant selector - show if user has multiple memberships */}
                            {selectedMasterUser.memberships && selectedMasterUser.memberships.length > 1 && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">Target Organization:</span>
                                <select
                                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm font-medium"
                                  value={selectedTenantId || ''}
                                  onChange={(e) => {
                                    const newTenantId = e.target.value || null;
                                    // Find the membership for the new tenant and update userId
                                    const newMembership = selectedMasterUser.memberships?.find((m: Membership) => m.tenantId === newTenantId);
                                    const newUserId = newMembership?.userId || null;

                                    setSelectedTenantId(newTenantId);
                                    setSelectedUserId(newUserId);

                                    console.log('[DeveloperMode] Tenant changed:', {
                                      tenantId: newTenantId,
                                      userId: newUserId,
                                      organization: newMembership?.organizationName
                                    });

                                    // Refetch features when tenant changes
                                    if (newUserId && newTenantId) {
                                      queryClient.invalidateQueries({ queryKey: ["developer-mode-user-features", newUserId, newTenantId] });
                                    }
                                  }}
                                  disabled={isBusy}
                                >
                                  {selectedMasterUser.memberships.map((m: Membership) => (
                                    <option key={m.tenantId} value={m.tenantId}>
                                      {m.organizationName || m.tenantId} {m.tenantId === selectedTenantId ? '(Current)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {/* Show current tenant if only one membership */}
                            {selectedMasterUser.memberships && selectedMasterUser.memberships.length === 1 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Organization: <span className="font-semibold">{selectedMasterUser.memberships[0].organizationName || selectedMasterUser.memberships[0].tenantId}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm font-semibold text-yellow-800">
                          👈 Step 1: Select a user from the left panel
                        </div>
                        <div className="text-xs text-yellow-700 mt-1">
                          Then you can control which features they can access
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetToDefaults} disabled={!selectedUserId || !selectedTenantId || !Array.isArray(userFeatures) || userFeatures.length === 0 || isBusy || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}>
                      <RefreshCcw className="mr-2 h-4 w-4" /> Reset to defaults
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRevert} disabled={!dirty || isBusy || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}>
                      Undo changes
                    </Button>
                    <Button onClick={handleSave} size="sm" disabled={!dirty || !selectedUserId || !selectedTenantId || !Array.isArray(userFeatures) || userFeatures.length === 0 || mutation.isPending || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}>
                      {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save changes
                    </Button>
                    {/* Tenant-wide quick actions (super admin recommended) */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!selectedTenantId) {
                          toast({ title: 'Error', description: 'No tenant selected. Please select a user first.', variant: 'destructive' });
                          return;
                        }
                        try {
                          console.log(`[DeveloperMode] Applying Basic to All for tenant: ${selectedTenantId}`);
                          const headers: Record<string, string> = { 'X-Tenant-Id': selectedTenantId };
                          const res = await fetch(`/api/admin/tenant/apply-basic-features-to-all`, {
                            method: 'POST',
                            headers,
                            credentials: 'include'
                          });
                          const data = await res.json().catch(() => null);
                          if (!res.ok) {
                            if (res.status === 403) throw new Error('Forbidden: Super Admin required to apply to all');
                            const errorMsg = data?.error || res.statusText || 'Failed to apply basic to all';
                            console.error(`[DeveloperMode] Apply Basic failed:`, errorMsg, data);
                            throw new Error(errorMsg);
                          }
                          toast({ title: '✅ Applied Basic to all users', description: data ? `${data.users} users updated, ${data.applied} features applied` : undefined });
                          if (selectedUserId && selectedTenantId) {
                            queryClient.invalidateQueries({ queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId] });
                            refetchUserFeatures();
                          }
                        } catch (e: any) {
                          console.error(`[DeveloperMode] Apply Basic to All error:`, e);
                          toast({
                            title: '❌ Apply to all failed',
                            description: e?.message || String(e),
                            variant: 'destructive'
                          });
                        }
                      }}
                      disabled={isBusy || !selectedTenantId}
                    >
                      Apply Basic to All
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!selectedTenantId) {
                          toast({ title: 'Error', description: 'No tenant selected. Please select a user first.', variant: 'destructive' });
                          return;
                        }
                        try {
                          console.log(`[DeveloperMode] Applying Advanced to All for tenant: ${selectedTenantId}`);
                          const headers: Record<string, string> = { 'X-Tenant-Id': selectedTenantId };
                          const res = await fetch(`/api/admin/tenant/apply-advanced-features-to-all`, {
                            method: 'POST',
                            headers,
                            credentials: 'include'
                          });
                          const data = await res.json().catch(() => null);
                          if (!res.ok) {
                            if (res.status === 403) throw new Error('Forbidden: Super Admin required to apply to all');
                            const errorMsg = data?.error || res.statusText || 'Failed to apply advanced to all';
                            console.error(`[DeveloperMode] Apply Advanced failed:`, errorMsg, data);
                            throw new Error(errorMsg);
                          }
                          toast({ title: '✅ Applied Advanced to all users', description: data ? `${data.users} users updated, ${data.applied} features applied` : undefined });
                          if (selectedUserId && selectedTenantId) {
                            queryClient.invalidateQueries({ queryKey: ["developer-mode-user-features", selectedUserId, selectedTenantId] });
                            refetchUserFeatures();
                          }
                        } catch (e: any) {
                          console.error(`[DeveloperMode] Apply Advanced to All error:`, e);
                          toast({
                            title: '❌ Apply to all failed',
                            description: e?.message || String(e),
                            variant: 'destructive'
                          });
                        }
                      }}
                      disabled={isBusy || !selectedTenantId}
                    >
                      Apply Advanced to All
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEnableAll(true)} disabled={!selectedUserId || !selectedTenantId || !Array.isArray(userFeatures) || userFeatures.length === 0 || isBusy || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}>
                    Enable all
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleEnableAll(false)} disabled={!selectedUserId || !selectedTenantId || !Array.isArray(userFeatures) || userFeatures.length === 0 || isBusy || (selectedMasterUser ? isDeveloperUser(selectedMasterUser) : false)}>
                    Disable all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedUserId || !selectedTenantId ? (
                  <div className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
                    {!selectedUserId ? 'Select a user to configure their access.' : 'Select a target organization for this user.'}
                  </div>
                ) : selectedMasterUser && isDeveloperUser(selectedMasterUser) ? (
                  <div className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
                    Developer account cannot be configured. Select another user from the left.
                  </div>
                ) : isLoadingCatalog || isLoadingUserFeatures ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !Array.isArray(userFeatures) || userFeatures.length === 0 ? (
                  <div className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
                    No features available. Ensure migrations have been applied.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedFeatures.map((group, groupIndex) => {
                      // Handle group headers (Master, Invoice, Day Business, Product Stock, Relational Features)
                      if (group.isGroup && group.children) {
                        const enabledInGroup = group.children.filter((child) => {
                          if (child.feature === null) return false; // Organization - not a feature
                          return draft.hasOwnProperty(child.feature.featureKey)
                            ? Boolean(draft[child.feature.featureKey])
                            : (child.feature.allowed ?? child.feature.defaultEnabled ?? true);
                        }).length;
                        const totalInGroup = group.children.filter(c => c.feature !== null).length;
                        const allEnabled = enabledInGroup === totalInGroup && totalInGroup > 0;
                        const anyEnabled = enabledInGroup > 0;

                        return (
                          <div key={`group-${groupIndex}`} className="rounded-lg border bg-white">
                            <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-gray-50">
                              <div>
                                <div className="text-base font-bold text-gray-900">{group.section}</div>
                                <div className="text-xs text-muted-foreground">
                                  {enabledInGroup} / {totalInGroup} enabled
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleGroup(group.section, true)}
                                  disabled={allEnabled || isBusy}
                                >
                                  Enable all
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleGroup(group.section, false)}
                                  disabled={!anyEnabled || isBusy}
                                >
                                  Disable all
                                </Button>
                              </div>
                            </div>
                            <div className="divide-y">
                              {group.children.map((child, childIndex) => {
                                // Special case: Organization (no feature key)
                                if (child.feature === null) {
                                  return (
                                    <div key={`org-${childIndex}`} className="px-4 py-3 bg-gray-50">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Super Admin Only</Badge>
                                        <span className="text-sm font-medium text-gray-700">{child.section}</span>
                                      </div>
                                    </div>
                                  );
                                }

                                let checked: boolean;
                                if (draft.hasOwnProperty(child.feature.featureKey)) {
                                  checked = Boolean(draft[child.feature.featureKey]);
                                } else {
                                  checked = child.feature.allowed ?? child.feature.defaultEnabled ?? true;
                                }

                                if (child.feature.featureKey === 'lubricants') {
                                  console.log(`[Render] lubricants: inDraft=${draft.hasOwnProperty('lubricants')}, draftVal=${draft['lubricants']}, checked=${checked}`);
                                }
                                const isCustomized = checked !== child.feature.defaultEnabled;

                                return (
                                  <label
                                    key={`${child.feature.featureKey}-${childIndex}`}
                                    className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50"
                                  >
                                    <Checkbox
                                      className="mt-1"
                                      checked={checked}
                                      onCheckedChange={(value) => {
                                        let boolValue: boolean;
                                        if (value === true) boolValue = true;
                                        else if (value === false) boolValue = false;
                                        else boolValue = false;
                                        handleToggleFeature(child.feature!.featureKey, boolValue);
                                      }}
                                      disabled={isBusy}
                                    />
                                    <div className="space-y-1 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-foreground ml-6">{child.section}</span>
                                        {isCustomized && <Badge variant="outline">Customized</Badge>}
                                        {!child.feature.defaultEnabled && <Badge variant="secondary">Default off</Badge>}
                                      </div>
                                      {child.feature.description && (
                                        <p className="text-xs text-muted-foreground ml-6 max-w-xl">{child.feature.description}</p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Handle standalone features (Dashboard, Statement Generation, Shift Sheet Entry, etc.)
                      if (group.feature) {
                        let checked: boolean;
                        if (draft.hasOwnProperty(group.feature.featureKey)) {
                          checked = Boolean(draft[group.feature.featureKey]);
                        } else {
                          checked = group.feature.allowed ?? group.feature.defaultEnabled ?? true;
                        }
                        const isCustomized = checked !== group.feature.defaultEnabled;

                        return (
                          <div key={`standalone-${groupIndex}`} className="rounded-lg border bg-white">
                            <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50">
                              <Checkbox
                                className="mt-1"
                                checked={checked}
                                onCheckedChange={(value) => {
                                  let boolValue: boolean;
                                  if (value === true) boolValue = true;
                                  else if (value === false) boolValue = false;
                                  else boolValue = false;
                                  handleToggleFeature(group.feature!.featureKey, boolValue);
                                }}
                                disabled={isBusy}
                              />
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{group.section}</span>
                                  {isCustomized && <Badge variant="outline">Customized</Badge>}
                                  {!group.feature.defaultEnabled && <Badge variant="secondary">Default off</Badge>}
                                </div>
                                {group.feature.description && (
                                  <p className="text-xs text-muted-foreground max-w-xl">{group.feature.description}</p>
                                )}
                              </div>
                            </label>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </CardContent>
              <div className="px-6 pb-6">
                <div className="p-3 bg-gray-100 text-xs font-mono rounded border border-gray-200">
                  <div className="font-bold mb-1">Debug Info (Temporary):</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>UserFeatures loaded: {userFeatures?.length || 0}</div>
                    <div>Draft keys: {Object.keys(draft).length}</div>
                    <div>Draft enabled: {Object.values(draft).filter(v => v === true).length}</div>
                    <div>Lubricants in draft: {draft.hasOwnProperty('lubricants') ? String(draft['lubricants']) : 'undefined'}</div>
                    <div>Lubricants in features: {userFeatures?.find(f => f.featureKey === 'lubricants')?.allowed ? 'true' : 'false'}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="rounded-lg border bg-green-50 px-4 py-3 text-sm text-green-900 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <strong>✅ Auto-Control Enabled:</strong> This page automatically refreshes every 10 seconds to detect new users.
                <div className="mt-1 text-green-800 font-semibold">
                  👥 <strong>ANY new user</strong> created through registration, "Add New User", or any other method in your tenant will automatically appear here within 10 seconds - you can immediately control their feature access!
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button variant="link" size="sm" className="px-0 h-auto text-green-900" onClick={() => refetchUsers()} disabled={isLoadingUsers}>
                  <RefreshCcw className={`h-3 w-3 mr-1 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  Refresh Users Now
                </Button>
                <Button variant="link" size="sm" className="px-0 h-auto text-green-900" onClick={() => refetchUserFeatures()} disabled={!selectedUserId || isBusy}>
                  <RefreshCcw className={`h-3 w-3 mr-1 ${isBusy ? 'animate-spin' : ''}`} />
                  Refresh Features
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system-health" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">System Health Dashboard</h2>

            {isLoadingSystemHealth ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading system health...</span>
              </div>
            ) : systemHealth && typeof systemHealth === 'object' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div className="text-3xl font-bold">{(systemHealth as SystemHealth).totalTenants || 0}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Active tenants in the system</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <div className="text-3xl font-bold">{(systemHealth as SystemHealth).totalUsers || 0}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Distinct users across all tenants</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Database Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Database className={`h-5 w-5 ${(systemHealth as SystemHealth).databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`} />
                      <Badge variant={(systemHealth as SystemHealth).databaseStatus === 'connected' ? 'default' : 'destructive'} className="text-base px-3 py-1">
                        {(systemHealth as SystemHealth).databaseStatus === 'connected' ? 'Connected' : 'Error'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Master database connection</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div className="text-sm font-semibold">
                        {new Date((systemHealth as SystemHealth).lastSyncTime || new Date().toISOString()).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Last system synchronization</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 py-10 text-center text-sm text-red-800">
                <div className="font-semibold mb-2">Failed to load system health</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => refetchSystemHealth()}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchSystemHealth()}
                disabled={isLoadingSystemHealth}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingSystemHealth ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tenant-management" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Tenant Management</h2>
            <p className="text-muted-foreground mb-4">
              View all active tenants and their users. Click a row to expand and see users in that tenant.
            </p>

            {isLoadingTenants ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading tenants...</span>
              </div>
            ) : !Array.isArray(tenants) || tenants.length === 0 ? (
              <div className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
                No active tenants found
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Organization Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">User Count</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Created Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tenants.map((tenant) => {
                          const isExpanded = expandedTenantIds.has(tenant.id);
                          const tenantUsersData = tenantUsersMap.get(tenant.id) || { users: [], isLoading: false };

                          return (
                            <React.Fragment key={tenant.id}>
                              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleTenantExpansion(tenant.id)}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {tenant.organizationName || tenant.id}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  <Badge variant="outline">{tenant.userCount}</Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {new Date(tenant.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTenantExpansion(tenant.id);
                                    }}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                        Hide Users
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="h-4 w-4 mr-1" />
                                        Show Users
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 bg-gray-50">
                                    {tenantUsersData.isLoading ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                                      </div>
                                    ) : tenantUsersData.users.length === 0 ? (
                                      <div className="text-sm text-muted-foreground text-center py-4">
                                        No users found in this tenant
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="text-sm font-semibold text-gray-700 mb-2">
                                          Users ({tenantUsersData.users.length}):
                                        </div>
                                        <div className="space-y-1">
                                          {tenantUsersData.users.map((user: TenantUserListItem) => (
                                            <div key={user.userId} className="flex items-center gap-2 px-3 py-2 bg-white rounded border text-sm">
                                              <Users className="h-4 w-4 text-gray-500" />
                                              <span className="text-gray-900">{user.email}</span>
                                              <span className="text-xs text-muted-foreground ml-auto">
                                                Added {new Date(user.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTenants()}
                disabled={isLoadingTenants}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingTenants ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Audit Logs</h2>
            <p className="text-muted-foreground mb-4">
              View recent Developer Mode actions. All feature access changes are logged here.
            </p>

            <div className="flex items-center gap-4 mb-4">
              <Input
                placeholder="Search by user email, developer email, or feature key..."
                value={auditLogSearch}
                onChange={(e) => setAuditLogSearch(e.target.value)}
                className="max-w-md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchAuditLogs()}
                disabled={isLoadingAuditLogs}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoadingAuditLogs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading audit logs...</span>
              </div>
            ) : !Array.isArray(filteredAuditLogs) || filteredAuditLogs.length === 0 ? (
              <div className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
                {auditLogSearch ? (
                  <>No audit logs match your search "{auditLogSearch}"</>
                ) : (
                  <>No audit logs found</>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Developer</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Target User</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredAuditLogs.map((log, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {log.developerEmail}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {log.targetUserEmail}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {log.featureKey || <span className="text-muted-foreground italic">N/A</span>}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={log.action === 'enabled' ? 'default' : 'secondary'}>
                                {log.action === 'enabled' ? '✅ Enabled' : '❌ Disabled'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {Array.isArray(filteredAuditLogs) && Array.isArray(auditLogs) && filteredAuditLogs.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                Showing {filteredAuditLogs.length} of {auditLogs.length} audit log entries
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="advanced-controls" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Advanced Controls</h2>
            <p className="text-muted-foreground mb-4">
              Bulk operations to manage multiple users at once. Select users and apply operations to all selected users.
            </p>

            <Card>
              <CardHeader>
                <CardTitle>Select Users for Bulk Operations</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Select one or more users from the list below to perform bulk operations on them.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search users to select for bulk operations..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="mb-4"
                />

                <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-2">
                  {isLoadingUsers || isLoadingMasterUsers ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <label
                        key={user.email}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedUsers.has(user.email.toLowerCase())}
                          onChange={(e) => {
                            const email = user.email.toLowerCase();
                            setBulkSelectedUsers(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) {
                                next.add(email);
                              } else {
                                next.delete(email);
                              }
                              return next;
                            });
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{user.fullName || user.username || user.email}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.memberships && user.memberships.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {user.memberships.map((m: Membership) => (
                                <Badge key={m.tenantId} variant="outline" className="text-xs">
                                  {m.organizationName || m.tenantId}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {bulkSelectedUsers.has(user.email.toLowerCase()) && (
                          <Badge className="bg-blue-600">Selected</Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>

                {bulkSelectedUsers.size > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-semibold text-blue-900 mb-2">
                      {bulkSelectedUsers.size} user{bulkSelectedUsers.size !== 1 ? 's' : ''} selected
                    </div>
                    <div className="text-sm text-blue-700">
                      Selected: {Array.from(bulkSelectedUsers).slice(0, 3).join(', ')}
                      {bulkSelectedUsers.size > 3 && ` and ${bulkSelectedUsers.size - 3} more...`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {bulkSelectedUsers.size > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk User Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowBulkPasswordChangeDialog(true)}
                      disabled={bulkOperationsPending}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Bulk Change Password
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowBulkStatusDialog(true)}
                      disabled={bulkOperationsPending}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Bulk Status Update
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowBulkRetentionDialog(true)}
                      disabled={bulkOperationsPending}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Bulk Retention Policy
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        if (confirm(`Force logout ${bulkSelectedUsers.size} user(s)? They will need to login again.`)) {
                          handleBulkForceLogout();
                        }
                      }}
                      disabled={bulkOperationsPending}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Bulk Force Logout
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={bulkOperationsPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Bulk Delete Users
                    </Button>
                    <div className="text-xs text-muted-foreground mt-2">
                      ⚠️ These operations are irreversible. Make sure you have backups before proceeding.
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {bulkSelectedUsers.size === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="font-semibold mb-2">No users selected</div>
                  <div className="text-sm">
                    Select users from the list above to perform bulk operations
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{selectedEmail}</strong>? This action cannot be undone.
              All user data will be removed from all tenants.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteUserMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedEmail) {
                  deleteUserMutation.mutate(selectedEmail);
                }
              }}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Password Info Dialog */}
      <Dialog open={showPasswordInfoDialog} onOpenChange={setShowPasswordInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Information</DialogTitle>
            <DialogDescription>
              Password information for <strong>{selectedEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          {passwordInfo ? (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-900 mb-2">Password Status:</div>
                <div className="text-blue-700">
                  <div className="mb-2">
                    <strong>⚠️ Note:</strong> Passwords are encrypted for security and cannot be displayed in plain text.
                  </div>
                  {passwordInfo.lastChanged ? (
                    <>
                      <div className="mb-1">
                        <strong>Last Changed:</strong> {new Date(passwordInfo.lastChanged).toLocaleString()}
                      </div>
                      <div>
                        <strong>Total Changes:</strong> {passwordInfo.changeCount} time{passwordInfo.changeCount !== 1 ? 's' : ''}
                      </div>
                    </>
                  ) : (
                    <div className="text-blue-600 italic">No password changes recorded in Developer Mode</div>
                  )}
                </div>
              </div>

              {passwordInfo.changeHistory && passwordInfo.changeHistory.length > 0 && (
                <div className="border rounded-lg p-3">
                  <div className="text-sm font-semibold mb-2">Recent Password Changes:</div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {passwordInfo.changeHistory.map((change: any, index: number) => (
                      <div key={index} className="text-xs border-b pb-2 last:border-0">
                        <div className="font-medium">{new Date(change.createdAt).toLocaleString()}</div>
                        <div className="text-muted-foreground">Changed by: {change.developerEmail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowPasswordInfoDialog(false);
                  setPasswordInfo(null);
                }}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{selectedEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={passwordChangeForm.newPassword}
                onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, newPassword: e.target.value })}
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={passwordChangeForm.confirmPassword}
                onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, confirmPassword: e.target.value })}
                disabled={changePasswordMutation.isPending}
              />
            </div>
            {passwordChangeForm.newPassword && passwordChangeForm.confirmPassword && passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword && (
              <div className="text-sm text-red-600">Passwords do not match</div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowPasswordChangeDialog(false);
                setPasswordChangeForm({ newPassword: "", confirmPassword: "" });
              }} disabled={changePasswordMutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!passwordChangeForm.newPassword || passwordChangeForm.newPassword.length < 6) {
                    toast({ title: "Validation Error", description: "Password must be at least 6 characters", variant: "destructive" });
                    return;
                  }
                  if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
                    toast({ title: "Validation Error", description: "Passwords do not match", variant: "destructive" });
                    return;
                  }
                  if (selectedEmail) {
                    changePasswordMutation.mutate({ userEmail: selectedEmail, newPassword: passwordChangeForm.newPassword });
                  }
                }}
                disabled={changePasswordMutation.isPending || passwordChangeForm.newPassword.length < 6 || passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Status</DialogTitle>
            <DialogDescription>
              Change account status for <strong>{selectedEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) => {
                  if (selectedEmail) {
                    updateStatusMutation.mutate({ userEmail: selectedEmail, status: value });
                  }
                }}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Can login)</SelectItem>
                  <SelectItem value="suspended">Suspended (Cannot login)</SelectItem>
                  <SelectItem value="deleted">Deleted (Soft delete)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Active:</strong> User can login normally<br />
              <strong>Suspended:</strong> User cannot login (account temporarily disabled)<br />
              <strong>Deleted:</strong> User account marked as deleted (soft delete)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Retention Policy Dialog */}
      <Dialog open={showRetentionDialog} onOpenChange={setShowRetentionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Data Retention Policy</DialogTitle>
            <DialogDescription>
              Set how long to keep data for <strong>{selectedEmail}</strong>. After this period, data will be automatically deleted with backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {userRetentionPolicy && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-blue-900">Current Policy:</div>
                <div className="text-blue-700 mt-1">
                  {userRetentionPolicy.retentionDays === null ? (
                    <>Forever (Never delete)</>
                  ) : (
                    <>
                      {userRetentionPolicy.retentionDays} days
                      {userRetentionPolicy.daysRemaining !== null && (
                        <> - {userRetentionPolicy.daysRemaining} days remaining</>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Retention Period</Label>
              <Select
                value={retentionForm.retentionDays === null ? "forever" : String(retentionForm.retentionDays)}
                onValueChange={(value) => {
                  setRetentionForm({ retentionDays: value === "forever" ? null : parseInt(value, 10) });
                }}
                disabled={setRetentionMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">1 Week</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">1 Month</SelectItem>
                  <SelectItem value="90">3 Months</SelectItem>
                  <SelectItem value="180">6 Months</SelectItem>
                  <SelectItem value="365">12 Months</SelectItem>
                  <SelectItem value="730">2 Years</SelectItem>
                  <SelectItem value="1825">5 Years</SelectItem>
                  <SelectItem value="forever">Forever (Never delete)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowRetentionDialog(false)} disabled={setRetentionMutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEmail) {
                    setRetentionMutation.mutate({ userEmail: selectedEmail, retentionDays: retentionForm.retentionDays });
                  }
                }}
                disabled={setRetentionMutation.isPending}
              >
                {setRetentionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Policy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Data Backup</DialogTitle>
            <DialogDescription>
              Create a backup of data for <strong>{selectedEmail}</strong>. You can backup all data or specify a date range.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={backupForm.backupAllData}
                  onChange={(e) => setBackupForm({ ...backupForm, backupAllData: e.target.checked, fromDate: "", toDate: "" })}
                  className="rounded"
                />
                Backup all data
              </Label>
            </div>
            {!backupForm.backupAllData && (
              <div className="space-y-3 border-t pt-3">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={backupForm.fromDate}
                    onChange={(e) => setBackupForm({ ...backupForm, fromDate: e.target.value })}
                    disabled={createBackupMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={backupForm.toDate}
                    onChange={(e) => setBackupForm({ ...backupForm, toDate: e.target.value })}
                    disabled={createBackupMutation.isPending}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBackupDialog(false)} disabled={createBackupMutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEmail) {
                    createBackupMutation.mutate({
                      userEmail: selectedEmail,
                      backupAllData: backupForm.backupAllData,
                      fromDate: backupForm.fromDate || undefined,
                      toDate: backupForm.toDate || undefined,
                    });
                  }
                }}
                disabled={createBackupMutation.isPending || (!backupForm.backupAllData && (!backupForm.fromDate || !backupForm.toDate))}
              >
                {createBackupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Backups Dialog */}
      <Dialog open={showBackupsList} onOpenChange={setShowBackupsList}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>User Backups</DialogTitle>
            <DialogDescription>
              View and download backups for <strong>{selectedEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
            {userBackups.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No backups found for this user.
              </div>
            ) : (
              <div className="space-y-2">
                {userBackups.map((backup: any) => (
                  <Card key={backup.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">{backup.backupType === 'manual' ? 'Manual Backup' : 'Auto Backup'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {backup.backupAllData ? (
                              <>All data</>
                            ) : (
                              <>
                                {backup.dateRangeStart || 'Start'} to {backup.dateRangeEnd || 'End'}
                              </>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(backup.createdAt).toLocaleString()} • {backup.fileSizeKB} KB
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`/api/developer-mode/backups/${backup.id}/download`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowBackupsList(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete Users</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{bulkSelectedUsers.size} user(s)</strong>? This action cannot be undone.
              All user data will be removed from all tenants.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[200px] overflow-y-auto mb-4">
            <div className="text-sm font-semibold mb-2">Users to be deleted:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Array.from(bulkSelectedUsers).slice(0, 10).map(email => (
                <li key={email}>{email}</li>
              ))}
              {bulkSelectedUsers.size > 10 && <li>...and {bulkSelectedUsers.size - 10} more</li>}
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)} disabled={bulkOperationsPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setBulkOperationsPending(true);
                try {
                  const emails = Array.from(bulkSelectedUsers);
                  const results = [];

                  for (const email of emails) {
                    try {
                      const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(email)}`, {
                        method: "DELETE",
                        credentials: "include",
                      });
                      const data = await response.json();
                      if (response.ok && data?.ok) {
                        results.push({ email, success: true });
                      } else {
                        results.push({ email, success: false, error: data?.error });
                      }
                    } catch (err: any) {
                      results.push({ email, success: false, error: err?.message });
                    }
                  }

                  const successCount = results.filter(r => r.success).length;
                  toast({
                    title: "Bulk Delete",
                    description: `${successCount} of ${emails.length} users deleted successfully.`,
                    variant: successCount === emails.length ? "default" : "destructive",
                  });

                  setShowBulkDeleteDialog(false);
                  setBulkSelectedUsers(new Set());
                  await refetchMasterUsers();
                  await refetchUsers();
                } catch (error: any) {
                  toast({
                    title: "Bulk operation failed",
                    description: error?.message || "Failed to perform bulk delete",
                    variant: "destructive",
                  });
                } finally {
                  setBulkOperationsPending(false);
                }
              }}
              disabled={bulkOperationsPending}
            >
              {bulkOperationsPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {bulkSelectedUsers.size} User{bulkSelectedUsers.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Password Change Dialog */}
      <Dialog open={showBulkPasswordChangeDialog} onOpenChange={setShowBulkPasswordChangeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Change Password</DialogTitle>
            <DialogDescription>
              Set the same new password for <strong>{bulkSelectedUsers.size} user(s)</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkNewPassword">New Password *</Label>
              <Input
                id="bulkNewPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={passwordChangeForm.newPassword}
                onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, newPassword: e.target.value, confirmPassword: "" })}
                disabled={bulkOperationsPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkConfirmPassword">Confirm Password *</Label>
              <Input
                id="bulkConfirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={passwordChangeForm.confirmPassword}
                onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, confirmPassword: e.target.value })}
                disabled={bulkOperationsPending}
              />
            </div>
            {passwordChangeForm.newPassword && passwordChangeForm.confirmPassword && passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword && (
              <div className="text-sm text-red-600">Passwords do not match</div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowBulkPasswordChangeDialog(false);
                setPasswordChangeForm({ newPassword: "", confirmPassword: "" });
              }} disabled={bulkOperationsPending}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!passwordChangeForm.newPassword || passwordChangeForm.newPassword.length < 6) {
                    toast({ title: "Validation Error", description: "Password must be at least 6 characters", variant: "destructive" });
                    return;
                  }
                  if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
                    toast({ title: "Validation Error", description: "Passwords do not match", variant: "destructive" });
                    return;
                  }

                  setBulkOperationsPending(true);
                  try {
                    const emails = Array.from(bulkSelectedUsers);
                    const results = [];

                    for (const email of emails) {
                      try {
                        const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(email)}/password`, {
                          method: "PUT",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ newPassword: passwordChangeForm.newPassword }),
                        });
                        const data = await response.json();
                        if (response.ok && data?.ok) {
                          results.push({ email, success: true });
                        } else {
                          results.push({ email, success: false, error: data?.error });
                        }
                      } catch (err: any) {
                        results.push({ email, success: false, error: err?.message });
                      }
                    }

                    const successCount = results.filter(r => r.success).length;
                    toast({
                      title: "Bulk Password Change",
                      description: `${successCount} of ${emails.length} passwords changed successfully.`,
                      variant: successCount === emails.length ? "default" : "destructive",
                    });

                    setShowBulkPasswordChangeDialog(false);
                    setPasswordChangeForm({ newPassword: "", confirmPassword: "" });
                    if (successCount === emails.length) {
                      setBulkSelectedUsers(new Set());
                    }
                    await refetchMasterUsers();
                  } catch (error: any) {
                    toast({
                      title: "Bulk operation failed",
                      description: error?.message || "Failed to perform bulk password change",
                      variant: "destructive",
                    });
                  } finally {
                    setBulkOperationsPending(false);
                  }
                }}
                disabled={bulkOperationsPending || passwordChangeForm.newPassword.length < 6 || passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword}
              >
                {bulkOperationsPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Change All Passwords
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Dialog */}
      <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
            <DialogDescription>
              Update account status for <strong>{bulkSelectedUsers.size} user(s)</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={async (value) => {
                  setBulkOperationsPending(true);
                  try {
                    const emails = Array.from(bulkSelectedUsers);
                    const results = [];

                    for (const email of emails) {
                      try {
                        const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(email)}/status`, {
                          method: "PUT",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: value }),
                        });
                        const data = await response.json();
                        if (response.ok && data?.ok) {
                          results.push({ email, success: true });
                        } else {
                          results.push({ email, success: false, error: data?.error });
                        }
                      } catch (err: any) {
                        results.push({ email, success: false, error: err?.message });
                      }
                    }

                    const successCount = results.filter(r => r.success).length;
                    toast({
                      title: "Bulk Status Update",
                      description: `${successCount} of ${emails.length} users updated successfully.`,
                      variant: successCount === emails.length ? "default" : "destructive",
                    });

                    setShowBulkStatusDialog(false);
                    if (successCount === emails.length) {
                      setBulkSelectedUsers(new Set());
                    }
                    await refetchMasterUsers();
                  } catch (error: any) {
                    toast({
                      title: "Bulk operation failed",
                      description: error?.message || "Failed to perform bulk status update",
                      variant: "destructive",
                    });
                  } finally {
                    setBulkOperationsPending(false);
                  }
                }}
                disabled={bulkOperationsPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Can login)</SelectItem>
                  <SelectItem value="suspended">Suspended (Cannot login)</SelectItem>
                  <SelectItem value="deleted">Deleted (Soft delete)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Active:</strong> User can login normally<br />
              <strong>Suspended:</strong> User cannot login (account temporarily disabled)<br />
              <strong>Deleted:</strong> User account marked as deleted (soft delete)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Retention Policy Dialog */}
      <Dialog open={showBulkRetentionDialog} onOpenChange={setShowBulkRetentionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Retention Policy</DialogTitle>
            <DialogDescription>
              Set data retention policy for <strong>{bulkSelectedUsers.size} user(s)</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Retention Period</Label>
              <Select
                value={retentionForm.retentionDays === null ? "forever" : String(retentionForm.retentionDays)}
                onValueChange={async (value) => {
                  const retentionDays = value === "forever" ? null : parseInt(value, 10);
                  setBulkOperationsPending(true);

                  try {
                    const emails = Array.from(bulkSelectedUsers);
                    const results = [];

                    for (const email of emails) {
                      try {
                        const response = await fetch(`/api/developer-mode/users/${encodeURIComponent(email)}/retention-policy`, {
                          method: "PUT",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ retentionDays }),
                        });
                        const data = await response.json();
                        if (response.ok && data?.ok) {
                          results.push({ email, success: true });
                        } else {
                          results.push({ email, success: false, error: data?.error });
                        }
                      } catch (err: any) {
                        results.push({ email, success: false, error: err?.message });
                      }
                    }

                    const successCount = results.filter(r => r.success).length;
                    toast({
                      title: "Bulk Retention Policy",
                      description: `${successCount} of ${emails.length} policies set successfully.`,
                      variant: successCount === emails.length ? "default" : "destructive",
                    });

                    setShowBulkRetentionDialog(false);
                    if (successCount === emails.length) {
                      setBulkSelectedUsers(new Set());
                    }
                  } catch (error: any) {
                    toast({
                      title: "Bulk operation failed",
                      description: error?.message || "Failed to set bulk retention policies",
                      variant: "destructive",
                    });
                  } finally {
                    setBulkOperationsPending(false);
                  }
                }}
                disabled={bulkOperationsPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">1 Week</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">1 Month</SelectItem>
                  <SelectItem value="90">3 Months</SelectItem>
                  <SelectItem value="180">6 Months</SelectItem>
                  <SelectItem value="365">12 Months</SelectItem>
                  <SelectItem value="730">2 Years</SelectItem>
                  <SelectItem value="1825">5 Years</SelectItem>
                  <SelectItem value="forever">Forever (Never delete)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBulkRetentionDialog(false)} disabled={bulkOperationsPending}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

