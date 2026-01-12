import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// using native <select> for credit/debit dropdowns for better compatibility
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ExportButtons from "@/components/ExportButtons";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

import { useAuth } from "@/hooks/useAuth";

export default function BusinessTransactions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  // transaction-level date (applies to all rows)
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));

  const defaultEnteredBy = user?.fullName || user?.username || "";

  // support multiple line rows (row-wise entry)
  const emptyRow = () => ({
    id: "",
    credit_from: "",
    debit_to: "",
    amount: "0",
    description: "",
    entered_by: defaultEnteredBy
  });
  const [formRows, setFormRows] = useState<Array<any>>(() => [emptyRow()]);
  const ADD_OPTION = "__add_second_row__";

  // Filter states
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterParty, setFilterParty] = useState("");

  // Fetch business transactions data using backend API with filters
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/business-transactions", filterFrom, filterTo, filterParty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterFrom) params.append('from', filterFrom);
      if (filterTo) params.append('to', filterTo);
      if (filterParty) params.append('party_name', filterParty);

      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/business-transactions?${params.toString()}`);
      const result = await response.json();
      if (!result?.ok) throw new Error(result?.error || 'Failed to fetch business transactions');
      return result?.rows || [];
    },
  });

  // Fetch customers data using backend API
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/credit-customers`);
      const result = await response.json();
      if (!result?.ok) throw new Error(result?.error || 'Failed to fetch customers');
      return result?.rows || [];
    },
  });

  // Fetch vendors data using backend API
  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/vendors`);
      const result = await response.json();
      if (!result?.ok) throw new Error(result?.error || 'Failed to fetch vendors');
      return result?.rows || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = transactionDate || new Date().toISOString().slice(0, 10);

    try {
      let hasErrors = false;
      const errors: string[] = [];

      // Validate all rows first
      for (let i = 0; i < formRows.length; i++) {
        const r = formRows[i];
        // Skip empty rows
        if (!r?.credit_from?.trim() && !r?.debit_to?.trim() && (!r?.amount || parseFloat(r?.amount || '0') <= 0)) {
          continue; // Skip completely empty rows
        }

        // Validate: At least one of credit_from or debit_to must be filled
        if (!r?.credit_from?.trim() && !r?.debit_to?.trim()) {
          errors.push(`Row ${i + 1}: Please fill either Credit(From) or Debit(To) field`);
          hasErrors = true;
          continue;
        }

        // Validate: Amount must be filled and greater than 0
        const amount = parseFloat(r?.amount || '0');
        if (!amount || amount <= 0) {
          errors.push(`Row ${i + 1}: Amount is required and must be greater than 0`);
          hasErrors = true;
          continue;
        }
      }

      if (hasErrors) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: errors.join('; ')
        });
        return;
      }

      // Process each form row sequentially to show proper error messages
      let savedCount = 0;
      // Reusing errors array from above (which is empty here)

      for (let i = 0; i < formRows.length; i++) {
        const r = formRows[i];
        // Skip empty rows
        if (!r?.credit_from?.trim() && !r?.debit_to?.trim() && (!r?.amount || parseFloat(r?.amount || '0') <= 0)) {
          continue;
        }

        try {
          const amount = parseFloat(r?.amount || '0');

          // Determine transaction type and party name based on which field is filled
          // Priority: If both are filled, use credit_from
          let transaction_type = 'Credit';
          let party_name = '';
          let effected_party = '';

          if (r?.credit_from && r?.credit_from?.trim()) {
            transaction_type = 'Credit';
            party_name = r?.credit_from?.trim();
            effected_party = r?.credit_from?.trim();
          } else if (r?.debit_to && r?.debit_to?.trim()) {
            transaction_type = 'Debit';
            party_name = r?.debit_to?.trim();
            effected_party = r?.debit_to?.trim();
          }

          const payload: any = {
            transaction_date: date,
            transaction_type: transaction_type,
            party_name: party_name,
            amount: amount,
            description: r?.description || '',
            effected_party: effected_party,
            entered_by: r?.entered_by || defaultEnteredBy
          };

          // Only include source if it has a value
          if (r?.source?.trim()) {
            payload.source = r?.source?.trim();
          }

          const method = r?.id ? 'PUT' : 'POST';
          const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
          const url = r?.id ? `${apiBase}/api/business-transactions/${r?.id}` : `${apiBase}/api/business-transactions`;

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          if (!result?.ok) {
            throw new Error(result?.error || 'Failed to save transaction');
          }

          savedCount++;
        } catch (error: any) {
          const errorMsg = error?.message || 'Unknown error';
          errors.push(`Row ${i + 1}: ${errorMsg}`);
        }
      }

      // Show results
      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Some transactions failed to save',
          description: `${savedCount} saved, ${errors.length} failed. ${errors.join('; ')}`
        });
        if (savedCount > 0) {
          refetch(); // Refresh if at least one was saved
        }
        return;
      }

      if (savedCount === 0) {
        toast({
          variant: 'destructive',
          title: 'No transactions to save',
          description: 'Please fill in at least one transaction row'
        });
        return;
      }

      // All saves succeeded
      toast({ title: 'Success', description: `Successfully saved ${savedCount} transaction(s)` });

      // Reset form
      setFormRows([emptyRow()]);
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setShowForm(false);
      refetch(); // Refresh the data
    } catch (error: any) {
      const errorInfo = handleAPIError(error, "Business Transaction");
      toast({
        variant: 'destructive',
        title: errorInfo.title,
        description: errorInfo.description
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/business-transactions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to delete transaction');
      }

      toast({ title: 'Success', description: 'Transaction deleted successfully' });
      refetch(); // Refresh the data
    } catch (error: any) {
      const errorInfo = handleAPIError(error, "Business Transaction");
      toast({
        variant: 'destructive',
        title: errorInfo.title,
        description: errorInfo.description
      });
    }
  };

  const handleEdit = (r: any) => {
    // populate the formRows with a single editable row for the selected record
    const transactionType = r.transactionType || r.transaction_type;
    const partyName = r.partyName || r.party_name;
    const effectedParty = r.effectedParty || r.effected_party;

    const credit_from = transactionType === 'Credit' ? (partyName || effectedParty || '') : '';
    const debit_to = transactionType === 'Debit' ? (partyName || effectedParty || '') : '';
    setTransactionDate(r.transactionDate || r.transaction_date || '');
    setFormRows([{
      id: r.id,
      credit_from: credit_from,
      debit_to: debit_to,
      amount: String(r.amount || 0),
      description: r.description || '',
      entered_by: r.enteredBy || r.entered_by || defaultEnteredBy
    }]);
    setShowForm(true);
  };

  // Allow multiple rows (up to 5)
  const addRow = () => setFormRows(prev => (prev.length >= 5 ? prev : [...prev, emptyRow()]));
  const removeRow = (idx: number) => setFormRows(prev => { if (prev.length <= 1) return prev; return prev.filter((_, i) => i !== idx); });
  const updateRow = (idx: number, key: string, value: any) => setFormRows(prev => { const copy = [...prev]; copy[idx] = { ...copy[idx], [key]: value }; return copy; });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Busi Cr/Dr Transactions</span></div>

      {/* Blue panel same-to-same */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="relative col-span-2">
              <input id="bt_date" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="absolute inset-0 opacity-0 pointer-events-none" />
              <button type="button" className="h-10 w-full rounded-md bg-yellow-400 text-black font-medium px-3" onClick={() => {
                const el = document.getElementById('bt_date') as HTMLInputElement | null; if (el) { // @ts-ignore
                  if (typeof el.showPicker === 'function') { // @ts-ignore
                    el.showPicker();
                  } else { el.click(); }
                }
              }}>Choose Date</button>
            </div>
            <div className="col-span-2 h-10 bg-white text-black rounded-md flex items-center px-3">
              {transactionDate || new Date().toISOString().slice(0, 10)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Render form rows */}
            {formRows.map((fr, idx) => (
              <div key={idx} className="space-y-4 bg-white/5 p-4 rounded-lg">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3 space-y-1">
                    <Label className="text-white text-xs">Credit(From)</Label>
                    <Input placeholder="Credit(From)" className="bg-white text-black h-9" value={fr.credit_from} onChange={(e) => updateRow(idx, 'credit_from', e.target.value)} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-white text-xs">Debit(To)</Label>
                    <Input placeholder="Debit(To)" className="bg-white text-black h-9" value={fr.debit_to} onChange={(e) => updateRow(idx, 'debit_to', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-white text-xs">Amount*</Label>
                    <Input placeholder="Amount*" className="bg-white text-black h-9" type="number" step="0.01" value={fr.amount} onChange={(e) => updateRow(idx, 'amount', e.target.value)} />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-white text-xs">Description</Label>
                    <Input placeholder="Description" className="bg-white text-black h-9" value={fr.description} onChange={(e) => updateRow(idx, 'description', e.target.value)} />
                  </div>
                  {formRows.length > 1 && (
                    <div className="col-span-1 flex items-end">
                      <Button type="button" variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => removeRow(idx)}>×</Button>
                    </div>
                  )}
                  {idx === formRows.length - 1 && formRows.length < 5 && (
                    <div className="col-span-1 flex items-end">
                      <Button type="button" variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={addRow}>+</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="col-span-12 flex justify-center">
              <Button type="submit" className="rounded-full bg-green-500 hover:bg-green-600 text-black px-8">SAVE</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4 flex items-center gap-2"><span>Search From</span><Input type="date" className="w-full" placeholder="Filter Date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} /></div>
            <div className="col-span-4 flex items-center gap-2"><span>To</span><Input type="date" className="w-full" placeholder="Filter Date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} /></div>
            <div className="col-span-3 flex items-center gap-2"><span>Creditor</span><Input placeholder="Creditor" className="w-full" value={filterParty} onChange={(e) => setFilterParty(e.target.value)} /></div>
            <div className="col-span-1 flex items-center justify-end"><Button className="bg-orange-500 hover:bg-orange-600" onClick={() => refetch()}>Search</Button></div>
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
                <TableHead>Effect Parties</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.transactionDate || r.transaction_date || '-'}</TableCell>
                    <TableCell>
                      {r.effectedParty || r.effected_party || r.partyName || r.party_name || '-'}
                      {(r.transactionType || r.transaction_type) && (
                        <span className={`ml-2 text-xs ${(r.transactionType || r.transaction_type) === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                          ({r.transactionType || r.transaction_type})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={(r.transactionType || r.transaction_type) === 'Credit' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {Number(r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{r.enteredBy || r.entered_by || r.createdBy || '-'}</TableCell>
                    <TableCell>{r.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(r.id)}>Del</Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {r.createdAt ? `Created: ${r.createdBy || 'System'} ${new Date(r.createdAt).toLocaleString('en-IN')}` : '-'}
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
