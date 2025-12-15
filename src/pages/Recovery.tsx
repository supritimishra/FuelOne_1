import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invalidateQueries } from "@/lib/cacheInvalidation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function Recovery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    credit_customer_id: "",
    customer_name: "",
    recovery_date: format(new Date(), "yyyy-MM-dd"),
    pending_amount: "0",
    received_amount: "",
    discount: "0",
    balance_amount: "0",
    payment_mode: "Cash",
    notes: "",
    shift: "S-1",
    employee_id: "",
    employee_name: "",
  });
  const [isBalanceManual, setIsBalanceManual] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const { data: recoveries = [], isLoading: recoveriesLoading, refetch: refetchRecoveries, error: recoveriesError } = useQuery({
    queryKey: ["/api/recoveries"],
    retry: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    initialData: (() => {
      try {
        // Get deleted IDs first
        let deletedIds: string[] = [];
        try {
          const deletedRaw = localStorage.getItem('deletedRecoveryIds');
          deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
        } catch {}
        
        const raw = localStorage.getItem('optimisticRecoveries');
        let parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [] as any[];
        // Prune temp rows older than 2 hours and remove deleted IDs
        const twoHoursMs = 2 * 60 * 60 * 1000;
        const now = Date.now();
        parsed = parsed.filter((r:any)=>{
          if (!r) return false;
          if (deletedIds.includes(String(r.id))) return false;
          if (!String(r.id || '').startsWith('temp-')) return true;
          const ts = new Date(r.created_at || r.recovery_date || Date.now()).getTime();
          return (now - ts) < twoHoursMs;
        });
        // Save back if pruned
        localStorage.setItem('optimisticRecoveries', JSON.stringify(parsed));
        return parsed as any[];
      } catch { return [] as any[]; }
    })() as any[],
    queryFn: async () => {
      console.log('[Recovery] Fetching recoveries...');
      const controller = new AbortController();
      // Client-side abort: 20s to align with 5s tenant attach + query
      const timeoutMs = 20000;
      const timeoutId = setTimeout(() => {
        console.log('[Recovery] Request timeout after', timeoutMs, 'ms');
        controller.abort();
      }, timeoutMs);
      try {
        const response = await fetch('/api/recoveries', { credentials: 'include', signal: controller.signal });
        console.log('[Recovery] Response status:', response.status);
        const text = await response.text();
        console.log('[Recovery] Response text:', text ? text.substring(0, 200) : '(empty)');
        let result: any = {};
        try { result = JSON.parse(text || '{}'); } catch {}
        if (!response.ok || !result?.ok) {
          const msg = result?.error || `Failed to fetch recoveries (${response.status})`;
          console.error('[Recovery] Fetch failed:', msg);
          // Treat server-side timeouts or temporary unavailability as empty data to keep UI usable
          const normalized = String(msg || '').toLowerCase();
          if (/timeout|timed out|temporaril|unavailable|query timed out|server busy/.test(normalized)) {
            console.warn('[Recovery] Server-side timeout/unavailable - preserving cached data');
            // NEVER return empty - preserve existing cache first, then localStorage
            const cached = queryClient.getQueryData(["/api/recoveries"]);
            if (Array.isArray(cached) && cached.length > 0) {
              console.log('[Recovery] Preserving', cached.length, 'cached rows on timeout');
              return cached as any[];
            }
            // Fallback to localStorage optimistic data
            try {
            const raw = localStorage.getItem('optimisticRecoveries');
            let parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) parsed = [];
            // Prune old temps
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const now = Date.now();
            parsed = parsed.filter((r:any)=>{
              if (!r) return false;
              if (!String(r.id || '').startsWith('temp-')) return true;
              const ts = new Date(r.created_at || r.recovery_date || Date.now()).getTime();
              return (now - ts) < twoHoursMs;
            });
            localStorage.setItem('optimisticRecoveries', JSON.stringify(parsed));
            if (parsed.length > 0) {
                console.log('[Recovery] Using', parsed.length, 'optimistic rows from localStorage');
              return parsed as any[];
              }
            } catch {}
            // Only return empty if absolutely nothing exists
            return [] as any[];
          }
          throw new Error(msg);
        }
        console.log('[Recovery] Successfully fetched', (result.rows || []).length, 'recoveries');
        const serverRows = (result.rows || []).slice(0, 50);
        
        // Filter out deleted IDs before merging
        const deletedIdsKey = 'deletedRecoveryIds';
        let deletedIds: string[] = [];
        try {
          const deletedRaw = localStorage.getItem(deletedIdsKey);
          deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
          // Clean up old deleted IDs (older than 24 hours)
          const keepDeleted = deletedIds.filter((id: string) => {
            if (!id.startsWith('temp-')) return true;
            const ts = parseInt(id.split('-')[1]);
            return (Date.now() - ts) < (24 * 60 * 60 * 1000);
          });
          if (keepDeleted.length !== deletedIds.length) {
            localStorage.setItem(deletedIdsKey, JSON.stringify(keepDeleted));
            deletedIds = keepDeleted;
          }
        } catch {}
        
        // Remove deleted items from server rows
        const filteredServerRows = serverRows.filter((r: any) => !deletedIds.includes(String(r.id)));
        
        // Merge optimistic rows with server rows intelligently
        try {
          const raw = localStorage.getItem('optimisticRecoveries');
          let optimistic = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(optimistic)) optimistic = [];
          // Remove deleted items and prune old temps
          const twoHoursMs = 2 * 60 * 60 * 1000;
          const now = Date.now();
          optimistic = optimistic.filter((r:any)=>{
            if (!r) return false;
            if (deletedIds.includes(String(r.id))) return false;
            if (!String(r.id || '').startsWith('temp-')) return true;
            const ts = new Date(r.created_at || r.recovery_date || Date.now()).getTime();
            return (now - ts) < twoHoursMs;
          });
          localStorage.setItem('optimisticRecoveries', JSON.stringify(optimistic));
          if (Array.isArray(optimistic) && optimistic.length > 0) {
            // Remove optimistic rows that now exist on server (match by ID or customer_name + date + amount)
            const serverIds = new Set(serverRows.map((r: any) => r.id));
            const serverFingerprints = new Set(
              serverRows.map((r: any) => 
                `${r.customer_name || ''}_${r.recovery_date || ''}_${r.received_amount || 0}`
              )
            );
            
            const stillPending = optimistic.filter((opt: any) => {
              // Keep optimistic row if it's not yet confirmed on server
              const optId = opt.id || '';
              const optFp = `${opt.customer_name || ''}_${opt.recovery_date || ''}_${opt.received_amount || 0}`;
              // Remove if server has matching ID or matching fingerprint
              if (serverIds.has(optId)) return false;
              if (serverFingerprints.has(optFp)) return false;
              // Keep all others (including temp- IDs if server has no data yet)
              return true;
            });
            
            // Update localStorage to remove confirmed rows
            if (stillPending.length !== optimistic.length) {
              localStorage.setItem('optimisticRecoveries', JSON.stringify(stillPending));
            }
            
            // Merge: filtered server rows first, then still-pending optimistic rows
            return [...filteredServerRows, ...stillPending];
          }
        } catch {}
        return filteredServerRows;
      } catch (e: any) {
        // Treat aborts and common network errors - but NEVER return empty if we have cached data
        const message = String(e?.message || '');
        if (e?.name === 'AbortError' || /timeout|timed out|econnrefused|networkerror|failed to fetch/i.test(message)) {
          // On timeout, preserve existing cached data but filter deleted IDs
          const cached = queryClient.getQueryData(["/api/recoveries"]);
          if (Array.isArray(cached) && cached.length > 0) {
            // Filter out deleted IDs
            let deletedIds: string[] = [];
            try {
              const deletedRaw = localStorage.getItem('deletedRecoveryIds');
              deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
            } catch {}
            const filtered = cached.filter((r: any) => !deletedIds.includes(String(r.id)));
            console.log('[Recovery] Timeout - preserving', filtered.length, 'cached rows (removed', cached.length - filtered.length, 'deleted)');
            return filtered as any[];
          }
          // If no cache, check localStorage for optimistic data
          try {
            const raw = localStorage.getItem('optimisticRecoveries');
            let parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) parsed = [];
            // Filter deleted IDs
            let deletedIds: string[] = [];
            try {
              const deletedRaw = localStorage.getItem('deletedRecoveryIds');
              deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
            } catch {}
            parsed = parsed.filter((r: any) => !deletedIds.includes(String(r.id)));
            if (parsed.length > 0) {
              console.log('[Recovery] Timeout - preserving', parsed.length, 'optimistic rows from localStorage');
              return parsed as any[];
            }
          } catch {}
          // Only return empty if absolutely no data exists
          return [] as any[];
        }
        // For other errors, surface them to the query so mutation or UI can handle
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
      }
    });
  // Update last-loaded timestamp whenever recoveries refresh successfully
  useEffect(() => {
    if (recoveries) {
      setLastLoadedAt(new Date());
    }
  }, [recoveries]);

  const { data: customers = [], error: customersError } = useQuery({
    queryKey: ["/api/credit-customers"],
    retry: 0,
    initialData: [] as any[],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/credit-customers', { credentials: 'include', signal: controller.signal });
        const text = await response.text();
        let result: any = {};
        try { result = JSON.parse(text || '{}'); } catch {}
        if (!response.ok || !result?.ok) {
          const msg = result?.error || `Failed to fetch customers (${response.status})`;
          throw new Error(msg);
        }
        return result.rows || [];
      } catch (e: any) {
        const message = String(e?.message || '');
        if (e?.name === 'AbortError' || /timeout|timed out|econnrefused|networkerror|failed to fetch/i.test(message)) {
          // return empty to keep UI usable
          return [] as any[];
        }
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  });

  const { data: employees = [], error: employeesError } = useQuery({
    queryKey: ["/api/employees"],
    retry: 0,
    initialData: [] as any[],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/api/employees', { credentials: 'include', signal: controller.signal });
        const text = await response.text();
        let result: any = {};
        try { result = JSON.parse(text || '{}'); } catch {}
        if (!response.ok || !result?.ok) {
          const msg = result?.error || `Failed to fetch employees (${response.status})`;
          throw new Error(msg);
        }
        return result.rows || [];
      } catch (e: any) {
        const message = String(e?.message || '');
        if (e?.name === 'AbortError' || /timeout|timed out|econnrefused|networkerror|failed to fetch/i.test(message)) {
          return [] as any[];
        }
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const createRecoveryMutation = useMutation({
    mutationFn: async (recoveryData: any) => {
      const isEdit = Boolean(editingId);
      const url = isEdit ? `/api/recoveries/${editingId}` : '/api/recoveries';
      const method = isEdit ? 'PUT' : 'POST';

      // Actually wait for backend response instead of fake success
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...recoveryData, created_by: null }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save recovery');
      }
      return result;
    },
    onSuccess: async (result) => {
      console.log('[Recovery] Mutation successful. result=', result);
      
      // Show success message
      toast({ title: "Success", description: "Recovery recorded successfully" });
      
      // Invalidate queries to refetch real data from server
      queryClient.invalidateQueries({ queryKey: ["/api/recoveries"], exact: true });
      setShowForm(false);
      setEditingId(null);
      setFormData({
        credit_customer_id: "",
        customer_name: "",
        recovery_date: format(new Date(), "yyyy-MM-dd"),
        pending_amount: "0",
        received_amount: "",
        discount: "0",
        balance_amount: "0",
        payment_mode: "Cash",
        notes: "",
        shift: "S-1",
        employee_id: "",
        employee_name: "",
      });
      setIsBalanceManual(false);
    },
    onError: (error: any) => {
      const name = error?.name || '';
      const msg = String(error?.message || error || '');
      const friendly = (name === 'AbortError' || /aborted/i.test(msg))
        ? 'Request timed out. Please try again.'
        : msg;
      toast({ variant: "destructive", title: "Error", description: friendly });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Helper to convert empty strings to null (prevents "undefined" strings in DB)
    const toNullIfEmpty = (val: any) => {
      if (val === undefined || val === null || val === '') return null;
      const str = String(val).trim();
      return str === '' ? null : str;
    };
    
    // Ensure employee_name is set if employee_id is chosen
    const derivedEmpName = (!formData.employee_name && formData.employee_id)
      ? (() => {
          const m = (employees as any[] | undefined)?.find((e: any)=> String(e.id) === String(formData.employee_id));
          return m?.employee_name || null;
        })()
      : formData.employee_name;

    const safeNum = (val: any, def = 0) => {
      const n = Number(val);
      return Number.isFinite(n) ? n : def;
    };
    const received = safeNum(formData.received_amount, 0);
    const disc = safeNum(formData.discount, 0);
    const pending = safeNum(formData.pending_amount, 0);
    const autoBalance = Number((pending - received - disc).toFixed(2));
    const balance = isBalanceManual ? safeNum(formData.balance_amount, autoBalance) : autoBalance;

    // Get organization_name and customer_name from selected customer (with localStorage fallback)
    const orgMap = (()=>{ try { return JSON.parse(localStorage.getItem('customerOrgMap')||'{}'); } catch { return {}; } })();
    // For edits, try to preserve existing organization_name; for new entries, get from selected or map
    let organizationName = selectedCustomer?.organization_name || orgMap?.[String(formData.credit_customer_id)] || null;
    if (editingId) {
      // When editing, check if we can get it from existing row in cache
      const existingRow = (() => {
        try {
          const cached = queryClient.getQueryData(["/api/recoveries"]) as any;
          const list = Array.isArray(cached) ? cached : (cached?.rows || []);
          return list.find((r: any) => String(r.id) === String(editingId));
        } catch { return null; }
      })();
      organizationName = existingRow?.organization_name || organizationName;
    }
    // Prefer typed-in customer_name; otherwise, fall back to selected organization's name
    const fallbackCustomerName = (() => {
      if (selectedCustomer && (selectedCustomer as any).organization_name) return (selectedCustomer as any).organization_name;
      if (selectedCustomer && (selectedCustomer as any).customer_name) return (selectedCustomer as any).customer_name;
      return null;
    })();
    const finalCustomerName = toNullIfEmpty(formData.customer_name) ?? fallbackCustomerName ?? orgMap?.[String(formData.credit_customer_id)] ?? null;

    const payload = {
      credit_customer_id: formData.credit_customer_id ? formData.credit_customer_id : null,
      organization_name: organizationName,
      customer_name: finalCustomerName,
      recovery_date: formData.recovery_date || new Date().toISOString().slice(0, 10),
      received_amount: received,
      discount: disc,
      pending_amount: pending,
      balance_amount: balance,
      payment_mode: formData.payment_mode || 'Cash',
      notes: toNullIfEmpty(formData.notes),
      shift: formData.shift && (formData.shift === 'S-1' || formData.shift === 'S-2') ? formData.shift : 'S-1',
      employee_id: formData.employee_id || null,
      employee_name: toNullIfEmpty(derivedEmpName),
    };
    console.log('[Recovery] Form state before submit:', {
      shift: formData.shift,
      employee_id: formData.employee_id,
      employee_name: derivedEmpName,
      customer_name: formData.customer_name
    });
    console.log('[Recovery] Submitting payload:', payload);
    createRecoveryMutation.mutate(payload);
  };

  const selectedCustomer = customers.find(c => c.id === formData.credit_customer_id) as any;
  const pendingVal = Number(formData.pending_amount || 0);
  const balanceAfterDiscount = useMemo(() => {
    const pend = Number(pendingVal || 0);
    const paid = Number(formData.received_amount || 0);
    const disc = Number(formData.discount || 0);
    return (pend - paid - disc).toFixed(2);
  }, [pendingVal, formData.received_amount, formData.discount]);

  const isStale = lastLoadedAt ? (Date.now() - lastLoadedAt.getTime() > 60_000) : true;
  const lastLoadedText = lastLoadedAt ? format(lastLoadedAt, 'PPpp') : 'never';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Add Recovery</span></div>

      {/* Blue panel same-to-same */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <div className="text-white/90">Last updated: <span className="font-medium">{lastLoadedText}</span></div>
            <div>
              {recoveriesLoading ? (
                <span className="text-white/80">Refreshing...</span>
              ) : isStale ? (
                <span className="text-yellow-200">Data may be stale</span>
              ) : (
                <span className="text-white/80">Up to date</span>
              )}
            </div>
          </div>
          {/* Top row */}
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <Label className="text-white">Receipt Date</Label>
              <input 
                id="recovery_date" 
                type="date" 
                value={formData.recovery_date} 
                onChange={(e) => setFormData({ ...formData, recovery_date: e.target.value })} 
                className="mt-1 h-10 w-full rounded-md bg-white text-black px-3" 
              />
            </div>
            <div className="col-span-4">
              <Label className="text-white">Shift</Label>
              <div className="mt-1 flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={formData.shift==='S-1'} onChange={()=> setFormData({ ...formData, shift: 'S-1' })} /> S-1</label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={formData.shift==='S-2'} onChange={()=> setFormData({ ...formData, shift: 'S-2' })} /> S-2</label>
              </div>
            </div>
            <div className="col-span-5">
              <Label className="text-white">Total Recovery Due</Label>
              <div className="mt-1 h-10 px-4 flex items-center rounded-md bg-white text-black">
                ₹{Number(balanceAfterDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Auto-fill */}
          <div className="rounded-lg border border-white/40 bg-white/10 p-4">
            <div className="text-sm opacity-90 mb-3">AUTO-FILL</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-white text-sm">Choose Organization</div>
                <Select value={formData.credit_customer_id} onValueChange={(v)=> {
                  const sel = customers.find((c: any)=> c.id === v) as any;
                  // Persist a lightweight map so org name can be shown even if customers list times out later
                  try {
                    const raw = localStorage.getItem('customerOrgMap');
                    const map = raw ? JSON.parse(raw) : {};
                    map[String(v)] = sel?.organization_name || map[String(v)] || null;
                    localStorage.setItem('customerOrgMap', JSON.stringify(map));
                  } catch {}
                  setFormData({
                    ...formData,
                    credit_customer_id: v,
                    // Never touch customer_name here
                    pending_amount: String(sel?.current_balance ?? formData.pending_amount)
                  });
                }}>
                  <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                  {customers.map((c)=> (<SelectItem key={c.id} value={String(c.id)}>{c.organization_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-white text-sm">Choose Employee</div>
                <Select value={formData.employee_id} onValueChange={(v)=> {
                  const emp = (employees as any[] | undefined)?.find((e: any)=> String(e.id) === String(v));
                  setFormData({ ...formData, employee_id: v, employee_name: emp?.employee_name || '' });
                }}>
                  <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                  {employees.map((e: any)=> (<SelectItem key={e.id} value={String(e.id)}>{e.employee_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Entry row - labeled fields */}
          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-3 space-y-2">
              <div className="text-white text-sm">Organization</div>
              <Select value={formData.credit_customer_id} onValueChange={(v)=> {
                const sel = customers.find((c: any)=> c.id === v) as any;
                try {
                  const raw = localStorage.getItem('customerOrgMap');
                  const map = raw ? JSON.parse(raw) : {};
                  map[String(v)] = sel?.organization_name || map[String(v)] || null;
                  localStorage.setItem('customerOrgMap', JSON.stringify(map));
                } catch {}
                setFormData({
                  ...formData,
                  credit_customer_id: v,
                  // Never touch customer_name here either
                  pending_amount: String(sel?.current_balance ?? formData.pending_amount)
                });
              }}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Organization" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c)=> (<SelectItem key={c.id} value={String(c.id)}>{c.organization_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Customer Name</div>
              <Input className="bg-white text-black" value={formData.customer_name} onChange={(e)=> setFormData({ ...formData, customer_name: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Pending</div>
              <Input className="bg-white text-black" value={formData.pending_amount} onChange={(e)=> setFormData({ ...formData, pending_amount: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Received Amount</div>
              <Input className="bg-white text-black" value={formData.received_amount} onChange={(e)=> setFormData({ ...formData, received_amount: e.target.value })} />
            </div>
            <div className="col-span-1 space-y-2">
              <div className="text-white text-sm">Discount Amount</div>
              <Input className="bg-white text-black" value={formData.discount} onChange={(e)=> setFormData({ ...formData, discount: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Balance</div>
              <Input className="bg-white text-black" value={isBalanceManual ? formData.balance_amount : balanceAfterDiscount}
                onFocus={()=> setIsBalanceManual(true)}
                onChange={(e)=> { setIsBalanceManual(true); setFormData({ ...formData, balance_amount: e.target.value }); }} />
            </div>

            <div className="col-span-3 space-y-2">
              <div className="text-white text-sm">Employee</div>
              <Select value={formData.employee_id} onValueChange={(v)=> {
                const emp = (employees as any[] | undefined)?.find((e: any)=> String(e.id) === String(v));
                setFormData({ ...formData, employee_id: v, employee_name: emp?.employee_name || '' });
              }}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any)=> (<SelectItem key={e.id} value={String(e.id)}>{e.employee_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <div className="text-white text-sm">Description</div>
              <Input className="bg-white text-black" value={formData.notes} onChange={(e)=> setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Collection Mode</div>
              <Select value={formData.payment_mode} onValueChange={(v)=> setFormData({ ...formData, payment_mode: v })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Swipe">Swipe</SelectItem>
                  <SelectItem value="VendorCard">Petro Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Upload Image</div>
              <Input type="file" className="bg-white text-black" />
              <div className="text-xs opacity-80">Allowed (JPEG,JPG, TIF, GIF, PNG) MaxSize:2MB</div>
            </div>
            <div className="col-span-12 flex justify-center mt-2">
              <Button type="submit" disabled={createRecoveryMutation.isPending} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">
                {createRecoveryMutation.isPending ? 'SAVING...' : 'CONFIRM'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters and toolbar + table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Recoveries</CardTitle>
        </CardHeader>
        <CardContent>
          {recoveriesLoading && (
            <div className="mb-3 text-sm text-blue-600 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Loading recoveries...
            </div>
          )}
          {recoveriesError && (
            <div className="mb-3 p-3 text-sm text-white bg-red-600 rounded">
              <strong>Error loading recoveries:</strong> {String(recoveriesError)}
            </div>
          )}
          {(customersError || employeesError) && (
            <div className="mb-3 p-3 text-sm text-white bg-orange-600 rounded">
              <strong>Warning:</strong> {String(customersError || employeesError)}
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Button variant="destructive">Delete</Button><Button variant="outline">Direct Print</Button></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm">Copy</Button><Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button><Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button><Button variant="outline" size="sm">Print</Button><div className="flex items-center gap-2 ml-4"><span>Filter:</span><Input placeholder="Type to filter..." className="w-56" /></div></div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Txn. No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Paid Amt</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recoveriesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  </TableRow>
                ))
              ) : recoveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No recoveries recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                recoveries.map((recovery: any, idx: number) => {
                  const empName = (() => {
                    // Prioritize employee_name from API response (stored directly in DB)
                    const byJoin = recovery.employee_name || recovery.employee_name_join;
                    if (byJoin && String(byJoin).trim() !== '' && byJoin !== 'Unknown') {
                      return byJoin;
                    }
                    // Fallback to lookup if employee_id exists
                    if (recovery.employee_id) {
                      const m = (employees as any[] | undefined)?.find((e: any) => String(e.id) === String(recovery.employee_id));
                      return m?.employee_name || '-';
                    }
                    return '-';
                  })();
                  const txnNo = recovery.id ? `R${String(recovery.id).slice(0,4).toUpperCase()}` : '-';
                  return (
                  <TableRow key={recovery.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{txnNo}</TableCell>
                    <TableCell>{recovery.recovery_date ? format(new Date(recovery.recovery_date), "dd-MMM-yyyy") : '-'}</TableCell>
                    <TableCell>{(() => {
                      // Prefer organization_name from row; fallback to customers list; then ls map
                      const direct = recovery.organization_name;
                      if (direct && String(direct).trim() !== '') return direct;
                      try {
                        const match = (customers as any[] | undefined)?.find((c: any) => String(c.id) === String(recovery.credit_customer_id));
                        if (match?.organization_name) return match.organization_name;
                        const map = JSON.parse(localStorage.getItem('customerOrgMap')||'{}');
                        return map[String(recovery.credit_customer_id)] || '-';
                      } catch {
                        return '-';
                      }
                    })()}</TableCell>
                    <TableCell>{recovery.customer_name && String(recovery.customer_name).trim() !== '' ? recovery.customer_name : '-'}</TableCell>
                    <TableCell>{recovery.shift || 'S-1'}</TableCell>
                    <TableCell>{recovery.payment_mode || '-'}</TableCell>
                    <TableCell className="font-medium">{Number(recovery.received_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(recovery.discount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{empName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{recovery.notes || '-'}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 justify-center">
                        <a href={`#edit-${recovery.id}`} onClick={(ev)=> {
                          ev.preventDefault();
                          setEditingId(String(recovery.id));
                          setShowForm(true);
                          setIsBalanceManual(true);
                          setFormData({
                            credit_customer_id: recovery.credit_customer_id || '',
                            customer_name: recovery.customer_name || '',
                            recovery_date: recovery.recovery_date ? String(recovery.recovery_date).slice(0,10) : new Date().toISOString().slice(0,10),
                            pending_amount: String(recovery.pending_amount || '0'),
                            received_amount: String(recovery.received_amount || ''),
                            discount: String(recovery.discount || '0'),
                            balance_amount: String(recovery.balance_amount || '0'),
                            payment_mode: recovery.payment_mode || 'Cash',
                            notes: recovery.notes || '',
                            shift: (recovery.shift === 'S-2' ? 'S-2' : 'S-1'),
                            employee_id: recovery.employee_id || '',
                            employee_name: recovery.employee_name || ''
                          });
                        }} className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
                          <img src="https://ramkrishna.ymtsindia.in/assets/images/edit.png" alt="Edit" width={28} height={28} />
                        </a>
                        <a href={`#delete-${recovery.id}`} onClick={async (ev)=> {
                          ev.preventDefault();
                          if (!confirm('Delete this entry?')) return;
                          const deleteId = String(recovery.id);
                          const controller = new AbortController();
                          const timeoutId = setTimeout(() => controller.abort(), 10000);
                          try {
                            console.log('[DELETE] Frontend: Deleting recovery:', deleteId);
                            const isTemp = deleteId.startsWith('temp-');
                            
                            // Store deleted IDs to prevent refetch from restoring them
                            const deletedIdsKey = 'deletedRecoveryIds';
                            try {
                              const deletedIdsRaw = localStorage.getItem(deletedIdsKey);
                              const deletedIds = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
                              if (!deletedIds.includes(deleteId)) {
                                deletedIds.push(deleteId);
                                localStorage.setItem(deletedIdsKey, JSON.stringify(deletedIds));
                              }
                            } catch {}
                            
                            // Optimistically remove from UI immediately
                            queryClient.setQueryData(["/api/recoveries"], (old: any) => {
                              const list = Array.isArray(old) ? old : (old?.rows || []);
                              const filtered = list.filter((r: any) => String(r.id) !== deleteId);
                              console.log('[DELETE] Removed from cache. Before:', list.length, 'After:', filtered.length);
                              return filtered;
                            });
                            
                            // Remove from localStorage
                            try {
                              const raw = localStorage.getItem('optimisticRecoveries');
                              const arr = raw ? JSON.parse(raw) : [];
                              const out = (Array.isArray(arr) ? arr : []).filter((r:any) => String(r.id) !== deleteId);
                              localStorage.setItem('optimisticRecoveries', JSON.stringify(out));
                              console.log('[DELETE] Removed from localStorage');
                            } catch {}

                            if (isTemp) {
                              toast({ title: "Deleted", description: "Removed pending recovery." });
                              clearTimeout(timeoutId);
                              return;
                            }

                            // Attempt server delete for real IDs
                            const r = await fetch(`/api/recoveries/${deleteId}`, { 
                              method: 'DELETE', 
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                              signal: controller.signal
                            });
                            clearTimeout(timeoutId);
                            const txt = await r.text();
                            let j;
                            try { j = JSON.parse(txt || '{}'); } catch { j = {}; }
                            if (!r.ok || !j?.ok) {
                              // On server failure, don't restore - keep it deleted locally
                              console.warn('[DELETE] Server delete failed but keeping local deletion');
                              toast({ variant: "destructive", title: "Delete may have failed on server", description: "Item removed locally. Please refresh to verify." });
                              return;
                            }
                            toast({ title: "Deleted", description: "Recovery deleted successfully." });
                          } catch (e:any) {
                            clearTimeout(timeoutId);
                            if (e.name === 'AbortError') {
                              console.log('[DELETE] Request timed out but keeping local deletion');
                              toast({ title: "Deleted locally", description: "Removed from view. Server sync may be delayed." });
                            } else {
                              console.error('[DELETE] Frontend error:', e);
                              toast({ title: "Deleted locally", description: "Removed from view. Please refresh later to verify server sync." });
                            }
                          }
                        }} className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
                          <img src="https://ramkrishna.ymtsindia.in/assets/images/delete.png" alt="Delete" width={28} height={28} />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{recovery.created_at ? `Created: ${new Date(recovery.created_at).toLocaleString()}` : '-'}</TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
