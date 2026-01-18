import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReportDateRange } from "@/hooks/useDateRange";

type Row = {
  date: string;
  employee_id: string;
  name: string;
  role?: string | null;
  entries: number;
  total_quantity: number;
};

export default function AttendanceReport() {
  // Use standardized date range hook with 1 year default
  const { fromDate, toDate, setFromDate, setToDate, isValidRange } = useReportDateRange('LAST_12_MONTHS');
  
  const [employeeId, setEmployeeId] = useState<string>("ALL");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => { fetchEmployees(); }, []);
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    
    // Validate date range
    if (!isValidRange) {
      setErrorMsg("Please select a valid date range");
      setLoading(false);
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (employeeId && employeeId !== 'ALL') params.append('employee_id', employeeId);
      
      const response = await fetch(`/api/sale-entries?${params.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.ok) {
        const data = result.rows || [];
        const map = new Map<string, Row>();
        data.forEach((r: any) => {
          if (!r.employee_id) return;
          const key = `${r.sale_date}|${r.employee_id}`;
          const name = employees.find((e: any) => e.id === r.employee_id)?.employee_name || r.employee_id;
          const current = map.get(key) || { date: r.sale_date, employee_id: r.employee_id, name, entries: 0, total_quantity: 0 } as Row;
          current.entries += 1;
          current.total_quantity += Number(r.quantity || 0);
          map.set(key, current);
        });
        const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
        setRows(arr);
      } else {
        setErrorMsg(result.error || "Failed to load attendance");
        setRows([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load attendance");
      setRows([]);
    }
    
    setLoading(false);
  }, [fromDate, toDate, employeeId, employees, isValidRange]);

  useEffect(() => { 
    if (fromDate && toDate) {
      fetchData();
    }
  }, [fromDate, toDate, employeeId, fetchData]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setEmployees(result.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const totalEmployees = new Set(rows.map(r => r.employee_id)).size;
  const presentCount = totalEmployees; // presence inferred by activity
  const attendanceRate = totalEmployees > 0 ? 100 : 0;

  const exportCsv = () => {
    const header = ["Date", "Employee", "Entries", "Total Qty (L)"];
    const body = rows.map(r => [r.date, r.name, r.entries, r.total_quantity]);
    const csv = [header, ...body].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Attendance Report</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Employees</SelectItem>
              {employees.map((e: any) => (<SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.reduce((s, r) => s + r.entries, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance (inferred from sales activity)</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMsg ? (
            <div className="text-sm text-destructive">{errorMsg}</div>
          ) : loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Total Qty (L)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={`${r.date}-${r.employee_id}-${idx}`}>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.entries}</TableCell>
                    <TableCell>{r.total_quantity.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${r.entries > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.entries > 0 ? "Present" : "Absent"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      <div className="py-4">
                        <p>No attendance data found for the selected date range.</p>
                        <p className="text-sm mt-2">Try selecting a broader date range or check if there are any sale entries with employee data.</p>
                        <p className="text-xs mt-1 text-blue-600">Available data dates: 2024-01-14, 2025-10-11, 2025-10-13</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
