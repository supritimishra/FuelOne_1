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
  const { fromDate, toDate, setFromDate, setToDate, isValidRange } = useReportDateRange('LAST_7_DAYS');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [filterText, setFilterText] = useState("");

  const filteredRows = rows.filter(r => {
    const search = filterText.toLowerCase();
    if (!search) return true;
    return Object.values(r).some(v => String(v).toLowerCase().includes(search));
  });
  const [totals, setTotals] = useState({
    meterSale: 0,
    lubSale: 0,
    recovery: 0,
    cashIn: 0,
    totalCash: 0,
    swipe: 0,
    credit: 0,
    expenses: 0,
    discount: 0,
    recoveryBank: 0,
    shortage: 0,
    handCash: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [shiftId, setShiftId] = useState<string>("ALL");

  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch duty shifts');
      return result.rows || [];
    },
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    if (!isValidRange) {
      setErrorMsg("Please select a valid date range");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      if (shiftId !== "ALL") params.append('shift_id', shiftId);

      const [
        guestRes, creditRes, lubeRes, expRes, recRes, meterRes,
        swipeRes, empCashRes
      ] = await Promise.all([
        fetch(`/api/guest-sales?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/credit-sales?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/lubricant-sales?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/expenses?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/recoveries?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/sale-entries?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/swipe-transactions?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/employee-cash-recovery?${params.toString()}`, { credentials: 'include' })
      ]);

      const [
        guestData, creditData, lubeData, expData, recData, meterData,
        swipeData, empCashData
      ] = await Promise.all([
        guestRes.json(), creditRes.json(), lubeRes.json(), expRes.json(), recRes.json(), meterRes.json(),
        swipeRes.json(), empCashRes.json()
      ]);

      const map: Record<string, any> = {};
      const ensure = (d: string) => (map[d] ||= {
        date: d,
        meterSale: 0,
        lubSale: 0,
        recovery: 0,
        cashIn: 0,
        totalCash: 0,
        swipe: 0,
        credit: 0,
        expenses: 0,
        discount: 0,
        recoveryBank: 0,
        shortage: 0,
        handCash: 0,
        settlement: "Pending" // Placeholder
      });

      // Meter Sale
      (meterData.rows || []).forEach((m: any) => {
        if (shiftId !== "ALL" && m.shift_id !== shiftId) return;
        const r = ensure(m.sale_date);
        r.meterSale += Number(m.net_sale_amount || 0);
      });

      // Lub Sale
      (lubeData.rows || []).forEach((l: any) => {
        const r = ensure(l.sale_date);
        r.lubSale += Number(l.total_amount || 0);
        r.discount += Number(l.discount || 0);
      });

      // Recovery (Cash vs Bank)
      (recData.rows || []).forEach((rv: any) => {
        const r = ensure(rv.recovery_date);
        const amt = Number(rv.received_amount || 0);
        const disc = Number(rv.discount || 0);
        if (rv.payment_mode === "Cash") {
          r.recovery += amt;
        } else {
          r.recoveryBank += amt;
        }
        r.discount += disc;
      });

      // Expenses
      (expData.rows || []).forEach((e: any) => {
        const r = ensure(e.expense_date);
        r.expenses += Number(e.amount || 0);
      });

      // Credit Sales
      (creditData.rows || []).forEach((c: any) => {
        const r = ensure(c.sale_date);
        r.credit += Number(c.total_amount || 0);
      });

      // Swipe
      (swipeData.rows || []).forEach((s: any) => {
        const r = ensure(s.transaction_date);
        r.swipe += Number(s.amount || 0);
      });

      // Shortage
      (empCashData.rows || []).forEach((emp: any) => {
        const r = ensure(emp.recovery_date);
        r.shortage += Number(emp.shortage_amount || 0);
      });

      // Guest Sales (Add to Cash/Swipe/Credit)
      (guestData.rows || []).forEach((g: any) => {
        const r = ensure(g.sale_date);
        const amt = Number(g.total_amount || 0);
        // Note: Guest sales might overlap with Meter sales if not handled carefully.
        // Usually Meter Sale is the MASTER record of fuel dispensed. Guest Sale is just customer tagging.
        // So we don't add Guest Sale to "Meter Sale" again. 
        // But if Guest Sale was "Swipe", we might want to track that? 
        // For now, let's assume "Swipe" table tracks all card swipes.
      });

      // Calculate Computed Columns per day
      Object.values(map).forEach(r => {
        // Total Cash = (Meter Sale - Credit - Swipe) + Recovery + Lub Sale (if cash)
        // This is tricky without knowing exact payment split of Meter/Lub.
        // PROXY: Total Cash = Hand Cash + Expenses ? 
        // No.
        // Let's approximated: 
        // Cash In flow = (Meter Sale + Lub Sale - Credit - Swipe) + Recovery(Cash).

        // Let's try: 
        // We don't have exact "Cash Sale" field in Meter Sale (Sale Entry).
        // Is there a better way? 
        // Maybe "Cash In" is just the cash collected? 
        // Let's assume:
        // Cash In = (Meter Sale + Lub Sale) - (Credit + Swipe) + Recovery(Cash).
        const salesCash = (r.meterSale + r.lubSale) - (r.credit + r.swipe);
        // Validating non-negative? 
        const actualSalesCash = Math.max(0, salesCash);

        r.cashIn = actualSalesCash; // Cash generated from operations
        r.totalCash = r.cashIn + r.recovery; // Total liquid cash
        r.handCash = r.totalCash - r.expenses;
      });

      const arr = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
      setRows(arr);

      // Aggregates
      const t = arr.reduce((acc, r: any) => ({
        meterSale: acc.meterSale + r.meterSale,
        lubSale: acc.lubSale + r.lubSale,
        recovery: acc.recovery + r.recovery,
        cashIn: acc.cashIn + r.cashIn,
        totalCash: acc.totalCash + r.totalCash,
        swipe: acc.swipe + r.swipe,
        credit: acc.credit + r.credit,
        expenses: acc.expenses + r.expenses,
        discount: acc.discount + r.discount,
        recoveryBank: acc.recoveryBank + r.recoveryBank,
        shortage: acc.shortage + r.shortage,
        handCash: acc.handCash + r.handCash,
      }), {
        meterSale: 0, lubSale: 0, recovery: 0, cashIn: 0, totalCash: 0,
        swipe: 0, credit: 0, expenses: 0, discount: 0, recoveryBank: 0,
        shortage: 0, handCash: 0
      });
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
      <h1 className="text-3xl font-bold">Daily Report</h1>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Show</span>
              <Select defaultValue="All">
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">From Date</span>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[150px]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">To Date</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[150px]" />
              </div>
              <Button onClick={fetchReport} disabled={loading}>{loading ? "Searching..." : "Search"}</Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter:</span>
              <Input
                placeholder="Type to filter..."
                className="w-[200px]"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Meter Sale(₹)</TableHead>
                  <TableHead className="text-right">Lub Sale(₹)</TableHead>
                  <TableHead className="text-right">Recovery(₹)</TableHead>
                  <TableHead className="text-right">Cash In(₹)</TableHead>
                  <TableHead className="text-right">Total Cash(₹)</TableHead>
                  <TableHead className="text-right">Swipe(₹)</TableHead>
                  <TableHead className="text-right">Credit(₹)</TableHead>
                  <TableHead className="text-right">Expenses(₹)</TableHead>
                  <TableHead className="text-right">Discount(₹)</TableHead>
                  <TableHead className="text-right">Recovery Bank(₹)</TableHead>
                  <TableHead className="text-right">Shortage(₹)</TableHead>
                  <TableHead className="text-right">Hand Cash(₹)</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead>Pictures</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={15} className="text-center h-24 text-muted-foreground">No data available in table</TableCell></TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.date}>
                      <TableCell className="font-medium whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{r.meterSale.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.lubSale.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{r.recovery.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.cashIn.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-bold">{r.totalCash.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.swipe.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.credit.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-red-600">{r.expenses.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.discount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">{r.recoveryBank.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-red-500">{r.shortage.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-bold text-blue-700">{r.handCash.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{r.settlement}</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ))
                )}
                {rows.length > 0 && (
                  <TableRow className="bg-muted font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totals.meterSale.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.lubSale.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right text-green-700">{totals.recovery.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.cashIn.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.totalCash.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.swipe.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.credit.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right text-red-700">{totals.expenses.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.discount.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{totals.recoveryBank.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right text-red-700">{totals.shortage.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right text-blue-800">{totals.handCash.toLocaleString("en-IN")}</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
