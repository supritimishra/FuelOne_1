import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

export default function VendorPayments() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [vendorId, setVendorId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); 
      setError("");
      
      // Fetch vendor invoices using backend API
      const invoiceParams = new URLSearchParams();
      invoiceParams.append('from_date', fromDate);
      invoiceParams.append('to_date', toDate);
      if (vendorId !== "ALL") invoiceParams.append('vendor_id', vendorId);
      
      const invoiceResponse = await fetch(`/api/vendor-invoices?${invoiceParams.toString()}`);
      const invoiceResult = await invoiceResponse.json();
      if (!invoiceResult.ok) throw new Error(invoiceResult.error || 'Failed to fetch vendor invoices');
      setInvoices(invoiceResult.rows || []);

      // Fetch vendor transactions using backend API
      const transactionParams = new URLSearchParams();
      transactionParams.append('from_date', fromDate);
      transactionParams.append('to_date', toDate);
      transactionParams.append('transaction_type', 'Debit');
      if (vendorId !== "ALL") transactionParams.append('vendor_id', vendorId);
      
      const transactionResponse = await fetch(`/api/vendor-transactions?${transactionParams.toString()}`);
      const transactionResult = await transactionResponse.json();
      if (!transactionResult.ok) throw new Error(transactionResult.error || 'Failed to fetch vendor transactions');
      setPayments(transactionResult.rows || []);
      
    } catch (err: any) {
      const errorInfo = handleAPIError(err, "Vendor Payments");
      setError(errorInfo.description);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, vendorId]);

  useEffect(() => { if (fromDate && toDate) fetchData(); }, [fromDate, toDate, vendorId, fetchData]);

  const totals = invoices.reduce((acc, r:any) => {
    acc.count += 1;
    acc.amount += Number(r.amount || 0);
    acc.gst += Number(r.gst_amount || 0);
    acc.total += Number(r.total_amount || 0);
    if ((r.payment_status || '').toLowerCase() === 'paid') acc.paid += Number(r.total_amount || 0);
    if ((r.payment_status || '').toLowerCase() === 'pending') acc.pending += Number(r.total_amount || 0);
    if ((r.payment_status || '').toLowerCase() === 'partial') acc.partial += Number(r.total_amount || 0);
    return acc;
  }, { count: 0, amount: 0, gst: 0, total: 0, paid: 0, pending: 0, partial: 0 });

  const paidOut = payments.reduce((s, p:any) => s + Number(p.amount || 0), 0);

  const exportCsv = () => {
    const header = ["From", "To", "Vendor", "InvCount", "BaseAmount", "GST", "Total", "Paid", "Partial", "Pending", "PaidOut"]; 
    const vendorName = vendorId === 'ALL' ? 'ALL' : (vendors.find(v=>v.id===vendorId)?.vendor_name || vendorId);
    const row = [fromDate, toDate, vendorName, totals.count, totals.amount, totals.gst, totals.total, totals.paid, totals.partial, totals.pending, paidOut];
    const csv = [header.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `vendor-payments_${fromDate}_to_${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Vendor Payments Summary</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Vendors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Vendors</SelectItem>
              {vendors.map((v:any) => (<SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={exportCsv}>Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader><CardTitle>Invoices</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totals.count}</CardContent></Card>
        <Card><CardHeader><CardTitle>Base Amount</CardTitle></CardHeader><CardContent className="text-2xl font-bold">₹{totals.amount.toLocaleString('en-IN')}</CardContent></Card>
        <Card><CardHeader><CardTitle>GST</CardTitle></CardHeader><CardContent className="text-2xl font-bold">₹{totals.gst.toLocaleString('en-IN')}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">₹{totals.total.toLocaleString('en-IN')}</CardContent></Card>
        <Card><CardHeader><CardTitle>Paid Out</CardTitle></CardHeader><CardContent className="text-2xl font-bold">₹{paidOut.toLocaleString('en-IN')}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((r:any, idx:number) => (
                    <TableRow key={idx}>
                      <TableCell>{r.invoice_date}</TableCell>
                      <TableCell>{r.vendors?.vendor_name || '-'}</TableCell>
                      <TableCell>{r.invoice_number}</TableCell>
                      <TableCell>{r.invoice_type}</TableCell>
                      <TableCell>₹{Number(r.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{r.payment_status}</TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No invoices</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p:any, idx:number) => (
                    <TableRow key={idx}>
                      <TableCell>{p.transaction_date}</TableCell>
                      <TableCell>{p.vendors?.vendor_name || '-'}</TableCell>
                      <TableCell>{p.payment_mode}</TableCell>
                      <TableCell>₹{Number(p.amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{p.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No payments</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
