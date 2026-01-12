import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

interface NozzleReading {
  id: string;
  nozzle_number: string;
  open_reading: string;
  close_reading: string;
  sale: number;
}

export default function SalesOfficer() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedTank, setSelectedTank] = useState<string>("");
  const [dipValue, setDipValue] = useState<string>("");
  const [presentStock, setPresentStock] = useState<string>("");

  const [isNozzleModalOpen, setIsNozzleModalOpen] = useState(false);
  const [nozzleReadings, setNozzleReadings] = useState<Record<string, NozzleReading>>({});

  // --- Date Fetching & Logic ---
  const { data: fuelProducts = [] } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products');
      return (await response.json()).rows || [];
    },
  });

  useEffect(() => {
    if (fuelProducts.length > 0 && !activeTab) {
      setActiveTab(fuelProducts[0].id);
    }
  }, [fuelProducts, activeTab]);

  const { data: tanks = [] } = useQuery({
    queryKey: ["/api/tanks"],
    queryFn: async () => {
      const response = await fetch('/api/tanks');
      return (await response.json()).rows || [];
    },
  });

  const currentTanks = useMemo(() => {
    const apiTanks = tanks.filter((t: any) => t.fuel_product_id === activeTab);
    const defaultTanks = [
      { id: 'tank-1', tank_number: '1', fuel_product_id: activeTab },
      { id: 'tank-2', tank_number: '2', fuel_product_id: activeTab },
      { id: 'tank-3', tank_number: '3', fuel_product_id: activeTab }
    ];
    // Merge logic
    const combined = [...apiTanks];
    defaultTanks.forEach(dt => {
      if (!combined.find(t => t.tank_number == dt.tank_number)) combined.push(dt);
    });
    return combined.sort((a, b) => a.tank_number.localeCompare(b.tank_number, undefined, { numeric: true }));
  }, [tanks, activeTab]);

  useEffect(() => {
    if (currentTanks.length > 0) {
      if (!selectedTank || !currentTanks.find((t: any) => t.id === selectedTank)) {
        setSelectedTank(currentTanks[0].id);
      }
    } else {
      setSelectedTank("");
    }
  }, [currentTanks, selectedTank]);

  const { data: nozzles = [] } = useQuery({
    queryKey: ["/api/nozzles"],
    queryFn: async () => {
      const response = await fetch('/api/nozzles');
      return (await response.json()).rows || [];
    },
  });

  const { data: reportData = [], refetch: refetchReport } = useQuery({
    queryKey: ["/api/tank-daily-readings", date, activeTab],
    queryFn: async () => {
      if (!activeTab) return [];
      const response = await fetch(`/api/tank-daily-readings?date=${date}&fuelProductId=${activeTab}`);
      const data = await response.json();
      return data.success ? data.rows : [];
    },
    enabled: !!activeTab
  });

  useEffect(() => {
    // Report Data uses camelCase keys: id, date, previousStock...
    // We need to match tankId or tank_id
    if (selectedTank && reportData.length > 0) {
      // Find reading for current tank
      // The API returns rows joined with tanks table, so we check tank_id (from tankDailyReadings schema) which is returned as tankId or tank_id depending on driver mapping?
      // Drizzle usually matches schema property name if mapped or db column if not. In schema: tankId: uuid("tank_id") -> usually returns 'tankId'. 
      // But let's handle looser matching just in case.
      const found = reportData.find((r: any) => r.tankId === selectedTank || r.tank_id === selectedTank);

      if (found) {
        setDipValue(found.dipReading || found.dip_reading || "");
        setPresentStock(found.currentStock || found.closing_stock || "");
        // Nozzle readings are currently separate/mocked or in notes? 
        // If notes existed, we could parse them.
        try {
          if (found.notes && found.notes.startsWith('{')) {
            setNozzleReadings(JSON.parse(found.notes));
          }
        } catch (e) { }
      } else {
        setDipValue("");
        setPresentStock("");
      }
    } else {
      setDipValue("");
      setPresentStock("");
    }
  }, [reportData, selectedTank]);

  const currentNozzles = useMemo(() => {
    if (!selectedTank) return [];
    const found = nozzles.filter((n: any) => n.tank_id === selectedTank);
    if (found.length > 0) return found;
    if (selectedTank.startsWith('tank-')) {
      return [
        { id: `mock-${selectedTank}-n1`, nozzle_number: '1', tank_id: selectedTank, pump_station: 'P1' },
        { id: `mock-${selectedTank}-n2`, nozzle_number: '2', tank_id: selectedTank, pump_station: 'P1' },
        { id: `mock-${selectedTank}-n3`, nozzle_number: '3', tank_id: selectedTank, pump_station: 'P2' },
      ];
    }
    return [];
  }, [nozzles, selectedTank]);

  // Init Readings
  useEffect(() => {
    if (isNozzleModalOpen) {
      const newReadings = { ...nozzleReadings };
      currentNozzles.forEach((n: any) => {
        if (!newReadings[n.id]) {
          newReadings[n.id] = {
            id: n.id,
            nozzle_number: n.nozzle_number,
            open_reading: "0",
            close_reading: "",
            sale: NaN
          };
        }
      });
      setNozzleReadings(newReadings);
    }
  }, [isNozzleModalOpen, currentNozzles]);

  const totalSale = useMemo(() => {
    let total = 0;
    Object.values(nozzleReadings).forEach((r) => {
      if (currentNozzles.find((n: any) => n.id === r.id)) {
        if (!isNaN(r.sale)) total += r.sale;
      }
    });
    return total;
  }, [nozzleReadings, currentNozzles]);

  const handleNozzleChange = (id: string, field: 'open_reading' | 'close_reading', value: string) => {
    setNozzleReadings(prev => {
      const reading = prev[id];
      const newOpen = field === 'open_reading' ? value : reading.open_reading;
      const newClose = field === 'close_reading' ? value : reading.close_reading;
      const openNum = parseFloat(newOpen) || 0;
      const closeNum = parseFloat(newClose) || 0;
      let sale = 0;
      if (newClose !== "") {
        sale = closeNum - openNum;
        if (sale < 0) sale = 0;
      } else { sale = NaN; }

      return { ...prev, [id]: { ...reading, [field]: value, sale: sale } };
    });
  };

  const handleSave = async () => {
    if (!activeTab) return toast({ title: "Error", description: "Select a product", variant: "destructive" });
    if (!selectedTank) return toast({ title: "Error", description: "Select a tank", variant: "destructive" });

    try {
      const response = await fetch('/api/tank-daily-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingDate: date,
          tankId: selectedTank,
          dipReading: parseFloat(dipValue) || 0,
          closingStock: parseFloat(presentStock) || 0,
          meterSale: totalSale, // Assumes user already updated nozzle readings locally and totalSale is correct
          testing: 0, // Mock testing for now
          variation: 0, // Calculated on backend preferably or here? Backend reporting calculates it dynamically.
          notes: JSON.stringify(nozzleReadings)
        })
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Daily reading saved successfully" });
        refetchReport();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-2 bg-gray-50 min-h-screen font-sans text-xs">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-2">
        <span className="font-bold text-gray-700">Dashboard</span>
        <span className="text-gray-400">&gt;</span>
        <span className="text-orange-500 font-medium">Add Tanker Details</span>
      </div>

      <div className="mb-2">
        <Button className="bg-[#0f766e] hover:bg-[#0d6e66] text-white font-bold rounded-sm h-7 text-[10px] px-3">SO REPORT</Button>
      </div>

      {/* Main Card */}
      <div className="bg-[#4338ca] text-white rounded-md shadow p-4">
        {/* Date Row */}
        <div className="flex items-center mb-4 gap-2">
          <div className="flex items-center h-8 bg-white rounded-sm overflow-hidden shadow-sm">
            <div className="bg-[#fbbf24] text-black px-3 font-bold text-xs h-full flex items-center">Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-full border-none w-[110px] text-black text-xs px-2 outline-none"
            />
          </div>
          <div className="h-8 bg-white rounded-sm flex items-center px-4 text-gray-400 text-xs shadow-sm min-w-[120px]">
            Inspection Date
          </div>
        </div>

        {/* Form Row */}
        <div className="flex flex-wrap md:flex-nowrap gap-3 items-end">
          <div className="w-[200px] shrink-0 space-y-1">
            <label className="text-white text-[10px] block font-medium">Tank</label>
            <select
              value={selectedTank}
              onChange={(e) => setSelectedTank(e.target.value)}
              className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none bg-white font-medium"
            >
              <option value="" disabled>Select Tank</option>
              {currentTanks.map((t: any) => (
                <option key={t.id} value={t.id}>Tank {t.tank_number}</option>
              ))}
              {currentTanks.length === 0 && <option value="none" disabled>No Tanks</option>}
            </select>
          </div>

          <div className="w-[150px] shrink-0 space-y-1">
            <label className="text-white text-[10px] block font-medium">Dip value</label>
            <input
              type="number"
              value={dipValue}
              onChange={(e) => setDipValue(e.target.value)}
              className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none font-medium"
            />
          </div>

          <div className="w-[150px] shrink-0 space-y-1">
            <label className="text-white text-[10px] block font-medium">Present Stock</label>
            <input
              type="number"
              value={presentStock}
              onChange={(e) => setPresentStock(e.target.value)}
              className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none font-medium"
            />
          </div>

          <div className="shrink-0 pb-1 px-1">
            <div onClick={() => setIsNozzleModalOpen(true)} className="cursor-pointer hover:scale-105 active:scale-95 transition-transform">
              <div className="relative">
                <Fuel className="text-[#fbbf24] w-9 h-9 fill-[#fbbf24] stroke-black" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[1px]">
                  <div className="bg-green-500 w-2 h-2 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[150px] shrink-0 space-y-1">
            <label className="text-white text-[10px] block font-medium">Total Sale (Lts.)</label>
            <input
              value={totalSale.toFixed(2)}
              readOnly
              className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none font-bold"
            />
          </div>

          <div className="shrink-0 pb-0.5 md:ml-auto">
            <Button onClick={handleSave} className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 py-1 rounded-full font-bold text-xs h-8 shadow-md">
              SAVE
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent p-0 h-auto gap-0 w-full justify-start rounded-none">
            {fuelProducts.map((p: any) => (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="data-[state=active]:bg-[#0f766e] data-[state=active]:text-white rounded-none px-6 py-1 border border-transparent data-[state=active]:border-[#0f766e] bg-gray-100 text-gray-600 mr-1 text-[11px] font-semibold"
              >
                {p.short_name || p.product_name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-sm shadow-sm border mt-4">
        <div className="p-2 flex justify-between items-center border-b">
          <div className="flex gap-2 items-center">
            <span className="text-[11px] text-gray-600 font-medium">Show:</span>
            <select className="h-6 text-[11px] border rounded px-1 outline-none bg-white">
              <option value="All">All</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[11px] text-gray-600 font-medium">Filter:</span>
            <div className="relative">
              <input placeholder="Type to filter..." className="pl-2 pr-6 h-6 w-[150px] text-[11px] border rounded outline-none" />
              <Search className="w-3 h-3 absolute right-2 top-1.5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-white border-b">
                <th className="py-2 px-4 font-bold text-left text-gray-700 w-[50px]">S.No</th>
                <th className="py-2 px-4 font-bold text-left text-gray-700 w-[80px]">Date</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Previous stock</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Receipts</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Total stock</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Current stock</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Meter.Sales</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Testing</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Actual.Sales</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Dip.Sales</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Variation</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">Vari.limit</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">%limit</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">4% limit</th>
                <th className="py-2 px-4 font-bold text-center text-gray-700">View</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-6 text-gray-500 italic">No data available in table</td>
                </tr>
              ) : (
                reportData.map((row: any, idx: number) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b last:border-0 text-center text-gray-600">
                    <td className="py-2 px-4 text-left">{idx + 1}</td>
                    <td className="py-2 px-4 text-left whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{row.previousStock}</td>
                    <td className="py-2 px-4">{row.receipts}</td>
                    <td className="py-2 px-4">{row.totalStock}</td>
                    <td className="py-2 px-4">{row.currentStock}</td>
                    <td className="py-2 px-4">{row.meterSales}</td>
                    <td className="py-2 px-4">{row.testing}</td>
                    <td className="py-2 px-4">{row.actualSales}</td>
                    <td className="py-2 px-4">{row.dipSales}</td>
                    <td className={`py-2 px-4 font-bold ${parseFloat(row.variation) < 0 ? 'text-red-500' : 'text-green-500'}`}>{row.variation}</td>
                    <td className="py-2 px-4">{row.variLimit}</td>
                    <td className="py-2 px-4">{row.limit}</td>
                    <td className="py-2 px-4">{row.limit4}</td>
                    <td className="py-2 px-4">
                      <Button variant="outline" size="sm" className="h-6 text-[10px]">View</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nozzles Popup */}
      <Dialog open={isNozzleModalOpen} onOpenChange={setIsNozzleModalOpen}>
        <DialogContent className="max-w-4xl bg-[#4338ca] text-white border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-3 bg-blue-800/50">
            <DialogTitle className="text-lg font-bold">Nozzels</DialogTitle>
          </DialogHeader>
          <div className="p-6 grid gap-4 max-h-[70vh] overflow-y-auto">
            {currentNozzles.length === 0 ? (
              <div className="text-center p-4">No nozzles found for this tank.</div>
            ) : (
              currentNozzles.map((n: any) => {
                const reading = nozzleReadings[n.id] || { open_reading: "0", close_reading: "", sale: NaN };
                return (
                  <div key={n.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2 font-bold text-md flex items-center gap-2">
                      <span>{n.pump_station || 'P'}-{n.nozzle_number}</span>
                      <Fuel className="text-orange-400 w-4 h-4" />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px] uppercase opacity-70 font-semibold tracking-wider">Open Reading</Label>
                      <input
                        value={reading.open_reading}
                        onChange={(e) => handleNozzleChange(n.id, 'open_reading', e.target.value)}
                        className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px] uppercase opacity-70 font-semibold tracking-wider">Close Reading</Label>
                      <input
                        value={reading.close_reading}
                        onChange={(e) => handleNozzleChange(n.id, 'close_reading', e.target.value)}
                        className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-[10px] uppercase opacity-70 font-semibold tracking-wider">Sale</Label>
                      <input
                        value={isNaN(reading.sale) ? "NaN" : reading.sale.toFixed(2)}
                        readOnly
                        className="w-full h-8 rounded-sm text-black text-xs px-2 outline-none border-none font-bold bg-gray-100"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="p-4 bg-transparent justify-center">
            <Button onClick={() => setIsNozzleModalOpen(false)} className="bg-[#84cc16] hover:bg-[#65a30d] px-8 font-bold text-white rounded-sm h-8">
              ✓ Ok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
