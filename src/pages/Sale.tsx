import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Fuel } from "lucide-react";

interface NozzleEntry {
  nozzle_id: string;
  nozzle_number: string;
  tank_number: string;
  product_name: string;
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

export default function Sale() {
  const { toast } = useToast();
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [showEntrySection, setShowEntrySection] = useState(false);
  const [nozzleEntries, setNozzleEntries] = useState<NozzleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch sales data
  const { data: salesData, refetch: refetchSales } = useQuery({
    queryKey: ["/api/guest-sales"],
    queryFn: async () => {
      const response = await fetch('/api/guest-sales', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch sales');
      return result.rows || [];
    },
  });

  // Fetch duty shifts to map S-1/S-2 to shift_id
  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch shifts');
      return result.rows || [];
    },
  });

  // Fetch employees for dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
  });

  // State for nozzles data
  const [nozzlesData, setNozzlesData] = useState<any[]>([]);
  const [isLoadingNozzles, setIsLoadingNozzles] = useState(false);
  const [nozzlesError, setNozzlesError] = useState<Error | null>(null);

  // Function to fetch nozzles
  const fetchNozzles = async () => {
    setIsLoadingNozzles(true);
    setNozzlesError(null);
    try {
      console.log('Fetching nozzles with last readings for date:', saleDate);
      const response = await fetch(`/api/nozzles-with-last-readings?date=${saleDate}`, {
        credentials: 'include'
      });
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Nozzles API response:', result);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch nozzles');
      }
      setNozzlesData(result.rows || []);
      console.log('Nozzles data set:', result.rows?.length || 0, 'nozzles');
    } catch (err: any) {
      console.error('Error fetching nozzles:', err);
      setNozzlesError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to fetch nozzles',
      });
    } finally {
      setIsLoadingNozzles(false);
    }
  };

  // Initialize nozzle entries when nozzles data is loaded
  useEffect(() => {
    console.log('useEffect triggered - showEntrySection:', showEntrySection, 'nozzlesData length:', nozzlesData?.length);
    if (showEntrySection) {
      if (nozzlesData && nozzlesData.length > 0) {
        console.log('Initializing nozzle entries from data:', nozzlesData);
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
        console.log('Setting nozzle entries:', entries.length);
        setNozzleEntries(entries);
      } else if (nozzlesData && nozzlesData.length === 0) {
        // Clear entries if no nozzles found
        console.log('No nozzles found, clearing entries');
        setNozzleEntries([]);
      }
    }
  }, [showEntrySection, nozzlesData]);

  const rows = salesData || [];

  const handleSearch = () => {
    refetchSales();
  };

  const handleSaleNozzelsClick = () => {
    try {
      // Immediate visual feedback
      alert('Button clicked! Opening entry section...');
      
      const newShowState = !showEntrySection;
      console.log('🔵 Sale Nozzels button clicked! Current state:', showEntrySection, 'New state:', newShowState);
      
      // Force state update immediately
      setShowEntrySection(newShowState);
      
      // If closing, clear entries
      if (!newShowState) {
        console.log('Closing entry section, clearing data');
        setNozzleEntries([]);
        setNozzlesData([]);
      } else {
        // If opening, immediately fetch nozzles
        console.log('Opening entry section, fetching nozzles...');
        fetchNozzles();
      }
    } catch (error) {
      console.error('Error in handleSaleNozzelsClick:', error);
      alert('Error: ' + error);
    }
  };

  const updateNozzleEntry = (index: number, field: keyof NozzleEntry, value: string) => {
    const updated = [...nozzleEntries];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate Sale when Closing Reading changes
    if (field === 'closing_reading') {
      const opening = parseFloat(updated[index].opening_reading) || 0;
      const closing = parseFloat(value) || 0;
      const sale = Math.max(0, closing - opening);
      updated[index].sale = sale.toString();
      
      // Auto-calculate Sale Amt
      const price = parseFloat(updated[index].price) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }
    
    // Auto-calculate Sale when Opening Reading changes
    if (field === 'opening_reading') {
      const opening = parseFloat(value) || 0;
      const closing = parseFloat(updated[index].closing_reading) || 0;
      const sale = Math.max(0, closing - opening);
      updated[index].sale = sale.toString();
      
      // Auto-calculate Sale Amt
      const price = parseFloat(updated[index].price) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }
    
    // Auto-calculate Sale Amt when Price changes
    if (field === 'price') {
      const sale = parseFloat(updated[index].sale) || 0;
      const price = parseFloat(value) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }
    
    // Auto-calculate Sale when Sale is manually changed
    if (field === 'sale') {
      const sale = parseFloat(value) || 0;
      const price = parseFloat(updated[index].price) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }
    
    setNozzleEntries(updated);
  };

  const handleCopy = () => {
    if (nozzleEntries.length === 0) return;
    const lastEntry = nozzleEntries[nozzleEntries.length - 1];
    const newEntry: NozzleEntry = {
      ...lastEntry,
      closing_reading: '',
      sale: '0',
      sale_amt: '0',
    };
    setNozzleEntries([...nozzleEntries, newEntry]);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      // Find shift_id from shifts array
      const selectedShift = shifts.find((s: any) => s.shift_name === shift);
      if (!selectedShift) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Shift ${shift} not found`,
        });
        return;
      }
      
      // Validate all entries
      const invalidEntries = nozzleEntries.filter(
        (entry) => !entry.closing_reading || !entry.employee_id
      );
      
      if (invalidEntries.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all closing readings and select employees",
        });
        return;
      }
      
      // Prepare sale entries
      const saleEntries = nozzleEntries.map((entry) => ({
        sale_date: saleDate,
        shift_id: selectedShift.id,
        pump_station: entry.pump_station,
        nozzle_id: entry.nozzle_id,
        fuel_product_id: entry.fuel_product_id,
        opening_reading: entry.opening_reading,
        closing_reading: entry.closing_reading,
        price_per_unit: entry.price,
        employee_id: entry.employee_id,
      }));
      
      // Submit to backend
      const response = await fetch('/api/sale-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleEntries),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save sale entries');
      }
      
      toast({
        title: "Success",
        description: `Successfully saved ${result.count || saleEntries.length} sale entries`,
      });
      
      // Refresh sales data and hide entry section
      refetchSales();
      setShowEntrySection(false);
      setNozzleEntries([]);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to save sale entries',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Sale</span></div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white">
          Sale
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Lub Sale
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Swipe
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Credit
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Expenses
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Recovery
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Day Settlement
        </button>
      </div>

      {/* Sale Form - Blue Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white text-xl">Sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Summary Row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 text-white font-medium">MS</div>
            <div className="col-span-1">
              <Input placeholder="Gross" className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Input placeholder="Test" className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Input placeholder="Net" className="bg-white text-black" />
            </div>
            <div className="col-span-2 text-white font-medium">XP</div>
            <div className="col-span-1">
              <Input placeholder="Gross" className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Input placeholder="Test" className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Input placeholder="Net" className="bg-white text-black" />
            </div>
            <div className="col-span-2 text-white font-medium">HSD</div>
            <div className="col-span-1">
              <Input placeholder="Gross" className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Input placeholder="Test" className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Input placeholder="Net" className="bg-white text-black" />
            </div>
          </div>

          {/* Sale Entry Row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">
              <Input placeholder="0" className="bg-white text-black text-lg" />
            </div>
            <div className="col-span-1 flex items-center gap-3">
              <button 
                type="button" 
                className="h-10 px-4 rounded-md bg-yellow-400 text-black font-medium hover:bg-yellow-300"
                onClick={() => document.getElementById('sale_date')?.showPicker()}
              >
                Choose Date
              </button>
              <input 
                id="sale_date" 
                type="date" 
                value={saleDate} 
                onChange={(e) => setSaleDate(e.target.value)} 
                className="hidden" 
              />
            </div>
            <div className="col-span-2">
              <Input 
                type="text" 
                value={saleDate} 
                onChange={(e) => setSaleDate(e.target.value)} 
                placeholder="Sale Date" 
                className="bg-white text-black" 
              />
            </div>
            <div className="col-span-2 flex items-center space-x-4">
              <div className="flex space-x-2">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="shift"
                    value="S-1"
                    checked={shift === "S-1"}
                    onChange={(e) => setShift(e.target.value as "S-1" | "S-2")}
                    className="mr-2"
                  />
                  S-1
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="shift"
                    value="S-2"
                    checked={shift === "S-2"}
                    onChange={(e) => setShift(e.target.value as "S-1" | "S-2")}
                    className="mr-2"
                  />
                  S-2
                </label>
              </div>
            </div>
            <div className="col-span-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔴 NATIVE BUTTON onClick triggered!');
                  alert('Native button clicked!');
                  handleSaleNozzelsClick();
                }}
                onMouseDown={(e) => {
                  console.log('🔴 Button onMouseDown triggered!');
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors"
              >
                <Fuel className="w-4 h-4" />
                Sale Nozzels
              </button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-white">Search From</span>
              <Input 
                placeholder="Filter Date" 
                type="date" 
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="bg-white text-black" 
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-white">To</span>
              <Input 
                placeholder="Filter Date" 
                type="date" 
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="bg-white text-black" 
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-white">Product</span>
              <Select value={searchProduct} onValueChange={setSearchProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Product"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hsd">High Speed Desi</SelectItem>
                  <SelectItem value="ms">Motor Spirit</SelectItem>
                  <SelectItem value="xp">Extra Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Button 
                onClick={handleSearch}
                className="bg-yellow-400 hover:bg-yellow-300 text-black w-full"
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Section - Conditionally Rendered */}
      {showEntrySection && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">
                Sale Entry Section {showEntrySection ? '✓' : '✗'}
              </CardTitle>
              <Button 
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nozzle</TableHead>
                    <TableHead>Open Reading</TableHead>
                    <TableHead>Closed Reading</TableHead>
                    <TableHead>Test Qty</TableHead>
                    <TableHead>Sale</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sale Amt</TableHead>
                    <TableHead>Employee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingNozzles ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Loading nozzles...
                      </TableCell>
                    </TableRow>
                  ) : nozzlesError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-red-500">
                        Error loading nozzles: {nozzlesError instanceof Error ? nozzlesError.message : 'Unknown error'}
                      </TableCell>
                    </TableRow>
                  ) : nozzleEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No nozzles found. Please ensure nozzles are configured in the system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    nozzleEntries.map((entry, index) => {
                      // Format nozzle display: {product}-T{tank} P{pump}-{nozzle}
                      const productShort = entry.product_name?.substring(0, 2).toUpperCase() || 'MS';
                      const nozzleDisplay = `${productShort}-T${entry.tank_number} P${entry.pump_station}-${entry.nozzle_number}`;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{nozzleDisplay}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.opening_reading}
                              onChange={(e) => updateNozzleEntry(index, 'opening_reading', e.target.value)}
                              className="bg-gray-50 w-32"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.closing_reading}
                              onChange={(e) => updateNozzleEntry(index, 'closing_reading', e.target.value)}
                              className="w-32"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.test_qty}
                              onChange={(e) => updateNozzleEntry(index, 'test_qty', e.target.value)}
                              className="w-24"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.sale}
                              onChange={(e) => updateNozzleEntry(index, 'sale', e.target.value)}
                              className="w-24"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.price}
                              onChange={(e) => updateNozzleEntry(index, 'price', e.target.value)}
                              className="w-24"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.sale_amt}
                              onChange={(e) => updateNozzleEntry(index, 'sale_amt', e.target.value)}
                              className="w-32"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={entry.employee_id}
                              onValueChange={(value) => updateNozzleEntry(index, 'employee_id', value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select Employee" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.employee_name || emp.name || emp.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleConfirm}
                disabled={loading || nozzleEntries.length === 0}
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-2"
              >
                {loading ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white">View Sale</Button>
              <div className="flex items-center gap-2">
                <span>Show:</span>
                <Select>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-red-600 hover:bg-red-700 text-white">Goto Delete</Button>
              <Button variant="outline" size="sm">Copy</Button>
              <Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
              <Button variant="outline" size="sm">Print</Button>
              <div className="flex items-center gap-2 ml-4">
                <span>Filter:</span>
                <Input placeholder="Type to filter..." className="w-56" />
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><input type="checkbox" /></TableHead>
                <TableHead>S.No</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Nozzle</TableHead>
                <TableHead>Meter Reading</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Net Sale</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Test Qty</TableHead>
                <TableHead>Emplo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground">
                    No sales data available
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r:any, idx:number)=> (
                  <TableRow key={r.id || idx}>
                    <TableCell><input type="checkbox" /></TableCell>
                    <TableCell>{idx+1}</TableCell>
                    <TableCell>{r.sale_date || '-'}</TableCell>
                    <TableCell>P{idx+1}</TableCell>
                    <TableCell>TANK-{idx+1} {r.product_name || 'Extra Premium'}</TableCell>
                    <TableCell>{shift}</TableCell>
                    <TableCell>{r.product_name?.substring(0,2) || 'XP'}{idx+1}</TableCell>
                    <TableCell>
                      Opening: {Math.floor(Math.random() * 1000000)}.{Math.floor(Math.random() * 100)}
                      <br />
                      Closing: {Math.floor(Math.random() * 1000000)}.{Math.floor(Math.random() * 100)}
                    </TableCell>
                    <TableCell>{r.price_per_unit || '113.2'}</TableCell>
                    <TableCell>{r.quantity || '14.6'}</TableCell>
                    <TableCell>{r.total_amount || '1,652.72'}</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>
                      {['Raju', 'Milon', 'Krishna', 'Harashit'][idx % 4]}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Created: Super Admin {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing 1 to 40 of 40 entries
            </div>
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
