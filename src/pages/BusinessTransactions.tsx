import { useEffect, useState } from "react";
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

export default function BusinessTransactions() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  // transaction-level date (applies to all rows)
  const [transactionDate, setTransactionDate] = useState("");
  // support multiple line rows (row-wise entry)
  const emptyRow = () => ({ id: "", transaction_type: "Credit", credit_party: "", debit_party: "", amount: "0", description: "" });
  const [formRows, setFormRows] = useState<Array<any>>([emptyRow()]);
  const ADD_OPTION = "__add_second_row__";

  // Fetch business transactions data using backend API
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/business-transactions"],
    queryFn: async () => {
      const response = await fetch('/api/business-transactions');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch business transactions');
      return result.rows || [];
    },
  });

  // Fetch customers data using backend API
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const response = await fetch('/api/credit-customers');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch customers');
      return result.rows || [];
    },
  });

  // Fetch vendors data using backend API
  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const response = await fetch('/api/vendors');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch vendors');
      return result.rows || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = transactionDate || new Date().toISOString().slice(0,10);
    
    try {
      // Process each form row
      for (const r of formRows) {
        const partyToSave = r.transaction_type === 'Credit' ? (r.credit_party || r.debit_party) : (r.debit_party || r.credit_party);
        const payload = { 
          transaction_date: date, 
          transaction_type: r.transaction_type, 
          party_name: partyToSave, 
          amount: parseFloat(r.amount || '0'), 
          description: r.description 
        };

        const method = r.id ? 'PUT' : 'POST';
        const url = r.id ? `/api/business-transactions/${r.id}` : '/api/business-transactions';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Failed to save transaction');
        }
      }

      toast({ title: 'Success', description: 'Business transactions saved successfully' });
      
      // Reset form
      setFormRows([emptyRow()]);
      setTransactionDate('');
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
      const response = await fetch(`/api/business-transactions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete transaction');
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
    const credit = r.transaction_type === 'Credit' ? r.party_name : '';
    const debit = r.transaction_type === 'Debit' ? r.party_name : '';
    setTransactionDate(r.transaction_date || '');
    setFormRows([{ id: r.id, transaction_type: r.transaction_type, credit_party: credit, debit_party: debit, amount: String(r.amount || 0), description: r.description || '' }]);
    setShowForm(true);
  };

  // Only allow up to 2 rows (per request). Add toggles second row; remove removes second row.
  const addRow = () => setFormRows(prev => (prev.length >= 2 ? prev : [...prev, emptyRow()]));
  const removeRow = (idx: number) => setFormRows(prev => { if (prev.length <= 1) return prev; return prev.filter((_, i) => i !== idx); });
  const updateRow = (idx: number, key: string, value: any) => setFormRows(prev => { const copy = [...prev]; copy[idx] = { ...copy[idx], [key]: value }; return copy; });
  const [popoverOpen, setPopoverOpen] = useState(false);

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
              <input id="bt_date" type="date" value={transactionDate} onChange={(e)=>setTransactionDate(e.target.value)} className="absolute inset-0 opacity-0 pointer-events-none" />
              <button type="button" className="h-10 w-full rounded-md bg-yellow-400 text-black font-medium px-3" onClick={()=>{ const el=document.getElementById('bt_date') as HTMLInputElement|null; if(el){ // @ts-ignore
                if(typeof el.showPicker==='function'){ // @ts-ignore
                  el.showPicker(); } else { el.click(); } } }}>Choose Date</button>
            </div>
            <div className="col-span-2 h-10 bg-white text-black rounded-md flex items-center px-3">Date</div>
            <div className="col-span-4">
              <div className="flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="shift" defaultChecked /> S-1</label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" /> S-2</label>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-2"><div className="h-10 bg-white text-black rounded-md flex items-center px-3">Credit/Party</div></div>
              <div className="col-span-2"><div className="h-10 bg-white text-black rounded-md flex items-center px-3">Debit/Cr</div></div>
              <div className="col-span-2"><div className="h-10 bg-white text-black rounded-md flex items-center px-3">Type</div></div>
              <div className="col-span-2"><div className="h-10 bg-white text-black rounded-md flex items-center px-3">Amount</div></div>
              <div className="col-span-4"><div className="h-10 bg-white text-black rounded-md flex items-center px-3">Description</div></div>
            </div>

            {/* Render only the primary (first) row inline. The second row is rendered inside a Popover triggered by the + button. */}
            {formRows.slice(0,1).map((fr, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-2">
                  <select className="w-full h-10 rounded-md bg-white text-black px-2" value={fr.credit_party} onChange={(e)=>{
                    const v = e.target.value;
                    if (v === ADD_OPTION) { if (formRows.length < 2) addRow(); setPopoverOpen(true); return; }
                    updateRow(idx, 'credit_party', v);
                  }} onClick={()=>{ if (!loadingParties && customers.length===0 && vendors.length===0) loadParties(); }}>
                    <option value="">-- Select --</option>
                    <option value="Cash">Cash</option>
                    {customers.map(c => (<option key={c.id} value={c.organization_name}>{c.organization_name}</option>))}
                    {vendors.map(v => (<option key={v.id} value={v.vendor_name}>{v.vendor_name}</option>))}
                    <option value={ADD_OPTION}>+ Add second row...</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <select className="w-full h-10 rounded-md bg-white text-black px-2" value={fr.debit_party} onChange={(e)=>{
                    const v = e.target.value;
                    if (v === ADD_OPTION) { if (formRows.length < 2) addRow(); setPopoverOpen(true); return; }
                    updateRow(idx, 'debit_party', v);
                  }} onClick={()=>{ if (!loadingParties && customers.length===0 && vendors.length===0) loadParties(); }}>
                    <option value="">-- Select --</option>
                    <option value="Cash">Cash</option>
                    {customers.map(c => (<option key={c.id} value={c.organization_name}>{c.organization_name}</option>))}
                    {vendors.map(v => (<option key={v.id} value={v.vendor_name}>{v.vendor_name}</option>))}
                    <option value={ADD_OPTION}>+ Add second row...</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <select className="w-full h-10 rounded-md bg-white text-black px-2" value={fr.transaction_type} onChange={(e)=>updateRow(idx, 'transaction_type', e.target.value)}>
                    <option>Credit</option>
                    <option>Debit</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Input placeholder="Amount*" className="bg-white text-black" type="number" value={fr.amount} onChange={(e)=>updateRow(idx, 'amount', e.target.value)} />
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <Input placeholder="Description" className="bg-white text-black" value={fr.description} onChange={(e)=>updateRow(idx, 'description', e.target.value)} />
                  <div className="flex items-center gap-2">
                    {/* Popover trigger to show the second row compactly */}
                    <div className="relative">
                      <Button type="button" variant="ghost" onClick={() => { const next = !popoverOpen; setPopoverOpen(next); if (next && formRows.length < 2) addRow(); }}>{popoverOpen ? '×' : '＋'}</Button>
                      {popoverOpen && formRows[1] ? (
                        <div className="absolute right-0 mt-2 z-50 w-72 rounded-md border bg-white p-3 shadow-md text-black">
                          <div className="grid grid-cols-1 gap-2">
                            <select className="w-full h-9 rounded-md px-2" value={formRows[1].credit_party} onChange={(e)=>updateRow(1, 'credit_party', e.target.value)}>
                              <option value="">-- Select --</option>
                              <option value="Cash">Cash</option>
                              {customers.map(c => (<option key={c.id} value={c.organization_name}>{c.organization_name}</option>))}
                              {vendors.map(v => (<option key={v.id} value={v.vendor_name}>{v.vendor_name}</option>))}
                            </select>
                            <select className="w-full h-9 rounded-md px-2" value={formRows[1].debit_party} onChange={(e)=>updateRow(1, 'debit_party', e.target.value)}>
                              <option value="">-- Select --</option>
                              <option value="Cash">Cash</option>
                              {customers.map(c => (<option key={c.id} value={c.organization_name}>{c.organization_name}</option>))}
                              {vendors.map(v => (<option key={v.id} value={v.vendor_name}>{v.vendor_name}</option>))}
                            </select>
                            <select className="w-full h-9 rounded-md px-2" value={formRows[1].transaction_type} onChange={(e)=>updateRow(1, 'transaction_type', e.target.value)}>
                              <option>Credit</option>
                              <option>Debit</option>
                            </select>
                            <Input placeholder="Amount" className="w-full" type="number" value={formRows[1].amount} onChange={(e)=>updateRow(1, 'amount', e.target.value)} />
                            <Input placeholder="Description" className="w-full" value={formRows[1].description} onChange={(e)=>updateRow(1, 'description', e.target.value)} />
                            <div className="flex justify-end"><Button type="button" variant="ghost" onClick={()=>{ removeRow(1); setPopoverOpen(false); }}>− Remove</Button></div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
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
            <div className="col-span-4 flex items-center gap-2"><span>Search From</span><Input type="date" className="w-full" placeholder="Filter Date" /></div>
            <div className="col-span-4 flex items-center gap-2"><span>To</span><Input type="date" className="w-full" placeholder="Filter Date" /></div>
            <div className="col-span-3 flex items-center gap-2"><span>Dealer</span><Input placeholder="Choose" className="w-full" /></div>
            <div className="col-span-1 flex items-center justify-end"><Button className="bg-orange-500 hover:bg-orange-600">Search</Button></div>
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
              {rows.map((r, idx) => (
                <TableRow key={r.id}>
                  <TableCell>{idx+1}</TableCell>
                  <TableCell>{r.transaction_date}</TableCell>
                  <TableCell>{r.party_name}</TableCell>
                  <TableCell>{r.amount}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={()=>handleEdit(r)}>Edit</Button>
                    <Button variant="ghost" size="icon" onClick={()=>handleDelete(r.id)}>Delete</Button>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
