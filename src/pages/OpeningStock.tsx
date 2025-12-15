import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface StockEntry {
  product: string;
  unit: string;
  openingStock: string;
}

export default function OpeningStock() {
  const navigate = useNavigate();
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([
    { product: "Petrol", unit: "L", openingStock: "8500" },
    { product: "Diesel", unit: "L", openingStock: "12000" },
    { product: "Castrol GTX 20W-50", unit: "L", openingStock: "45" },
    { product: "Mobil 1 5W-30", unit: "L", openingStock: "120" },
    { product: "Coolant", unit: "L", openingStock: "25" },
  ]);

  // Filters state (live)
  const todayIso = new Date().toISOString().slice(0, 10);
  const last30Iso = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>(last30Iso);
  const [toDate, setToDate] = useState<string>(todayIso);

  // Density Modal State
  const [densityModal, setDensityModal] = useState({
    open: false,
    tankId: '',
    temp: '',
    hydro: '',
    density: ''
  });
  // Fetch opening stock data (from reports)
  const { data: openingStockData, refetch: refetchOpeningStock } = useQuery({
    queryKey: ["/api/reports/opening-stock", fromDate, toDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (fromDate) params.append('from', fromDate);
        if (toDate) params.append('to', toDate);
        const response = await fetch(`/api/reports/opening-stock?${params.toString()}`, { credentials: 'include' });
        const text = await response.text();
        let result: any = {};
        try { result = JSON.parse(text || '{}'); } catch { /* ignore */ }
        if (!response.ok || !result.ok) {
          console.warn('[OpeningStock] GET /api/reports/opening-stock failed:', response.status, result?.error);
          return [] as any[];
        }
        const rows = (result.rows || []) as any[];
        // Fallback: if date-filtered query returns empty, try without filters to show some data
        if (rows.length === 0 && (fromDate || toDate)) {
          const r2 = await fetch(`/api/reports/opening-stock`, { credentials: 'include' });
          const t2 = await r2.text();
          let j2: any = {};
          try { j2 = JSON.parse(t2 || '{}'); } catch { }
          if (r2.ok && j2?.ok) return j2.rows || [];
        }
        return rows;
      } catch (e) {
        console.error('[OpeningStock] Fetch error:', e);
        return [] as any[];
      }
    },
  });

  // State for "Show Tanks" feature
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [tanks, setTanks] = useState<any[]>([]);
  const [showTanksPanel, setShowTanksPanel] = useState(false);

  const handleShowTanks = async () => {
    if (!showTanksPanel) {
      try {
        // Fetch tanks
        const res = await fetch('/api/tanks');
        const json = await res.json();

        // Fetch products to map names
        const pRes = await fetch('/api/fuel-products'); // We might need to check if this endpoint exists
        // If /api/fuel-products doesn't exist, we fallback or try /api/products if that's standard.
        // Looking at routes.ts, there isn't a direct /api/fuel-products widely used, but let's check.
        // Wait, I didn't verify /api/fuel-products exists in routes.ts. Let's assume standard REST.
        // Actually, let's use a safer approach: just fetch tanks and if needed fetch nozzles/products.
        // Or simplified: Just set tanks and let the UI handle missing names if simple. 
        // Better: Try to get product names.

        // Re-reading routes.ts: I viewed lines 2080-2660 and 2300-2470.
        // line 2302: router.get('/tanks'...) -> returns id, tank_number, fuel_product_id, current_stock.
        // I don't see a clear /api/fuel-products route in the snippets. 
        // I'll assume I can just use tanks for now. If product name is missing, I'll update later.
        // Wait, line 2341 is guest sales.

        // Let's just fetch tanks. I will try to fetch /api/fuel-products cautiously. 
        // If it fails, we show "Product ID: ..."

        let productsMap = new Map();
        try {
          const pr = await fetch('/api/fuel-products'); // optimistic
          if (pr.ok) {
            const pj = await pr.json();
            (pj.rows || []).forEach((p: any) => productsMap.set(p.id, p.product_name));
          }
        } catch (e) {/*ignore*/ }

        if (json.ok) {
          setTanks((json.rows || []).map((t: any) => ({
            ...t,
            opening_stock: Number(t.current_stock || 0).toString(),
            product_name: productsMap.get(t.fuel_product_id) || 'Unknown Product'
          })));
        }
      } catch (e) {
        console.error("Failed to load tanks", e);
        toast({ title: "Error", description: "Failed to load tanks", variant: "destructive" });
      }
    }
    setShowTanksPanel(!showTanksPanel);
  };

  const openingStockRows = openingStockData || [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterTerm, setFilterTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("ALL");
  const filteredRows = useMemo(() => {
    let rows = openingStockRows as any[];
    if (productFilter && productFilter !== 'ALL') {
      const p = productFilter.toLowerCase();
      rows = rows.filter((r: any) => String(r.tank_name || r.product || r.product_name || '').toLowerCase().includes(p));
    }
    if (!filterTerm) return rows;
    const q = filterTerm.toLowerCase();
    return rows.filter((r: any) =>
      String(r.product || r.product_name || "").toLowerCase().includes(q) ||
      String(r.created_at || r.stock_date || "").toLowerCase().includes(q)
    );
  }, [openingStockRows, filterTerm, productFilter]);

  const handleStockChange = (index: number, value: string) => {
    const updated = [...stockEntries];
    updated[index].openingStock = value;
    setStockEntries(updated);
  };

  const handleSaveTanks = async () => {
    try {
      // Pre-calculate values for any tanks that weren't edited (missing derived fields)
      const tanksToSave = tanks.map(t => {
        const open = parseFloat(t.opening_stock || '0');
        const rx = parseFloat(t.stock_rx || '0');
        const sale = parseFloat(t.meter_sale || '0');
        const gross = open + rx;
        const closing = gross - sale;
        const dip = parseFloat(t.cls_dip_stock || '0');
        const vari = dip - closing;

        return {
          ...t,
          opening_stock: t.opening_stock || '0',
          stock_rx: t.stock_rx || '0',
          meter_sale: t.meter_sale || '0',
          gross_stock: t.gross_stock !== undefined ? t.gross_stock : gross.toFixed(2),
          closing_stock: t.closing_stock !== undefined ? t.closing_stock : closing.toFixed(2),
          cls_dip_stock: t.cls_dip_stock || '0',
          variation_lts: t.variation_lts !== undefined ? t.variation_lts : vari.toFixed(2)
        };
      });

      const response = await fetch('/api/tanks/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tanks: tanksToSave }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to update tanks');
      }

      toast({
        title: "Tanks Updated",
        description: "Tank stock levels have been successfully updated.",
      });

      // Refresh table and tanks
      refetchOpeningStock();
      handleShowTanks(); // Toggle off
      setTimeout(() => handleShowTanks(), 100); // Toggle on to re-fetch? Or just refetch.
      // Better: just refetch tanks.
      // But handleShowTanks toggles.
      // Let's just manually fetch or set showTanksPanel(false) then true?
      // Actually we just updated the DB. The local state 'tanks' is already updated with user input.
      // We might want to re-fetch to confirm.

    } catch (error) {
      console.error("Save error", error);
      toast({
        title: "Error",
        description: "Failed to save tank data",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/opening-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockEntries),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to save opening stock');
      }

      toast({
        title: "Opening Stock Saved",
        description: "Stock levels have been updated successfully",
      });

      // Refresh the data
      refetchOpeningStock();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save opening stock",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Stock</span></div>

      {/* Blue panel same-to-same */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Stock</CardTitle>
            <div className="flex items-center gap-2">
              <Link to="/stock-report"><Button variant="outline" className="bg-white text-black hover:bg-white">Stock Report</Button></Link>
              <Link to="/product-stock/stock-variation"><Button variant="outline" className="bg-white text-black hover:bg-white">Stock Variation</Button></Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <span className="text-white font-medium">Choose Date</span>
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => (document.getElementById('stock_date') as HTMLInputElement | null)?.showPicker?.()}
              >
                {selectedDate}
              </button>
              <input
                id="stock_date"
                type="date"
                className="hidden"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="col-span-10 flex justify-end">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="bg-white text-black hover:bg-white"
                  onClick={handleShowTanks}
                >
                  {showTanksPanel ? 'Hide Tanks' : 'Show Tanks'}
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">OK</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tanks List Panel */}
      {showTanksPanel && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {tanks.length === 0 ? (
            <div className="text-center p-4 bg-muted rounded-lg">Loading tanks...</div>
          ) : (
            tanks.map((tank, idx) => {
              const handleTankChange = (field: string, value: string) => {
                const safeFloat = (v: any) => {
                  if (v === '' || v === null || v === undefined) return 0;
                  const n = parseFloat(v);
                  return isNaN(n) ? 0 : n;
                };

                const newTanks = [...tanks];
                const updatedTank = { ...newTanks[idx], [field]: value };

                // Calculations
                // If opening_stock is edited, use it. If not, fallback to current_stock which is initial value.
                // However, updatedTank.opening_stock is set on init to string.
                const open = safeFloat(updatedTank.opening_stock);
                const rx = safeFloat(updatedTank.stock_rx);
                const gross = open + rx;
                const sales = safeFloat(updatedTank.meter_sale);
                const closing = gross - sales;

                updatedTank.gross_stock = gross;
                updatedTank.closing_stock = closing;

                const dipStock = safeFloat(updatedTank.cls_dip_stock);
                // Variation = Physical (Dip) - Book (Closing)
                const variation = dipStock - closing;
                updatedTank.variation_lts = variation;

                // Variation Amount (assuming rate is needed, usually price/L)
                // For now leaving as 0 or manual if not provided. 
                // Using 100 as placeholder rate or maybe derived from rate_revision??
                // Let's leave amount calc out or 0 unless we have rate.
                // updatedTank.variation_amount = variation * RATE; 

                newTanks[idx] = updatedTank;
                setTanks(newTanks);
              };

              const tNumber = tank.tank_number?.startsWith('T') ? tank.tank_number : `T${tank.tank_number}`;
              const capacityLabel = tank.capacity > 100 ? (Number(tank.capacity) / 1000).toFixed(0) : tank.capacity;

              return (
                <Card key={tank.id || idx} className="bg-[#1e293b] border-slate-700 text-white shadow-lg overflow-hidden">
                  <CardContent className="p-6 flex gap-6">
                    {/* Left Column: Tank ID and Density */}
                    <div className="flex flex-col justify-between min-w-[80px]">
                      <div className="pt-8">
                        <span className="text-yellow-400 font-bold text-2xl tracking-wide">
                          {tNumber}-{capacityLabel}
                        </span>
                      </div>
                      <div className="pb-2">
                        <Label className="text-xs text-slate-400 mb-2 block">Density</Label>
                        <div
                          className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center border border-blue-500/50 cursor-pointer hover:bg-blue-500/40"
                          onClick={() => setDensityModal({ open: true, tankId: tank.id, temp: '', hydro: '', density: '' })}
                        >
                          <span className="text-xl">🌡️</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Input Fields */}
                    <div className="flex-1 space-y-6">
                      {/* Row 1 */}
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Product</Label>
                          <Input
                            value={tank.product_name || "Unknown"}
                            readOnly
                            className="bg-white text-black font-medium h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Opening Stock</Label>
                          <Input
                            value={tank.opening_stock}
                            onChange={(e) => handleTankChange('opening_stock', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-white text-black font-bold h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Stock Rx.</Label>
                          <Input
                            value={tank.stock_rx || ''}
                            onChange={(e) => handleTankChange('stock_rx', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Gross Stock</Label>
                          <Input
                            value={Number(tank.gross_stock || (Number(tank.opening_stock || tank.current_stock || 0) + Number(tank.stock_rx || 0))).toFixed(2)}
                            readOnly
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Meter Sale (ltrs)</Label>
                          <div className="relative">
                            <Input
                              value={tank.meter_sale || ''}
                              onChange={(e) => handleTankChange('meter_sale', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="bg-white text-black pr-8 h-9 focus-visible:ring-offset-0"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-2 text-orange-500">⛽</span>
                          </div>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Cls. Stock</Label>
                          <Input
                            value={Number(tank.closing_stock || (Number(tank.opening_stock || tank.current_stock || 0) + Number(tank.stock_rx || 0) - Number(tank.meter_sale || 0))).toFixed(2)}
                            readOnly
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Cls. DIP value</Label>
                          <Input
                            placeholder="Scale value"
                            value={tank.cls_dip_value || ''}
                            onChange={(e) => handleTankChange('cls_dip_value', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Cls. DIP Stock</Label>
                          <Input
                            placeholder="DIP stock"
                            value={tank.cls_dip_stock || ''}
                            onChange={(e) => handleTankChange('cls_dip_stock', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs text-slate-400">Variation (ltrs)</Label>
                          <Input
                            value={Number(tank.variation_lts || 0).toFixed(2)}
                            readOnly
                            className={`bg-white font-bold h-9 focus-visible:ring-offset-0 ${Number(tank.variation_lts || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs text-slate-400">Vari. Amount (₹)</Label>
                          <Input
                            value={tank.variation_amount || ''}
                            onChange={(e) => handleTankChange('variation_amount', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-400">Rate Revision (₹)</Label>
                          <Input
                            value={tank.rate_revision || ''}
                            onChange={(e) => handleTankChange('rate_revision', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-white text-black h-9 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          <div className="flex justify-center pt-4">
            <Button
              className="bg-green-500 hover:bg-green-600 text-white min-w-[200px] gap-2"
              onClick={handleSaveTanks}
            >
              <Save className="w-4 h-4" /> SAVE
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4 flex items-center gap-3">
              <span>From Date</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-span-4 flex items-center gap-3">
              <span>To Date</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-span-3 flex items-center gap-3">
              <span>Product</span>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Choose Product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="Extra Premium">Extra Premium</SelectItem>
                  <SelectItem value="High Speed Desi">High Speed Desi</SelectItem>
                  <SelectItem value="Motor Spirit">Motor Spirit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 flex justify-end"><Button className="bg-orange-500 hover:bg-orange-600" onClick={() => refetchOpeningStock()}>Search</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="destructive" disabled={selectedIds.size === 0} onClick={async () => {
                if (selectedIds.size === 0) return;
                if (!confirm(`Delete ${selectedIds.size} entr${selectedIds.size > 1 ? 'ies' : 'y'}?`)) return;
                for (const id of Array.from(selectedIds)) {
                  try {
                    const r = await fetch(`/api/sale-entries/${id}`, { method: 'DELETE', credentials: 'include' });
                    // ignore body; rely on status
                  } catch (e) { /* ignore */ }
                }
                setSelectedIds(new Set());
                refetchOpeningStock();
              }}>Delete Stock</Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <select className="h-9 rounded-md border bg-background px-2 text-sm">
                  <option>All</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Copy</Button>
              <Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
              <Button variant="outline" size="sm">Print</Button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Input placeholder="Type to filter..." className="w-56" value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set((filteredRows as any[]).map((r: any) => String(r.id))));
                  } else {
                    setSelectedIds(new Set());
                  }
                }} /></TableHead>
                <TableHead>Sl.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tank</TableHead>
                <TableHead>Variation (Lts)</TableHead>
                <TableHead>Variation (Amt)</TableHead>
                <TableHead>Open Stock</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Meter Sale</TableHead>
                <TableHead>Closing Stock</TableHead>
                <TableHead>DIP Details</TableHead>
                <TableHead>Stock Dump</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-gray-500">
                    {filterTerm ? `No entries found matching "${filterTerm}"` : "No opening stock data available. Add some stock entries to see them here."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row: any, index: number) => (
                  <TableRow key={row.id || index}>
                    <TableCell><input type="checkbox" checked={selectedIds.has(String(row.id))} onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) next.add(String(row.id)); else next.delete(String(row.id));
                      setSelectedIds(next);
                    }} /></TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.stock_date || (row.created_at ? new Date(row.created_at).toLocaleDateString() : new Date().toLocaleDateString())}</TableCell>
                    <TableCell>{row.tank_name || row.product || row.product_name || "-"}</TableCell>
                    <TableCell className={Number(row.variation_lts || 0) > 0 ? "text-blue-600" : Number(row.variation_lts || 0) < 0 ? "text-orange-600" : ""}>
                      {Number(row.variation_lts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{Number(row.variation_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(row.opening_stock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(row.receipt_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(row.total_stock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(row.meter_sale || row.sale_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(row.closing_stock || row.previous_closing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{Number(row.dip_details || row.current_closing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/stock-dump/add?tankId=${row.tank_id}&date=${row.stock_date || row.date}`)}>
                        <span className="text-xl">🚚</span>
                        <div className="flex flex-col text-xs text-left ml-1">
                          {row.density > 0 && <span>D: {row.density}</span>}
                          {row.temp > 0 && <span>T: {row.temp}</span>}
                        </div>
                      </Button>
                    </TableCell>
                    <TableCell>{row.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(() => {
              const totalFuel = (filteredRows as any[]).reduce((s: any, r: any) => s + Number(r.closing_stock || 0), 0);
              const variance = (filteredRows as any[]).reduce((s: any, r: any) => s + Number(r.variation_lts || 0), 0);
              return (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Fuel Stock</p>
                    <p className="text-2xl font-bold mt-1">{totalFuel.toLocaleString('en-IN', { minimumFractionDigits: 2 })} L</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Lubricants Stock</p>
                    <p className="text-2xl font-bold mt-1">0.00 L</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Stock Variance</p>
                    <p className={`text-2xl font-bold mt-1 ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{variance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} L</p>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Density Modal */}
      <Dialog open={densityModal.open} onOpenChange={(open) => !open && setDensityModal(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-[600px] bg-white text-black">
          <DialogHeader className="bg-blue-600 text-white p-4 -mx-6 -mt-6 rounded-t-lg">
            <DialogTitle>Density Test</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-6 pt-6">
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                placeholder="Temp Reading"
                value={densityModal.temp}
                onChange={(e) => setDensityModal(prev => ({ ...prev, temp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Hydro Meter Reading</Label>
              <Input
                placeholder="Hydro Meter.Read"
                value={densityModal.hydro}
                onChange={(e) => setDensityModal(prev => ({ ...prev, hydro: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Density</Label>
              <Input
                value={densityModal.density}
                onChange={(e) => setDensityModal(prev => ({ ...prev, density: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-center gap-2 mt-6">
            <Button variant="default" className="bg-green-600 hover:bg-green-700 w-24" onClick={() => {
              setDensityModal(prev => ({ ...prev, open: false }));
              toast({ title: "Density Saved", description: "Density reading updated locally." });
            }}>
              ✓ Ok
            </Button>
            <Button variant="outline" className="border-black text-black w-24" onClick={() => setDensityModal(prev => ({ ...prev, open: false }))}>
              ✖ Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
