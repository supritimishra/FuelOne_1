import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Fuel, Copy, Save, FileText, Trash2, Edit, Search } from "lucide-react";
import { format } from "date-fns";

interface NozzleEntry {
  nozzle_id: string;
  nozzle_number: string;
  tank_number: string;
  product_name: string; // 'High Speed Diesel', 'Motor Spirit', 'Xtra Premium'
  pump_station: string;
  fuel_product_id: string;
  opening_reading: string;
  closing_reading: string;
  test_qty: string;
  sale: string;
  price: string;
  sale_amt: string;
  employee_id: string;
  last_closing_reading: string | null;
  current_rate: number;
}

// Helper to normalize product names to keys
const getProductKey = (name: string) => {
  if (name.toLowerCase().includes("high speed")) return "HSD";
  if (name.toLowerCase().includes("motor spirit")) return "MS";
  if (name.toLowerCase().includes("xtra")) return "XP";
  return "OTHER";
};

type ViewMode = 'entry' | 'view' | 'delete';

export default function SaleEntry() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('entry');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<string>("");

  // Filter states
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  // Entry section states
  const [showEntrySection, setShowEntrySection] = useState(false);
  const [nozzleEntries, setNozzleEntries] = useState<NozzleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [nozzlesData, setNozzlesData] = useState<any[]>([]);
  const [isLoadingNozzles, setIsLoadingNozzles] = useState(false);
  const [nozzlesError, setNozzlesError] = useState<Error | null>(null);

  // Reset filters when changing view mode
  useEffect(() => {
    setSearchText("");
    if (viewMode === 'delete') {
      setFilterProduct(""); // Clear product filter for delete view to show all products in pivot
    }
  }, [viewMode]);

  // Fetch duty shifts
  const { data: shifts = [], refetch: refetchShifts } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts');
      const result = await response.json();
      return result.rows || [];
    },
  });

  useEffect(() => {
    if (shifts.length > 0 && !shift) {
      // Prefer S-1 or default to first
      const s1 = shifts.find((s: any) => s.shift_name === 'S-1');
      setShift(s1 ? s1.shift_name : shifts[0].shift_name);
    }
  }, [shifts, shift]);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      const result = await response.json();
      return result.rows || [];
    },
  });

  // Fetch sale entries data for table
  const { data: saleEntriesData, refetch: refetchSaleEntries } = useQuery({
    queryKey: ["/api/sale-entries", searchFrom, searchTo, filterProduct],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFrom) params.append('from', searchFrom);
      if (searchTo) params.append('to', searchTo);
      // For summary views, we might want 'All' products to aggregate correctly, 
      // but if user filters by Product in 'View' mode, we honor it.
      if (filterProduct && filterProduct !== 'All') params.append('product', filterProduct);

      const response = await fetch(`/api/sale-entries?${params.toString()}`);
      const result = await response.json();
      return result.rows || [];
    },
  });

  const rows = saleEntriesData || [];

  const fetchNozzles = async () => {
    setIsLoadingNozzles(true);
    setNozzlesError(null);
    try {
      const response = await fetch(`/api/nozzles-with-last-readings?date=${saleDate}`);
      const result = await response.json();
      if (!result.success && !result.ok) throw new Error(result.error || 'Failed to fetch nozzles');
      setNozzlesData(result.rows || []);
    } catch (err: any) {
      setNozzlesError(err);
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsLoadingNozzles(false);
    }
  };

  useEffect(() => {
    if (showEntrySection && nozzlesData.length > 0) {
      const entries: NozzleEntry[] = nozzlesData.map((nozzle: any) => ({
        nozzle_id: nozzle.id,
        nozzle_number: nozzle.nozzle_number || '',
        tank_number: nozzle.tank_number || '',
        product_name: nozzle.product_name || '',
        pump_station: nozzle.pump_station || '',
        fuel_product_id: nozzle.fuel_product_id || '',
        opening_reading: nozzle.last_closing_reading || '0',
        closing_reading: '',
        test_qty: '0',
        sale: '0',
        price: nozzle.current_rate?.toString() || '0',
        sale_amt: '0',
        employee_id: '',
        last_closing_reading: nozzle.last_closing_reading,
        current_rate: nozzle.current_rate || 0,
      }));
      setNozzleEntries(entries);
    } else if (showEntrySection && nozzlesData.length === 0) {
      setNozzleEntries([]);
    }
  }, [showEntrySection, nozzlesData]);

  const handleSaleNozzelsClick = () => {
    const newShowState = !showEntrySection;
    setShowEntrySection(newShowState);
    if (!newShowState) {
      setNozzleEntries([]);
      setNozzlesData([]);
    } else {
      fetchNozzles();
    }
  };

  const updateNozzleEntry = (index: number, field: keyof NozzleEntry, value: string) => {
    const updated = [...nozzleEntries];
    updated[index] = { ...updated[index], [field]: value };
    const entry = updated[index];

    // Auto-calculate logic
    const opening = parseFloat(entry.opening_reading) || 0;
    const closing = parseFloat(entry.closing_reading) || 0;
    const test = parseFloat(entry.test_qty) || 0;
    const price = parseFloat(entry.price) || 0;

    // Recalculate Sale (Volume) if readings change or test qty changes
    if (field === 'opening_reading' || field === 'closing_reading' || field === 'test_qty') {
      let grossSale = 0;
      if (entry.closing_reading && !isNaN(closing) && closing > 0) {
        grossSale = Math.max(0, closing - opening);
      }
      const netSale = Math.max(0, grossSale - test);
      updated[index].sale = netSale.toFixed(2);

      // Also update amount if volume changes
      updated[index].sale_amt = (netSale * price).toFixed(2);
    }

    // If price changes, update amount based on current sale volume
    if (field === 'price') {
      const currentSale = parseFloat(updated[index].sale) || 0;
      updated[index].sale_amt = (currentSale * price).toFixed(2);
    }

    // If Sale Amt changes, reverse calculate Price
    if (field === 'sale_amt') {
      const currentSale = parseFloat(updated[index].sale) || 0;
      const newAmt = parseFloat(value) || 0;
      if (currentSale > 0) {
        updated[index].price = (newAmt / currentSale).toFixed(2);
      }
    }

    setNozzleEntries(updated);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const selectedShift = shifts.find((s: any) => s.shift_name === shift) || shifts[0];

      const entriesToSave = nozzleEntries.map((entry) => {
        if (!entry.closing_reading) return null;
        const closing = parseFloat(entry.closing_reading);
        if (isNaN(closing)) return null;

        return {
          sale_date: saleDate,
          shift_id: selectedShift?.id,
          pump_station: entry.pump_station,
          nozzle_id: entry.nozzle_id,
          fuel_product_id: entry.fuel_product_id,
          opening_reading: entry.opening_reading,
          closing_reading: entry.closing_reading,
          test_qty: entry.test_qty || '0',
          price_per_unit: entry.price,
          net_sale_amount: entry.sale_amt,
          employee_id: entry.employee_id || null
        };
      }).filter(Boolean);

      if (entriesToSave.length === 0) {
        toast({ title: "Warning", description: "No entries with closing readings to save.", variant: "destructive" });
        return;
      }

      const response = await fetch('/api/sale-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entriesToSave),
      });

      const result = await response.json();
      if (!result.success && !result.ok) throw new Error(result.error);

      toast({ title: "Success", description: "Sales saved successfully" });
      setShowEntrySection(false);
      refetchSaleEntries();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Summaries
  const summaries = useMemo(() => {
    const stats: Record<string, { gross: number, test: number, net: number }> = {
      MS: { gross: 0, test: 0, net: 0 },
      XP: { gross: 0, test: 0, net: 0 },
      HSD: { gross: 0, test: 0, net: 0 }
    };

    nozzleEntries.forEach(e => {
      const key = getProductKey(e.product_name);
      if (stats[key]) {
        const open = parseFloat(e.opening_reading) || 0;
        const close = parseFloat(e.closing_reading) || 0;
        const test = parseFloat(e.test_qty) || 0;
        // Only count gross if closing is entered/valid
        if (e.closing_reading) {
          const gross = Math.max(0, close - open);
          const net = Math.max(0, gross - test);
          stats[key].gross += gross;
          stats[key].test += test;
          stats[key].net += net;
        }
      }
    });
    return stats;
  }, [nozzleEntries]);


  // --- AGGREGATION LOGIC ---

  // For View Sale: Group by Date + Product
  const viewSaleData = useMemo(() => {
    if (!rows.length) return [];

    // Key: date_productName
    const groups: Record<string, any> = {};

    rows.forEach((row: any) => {
      const dateKey = row.sale_date ? format(new Date(row.sale_date), 'dd-MMM-yyyy') : 'Unknown';
      const prodName = row.product_name || 'Unknown';
      const key = `${dateKey}_${prodName}`;

      if (!groups[key]) {
        groups[key] = {
          date: dateKey,
          product: prodName,
          sale_qty: 0,
          amount: 0,
          rawDate: row.sale_date
        };
      }

      groups[key].sale_qty += parseFloat(row.quantity || 0);
      groups[key].amount += parseFloat(row.net_sale_amount || 0);
    });

    const data = Object.values(groups).sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      return data.filter((d: any) =>
        d.date.toLowerCase().includes(lowerSearch) ||
        d.product.toLowerCase().includes(lowerSearch)
      );
    }
    return data;
  }, [rows, searchText]);

  // For Delete Sale: Group by Date + Shift + Product (Pivot)
  const deleteSaleData = useMemo(() => {
    if (!rows.length) return [];

    // Key: date_shift
    const groups: Record<string, any> = {};

    rows.forEach((row: any) => {
      const dateKey = row.sale_date ? format(new Date(row.sale_date), 'dd-MMM-yyyy') : 'Unknown';
      const shiftName = row.shift || 'Unknown';
      const key = `${dateKey}_${shiftName}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          date: dateKey,
          shift: shiftName,
          ms: { qty: 0, amt: 0 },
          hsd: { qty: 0, amt: 0 },
          xp: { qty: 0, amt: 0 },
          createdDate: row.created_at,
          ids: [], // Store all IDs for batch delete
          rawDate: row.sale_date
        };
      }

      // Add ID
      groups[key].ids.push(row.id);

      const pKey = getProductKey(row.product_name || '');
      const qty = parseFloat(row.quantity || 0);
      const amt = parseFloat(row.net_sale_amount || 0);

      if (pKey === 'MS') {
        groups[key].ms.qty += qty;
        groups[key].ms.amt += amt;
      } else if (pKey === 'HSD') {
        groups[key].hsd.qty += qty;
        groups[key].hsd.amt += amt;
      } else if (pKey === 'XP') {
        groups[key].xp.qty += qty;
        groups[key].xp.amt += amt;
      }
    });

    const data = Object.values(groups).sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      return data.filter((d: any) =>
        d.date.toLowerCase().includes(lowerSearch) ||
        d.shift.toLowerCase().includes(lowerSearch)
      );
    }
    return data;
  }, [rows, searchText]);


  const handleDeleteBatch = async (ids: string[]) => {
    if (!confirm("Are you sure you want to delete these entries? This action cannot be undone.")) return;

    try {
      const response = await fetch('/api/sale-entries-batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        toast({ title: "Success", description: "Entries deleted successfully" });
        refetchSaleEntries();
      } else {
        const res = await response.json();
        toast({ title: "Error", description: res.error || "Failed to delete", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  // --- RENDER HELPERS ---

  const renderFilters = (showProductFilter = false) => (
    <Card className="rounded-lg shadow-sm mb-4">
      <CardContent className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 text-sm whitespace-nowrap">From Date</span>
          <Input type="date" className="w-36 h-9" value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 text-sm whitespace-nowrap">To Date</span>
          <Input type="date" className="w-36 h-9" value={searchTo} onChange={(e) => setSearchTo(e.target.value)} />
        </div>

        {showProductFilter && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 text-sm">Product</span>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-48 bg-white h-9">
                <SelectValue placeholder="Choose Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Products</SelectItem>
                <SelectItem value="Motor Spirit">MS</SelectItem>
                <SelectItem value="High Speed Diesel">HSD</SelectItem>
                <SelectItem value="Xtra Premium">XP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={() => refetchSaleEntries()} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 gap-2">
          <Search className="h-4 w-4" /> Search
        </Button>
      </CardContent>
    </Card>
  );

  if (viewMode === 'view') {
    return (
      <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <span className="cursor-pointer hover:underline" onClick={() => setViewMode('entry')}>Dashboard</span>
          <span>{'>'}</span>
          <span className="cursor-pointer hover:underline" onClick={() => setViewMode('entry')}>Sale</span>
          <span>{'>'}</span>
          <span className="text-blue-600 font-semibold">View Sale</span>
        </div>

        {renderFilters(true)}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Show:</span>
              <Select defaultValue="All">
                <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <Input placeholder="Type to filter..." className="h-8 w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16 font-bold text-gray-700">S.No</TableHead>
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Pump</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Sale Quantity(Lt.)</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewSaleData.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No data found</TableCell></TableRow>
              ) : (
                viewSaleData.slice(0, 50).map((row: any, i: number) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-700">{row.date}</TableCell>
                    <TableCell>{row.product}</TableCell>
                    <TableCell className="text-right">{row.sale_qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-semibold">{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t text-xs text-gray-500 flex justify-between">
            <span>Showing 1 to {Math.min(viewSaleData.length, 50)} of {viewSaleData.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2" disabled>{'<'}</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 bg-gray-100">1</Button>
              <Button variant="outline" size="sm" className="h-7 px-2" disabled>{'>'}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'delete') {
    return (
      <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <span className="cursor-pointer hover:underline" onClick={() => setViewMode('entry')}>Dashboard</span>
          <span>{'>'}</span>
          <span className="cursor-pointer hover:underline" onClick={() => setViewMode('entry')}>Sale</span>
          <span>{'>'}</span>
          <span className="text-blue-600 font-semibold">Delete Sale</span>
        </div>

        {renderFilters(false)}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Show:</span>
              <Select defaultValue="All">
                <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <Input placeholder="Type to filter..." className="h-8 w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12 font-bold text-gray-700">S.No</TableHead>
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Shift</TableHead>
                <TableHead className="font-bold text-gray-700">MS</TableHead>
                <TableHead className="font-bold text-gray-700">HSD</TableHead>
                <TableHead className="font-bold text-gray-700">XP</TableHead>
                <TableHead className="font-bold text-gray-700">Created Date</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deleteSaleData.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">No data found</TableCell></TableRow>
              ) : (
                deleteSaleData.slice(0, 50).map((row: any, i: number) => (
                  <TableRow key={row.key} className="hover:bg-gray-50">
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-700 whitespace-nowrap">{row.date}</TableCell>
                    <TableCell>{row.shift}</TableCell>
                    <TableCell className="text-xs">
                      <div className="whitespace-nowrap">Qty - {row.ms.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-gray-500">Amt - {row.ms.amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="whitespace-nowrap">Qty - {row.hsd.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-gray-500">Amt - {row.hsd.amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="whitespace-nowrap">Qty - {row.xp.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-gray-500">Amt - {row.xp.amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-gray-500">
                      {row.createdDate ? format(new Date(row.createdDate), 'dd-MMM-yyyy hh:mm a') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-500 bg-blue-50 hover:bg-blue-100"
                          onClick={() => handleDeleteBatch(row.ids)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t text-xs text-gray-500 flex justify-between">
            <span>Showing 1 to {Math.min(deleteSaleData.length, 50)} of {deleteSaleData.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2" disabled>{'<'}</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 bg-gray-100">1</Button>
              <Button variant="outline" size="sm" className="h-7 px-2" disabled>{'>'}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ENTRY MODE (Default) ---

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-semibold">Dashboard</span><span>{'>'}</span><span className="text-blue-600">Sale</span>
      </div>

      {/* Top Stats */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {['MS', 'XP', 'HSD'].map(key => (
          <div key={key} className="flex border rounded-md shadow-sm bg-white overflow-hidden min-w-[300px]">
            <div className="bg-slate-600 text-white font-bold w-16 flex items-center justify-center text-xl">
              {key}
            </div>
            <div className="flex-1 grid grid-cols-3 divide-x text-sm">
              <div className="px-2 py-1 flex flex-col items-center justify-center">
                <span className="text-gray-500 text-xs font-bold uppercase">Gross</span>
                <span className="font-bold">{summaries[key].gross.toFixed(2)}</span>
              </div>
              <div className="px-2 py-1 flex flex-col items-center justify-center">
                <span className="text-gray-500 text-xs font-bold uppercase">Test</span>
                <span className="font-bold">{summaries[key].test.toFixed(2)}</span>
              </div>
              <div className="px-2 py-1 flex flex-col items-center justify-center bg-gray-50">
                <span className="text-gray-500 text-xs font-bold uppercase">Net</span>
                <span className="font-bold text-green-600">{summaries[key].net.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg flex items-center shadow-lg h-[80px]">

        {/* Left: 0 Box */}
        <div className="bg-white text-black font-bold h-10 w-16 flex items-center justify-center rounded ml-4 shadow">
          0
        </div>

        {/* Date Picker */}
        <div className="flex items-center ml-4">
          <span className="bg-yellow-400 text-black font-bold h-10 px-6 flex items-center rounded-l text-sm uppercase tracking-wide">
            Choose Date
          </span>
          <div className="bg-white h-10 flex items-center px-3 rounded-r w-48 relative">
            <span className="text-black font-medium text-sm flex-1">
              {(() => {
                try { return saleDate ? format(new Date(saleDate), 'dd-MM-yyyy') : 'Select Date'; }
                catch { return 'Select Date'; }
              })()}
            </span>
            <Input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-gray-500">📅</span>
          </div>
        </div>

        {/* Center: Shift Toggles (S-1, S-2 only) */}
        <div className="flex-1 flex items-center justify-center gap-12 bg-blue-800/30 rounded h-10 mx-8 border border-blue-500/30">
          {['S-1', 'S-2'].map((sName) => (
            <label key={sName} className="flex items-center gap-3 cursor-pointer select-none group">
              <div className={`w-5 h-5 rounded-full border-[3px] flex items-center justify-center transition-all ${shift === sName ? 'border-white' : 'border-blue-300'}`}>
                {shift === sName && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
              <span className={`font-bold text-lg group-hover:text-white/90 ${shift === sName ? 'text-white' : 'text-blue-200'}`}>{sName}</span>
              <input
                type="radio"
                name="shift"
                className="hidden"
                checked={shift === sName}
                onChange={() => setShift(sName)}
              />
            </label>
          ))}
        </div>

        {/* Right: Sale Nozzles Button */}
        <div className="mr-4">
          <Button
            onClick={handleSaleNozzelsClick}
            className="bg-blue-500 hover:bg-blue-400 text-white font-medium px-4 h-10 rounded shadow-sm border border-blue-400/50 flex items-center gap-2 transition-all active:scale-95"
          >
            Sale Nozzels <Fuel className="fill-yellow-400 text-yellow-400 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-6 justify-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Search From</span>
            <Input
              type="date"
              className="w-36 h-9"
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
            />
            <span className="font-semibold text-gray-700">To</span>
            <Input
              type="date"
              className="w-36 h-9"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Product</span>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-48 bg-white h-9">
                <SelectValue placeholder="Choose Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Products</SelectItem>
                <SelectItem value="Motor Spirit">MS</SelectItem>
                <SelectItem value="High Speed Diesel">HSD</SelectItem>
                <SelectItem value="Xtra Premium">XP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => refetchSaleEntries()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9"
          >
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Entry Table (Popup) */}
      {showEntrySection && (
        <div className="bg-blue-600 rounded-lg p-1 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
          <div className="p-2 text-right">
            <Button onClick={() => setNozzleEntries([...nozzleEntries])} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-1 h-7 text-xs">
              <Copy className="h-3 w-3" /> COPY
            </Button>
          </div>
          <div className="p-2 space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 text-white text-xs font-semibold px-2">
              <div className="col-span-2">NOZZLE</div>
              <div className="col-span-2 text-center">OPEN READING</div>
              <div className="col-span-2 text-center">CLOSED READING</div>
              <div className="col-span-1 text-center">TEST QTY</div>
              <div className="col-span-1 text-center">SALE</div>
              <div className="col-span-1 text-center">PRICE</div>
              <div className="col-span-1 text-center">SALE AMT</div>
              <div className="col-span-2">EMPLOYEE</div>
            </div>

            {nozzleEntries.map((entry, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center text-white text-sm font-medium px-2">
                <div className="col-span-2 flex flex-col leading-tight">
                  <span className="text-[10px] opacity-80 font-mono text-yellow-200">
                    {entry.product_name?.includes('High') ? 'HSD' : entry.product_name?.includes('Motor') ? 'MS' : 'XP'}-T{entry.tank_number}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-300 font-bold text-base">
                    <span>P{entry.pump_station}-{entry.product_name?.substring(0, 2).toUpperCase()}{entry.nozzle_number}</span>
                    <Fuel className="h-4 w-4 fill-current shrink-0" />
                  </div>
                </div>

                <div className="col-span-2">
                  <Input
                    value={entry.opening_reading}
                    onChange={e => updateNozzleEntry(idx, 'opening_reading', e.target.value)}
                    className="bg-white text-black h-9 text-right font-semibold shadow-inner"
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    type="number"
                    value={entry.closing_reading}
                    onChange={e => updateNozzleEntry(idx, 'closing_reading', e.target.value)}
                    className="bg-yellow-300 border-yellow-400 text-black h-9 text-right font-bold focus-visible:ring-yellow-500 shadow-sm"
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    type="number"
                    value={entry.test_qty}
                    onChange={e => updateNozzleEntry(idx, 'test_qty', e.target.value)}
                    className="bg-white text-black h-9 text-center shadow-sm"
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    readOnly
                    value={entry.sale}
                    className="bg-slate-100 text-slate-700 h-9 text-center font-semibold"
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    value={entry.price}
                    onChange={e => updateNozzleEntry(idx, 'price', e.target.value)}
                    className="bg-white text-black h-9 text-center font-semibold"
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    value={entry.sale_amt}
                    onChange={e => updateNozzleEntry(idx, 'sale_amt', e.target.value)}
                    className="bg-white text-black h-9 text-right font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <Select value={entry.employee_id} onValueChange={v => updateNozzleEntry(idx, 'employee_id', v)}>
                    <SelectTrigger className="h-9 bg-white text-black w-full text-xs font-semibold">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.employee_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center p-4">
            <Button onClick={handleConfirm} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-12 h-10 gap-2 shadow-lg transition-transform active:scale-95 text-base rounded-full">
              <Save className="h-5 w-5" /> Confirm
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border mt-4">
        <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
          <Button onClick={() => setViewMode('view')} className="bg-green-500 hover:bg-green-600 text-white gap-2 font-bold shadow-sm">
            <Fuel className="h-4 w-4" /> View Sale
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={() => setViewMode('delete')} size="sm" variant="destructive" className="font-bold">Goto Delete {'>'}</Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Filter:</span>
            <Input placeholder="Type to filter..." className="h-8 w-48 bg-gray-50" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-gray-700 w-16">S.No</TableHead>
                <TableHead className="font-bold text-gray-700">Sale Date</TableHead>
                <TableHead className="font-bold text-gray-700">Pump</TableHead>
                <TableHead className="font-bold text-gray-700">Product</TableHead>
                <TableHead className="font-bold text-gray-700">Shift</TableHead>
                <TableHead className="font-bold text-gray-700">Nozzle</TableHead>
                <TableHead className="font-bold text-gray-700">Meter Reading</TableHead>
                <TableHead className="font-bold text-gray-700">Price</TableHead>
                <TableHead className="font-bold text-gray-700">Net Sale</TableHead>
                <TableHead className="font-bold text-gray-700">Sale Amount</TableHead>
                <TableHead className="font-bold text-gray-700">Test Qty</TableHead>
                <TableHead className="font-bold text-gray-700">Employee</TableHead>
                <TableHead className="font-bold text-gray-700">Edit</TableHead>
                <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center h-32 text-gray-400">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row: any, i: number) => (
                  <TableRow key={row.id || i} className="hover:bg-slate-50 transition-colors">
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-gray-700">
                      {(() => {
                        try { return row.sale_date ? format(new Date(row.sale_date), 'dd-MMM-yyyy') : '-'; }
                        catch { return '-'; }
                      })()}
                    </TableCell>
                    <TableCell>{row.pump_station}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-gray-600">TANK-{row.tank_number}</span>
                        <span className="text-gray-500">{row.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{row.shift}</TableCell>
                    <TableCell className="font-medium">{row.nozzle_number}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div className="text-gray-500">Opening : <span className="text-gray-700 font-medium">{row.opening_reading}</span></div>
                      <div className="text-gray-500">Closing : <span className="text-gray-700 font-medium">{row.closing_reading}</span></div>
                    </TableCell>
                    <TableCell>{row.price_per_unit}</TableCell>
                    <TableCell className="font-bold text-gray-800">{row.quantity}</TableCell>
                    <TableCell className="font-bold text-blue-600">{row.net_sale_amount || row.total_amount}</TableCell>
                    <TableCell>{row.test_qty || '0'}</TableCell>
                    <TableCell>{row.employee_name}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100"><FileText className="h-4 w-4" /></Button>
                    </TableCell>
                    <TableCell className="text-[10px] text-gray-400 whitespace-nowrap">
                      Created: {row.created_by || 'Unknown'} <br />
                      {(() => {
                        try { return row.created_at ? format(new Date(row.created_at), 'dd-MM-yyyy hh:mm a') : ''; }
                        catch { return '-'; }
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
