import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Save, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Fuel,
  Eye,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface TankerSale {
  id: string;
  sale_date: string;
  fuel_product_id: string | null;
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
  // default date range: yesterday -> today (ISO YYYY-MM-DD)
  const _today = new Date();
  const _yesterday = new Date(_today);
  _yesterday.setDate(_today.getDate() - 1);
  const _fmt = (d: Date) => d.toISOString().slice(0, 10);
  
  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    end_date_time: "",
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

  // UI state
  const [rows, setRows] = useState<TankerSale[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntries, setShowEntries] = useState("All");
  const [searchFrom, setSearchFrom] = useState<string>(_fmt(_yesterday));
  const [searchTo, setSearchTo] = useState<string>(_fmt(_today));
  const [filterTankId, setFilterTankId] = useState<string>("ALL");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");

  // Fetch tanker sales list (supports filters)
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
      console.log('🌐 API URL:', url);
      console.log('🔑 Auth headers:', getAuthHeaders());
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) throw new Error("Failed to fetch tanker sales");

      const data = await response.json();
      console.log('📊 Raw API data:', data);
      console.log('📊 Data type:', typeof data);
      console.log('📊 Is array:', Array.isArray(data));
      console.log('📊 Has value property:', 'value' in data);
      
      // Handle API response format: { ok: true, rows: [...] }
      let rawData = [];
      if (data && typeof data === 'object' && data.ok && Array.isArray(data.rows)) {
        rawData = data.rows;
        console.log('📊 Using data.rows (API format)');
      } else if (data && typeof data === 'object' && 'value' in data && Array.isArray(data.value)) {
        rawData = data.value;
        console.log('📊 Using data.value (legacy format)');
      } else if (Array.isArray(data)) {
        rawData = data;
        console.log('📊 Using data directly (array format)');
      } else {
        console.log('❌ Unexpected data format:', data);
        rawData = [];
      }
      
      const normalized: TankerSale[] = Array.isArray(rawData)
        ? rawData.map((item: any) => ({
            id: String(item.id),
            sale_date: String(item.sale_date),
            fuel_product_id: item.fuel_product_id ? String(item.fuel_product_id) : null,
            before_dip_stock: Number(item.before_dip_stock) || 0,
            gross_stock: Number(item.gross_stock) || 0,
            tanker_sale_quantity: Number(item.tanker_sale_quantity) || 0,
            notes: item.notes ?? "",
            created_at: item.created_at ? String(item.created_at) : undefined,
            product_name: item.fuel_products?.product_name ?? "",
            short_name: item.fuel_products?.short_name ?? "",
          }))
        : [];
      
      console.log('✅ Normalized data:', normalized);
      console.log('📈 Number of records:', normalized.length);
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
      if (!response.ok) throw new Error("Failed to fetch tanks");
      const data = await response.json();
      setTanks(data.rows || []);
    } catch (error: any) {
      console.error("Error fetching tanks:", error);
    }
  }, [getAuthHeaders]);

  // Initial data load
  useEffect(() => {
    fetchList();
    fetchTanks();
  }, [fetchList, fetchTanks]);

  // Handle form changes
  const handleFormChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Save tanker sale
  const save = async () => {
    if (!form.tank || !form.total_sale) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    // Find the selected tank to get its fuel_product_id
    const selectedTank = tanks.find(tank => tank.id === form.tank);
    if (!selectedTank) {
      toast({
        title: "Validation Error",
        description: "Selected tank not found",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/tanker-sales", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sale_date: form.date,
          fuel_product_id: selectedTank.fuel_product_id, // Use the tank's fuel_product_id
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

  // Reset form
  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      end_date_time: "",
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

  // Filter rows based on search and active tab
  const fuelProductTankMap = useMemo(() => {
    const map = new Map<string, string>();
    tanks.forEach((tank) => {
      const label = `Tank ${tank.tank_number}`;
      if (tank.fuel_product_id) {
        map.set(tank.fuel_product_id, label);
      }
      map.set(tank.id, label);
    });
    return map;
  }, [tanks]);

  const displayRows: DisplayTankerSale[] = useMemo(() => {
    console.log('🔄 Calculating displayRows from rows:', rows);
    console.log('📊 Rows length:', rows.length);
    
    const result = rows.map((row) => {
      const beforeDip = row.before_dip_stock || 0;
      const grossStock = row.gross_stock || 0;
      const tankerSale = row.tanker_sale_quantity || 0;
      const receipt = Math.max(grossStock - beforeDip, 0);
      const variation = receipt - tankerSale;
      const balance = grossStock - tankerSale;
      const tankLabel =
        (row.fuel_product_id && fuelProductTankMap.get(row.fuel_product_id)) ||
        row.product_name ||
        row.short_name ||
        "Unknown Tank";

      return {
        id: row.id,
        dump_date: row.sale_date,
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
    
    console.log('✅ DisplayRows result:', result);
    console.log('📈 DisplayRows length:', result.length);
    return result;
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
    console.log('🔍 Filtering rows...');
    console.log('📊 DisplayRows length:', displayRows.length);
    console.log('🔍 Search term:', searchTerm);
    console.log('🏷️ Active tab:', activeTab);
    
    const term = searchTerm.trim().toLowerCase();

    const result = displayRows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        [row.dump_date, row.tank, row.details]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));

      const matchesTab = activeTab === "All" || row.tank === activeTab;

      return matchesSearch && matchesTab;
    });
    
    console.log('✅ FilteredRows result:', result);
    console.log('📈 FilteredRows length:', result.length);
    return result;
  }, [displayRows, searchTerm, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 px-6 py-4 shadow-sm">
        <nav className="flex items-center justify-between" aria-label="Breadcrumb">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Dashboard</span>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">Tanker Sale</span>
          </div>
        </nav>
        <div className="mt-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Tanker Sale Management</h1>
          <p className="text-muted-foreground text-lg">Manage tanker sales and fuel deliveries</p>
        </div>
      </div>

      {/* Search / Filters */}
      <div className="px-6 py-4 bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={searchFrom} 
              onChange={(e) => setSearchFrom(e.target.value)} 
              className="w-40 h-10 rounded-lg border-2 border-orange-200 focus:border-orange-500" 
            />
            <span className="text-sm text-gray-600 font-medium">to</span>
            <Input 
              type="date" 
              value={searchTo} 
              onChange={(e) => setSearchTo(e.target.value)} 
              className="w-40 h-10 rounded-lg border-2 border-orange-200 focus:border-orange-500" 
            />
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Select value={filterTankId} onValueChange={setFilterTankId}>
              <SelectTrigger className="w-52 bg-white h-10 rounded-lg border-2 border-orange-200 focus:border-orange-500">
                <SelectValue placeholder="Filter by tank / product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All tanks / products</SelectItem>
                {tanks.map((t) => {
                  const value = t.fuel_product_id ? t.fuel_product_id : t.id;
                  return (
                    <SelectItem key={t.id} value={value}>{`Tank ${t.tank_number}`}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Input 
              placeholder="Min qty" 
              value={minQuantity} 
              onChange={(e) => setMinQuantity(e.target.value)} 
              className="w-24 h-10 rounded-lg border-2 border-orange-200 focus:border-orange-500" 
            />
            <Input 
              placeholder="Max qty" 
              value={maxQuantity} 
              onChange={(e) => setMaxQuantity(e.target.value)} 
              className="w-24 h-10 rounded-lg border-2 border-orange-200 focus:border-orange-500" 
            />

            <Search className="h-4 w-4 text-orange-500" />
            <Input
              placeholder="Search:"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-10 rounded-lg border-2 border-orange-200 focus:border-orange-500"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchList()}
              className="h-10 px-6 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-medium rounded-lg transition-all duration-200"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tanker Details Form */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tanker Details</h2>
                <p className="text-blue-100 text-sm">Add new tanker sale information</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="h-8 w-8 text-white opacity-80" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* First Row */}
            <div className="space-y-2">
              <Label className="text-yellow-200 text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date/Time
              </Label>
              <Input
                type="datetime-local"
                value={form.end_date_time}
                onChange={(e) => handleFormChange("end_date_time", e.target.value)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-yellow-200 text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Invoice No
              </Label>
              <Input
                value={form.invoice_no}
                onChange={(e) => handleFormChange("invoice_no", e.target.value)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
                placeholder="Enter invoice number"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-yellow-200 text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Vehicle No
              </Label>
              <Input
                value={form.vehicle_no}
                onChange={(e) => handleFormChange("vehicle_no", e.target.value)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
                placeholder="Enter vehicle number"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-yellow-200 text-sm font-semibold flex items-center gap-2">
                📱 Mobile No
              </Label>
              <Input
                value={form.mobile_no}
                onChange={(e) => handleFormChange("mobile_no", e.target.value)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
                placeholder="Enter mobile number"
              />
            </div>

            {/* Second Row */}
            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Tank
              </Label>
              <Select value={form.tank} onValueChange={(value) => handleFormChange("tank", value)}>
                <SelectTrigger className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11">
                  <SelectValue placeholder="-Select Tank-" />
                </SelectTrigger>
                <SelectContent>
                  {tanks.map((tank) => (
                    <SelectItem key={tank.id} value={tank.id}>
                      Tank {tank.tank_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Before Dip
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.before_dip}
                onChange={(e) => handleFormChange("before_dip", parseFloat(e.target.value) || 0)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Before Stock
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.before_stock}
                onChange={(e) => handleFormChange("before_stock", parseFloat(e.target.value) || 0)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                📄 Receipt
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.receipt}
                onChange={(e) => handleFormChange("receipt", parseFloat(e.target.value) || 0)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                📊 Gross Stock
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.gross_stock}
                onChange={(e) => handleFormChange("gross_stock", parseFloat(e.target.value) || 0)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Sale (Lts.)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.total_sale}
                onChange={(e) => handleFormChange("total_sale", parseFloat(e.target.value) || 0)}
                className="bg-white border-2 border-orange-200 focus:border-orange-400 rounded-lg h-11"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-12 py-4 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? "SAVING..." : "SAVE TANKER SALE"}
            </Button>
          </div>
        </div>

        {/* Tanker Data Table */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Table Controls */}
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show</span>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">entries</span>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search:"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["S.No", "Dump Date", "Tank", "Before Dip", "Before Stock", "Receipt", "Gross Stock", "Tanker Sale", "Variation", "View", "Balance", "Details"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>{header}</span>
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3" />
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(row.dump_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.tank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.before_dip.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.before_stock.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.receipt.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.gross_stock.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.tanker_sale.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.variation.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.balance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.details || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {filteredRows.length > 0 ? 1 : 0} to {filteredRows.length} of {filteredRows.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}