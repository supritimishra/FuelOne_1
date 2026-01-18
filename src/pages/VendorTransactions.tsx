import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ExportButtons from "@/components/ExportButtons";
import { handleAPIError } from "@/lib/errorHandler";

export default function VendorTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: "", vendor_id: "", amount: "0", transaction_type: "Credit", payment_mode: "Cash", description: "", transaction_date: new Date().toISOString().slice(0, 10), employee_id: "" });

  // Filter states
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterVendor, setFilterVendor] = useState("");

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["/api/vendor-transactions", filterFrom, filterTo, filterVendor],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterFrom) params.append('from', filterFrom);
        if (filterTo) params.append('to', filterTo);
        if (filterVendor && filterVendor !== "ALL") params.append('vendor_id', filterVendor);

        const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
        const response = await fetch(`${apiBase}/api/vendor-transactions?${params.toString()}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result?.ok) throw new Error(result?.error || 'Failed to fetch vendor transactions');
        return result?.rows || [];
      } catch (error: any) {
        // Keeping console.error for production monitoring
        console.error('Error fetching vendor transactions:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const { data: vendors = [], error: vendorsError } = useQuery({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      try {
        const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
        const response = await fetch(`${apiBase}/api/vendors`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result?.ok) throw new Error(result?.error || 'Failed to fetch vendors');
        return result?.rows || [];
      } catch (error: any) {
        console.error('Error fetching vendors:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const { data: employees = [], error: employeesError } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      try {
        const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
        const response = await fetch(`${apiBase}/api/employees`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result?.ok) throw new Error(result?.error || 'Failed to fetch employees');
        return result?.rows || [];
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const saveTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const payload = {
        vendor_id: transactionData.vendor_id,
        amount: parseFloat(transactionData.amount),
        transaction_type: transactionData.transaction_type,
        payment_mode: transactionData.payment_mode,
        description: transactionData.description,
        transaction_date: transactionData.transaction_date,
        employee_id: transactionData.employee_id || null,
      };

      const method = transactionData.id ? 'PUT' : 'POST';
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const url = transactionData.id ? `${apiBase}/api/vendor-transactions/${transactionData.id}` : `${apiBase}/api/vendor-transactions`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to save transaction');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-transactions"] });
      toast({ title: "Success", description: "Transaction recorded" });
      setShowForm(false);
      setFormData({ id: "", vendor_id: "", amount: "0", transaction_type: "Credit", payment_mode: "Cash", description: "", transaction_date: new Date().toISOString().slice(0, 10), employee_id: "" });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "Vendor Transaction");
      toast({
        variant: "destructive",
        title: errorInfo.title,
        description: errorInfo.description
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/vendor-transactions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to delete transaction');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-transactions"] });
      toast({ title: "Success", description: "Deleted" });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "Vendor Transaction");
      toast({
        variant: "destructive",
        title: errorInfo.title,
        description: errorInfo.description
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    saveTransactionMutation.mutate(formData);
  };

  const handleDelete = async (id: string) => {
    deleteTransactionMutation.mutate(id);
  };

  const handleEdit = (t: any) => {
    setFormData({
      id: t.id,
      vendor_id: t.vendorId || t.vendor_id,
      amount: String(t.amount || 0),
      transaction_type: t.transactionType || t.transaction_type || "Credit",
      payment_mode: t.paymentMode || t.payment_mode || "Cash",
      description: t.description || "",
      transaction_date: t.transactionDate || t.transaction_date || new Date().toISOString().slice(0, 10),
      employee_id: t.employeeId || t.employee_id || ""
    });
    setShowForm(true);
  };

  // Show error messages if queries fail
  if (transactionsError || vendorsError || employeesError) {
    const errorMessage = transactionsError?.message || vendorsError?.message || employeesError?.message || 'Failed to load data';
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Vendor Transactions</span></div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">Error loading data: {errorMessage}</p>
              <Button
                className="mt-4"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/vendor-transactions"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Vendor Transactions</span></div>

      {/* Blue panel same-to-same */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Vendor Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="relative col-span-2">
              <input id="vt_date" type="date" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className="absolute inset-0 opacity-0" />
              <button type="button" className="h-10 w-full rounded-md bg-orange-500 text-white font-medium px-3" onClick={() => {
                const el = document.getElementById('vt_date') as HTMLInputElement | null; if (el) { // @ts-ignore
                  if (typeof el.showPicker === 'function') { // @ts-ignore
                    el.showPicker();
                  } else { el.click(); }
                }
              }}>Choose Date</button>
            </div>
            <div className="col-span-3">
              <Input placeholder="Date" className="bg-white text-black" value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} />
            </div>
            <div className="col-span-4">
              <Select value={formData.employee_id} onValueChange={(val) => setFormData({ ...formData, employee_id: val })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={String(e.id || e._id)} value={String(e.id || e._id)}>{e.employee_name || e.employeeName || 'Unknown'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Vendor*" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={String(v.id)} value={String(v.id)}>{v.vendor_name || 'Unknown'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <div className="flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="vt_type" checked={formData.transaction_type === 'Credit'} onChange={() => setFormData({ ...formData, transaction_type: 'Credit' })} /> Credit</label>
                <label className="flex items-center gap-2"><input type="radio" name="vt_type" checked={formData.transaction_type === 'Debit'} onChange={() => setFormData({ ...formData, transaction_type: 'Debit' })} /> Debit</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-3">
              <Select value={formData.payment_mode} onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="-Select Bank-" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Input type="number" step="0.01" placeholder="Amount*" className="bg-white text-black" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div className="col-span-6">
              <Input placeholder="Description" className="bg-white text-black" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-center">
            <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8" onClick={handleSubmit}>SAVE</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 flex items-center gap-2"><span>From Date</span><Input type="date" className="w-44" placeholder="Filter Date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} /></div>
            <div className="col-span-3 flex items-center gap-2"><span>To Date</span><Input type="date" className="w-44" placeholder="Filter Date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} /></div>
            <div className="col-span-4 flex items-center gap-2">
              <span>Vendor</span>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center justify-end"><Button className="bg-orange-500 hover:bg-orange-600" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/vendor-transactions"] })}>Search</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3"><Button variant="destructive">Delete</Button><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Show:</span><select className="h-9 rounded-md border bg-background px-2 text-sm"><option>All</option></select></div></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm">CSV</Button><Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button><div className="flex items-center gap-2 ml-2"><span className="text-sm text-muted-foreground">Filter:</span><Input placeholder="Type to filter..." className="w-56" /></div></div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credit(₹)</TableHead>
                <TableHead>Debit(₹)</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t, idx) => (
                  <TableRow key={t?.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">{t?.transactionDate || t?.transaction_date || "-"}</TableCell>
                    <TableCell>
                      {(() => {
                        if (t?.vendors?.vendor_name && t.vendors.vendor_name !== 'Unknown Vendor') {
                          return t.vendors.vendor_name;
                        }
                        const vId = t?.vendorId || t?.vendor_id;
                        if (vId) {
                          const v = vendors.find((v: any) => String(v.id) === String(vId));
                          if (v) return v.vendor_name;
                        }
                        return 'Unknown Vendor';
                      })()}
                    </TableCell>
                    <TableCell>{t?.transactionType || t?.transaction_type || "-"}</TableCell>
                    <TableCell className="text-green-600 font-medium">{(t?.transactionType || t?.transaction_type) === 'Credit' ? (t?.amount || "0") : '-'}</TableCell>
                    <TableCell className="text-red-600 font-medium">{(t?.transactionType || t?.transaction_type) === 'Debit' ? (t?.amount || "0") : '-'}</TableCell>
                    <TableCell>{t?.paymentMode || t?.payment_mode || '-'}</TableCell>
                    <TableCell>
                      {(() => {
                        // 1. Try server-resolved name (now more reliable)
                        const sname = t?.employees?.employee_name;
                        if (sname && sname !== 'Unknown' && sname !== 'undefined' && sname !== 'null') {
                          return sname;
                        }

                        // 2. Local lookup by employee identifier
                        const rawId = t?.employeeId || t?.employee_id;
                        if (rawId && rawId !== 'undefined' && rawId !== 'null') {
                          // Try ID lookup
                          const found = employees.find((e: any) => String(e.id || e._id) === String(rawId));
                          if (found) return found.employee_name || found.employeeName;

                          // If rawId is actually a name (legacy), use it directly
                          if (String(rawId).length > 2 && !String(rawId).includes(':')) return rawId;
                        }

                        return '-';
                      })()}
                    </TableCell>
                    <TableCell>{t?.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(t?.id)}>Del</Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {t?.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
