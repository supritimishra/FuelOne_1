import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export default function StockReport() {
  const { toast } = useToast();
  const [chooseDate, setChooseDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [endDateTime, setEndDateTime] = useState<string>(new Date().toISOString().slice(0,16));
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [product, setProduct] = useState("");

  // Fetch stock data
  const { data: stockData, refetch: refetchStock } = useQuery({
    queryKey: ["/api/opening-stock", fromDate, toDate, product],
    queryFn: async () => {
      try {
        const response = await fetch('/api/opening-stock', { credentials: 'include' });
        const text = await response.text();
        let result: any = {};
        try { result = JSON.parse(text || '{}'); } catch {}
        if (!response.ok || !result?.ok) return [] as any[];
      return result.rows || [];
      } catch {
        return [] as any[];
      }
    },
  });

  const rows = (stockData as any[]) || [];
  const [filter, setFilter] = useState("");
  const filteredRows = useMemo(()=>{
    if (!filter) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r:any)=> String(r.product||r.product_name||'').toLowerCase().includes(q) || String(r.created_at||r.stock_date||'').toLowerCase().includes(q));
  }, [rows, filter]);

  const handleShowTanks = () => {
    refetchStock();
  };

  const handleSearch = () => {
    refetchStock();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Stock Report</span></div>

      {/* Header with right actions */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Stock Report</CardTitle>
            <div className="flex items-center gap-2">
              <Link to="/day-opening-stock"><Button variant="outline" className="bg-white text-black hover:bg-white">Stock Entry +</Button></Link>
              <Link to="/product-stock/stock-variation"><Button variant="outline" className="bg-white text-black hover:bg-white">Stock Variation</Button></Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From / To / Product / Search */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4 flex items-center gap-3">
              <span className="text-white">From Date</span>
              <Input type="date" value={fromDate} onChange={(e)=> setFromDate(e.target.value)} className="bg-white text-black" />
            </div>
            <div className="col-span-4 flex items-center gap-3">
              <span className="text-white">To Date</span>
              <Input type="date" value={toDate} onChange={(e)=> setToDate(e.target.value)} className="bg-white text-black" />
            </div>
            <div className="col-span-3 flex items-center gap-3">
              <span className="text-white">Product</span>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select Product"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hsd">High Speed Desi</SelectItem>
                  <SelectItem value="ms">Motor Spirit</SelectItem>
                  <SelectItem value="xp">Extra Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Button className="bg-orange-500 hover:bg-orange-600 w-full" onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate search row removed */}

      {/* Table Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span>Show:</span>
                <Select>
                  <SelectTrigger className="w-20"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
              <div className="flex items-center gap-2 ml-4">
                <span>Filter:</span>
                <Input placeholder="Type to filter..." className="w-56" value={filter} onChange={(e)=> setFilter(e.target.value)} />
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><input type="checkbox" /></TableHead>
                <TableHead>S.No</TableHead>
                <TableHead>Tank</TableHead>
                <TableHead>Variation (Lts)</TableHead>
                <TableHead>Variation (Amt)</TableHead>
                <TableHead>Open Stock</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Closing Stock</TableHead>
                <TableHead>Test Qty</TableHead>
                <TableHead>Shortage</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground">
                    No stock data available
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r:any, idx:number)=> (
                  <TableRow key={r.id || idx}>
                    <TableCell><input type="checkbox" /></TableCell>
                    <TableCell>{idx+1}</TableCell>
                    <TableCell>{r.tank_name || r.product || r.product_name || '-'}</TableCell>
                    <TableCell className={Number(r.variation_lts||0) < 0 ? 'text-red-600' : ''}>{Number(r.variation_lts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={Number(r.variation_amount||0) < 0 ? 'text-red-600' : ''}>₹{Number(r.variation_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(r.opening_stock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(r.receipt_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-blue-600">{Number(r.sale_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-red-600">{Number(r.closing_stock || r.current_closing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(r.test_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={Number(r.shortage||0) !== 0 ? 'text-red-600' : ''}>{Number(r.shortage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.created_at ? `Created: ${new Date(r.created_at).toLocaleString('en-IN')}` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">Showing {filteredRows.length > 0 ? `1 to ${filteredRows.length} of ${filteredRows.length}` : '0 of 0'} entries</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>←</Button>
              <Button variant="outline" size="sm" className="bg-blue-500 text-white">1</Button>
              <Button variant="outline" size="sm" disabled>→</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}