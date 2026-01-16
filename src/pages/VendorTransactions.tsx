import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invalidateQueries } from "@/lib/cacheInvalidation";
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

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/vendor-transactions"],
    queryFn: async () => {
      const response = await fetch('/api/vendor-transactions', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch vendor transactions');
      return result.rows || [];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const response = await fetch('/api/vendors', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch vendors');
      return result.rows || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
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
      const url = transactionData.id ? `/api/vendor-transactions/${transactionData.id}` : '/api/vendor-transactions';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save transaction');
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
      const response = await fetch(`/api/vendor-transactions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete transaction');
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
    setFormData({ id: t.id, vendor_id: t.vendor_id, amount: String(t.amount || 0), transaction_type: t.transaction_type || "Credit", payment_mode: t.payment_mode || "Cash", description: t.description || "", transaction_date: t.transaction_date || new Date().toISOString().slice(0, 10), employee_id: t.employee_id || "" });
    setShowForm(true);
  };

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
              <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Vendor*" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>
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
            <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8" onClick={(e) => { e.preventDefault(); (handleSubmit as any)(e); }}>SAVE</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 flex items-center gap-2"><span>From Date</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="col-span-3 flex items-center gap-2"><span>To Date</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="col-span-4 flex items-center gap-2"><span>Vendor</span><Input placeholder="Select Vendor" className="w-full" /></div>
            <div className="col-span-2 flex items-center justify-end"><Button className="bg-orange-500 hover:bg-orange-600">Search</Button></div>
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
                <TableHead>Credit(₹)</TableHead>
                <TableHead>Debit(₹)</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
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
              ) : (
                transactions.map((t, idx) => (
                  <TableRow key={t.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{t.transaction_date || ""}</TableCell>
                    <TableCell>{t.vendors?.vendor_name || vendors.find((v) => v.id === t.vendor_id)?.vendor_name || t.vendor_id}</TableCell>
                    <TableCell>{t.transaction_type === 'Credit' ? t.amount : '-'}</TableCell>
                    <TableCell>{t.transaction_type === 'Debit' ? t.amount : '-'}</TableCell>
                    <TableCell>{t.payment_mode || '-'}</TableCell>
                    <TableCell className="max-w-md truncate">{t.description}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>Edit</Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>Delete</Button>
                    </TableCell>
                    <TableCell>-</TableCell>
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
