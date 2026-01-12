import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";
import { useReportDateRange } from "@/hooks/useDateRange";

export default function EmployeePerformance() {
  // Use standardized date range hook with 30 days default for performance reports
  const { fromDate, toDate, setFromDate, setToDate, isValidRange } = useReportDateRange('LAST_30_DAYS');
  
  const [employeeId, setEmployeeId] = useState<string>("ALL");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch employees data using backend API
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); 
      setError("");
      
      // Validate date range
      if (!isValidRange) {
        setError("Please select a valid date range");
        setLoading(false);
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      if (employeeId !== "ALL") params.append('employee_id', employeeId);

      // Fetch meter sales from sale_entries
      const meterResponse = await fetch(`/api/sale-entries?${params.toString()}`, {
        credentials: 'include'
      });
      const meterResult = await meterResponse.json();
      const meterSales = meterResult.ok ? meterResult.rows || [] : [];

      // Fetch credit sales
      const creditResponse = await fetch(`/api/credit-sales?${params.toString()}`);
      const creditResult = await creditResponse.json();
      const creditSales = creditResult.ok ? creditResult.rows || [] : [];

      // Fetch lubricant sales
      const lubeResponse = await fetch(`/api/lubricant-sales?${params.toString()}`);
      const lubeResult = await lubeResponse.json();
      const lubeSales = lubeResult.ok ? lubeResult.rows || [] : [];

      // Aggregate by employee
      const map = new Map<string, any>();
      const nameOf = (id: string) => employees.find((e:any)=>e.id===id)?.employee_name || id || "Unknown";

      meterSales.forEach((m:any) => {
        if (!m.employee_id) return;
        const e = map.get(m.employee_id) || { employee_id: m.employee_id, name: nameOf(m.employee_id), meter_amount: 0, meter_qty: 0, credit_amount: 0, lube_amount: 0 };
        e.meter_amount += Number(m.net_sale_amount || 0);
        e.meter_qty += Number(m.quantity || 0);
        map.set(m.employee_id, e);
      });

      creditSales.forEach((c:any) => {
        if (!c.employee_id) return;
        const e = map.get(c.employee_id) || { employee_id: c.employee_id, name: nameOf(c.employee_id), meter_amount: 0, meter_qty: 0, credit_amount: 0, lube_amount: 0 };
        e.credit_amount += Number(c.total_amount || 0);
        map.set(c.employee_id, e);
      });

      lubeSales.forEach((l:any) => {
        if (!l.employee_id) return;
        const e = map.get(l.employee_id) || { employee_id: l.employee_id, name: nameOf(l.employee_id), meter_amount: 0, meter_qty: 0, credit_amount: 0, lube_amount: 0 };
        e.lube_amount += Number(l.total_amount || 0);
        map.set(l.employee_id, e);
      });

      const arr = Array.from(map.values()).map((r:any) => ({
        ...r,
        total_amount: Number(r.meter_amount) + Number(r.credit_amount) + Number(r.lube_amount),
      })).sort((a,b)=>a.name.localeCompare(b.name));
      setRows(arr);
    } catch (e:any) {
      const errorInfo = handleAPIError(e, "Employee Performance");
      setError(errorInfo.description);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, employeeId, employees, isValidRange]);

  useEffect(() => { if (fromDate && toDate) fetchData();   }, [fromDate, toDate, fetchData]);

  const exportCsv = () => {
    const header = ["From", "To", "Employee", "Meter Qty(L)", "Meter Amount", "Credit Amount", "Lube Amount", "Total Amount"];
    const body = rows.map((r:any) => [fromDate, toDate, r.name, r.meter_qty, r.meter_amount, r.credit_amount, r.lube_amount, r.total_amount]);
    const csv = [header, ...body].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `employee-performance_${fromDate}_to_${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Employee Performance</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Employees</SelectItem>
              {employees.map((e:any) => (<SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={exportCsv}>Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Meter Qty (L)</TableHead>
                    <TableHead>Meter Amount</TableHead>
                    <TableHead>Credit Amount</TableHead>
                    <TableHead>Lube Amount</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r:any) => (
                    <TableRow key={r.employee_id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{Number(r.meter_qty || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{Number(r.meter_amount || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{Number(r.credit_amount || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{Number(r.lube_amount || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="font-semibold">₹{Number(r.total_amount || 0).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No records</TableCell>
                    </TableRow>
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
