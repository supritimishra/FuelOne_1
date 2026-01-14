import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, CalendarIcon, FuelIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TankerSale {
  id: string;
  sale_date: string;
  fuel_product_id: string | null;
  tank_id?: string | null; // Added tank_id to interface
  before_dip_stock: number;
  gross_stock: number;
  tanker_sale_quantity: number;
  notes?: string | null;
  created_at?: string;
  product_name?: string;
  short_name?: string;
}

interface DisplayTankerSale {
  id: string;
  dump_date: string;
  tank: string;
  before_dip: number;
  before_stock: number;
  receipt: number;
  gross_stock: number;
  tanker_sale: number;
  variation: number;
  balance: number;
  details: string;
}

interface Tank {
  id: string;
  tank_number: string;
  fuel_product_id: string | null;
  current_stock: number;
}

export default function TankerSaleEnhanced() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();

  // Date calculations
  const _today = new Date();
  const _30DaysAgo = new Date(_today);
  _30DaysAgo.setDate(_today.getDate() - 30);
  const _fmt = (d: Date) => d.toISOString().slice(0, 10);

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    invoice_no: "",
    vehicle_no: "",
    mobile_no: "",
    tank: "", // Tank ID
    before_dip: 0,
    before_stock: 0,
    receipt: 0,
    gross_stock: 0,
    total_sale: 0,
  });

  // UI state
  const [rows, setRows] = useState<TankerSale[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntries, setShowEntries] = useState("All");

  // Search filters
  const [searchFrom, setSearchFrom] = useState<string>(_fmt(_30DaysAgo)); // Default to 30 days
  const [searchTo, setSearchTo] = useState<string>(_fmt(_today));
  const [filterTankId, setFilterTankId] = useState<string>("ALL");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");

  // Fetch tanker sales list
  const fetchList = useCallback(async () => {
    setLoading(true);
    console.log('🔍 Fetching tanker sales...');
    try {
      const params = new URLSearchParams();
      if (searchFrom) params.append('from', searchFrom);
      if (searchTo) params.append('to', searchTo);
      if (filterTankId && filterTankId !== 'ALL') params.append('fuel_product_id', filterTankId);
      if (minQuantity) params.append('min_quantity', minQuantity);
      if (maxQuantity) params.append('max_quantity', maxQuantity);
      if (searchTerm) params.append('search', searchTerm);

      const url = `/api/tanker-sales${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error("Failed to fetch tanker sales");

      const data = await response.json();

      // Handle API response format: { success: true, rows: [...] }
      let rawData = [];
      if (data && typeof data === 'object' && data.rows && Array.isArray(data.rows)) {
        rawData = data.rows;
      } else if (Array.isArray(data)) {
        rawData = data;
      } else {
        rawData = [];
      }

      const normalized: TankerSale[] = rawData.map((item: any) => ({
        id: String(item.id),
        sale_date: String(item.sale_date),
        fuel_product_id: item.fuel_product_id ? String(item.fuel_product_id) : null,
        tank_id: item.tank_id ? String(item.tank_id) : null, // Correctly map tank_id
        before_dip_stock: Number(item.before_dip_stock) || 0,
        gross_stock: Number(item.gross_stock) || 0,
        tanker_sale_quantity: Number(item.tanker_sale_quantity) || 0,
        notes: item.notes ?? "",
        created_at: item.created_at ? String(item.created_at) : undefined,
        product_name: item.fuel_products?.product_name ?? "",
        short_name: item.fuel_products?.short_name ?? "",
      }));

      setRows(normalized);
    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, searchFrom, searchTo, filterTankId, minQuantity, maxQuantity, searchTerm, getAuthHeaders]);

  // Fetch tanks
  const fetchTanks = useCallback(async () => {
    try {
      const response = await fetch("/api/tanks", {
        headers: getAuthHeaders()
      });
      let fetchedTanks: Tank[] = [];
      if (response.ok) {
        const data = await response.json();
        fetchedTanks = data.rows || [];
      }

      // Ensure Tank 1, 2, 3 exist for UI consistency
      const defaults: Tank[] = [
        { id: 'tank-1', tank_number: '1', fuel_product_id: null, current_stock: 0 },
        { id: 'tank-2', tank_number: '2', fuel_product_id: null, current_stock: 0 },
        { id: 'tank-3', tank_number: '3', fuel_product_id: null, current_stock: 0 },
      ];

      const merged = [...fetchedTanks];
      defaults.forEach(d => {
        if (!merged.find(t => t.tank_number === d.tank_number || t.tank_number === `Tank ${d.tank_number}`)) {
          merged.push(d);
        }
      });

      setTanks(merged.sort((a, b) => a.tank_number.localeCompare(b.tank_number, undefined, { numeric: true })));
    } catch (error: any) {
      console.error("Error fetching tanks:", error);
      // Fallback
      setTanks([
        { id: 'tank-1', tank_number: '1', fuel_product_id: null, current_stock: 0 },
        { id: 'tank-2', tank_number: '2', fuel_product_id: null, current_stock: 0 },
        { id: 'tank-3', tank_number: '3', fuel_product_id: null, current_stock: 0 },
      ]);
    }
  }, [getAuthHeaders]);

  // Initial load
  useEffect(() => {
    fetchList();
    fetchTanks();
  }, [fetchList, fetchTanks]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Save functionality
  const save = async () => {
    if (!form.tank || !form.total_sale) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedTank = tanks.find(tank => tank.id === form.tank);

    setSaving(true);
    try {
      const response = await fetch("/api/tanker-sales", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sale_date: form.date,
          fuel_product_id: selectedTank?.fuel_product_id,
          tank_id: form.tank,
          before_dip_stock: form.before_dip,
          gross_stock: form.gross_stock,
          tanker_sale_quantity: form.total_sale,
          notes: `Invoice: ${form.invoice_no}, Vehicle: ${form.vehicle_no}, Mobile: ${form.mobile_no}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to save tanker sale");

      toast({
        title: "Success",
        description: "Tanker sale saved successfully",
      });

      resetForm();
      fetchList();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      invoice_no: "",
      vehicle_no: "",
      mobile_no: "",
      tank: "",
      before_dip: 0,
      before_stock: 0,
      receipt: 0,
      gross_stock: 0,
      total_sale: 0,
    });
    setEditingId(null);
  };

  const fuelProductTankMap = useMemo(() => {
    const map = new Map<string, string>();
    tanks.forEach((tank) => {
      const label = `Tank ${tank.tank_number}`;
      if (tank.fuel_product_id) map.set(tank.fuel_product_id, label);
      map.set(tank.id, label);
    });
    return map;
  }, [tanks]);

  const displayRows: DisplayTankerSale[] = useMemo(() => {
    return rows.map((row) => {
      const beforeDip = row.before_dip_stock || 0;
      const grossStock = row.gross_stock || 0;
      const tankerSale = row.tanker_sale_quantity || 0;
      const receipt = Math.max(grossStock - beforeDip, 0);
      const variation = receipt - tankerSale;
      const balance = grossStock - tankerSale;

      // Smart Tank Label Resolution
      let tankLabel = "Unknown Tank";
      if (row.tank_id && fuelProductTankMap.has(row.tank_id)) {
        tankLabel = fuelProductTankMap.get(row.tank_id)!;
      } else if (row.fuel_product_id && fuelProductTankMap.has(row.fuel_product_id)) {
        tankLabel = fuelProductTankMap.get(row.fuel_product_id)!;
      } else if (row.product_name) {
        tankLabel = row.product_name;
      } else if (row.notes) {
        // Fallback if needed
      }

      return {
        id: row.id,
        dump_date: row.sale_date ? new Date(row.sale_date).toISOString().slice(0, 10) : "",
        tank: tankLabel,
        before_dip: beforeDip,
        before_stock: beforeDip,
        receipt,
        gross_stock: grossStock,
        tanker_sale: tankerSale,
        variation,
        balance,
        details: row.notes ? String(row.notes) : "",
      };
    });
  }, [rows, fuelProductTankMap]);

  const tabs = useMemo(() => {
    const uniqueLabels = new Set<string>();
    displayRows.forEach((row) => uniqueLabels.add(row.tank));
    return ["All", ...Array.from(uniqueLabels).sort()];
  }, [displayRows]);

  useEffect(() => {
    if (activeTab !== "All" && !tabs.includes(activeTab)) {
      setActiveTab("All");
    }
  }, [activeTab, tabs]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Sort items by date descending
    const sorted = [...displayRows].sort((a, b) =>
      new Date(b.dump_date).getTime() - new Date(a.dump_date).getTime()
    );

    return sorted.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        [row.dump_date, row.tank, row.details]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));

      const matchesTab = activeTab === "All" || row.tank === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [displayRows, searchTerm, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Path */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <span className="font-semibold text-gray-900">Dashboard</span>
        <span>&gt;</span>
        <span className="text-orange-500 cursor-pointer">Add Tanker Details</span>
      </div>

      {/* Tanker Details Header Button */}
      <div className="mb-4">
        <div className="bg-[#1e1b4b] text-white px-4 py-2 rounded-md inline-block font-bold shadow-md">
          Tanker Details
        </div>
      </div>

      {/* Main Form Container */}
      <Card className="bg-[#4338ca] border-none shadow-xl mb-6 text-white overflow-hidden">
        <CardContent className="p-6 space-y-6">

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Date */}
            <div className="flex">
              <div className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-l-md flex items-center justify-center min-w-[80px] text-sm">
                Date
              </div>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
                className="flex-1 px-3 py-2 text-black rounded-r-md border-none focus:ring-2 focus:ring-yellow-400 outline-none h-10"
              />
            </div>

            {/* Invoice No */}
            <div className="flex">
              <div className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-l-md flex items-center justify-center min-w-[100px] text-sm whitespace-nowrap">
                Invoice No
              </div>
              <input
                type="text"
                value={form.invoice_no}
                onChange={(e) => handleFormChange("invoice_no", e.target.value)}
                placeholder="456"
                className="flex-1 px-3 py-2 text-black rounded-r-md border-none focus:ring-2 focus:ring-yellow-400 outline-none h-10"
              />
            </div>

            {/* Vehicle No */}
            <div className="flex">
              <div className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-l-md flex items-center justify-center min-w-[100px] text-sm whitespace-nowrap">
                Vehicle No
              </div>
              <input
                type="text"
                value={form.vehicle_no}
                onChange={(e) => handleFormChange("vehicle_no", e.target.value)}
                placeholder="123"
                className="flex-1 px-3 py-2 text-black rounded-r-md border-none focus:ring-2 focus:ring-yellow-400 outline-none h-10"
              />
            </div>

            {/* Mobile No */}
            <div className="flex">
              <div className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-l-md flex items-center justify-center min-w-[100px] text-sm whitespace-nowrap">
                Mobile No
              </div>
              <input
                type="text"
                value={form.mobile_no}
                onChange={(e) => handleFormChange("mobile_no", e.target.value)}
                placeholder="1111111"
                className="flex-1 px-3 py-2 text-black rounded-r-md border-none focus:ring-2 focus:ring-yellow-400 outline-none h-10"
              />
            </div>
          </div>

          {/* Row 2: Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">

            {/* Tank Selection */}
            <div className="space-y-1">
              <label className="text-white text-sm font-semibold">Tank</label>
              <select
                value={form.tank}
                onChange={(e) => handleFormChange("tank", e.target.value)}
                className="w-full h-10 rounded-md border-none px-3 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
              >
                <option value="">-Select Tank-</option>
                {tanks.map((tank) => (
                  <option key={tank.id} value={tank.id}>
                    Tank {tank.tank_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Before Dip */}
            <div className="space-y-1">
              <label className="text-white text-sm font-semibold">Before Dip</label>
              <input
                type="number"
                value={form.before_dip}
                onChange={(e) => handleFormChange("before_dip", e.target.value)}
                className="w-full h-10 rounded-md border-none px-3 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
              />
            </div>

            {/* Before Stock */}
            <div className="space-y-1">
              <label className="text-white text-sm font-semibold">Before Stock</label>
              <input
                type="number"
                value={form.before_stock}
                onChange={(e) => handleFormChange("before_stock", e.target.value)}
                className="w-full h-10 rounded-md border-none px-3 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
              />
            </div>

            {/* Receipt */}
            <div className="space-y-1">
              <label className="text-white text-sm font-semibold">Receipt</label>
              <input
                type="number"
                value={form.receipt}
                onChange={(e) => handleFormChange("receipt", e.target.value)}
                className="w-full h-10 rounded-md border-none px-3 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
              />
            </div>

            {/* Gross Stock */}
            <div className="space-y-1">
              <label className="text-white text-sm font-semibold">Gross Stock</label>
              <input
                type="number"
                value={form.gross_stock}
                onChange={(e) => handleFormChange("gross_stock", e.target.value)}
                className="w-full h-10 rounded-md border-none px-3 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
              />
            </div>

            {/* Total Sale & Icon */}
            <div className="flex items-end gap-2">
              <div className="flex-none pb-2">
                <FuelIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-white text-sm font-semibold whitespace-nowrap">Total Sale (Lts.)</label>
                <input
                  type="number"
                  value={form.total_sale}
                  onChange={(e) => handleFormChange("total_sale", e.target.value)}
                  className="w-full h-10 rounded-md border-none px-3 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
                />
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={save}
              disabled={saving}
              className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold px-8 py-2 rounded-full shadow-lg transform transition active:scale-95 text-lg"
            >
              {saving ? "SAVING..." : "SAVE"}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* FILTER & TABLE SECTION */}
      <div className="bg-white rounded-lg shadow-sm p-4">

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <Button variant="default" className="bg-[#1e1b4b] text-white px-4 h-9">
            All
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              className="border rounded p-1"
              value={showEntries}
              onChange={(e) => setShowEntries(e.target.value)}
            >
              <option>All</option>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span>Search:</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <SearchIcon className="w-4 h-4 absolute right-2 top-1.5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-semibold border-b">
                <th className="p-3 whitespace-nowrap">S.No <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Dump Date <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Tank <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Before Dip <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Before Stock <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Receipt <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Gross Stock <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Tanker Sale <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Balance <span className="text-gray-400 text-xs">↕</span></th>
                <th className="p-3 whitespace-nowrap">Details <span className="text-gray-400 text-xs">↕</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{row.dump_date}</td>
                    <td className="p-3 font-medium text-blue-600">{row.tank}</td>
                    <td className="p-3">{row.before_dip}</td>
                    <td className="p-3">{row.before_stock}</td>
                    <td className="p-3">{row.receipt}</td>
                    <td className="p-3">{row.gross_stock}</td>
                    <td className="p-3 font-bold">{row.tanker_sale}</td>
                    <td className="p-3">{row.balance}</td>
                    <td className="p-3 text-gray-500 italic max-w-xs truncate">{row.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
          <div>Showing {filteredRows.length} of {filteredRows.length} entries</div>
          <div className="flex gap-1">
            <button className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Previous</button>
            <button className="px-2 py-1 bg-blue-600 text-white rounded">1</button>
            <button className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}