import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv, toCsv } from "@/lib/utils";

interface StockRow {
  id: string;
  product_name: string;
  purchased: number;
  sold: number;
  lost: number;
  current_stock: number | null;
  minimum_stock: number | null;
}

export default function LubsStock() {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filtered = useMemo(() =>
    rows.filter(r => r.product_name.toLowerCase().includes(filter.toLowerCase())),
  [rows, filter]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(null);
    // Load base products with resilient select attempts to handle schema differences
    const attempts = [
      "id, product_name, lubricant_name, name, product_code, current_stock, minimum_stock, is_active",
      "id, product_name, lubricant_name, name, product_code, current_stock, minimum_stock",
      "id, lubricant_name, name, product_code, current_stock, minimum_stock",
      "id, name, product_code, current_stock, minimum_stock",
      "id, product_code, current_stock, minimum_stock",
      "id, current_stock, minimum_stock",
    ];

    let lubs: any[] = [];
    let lastErr: any = null;
    
    try {
      const response = await fetch('/api/lubricants');
      const result = await response.json();
      if (result.ok) {
        lubs = result.rows || [];
      } else {
        throw new Error(result.error || 'Failed to fetch lubricants');
      }
    } catch (e: any) {
      lastErr = e;
    }
    if (lastErr) {
      console.error("LubsStock load error:", lastErr);
      setRows([]);
      setLoadError(lastErr.message || String(lastErr));
      setLoading(false);
      return;
    }

    const ids = (lubs||[]).map(l => l.id);

    // Purchased total per product (if we later add item-level, adjust accordingly)
    // For now, purchases table doesn't store lubricant_id, so rely on current_stock and movements
    // Compute sold and lost from movement tables using Express API
    const [salesRes, lossRes] = await Promise.all([
      fetch('/api/lubricant-sales').then(r => r.json()).catch(() => ({ ok: false, rows: [] })),
      fetch('/api/lub-loss').then(r => r.json()).catch(() => ({ ok: false, rows: [] })),
    ]);
    
    const soldMap = new Map<string, number>();
    if (salesRes.ok && salesRes.rows) {
      salesRes.rows.forEach((r: any) => {
        if (ids.includes(r.lubricant_id)) {
          soldMap.set(r.lubricant_id, (soldMap.get(r.lubricant_id) || 0) + Number(r.quantity || 0));
        }
      });
    }
    
    const lossMap = new Map<string, number>();
    if (lossRes.ok && lossRes.rows) {
      lossRes.rows.forEach((r: any) => {
        if (ids.includes(r.lubricant_id)) {
          lossMap.set(r.lubricant_id, (lossMap.get(r.lubricant_id) || 0) + Number(r.quantity || 0));
        }
      });
    }

    // Without reliable purchase quantities per product, we expose purchased as derived: current_stock + sold + lost
    const computed: StockRow[] = (lubs||[]).map((l:any) => {
      const sold = Number(soldMap.get(l.id) || 0);
      const lost = Number(lossMap.get(l.id) || 0);
      const current = l.current_stock == null ? null : Number(l.current_stock);
      // purchased derived from observed movements and current stock (treat null as 0)
      const purchased = (current ?? 0) + sold + lost;
      return {
        id: l.id,
        product_name: l.product_name || l.lubricant_name || l.name || l.product_code || 'Unknown',
        purchased,
        sold,
        lost,
        current_stock: current,
        minimum_stock: l.minimum_stock ?? null,
      };
    });
    setRows(computed);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Lubricants Stock</span></div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Lubs Stock</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <select className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option>All</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={()=>{
                const csv = toCsv(filtered.map((r, i)=> ({
                  SlNo: i+1,
                  Product: r.product_name,
                  Purchased: r.purchased,
                  Sold: r.sold,
                  Loss: r.lost,
                  Stock: r.current_stock ?? '',
                  Minimum: r.minimum_stock ?? '',
                })));
                downloadCsv('lubs-stock.csv', csv);
              }}>CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Input placeholder="Type to filter..." className="w-56" value={filter} onChange={(e)=> setFilter(e.target.value)} />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sl.No</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Purchase</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Loss</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-red-600">Failed to load: {loadError}</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">No data available</TableCell>
                </TableRow>
              ) : filtered.map((r, i)=> {
                const low = r.minimum_stock != null && r.current_stock != null && r.current_stock < r.minimum_stock;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{i+1}</TableCell>
                    <TableCell>{r.product_name}</TableCell>
                    <TableCell>{r.purchased.toFixed(3)}</TableCell>
                    <TableCell>{r.sold.toFixed(3)}</TableCell>
                    <TableCell className={r.lost > 0 ? "text-red-600" : ""}>{r.lost.toFixed(3)}</TableCell>
                    <TableCell>{r.current_stock ?? '-'}</TableCell>
                    <TableCell>{r.minimum_stock ?? '-'}</TableCell>
                    <TableCell>{low ? <span className="text-amber-600">Low</span> : <span className="text-green-600">OK</span>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
