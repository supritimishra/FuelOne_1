import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function SaleEntry() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<string>(""); // Default to empty, will auto-select

  // Filter states
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");

  // Entry section states
  const [showEntrySection, setShowEntrySection] = useState(false);
  const [nozzleEntries, setNozzleEntries] = useState<NozzleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [nozzlesData, setNozzlesData] = useState<any[]>([]);
  const [isLoadingNozzles, setIsLoadingNozzles] = useState(false);
  const [nozzlesError, setNozzlesError] = useState<Error | null>(null);


  // Fetch duty shifts to map S-1/S-2 to shift_id
  const { data: shifts = [], refetch: refetchShifts } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch shifts');
      return result.rows || [];
    },
  });

  // Auto-select first shift if current selection is invalid
  useEffect(() => {
    if (shifts.length > 0) {
      // Check for legacy shift names and auto-fix
      const hasLegacyShifts = shifts.some((s: any) => s.shift_name === 'Morning' || s.shift_name === 'Shift1');
      if (hasLegacyShifts) {
        console.log('Detected legacy shifts, triggering fix...');
        fetch('/api/fix-shift-names', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            console.log('Fix result:', data);
            refetchShifts(); // Reload shifts after fix
          })
          .catch(err => console.error('Failed to fix shifts:', err));
      }

      const currentShiftExists = shifts.find((s: any) => s.shift_name === shift);
      if (!currentShiftExists) {
        setShift(shifts[0].shift_name);
      }
    }
  }, [shifts, shift, refetchShifts]);

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

  // Fetch sale entries data
  const { data: saleEntriesData, refetch: refetchSaleEntries } = useQuery({
    queryKey: ["/api/sale-entries", searchFrom, searchTo, filterProduct],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFrom) params.append('from', searchFrom);
      if (searchTo) params.append('to', searchTo);
      if (filterProduct) params.append('product', filterProduct);

      const response = await fetch(`/api/sale-entries?${params.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch sale entries');
      return result.rows || [];
    },
  });

  const rows = saleEntriesData || [];

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
    if (showEntrySection) {
      if (nozzlesData && nozzlesData.length > 0) {
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
      } else if (nozzlesData && nozzlesData.length === 0) {
        setNozzleEntries([]);
      }
    }
  }, [showEntrySection, nozzlesData]);

  const handleSearch = () => {
    refetchSaleEntries();
  };

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

    // Auto-calculate Sale when Closing Reading changes
    if (field === 'closing_reading') {
      const opening = parseFloat(updated[index].opening_reading) || 0;
      const closing = parseFloat(value) || 0;
      const sale = Math.max(0, closing - opening);
      updated[index].sale = sale.toString();

      const price = parseFloat(updated[index].price) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }

    // Auto-calculate Sale when Opening Reading changes
    if (field === 'opening_reading') {
      const opening = parseFloat(value) || 0;
      const closing = parseFloat(updated[index].closing_reading) || 0;
      const sale = Math.max(0, closing - opening);
      updated[index].sale = sale.toString();

      const price = parseFloat(updated[index].price) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }

    // Auto-calculate Sale Amt when Price changes
    if (field === 'price') {
      const sale = parseFloat(updated[index].sale) || 0;
      const price = parseFloat(value) || 0;
      updated[index].sale_amt = (sale * price).toString();
    }

    // Auto-calculate Sale Amt when Sale is manually changed
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

      // Find shift_id from shifts array (Robust match: trim + case insensitive)
      let selectedShift = shifts.find((s: any) =>
        s.shift_name?.trim().toUpperCase() === shift.trim().toUpperCase()
      );

      // Fallback: If not found but shifts exist, default to the first one
      if (!selectedShift && shifts.length > 0) {
        console.warn(`Selected shift "${shift}" not found. Defaulting to "${shifts[0].shift_name}"`);
        selectedShift = shifts[0];
        setShift(shifts[0].shift_name); // Sync state
      }

      if (!selectedShift) {
        console.error('Shift not found. Available shifts:', shifts);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Shift "${shift}" not found. Available: ${shifts.map((s: any) => s.shift_name).join(', ')}`,
        });
        return;
      }

      // Validate all entries
      // Update: If Closing Reading is empty, we assume it equals Opening Reading (No Sale).
      const invalidEntries = nozzleEntries.filter(
        (entry) => {
          // Calculate effective closing reading (default to opening if empty)
          const opening = parseFloat(entry.opening_reading || '0');
          const closingInput = entry.closing_reading;
          const effectiveClosing = (closingInput !== '' && closingInput !== undefined && closingInput !== null)
            ? parseFloat(closingInput)
            : opening;

          // Calculate effective sale
          const effectiveSale = Math.max(0, effectiveClosing - opening);

          // Employee is required ONLY if there is an actual sale
          const isEmployeeMissing = effectiveSale > 0 && !entry.employee_id;

          return isEmployeeMissing;
        }
      );

      if (invalidEntries.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Employee is required for pumps with sales.",
        });
        return;
      }

      // Prepare sale entries
      const saleEntries = nozzleEntries.map((entry) => {
        const opening = parseFloat(entry.opening_reading || '0');
        const closingInput = entry.closing_reading;
        // Auto-fill closing with opening if empty
        const effectiveClosing = (closingInput !== '' && closingInput !== undefined && closingInput !== null)
          ? closingInput
          : entry.opening_reading;

        return {
          sale_date: saleDate,
          shift_id: selectedShift.id,
          pump_station: entry.pump_station,
          nozzle_id: entry.nozzle_id,
          fuel_product_id: entry.fuel_product_id,
          opening_reading: entry.opening_reading,
          closing_reading: effectiveClosing, // Use auto-filled value
          price_per_unit: entry.price,
          employee_id: entry.employee_id,
        };
      });

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
      refetchSaleEntries();
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

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/sale-entries/${entryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Sale entry deleted successfully" });
        refetchSaleEntries();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete sale entry", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Sale</span></div>

      {/* Summary boxes */}
      <div className="grid grid-cols-3 gap-3">
        {/* MS */}
        <div className="grid grid-cols-4 gap-1 text-sm">
          <div className="col-span-4 font-semibold">MS</div>
          <div className="border p-2">Gross 0</div>
          <div className="border p-2">Test 0</div>
          <div className="border p-2">Net 0</div>
          <div className="border p-2"></div>
        </div>
        {/* XP */}
        <div className="grid grid-cols-4 gap-1 text-sm">
          <div className="col-span-4 font-semibold">XP</div>
          <div className="border p-2">Gross 0</div>
          <div className="border p-2">Test 0</div>
          <div className="border p-2">Net 0</div>
          <div className="border p-2"></div>
        </div>
        {/* HSD */}
        <div className="grid grid-cols-4 gap-1 text-sm">
          <div className="col-span-4 font-semibold">HSD</div>
          <div className="border p-2">Gross 0</div>
          <div className="border p-2">Test 0</div>
          <div className="border p-2">Net 0</div>
          <div className="border p-2"></div>
        </div>
      </div>

      {/* Blue panel */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">&nbsp;</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input className="bg-white text-black w-32" placeholder="0" />
            <span className="bg-orange-500 text-white font-medium px-4 py-2 rounded">Choose Date</span>
            <Input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-48 h-10 bg-white text-black"
            />
            <div className="flex items-center gap-6">
              {shifts.length > 0 ? (
                shifts.map((s: any) => (
                  <label key={s.id} className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="shift"
                      checked={shift === s.shift_name}
                      onChange={() => setShift(s.shift_name)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    {s.shift_name}
                  </label>
                ))
              ) : (
                <span className="text-white text-sm">Loading shifts...</span>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="text-black bg-yellow-400 hover:bg-yellow-500 flex items-center gap-2"
              onClick={handleSaleNozzelsClick}
            >
              <Fuel className="w-4 h-4" />
              Sale Nozzels
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-2"><span>Search From</span><Input placeholder="Filter Date" type="date" value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} /></div>
            <div className="flex items-center gap-2"><span>To</span><Input placeholder="Filter Date" type="date" value={searchTo} onChange={(e) => setSearchTo(e.target.value)} /></div>
            <div className="flex items-center gap-2"><span>Product</span><Select value={filterProduct} onValueChange={setFilterProduct}><SelectTrigger className="w-56"><SelectValue placeholder="Choose Product" /></SelectTrigger><SelectContent><SelectItem value="HSD">HSD</SelectItem><SelectItem value="MS">MS</SelectItem><SelectItem value="XP">XP</SelectItem></SelectContent></Select></div>
            <div className="flex items-center gap-2"><Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSearch}>Search</Button></div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Section - Conditionally Rendered */}
      {showEntrySection && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Sale Entry Section</CardTitle>
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

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="secondary">View Sale</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Copy</Button>
              <Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
              <Button variant="outline" size="sm">Print</Button>
              <div className="flex items-center gap-2 ml-4">
                <span>Filter:</span>
                <Input placeholder="Type to filter..." className="w-56" />
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  console.log('Goto Delete clicked!');
                  try {
                    navigate('/delete-sale');
                  } catch (err) {
                    console.error('Navigation error:', err);
                    window.location.href = '/delete-sale';
                  }
                }}
              >
                Goto Delete
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableHead>Employee</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-gray-500">
                    No data available. Add some sale entries to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row: any, index: number) => (
                  <TableRow key={row.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</TableCell>
                    <TableCell>{row.pump_station || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {row.tank_number ? `TANK-${row.tank_number}` : ''}
                      {row.tank_number && row.product_name && <br />}
                      {row.product_name || '-'}
                    </TableCell>
                    <TableCell>{row.shift || '-'}</TableCell>
                    <TableCell>{row.nozzle_number || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {row.opening_reading !== null && row.opening_reading !== undefined ? `Opening : ${Number(row.opening_reading).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      {row.opening_reading !== null && row.opening_reading !== undefined && row.closing_reading !== null && row.closing_reading !== undefined && <br />}
                      {row.closing_reading !== null && row.closing_reading !== undefined ? `Closing : ${Number(row.closing_reading).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </TableCell>
                    <TableCell>{row.price_per_unit ? Number(row.price_per_unit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
                    <TableCell>{row.quantity ? Number(row.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
                    <TableCell>{row.net_sale_amount ? Number(row.net_sale_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>{row.employee_name || '-'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); /* Edit functionality */ }}>✏️</Button>
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.created_at ? `Created: Super Admin ${new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(row.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
