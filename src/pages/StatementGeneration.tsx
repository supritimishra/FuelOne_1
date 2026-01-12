import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ExportButtons from "@/components/ExportButtons";
import { useReportDateRange } from "@/hooks/useDateRange";

type Org = { id: string; organization_name: string };
type Row = {
  id: string;
  statement_no: string;
  statement_date: string;
  organization: string;
  amount: number;
};

export default function StatementGeneration() {
  // Use standardized date range hook with 2 years default to cover all available data
  const { fromDate, toDate, setFromDate, setToDate, isValidRange } = useReportDateRange('LAST_2_YEARS');
  
  const [orgId, setOrgId] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch organizations using backend API
  const { data: orgs = [] } = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const response = await fetch('/api/credit-customers');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch organizations');
      return result.rows || [];
    },
  });

  const fetchStatements = async () => {
    setLoading(true);
    
    // Validate date range
    if (!isValidRange) {
      alert("Please select a valid date range");
      setLoading(false);
      return;
    }
    
    try {
      if (!orgId) {
        alert("Please select an organization");
        setLoading(false);
        return;
      }

      // Fetch credit sales for the selected customer and date range
      const salesParams = new URLSearchParams();
      salesParams.append('customer_id', orgId);
      if (fromDate) salesParams.append('from_date', fromDate);
      if (toDate) salesParams.append('to_date', toDate);

      const salesResponse = await fetch(`/api/credit-sales?${salesParams.toString()}`);
      const salesResult = await salesResponse.json();
      
      if (!salesResult.ok) {
        throw new Error(salesResult.error || 'Failed to fetch credit sales');
      }

      // Fetch recoveries (payments) for the selected customer and date range
      const recoveryParams = new URLSearchParams();
      recoveryParams.append('customer_id', orgId);
      if (fromDate) recoveryParams.append('from_date', fromDate);
      if (toDate) recoveryParams.append('to_date', toDate);

      const recoveryResponse = await fetch(`/api/recoveries?${recoveryParams.toString()}`);
      const recoveryResult = await recoveryResponse.json();
      
      if (!recoveryResult.ok) {
        throw new Error(recoveryResult.error || 'Failed to fetch recoveries');
      }

      const salesData = salesResult.rows || [];
      const recoveryData = recoveryResult.rows || [];

      // Get customer details
      const customer = orgs.find((o) => o.id === orgId);
      const customerName = customer?.organization_name || "Unknown";

      // Combine sales and payments into statement rows
      const mapRows: Row[] = [];
      
      // Add sales
      salesData.forEach((sale: any, idx: number) => {
        mapRows.push({
          id: sale.id,
          statement_no: `SALE-${String(idx + 1).padStart(4, "0")}`,
          statement_date: sale.sale_date,
          organization: customerName,
          amount: sale.total_amount,
        });
      });

      // Add recoveries
      recoveryData.forEach((recovery: any, idx: number) => {
        mapRows.push({
          id: recovery.id,
          statement_no: `PMT-${String(idx + 1).padStart(4, "0")}`,
          statement_date: recovery.recovery_date,
          organization: `${customerName} (Payment)`,
          amount: -recovery.received_amount, // Negative for payment
        });
      });

      // Sort by date
      mapRows.sort((a, b) => new Date(a.statement_date).getTime() - new Date(b.statement_date).getTime());

      setRows(mapRows);
    } catch (error) {
      console.error('Error fetching statements:', error);
      alert('Failed to fetch statement data');
    } finally {
      setLoading(false);
    }
  };

  const exportRows = useMemo(() => rows.map(r => ({
    "ST NO.": r.statement_no,
    "Statement Date": r.statement_date,
    Organization: r.organization,
    "Bill Amount": r.amount,
  })), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Statement Generation</h1>
          <p className="text-muted-foreground">Generate statements by date and organization</p>
        </div>
        <ExportButtons rows={exportRows} filename="statements" title="Statements" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={orgId} onValueChange={(v) => setOrgId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Organization" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.organization_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button onClick={fetchStatements} disabled={loading}>
                {loading ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ST NO.</TableHead>
                <TableHead>Statement Date</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Bill Amount</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.statement_no}</TableCell>
                  <TableCell>{r.statement_date}</TableCell>
                  <TableCell>{r.organization}</TableCell>
                  <TableCell>{r.amount}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">View</Button>
                    <Button size="sm" variant="ghost">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No data</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
