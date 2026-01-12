import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

export default function StockReconciliation() {
  const { toast } = useToast();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [asOf, setAsOf] = useState<string>(today);
  const [productId, setProductId] = useState<string>("ALL");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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
    try {
      setLoading(true);
      setError("");
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('as_of_date', asOf);
      if (productId !== "ALL") params.append('product_id', productId);

      // Fetch stock reconciliation data
      const response = await fetch(`/api/stock-reconciliation?${params.toString()}`);
      const result = await response.json();
      
      if (!result.ok) {
        const errorInfo = handleAPIError(result.error, "Stock Reconciliation");
        setError(errorInfo.description);
        setRows([]);
      } else {
        setRows(result.rows || []);
      }
    } catch (e: any) {
      const errorInfo = handleAPIError(e, "Stock Reconciliation");
      setError(errorInfo.description);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [asOf, productId]);

  useEffect(() => { if (asOf) fetchData(); }, [asOf, fetchData]);

  const exportCsv = () => {
    const header = ["As Of", "Tank", "Product", "System Stock (L)", "Latest Dip (L)", "Variance (L)"];
    const body = rows.map((r) => [asOf, r.tank, r.product, r.systemStock, r.latestDip, r.variance]);
    const csv = [header, ...body].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock-reconciliation_${asOf}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Reconciliation</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              {products.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button onClick={fetchData} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
          <Button variant="secondary" onClick={exportCsv}>Export</Button>
          <Button variant="outline" onClick={logAction}>Log</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>As of {asOf}</CardTitle>
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
                    <TableHead>Tank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>System Stock (L)</TableHead>
                    <TableHead>Latest Dip (L)</TableHead>
                    <TableHead>Variance (L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.tank}</TableCell>
                      <TableCell>{r.product}</TableCell>
                      <TableCell>{Number(r.systemStock).toLocaleString("en-IN")}</TableCell>
                      <TableCell>{Number(r.latestDip).toLocaleString("en-IN")}</TableCell>
                      <TableCell className={r.variance < 0 ? "text-red-600" : r.variance > 0 ? "text-green-700" : ""}>{Number(r.variance).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No rows</TableCell>
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
