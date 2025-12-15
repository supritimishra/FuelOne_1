import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingDown, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

type Row = {
  date: string;
  product_name: string;
  quantity_l: number;
  notes?: string | null;
};

export default function PurchaseReport() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Fetch products data using backend API
  const { data: products = [] } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      if (productId !== "ALL") params.append('product_id', productId);
      if (search.trim()) params.append('search', search.trim());

      // Fetch purchase data
      const response = await fetch(`/api/purchase-reports?${params.toString()}`);
      const result = await response.json();
      
      if (!result.ok) {
        const errorInfo = handleAPIError(result.error, "Purchase Report");
        setErrorMsg(errorInfo.description);
        setRows([]);
      } else {
        setRows(result.rows || []);
      }
    } catch (e: any) {
      const errorInfo = handleAPIError(e, "Purchase Report");
      setErrorMsg(errorInfo.description);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, productId, search]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchData();
    }
  }, [fromDate, toDate, fetchData]);

  const totalQuantity = rows.reduce((s, r) => s + r.quantity_l, 0);

  const exportCsv = () => {
    const header = ["Date", "Product", "Quantity(L)", "Notes"];
    const body = rows.map(r => [
      r.date,
      r.product_name,
      r.quantity_l,
      (r.notes || "").replace(/,/g, " "),
    ]);
    const csv = [header, ...body].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-report_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Purchase Report</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              {products.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} className="w-[220px]" />
          <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity (L)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Qty per Delivery</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length ? Math.round(totalQuantity / rows.length).toLocaleString("en-IN") : 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMsg ? (
            <div className="text-sm text-destructive">{errorMsg}</div>
          ) : loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity (L)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.date}-${i}`}>
                      <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{r.product_name}</TableCell>
                      <TableCell>{r.quantity_l.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">{r.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell>
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
