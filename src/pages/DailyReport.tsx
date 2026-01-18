import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Banknote, CreditCard, IndianRupee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";
import { useReportDateRange } from "@/hooks/useDateRange";

export default function DailyReport() {
  // Use standardized date range hook with 7 days default for daily reports
  const { fromDate, toDate, setFromDate, setToDate, isValidRange } = useReportDateRange('LAST_7_DAYS');
  
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    fuelSale: 0,
    lubricantSale: 0,
    cash: 0,
    card: 0,
    upi: 0,
    credit: 0,
    expenses: 0,
    recovery: 0,
    meterSale: 0,
    denominations: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [shiftId, setShiftId] = useState<string>("ALL");

  // Fetch shifts data using backend API
  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch duty shifts');
      return result.rows || [];
    },
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    
    // Validate date range
    if (!isValidRange) {
      setErrorMsg("Please select a valid date range");
      setLoading(false);
      return;
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      if (shiftId !== "ALL") params.append('shift_id', shiftId);

      // Get guest sales split by payment
      const guestResponse = await fetch(`/api/guest-sales?${params.toString()}`, {
        credentials: 'include'
      });
      const guestResult = await guestResponse.json();
      const guestSales = guestResult.ok ? guestResult.rows || [] : [];

      const creditResponse = await fetch(`/api/credit-sales?${params.toString()}`, {
        credentials: 'include'
      });
      const creditResult = await creditResponse.json();
      const creditSales = creditResult.ok ? creditResult.rows || [] : [];

      const lubeResponse = await fetch(`/api/lubricant-sales?${params.toString()}`, {
        credentials: 'include'
      });
      const lubeResult = await lubeResponse.json();
      const lubeSales = lubeResult.ok ? lubeResult.rows || [] : [];

      const expensesResponse = await fetch(`/api/expenses?${params.toString()}`, {
        credentials: 'include'
      });
      const expensesResult = await expensesResponse.json();
      const expenses = expensesResult.ok ? expensesResult.rows || [] : [];

      const recoveryResponse = await fetch(`/api/recoveries?${params.toString()}`, {
        credentials: 'include'
      });
      const recoveryResult = await recoveryResponse.json();
      const rec = recoveryResult.ok ? recoveryResult.rows || [] : [];

      // Meter sales (from sale_entries), optional shift filter
      const meterResponse = await fetch(`/api/sale-entries?${params.toString()}`, {
        credentials: 'include'
      });
      const meterResult = await meterResponse.json();
      const meter = meterResult.ok ? meterResult.rows || [] : [];

      // Denominations total (cash count)
      const denomsResponse = await fetch(`/api/denominations?${params.toString()}`, {
        credentials: 'include'
      });
      const denomsResult = await denomsResponse.json();
      const denoms = denomsResult.ok ? denomsResult.rows || [] : [];

      // Aggregate by day
      const map: Record<string, any> = {};
      const ensure = (d: string) => (map[d] ||= { date: d, cash: 0, card: 0, upi: 0, fuelSale: 0, lubeSale: 0, credit: 0, expenses: 0, recovery: 0 });

      guestSales.forEach((g) => {
        const d = g.sale_date as string;
        const r = ensure(d);
        const amt = Number(g.total_amount || 0);
        if (g.payment_mode === "Cash") { r.cash += amt; }
        else if (g.payment_mode === "Card") { r.card += amt; }
        else if (g.payment_mode === "UPI") { r.upi += amt; }
        r.fuelSale += amt;
      });

      creditSales.forEach((c) => {
      const d = c.sale_date as string;
      const r = ensure(d);
      const amt = Number(c.total_amount || 0);
      r.credit += amt;
    });

    (lubeSales || []).forEach((l) => {
      const d = l.sale_date as string;
      const r = ensure(d);
      const amt = Number(l.total_amount || 0);
      r.lubeSale += amt;
    });

    (expenses || []).forEach((e) => {
      const d = e.expense_date as string;
      const r = ensure(d);
      const amt = Number(e.amount || 0);
      r.expenses += amt;
    });

    (rec || []).forEach((rv) => {
      const d = rv.recovery_date as string;
      const r = ensure(d);
      const amt = Number(rv.received_amount || 0);
      r.recovery += amt;
    });

    // meter sale aggregate
    (meter || []).forEach((m) => {
      if (shiftId !== "ALL" && m.shift_id !== shiftId) return;
      const d = m.sale_date as string;
      const r = ensure(d);
      const amt = Number((m as any).net_sale_amount || 0);
      r.meterSale = (r.meterSale || 0) + amt;
    });

    const arr = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    setRows(arr);

    const denomTotal = (denoms || []).reduce((s, d: any) => {
      const dateStr: string = (d.denomination_date || (d.created_at ? String(d.created_at).slice(0, 10) : null));
      if (!dateStr) return s;
      if (dateStr >= fromDate && dateStr <= toDate) {
        return s + Number(d.total_amount || 0);
      }
      return s;
    }, 0);

    const t = arr.reduce((acc, r: any) => ({
      fuelSale: acc.fuelSale + r.fuelSale,
      lubricantSale: acc.lubricantSale + r.lubeSale,
      cash: acc.cash + r.cash,
      card: acc.card + r.card,
      upi: acc.upi + r.upi,
      credit: acc.credit + r.credit,
      expenses: acc.expenses + r.expenses,
      recovery: acc.recovery + r.recovery,
      meterSale: acc.meterSale + (r.meterSale || 0),
      denominations: denomTotal,
    }), { fuelSale: 0, lubricantSale: 0, cash: 0, card: 0, upi: 0, credit: 0, expenses: 0, recovery: 0, meterSale: 0, denominations: 0 });
    setTotals(t);
    setLoading(false);
  } catch (e: any) {
    const errorInfo = handleAPIError(e, "Daily Report");
    setErrorMsg(errorInfo.description);
    setRows([]);
    setLoading(false);
  }
}, [fromDate, toDate, shiftId, isValidRange]);

useEffect(() => { if (fromDate && toDate) fetchReport(); }, [fromDate, toDate, fetchReport]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Daily Report</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={shiftId} onValueChange={setShiftId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Shifts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Shifts</SelectItem>
              {shifts.map((s) => (<SelectItem key={s.id} value={s.id}>{s.shift_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button onClick={fetchReport} disabled={loading}>{loading ? "Loading..." : "Search"}</Button>
          <Button variant="secondary" onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      {errorMsg && (
        <div className="text-sm text-destructive">{errorMsg}</div>
      )}

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Fuel Sale</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">₹{totals.fuelSale.toLocaleString("en-IN")}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Lubricant Sale</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">₹{totals.lubricantSale.toLocaleString("en-IN")}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Cash</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">₹{totals.cash.toLocaleString("en-IN")}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Digital (Card+UPI)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">₹{(totals.card + totals.upi).toLocaleString("en-IN")}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">Meter Sale</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">₹{totals.meterSale.toLocaleString("en-IN")}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">Denominations</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">₹{totals.denominations.toLocaleString("en-IN")}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Summary Table</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No data in the selected range.</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fuel Sale</TableHead>
                    <TableHead>Lube Sale</TableHead>
                    <TableHead>Cash</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>UPI</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Recovery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.date}>
                      <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell>₹{r.fuelSale.toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{r.lubeSale.toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{r.cash.toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{r.card.toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{r.upi.toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{r.credit.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-red-600">₹{r.expenses.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-green-700">₹{r.recovery.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
