import { useEffect, useState, useCallback } from "react";
import { Fuel, Trash2, Eye, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function DayAssignings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"lubs" | "nozzles">("lubs");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [recoveryDate, setRecoveryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [employee, setEmployee] = useState<string>("");
  const [shift, setShift] = useState<string>("S-1");
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState("");
  const [productRate, setProductRate] = useState<string>("");
  const [assigned, setAssigned] = useState<string>("");
  const [sold, setSold] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [collected, setCollected] = useState<string>("");
  const [shortage, setShortage] = useState<string>("");
  const [nozzle, setNozzle] = useState("");
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [lubProducts, setLubProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [nozzles, setNozzles] = useState<Array<{ id: string; name: string; tank: string }>>([]);

  const [showAssignsModal, setShowAssignsModal] = useState(false);
  const [selectedNozzles, setSelectedNozzles] = useState<Record<string, boolean>>({});
  const [showPumpCards, setShowPumpCards] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Validation Modal State
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [checkModalMessage, setCheckModalMessage] = useState("");

  // Fetch day assignings data
  const { data: dayAssigningsData, refetch: refetchDayAssignings } = useQuery({
    queryKey: ["/api/day-assignings"],
    queryFn: async () => {
      const response = await fetch('/api/day-assignings', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch day assignings');
      return result.rows || [];
    },
  });

  // Fetch nozzle assignings data
  const { data: nozzleAssigningsData, refetch: refetchNozzleAssignings } = useQuery({
    queryKey: ["/api/nozzle-assignings"],
    queryFn: async () => {
      const response = await fetch('/api/nozzle-assignings', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch nozzle assignings');
      return result.rows || [];
    },
  });

  // Get current rows based on active tab
  const rows = activeTab === "lubs" ? (dayAssigningsData || []) : (nozzleAssigningsData || []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/employees', {
          credentials: 'include'
        });
        const result = await response.json();
        if (result.ok) {
          setEmployees((result.rows || []).map((e: any) => ({ id: e.id, name: e.employee_name || e.id })));
        }
      } catch (e) {
        // ignore transient errors fetching employees
      }
      try {
        const response = await fetch('/api/lubricants', {
          credentials: 'include'
        });
        const result = await response.json();
        if (result.ok) {
          setLubProducts((result.rows || []).map((p: any) => ({ id: p.id, name: p.lubricant_name || p.id })));
        }
      } catch (e) {
        // ignore transient errors fetching lubricants
      }
      try {
        const response = await fetch('/api/nozzles', {
          credentials: 'include'
        });
        const result = await response.json();
        if (result.ok) {
          setNozzles((result.rows || []).map((n: any) => ({
            id: n.id,
            name: n.nozzle_number || n.id,
            tank: n.tank_number || '-'
          })));
        }
      } catch (e) {
        // ignore transient errors fetching nozzles
      }
    })();
  }, []);

  const handleShow = useCallback(async () => {
    try {
      if (activeTab === "lubs") {
        await refetchDayAssignings();
      } else {
        await refetchNozzleAssignings();
      }
    } catch (error) {
      console.error('Error loading rows:', error);
    }
  }, [activeTab, refetchDayAssignings, refetchNozzleAssignings]);

  const onSave = async () => {
    try {
      if (activeTab === "lubs") {
        if (!employee || !product) {
          toast({ title: "Missing", description: "Employee and Product required", variant: "destructive" });
          return;
        }

        const url = selectedId ? `/api/day-assignings/${selectedId}` : '/api/day-assignings';
        const method = selectedId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            assign_date: date,
            recovery_date: recoveryDate || null,
            shift,
            employee_id: employee || null,
            product,
            product_rate: productRate ? Number(productRate) : null,
            assigned: assigned ? Number(assigned) : null,
            sold: sold ? Number(sold) : null,
            balance: balance ? Number(balance) : null,
            collected: collected ? Number(collected) : null,
            shortage: shortage ? Number(shortage) : null,
          })
        });

        const result = await response.json();
        if (!result.ok) {
          toast({ title: "Save failed", description: result.error, variant: "destructive" });
          return;
        }

        toast({ title: selectedId ? "Updated successfully" : "Saved successfully" });
        setOpen(false);
        setSelectedId(null); // Reset selection

        // Refresh data after successful submission
        refetchDayAssignings();
      } else {
        if (!employee || !nozzle) {
          toast({ title: "Missing", description: "Employee and Nozzle required", variant: "destructive" });
          return;
        }

        const response = await fetch('/api/nozzle-assignings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            assign_date: date,
            shift,
            employee_id: employee || null,
            nozzle,
          })
        });

        const result = await response.json();
        if (!result.ok) {
          toast({ title: "Save failed", description: result.error, variant: "destructive" });
          return;
        }

        // Refresh data after successful submission
        refetchNozzleAssignings();
      }

      toast({ title: "Saved successfully" });
      await handleShow(); // Refresh the table data
      setOpen(false); // Close dialog
      // Reset form fields
      setProduct("");
      setProductRate("");
      setAssigned("");
      setSold("");
      setBalance("");
      setCollected("");
      setShortage("");
      setNozzle("");
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleNozzleCheckboxChange = (nozzleId: string, checked: boolean) => {
    setSelectedNozzles(prev => ({
      ...prev,
      [nozzleId]: checked
    }));
  };

  const onSaveNozzles = async () => {
    if (!employee) {
      toast({ title: "Missing", description: "Employee required", variant: "destructive" });
      return;
    }

    const selectedIds = Object.entries(selectedNozzles)
      .filter(([_, checked]) => checked)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      toast({ title: "Missing", description: "Select at least one nozzle", variant: "destructive" });
      return;
    }

    try {
      // Send a request for each selected nozzle
      for (const nozzleId of selectedIds) {
        const nozzleObj = nozzles.find(n => n.id === nozzleId);
        const nozzleValue = nozzleObj ? nozzleObj.name : nozzleId;

        const response = await fetch('/api/nozzle-assignings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            assign_date: date,
            shift,
            employee_id: employee || null,
            nozzle: nozzleValue,
          })
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error);
      }

      toast({ title: "Saved successfully" });
      await handleShow();
      setSelectedNozzles({});
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, type: "lubs" | "nozzles") => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const endpoint = type === "lubs" ? `/api/day-assignings/${id}` : `/api/nozzle-assignings/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to delete");
      }

      toast({ title: "Deleted successfully" });

      if (type === "lubs") {
        refetchDayAssignings();
      } else {
        refetchNozzleAssignings();
      }
    } catch (error) {
      toast({ title: "Delete failed", description: String(error), variant: "destructive" });
    }
  };

  // Group nozzles for display (Mocking P1, P2, P3 groups for UI matching)
  const renderPumpCard = (title: string, icon: React.ReactNode, nozzleList: typeof nozzles) => (
    <div className="bg-blue-600/90 rounded-lg p-4 text-white min-h-[200px]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="font-bold text-lg">{title}</span>
      </div>
      <div className="space-y-3">
        {nozzleList.map(n => (
          <div key={n.id} className="flex items-center justify-between">
            <span className="font-medium">{n.name}</span>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={!!selectedNozzles[n.id]}
              onChange={(e) => handleNozzleCheckboxChange(n.id, e.target.checked)}
            />
          </div>
        ))}
        {nozzleList.length === 0 && <div className="text-sm opacity-70">No nozzles available</div>}
      </div>
    </div>
  );

  // Distribute nozzles for demo (Round robin or just split)
  const p1Nozzles = nozzles.slice(0, Math.ceil(nozzles.length / 3));
  const p2Nozzles = nozzles.slice(Math.ceil(nozzles.length / 3), Math.ceil(nozzles.length * 2 / 3));
  const p3Nozzles = nozzles.slice(Math.ceil(nozzles.length * 2 / 3));

  // Nozzle Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [nozzleDetails, setNozzleDetails] = useState<Array<{ tank: string; pump: string; nozzle: string }>>([]);

  const handleShowDetails = (nozzleString: string) => {
    if (!nozzleString) return;

    // Try to find the nozzle object in our state to get the tank info
    const nozzleObj = nozzles.find(n => n.name === nozzleString);

    let tank = nozzleObj ? nozzleObj.tank : '-';
    let nozzleName = nozzleString;
    let pump = '-';

    // If we found the object, we can also infer the pump group
    if (nozzleObj) {
      if (p1Nozzles.find(n => n.id === nozzleObj.id)) pump = 'P1';
      else if (p2Nozzles.find(n => n.id === nozzleObj.id)) pump = 'P2';
      else if (p3Nozzles.find(n => n.id === nozzleObj.id)) pump = 'P3';
    } else {
      // Fallback parsing if we can't find the object (e.g. if name format was used)
      const parts = nozzleString.split('-');
      if (parts.length > 2) {
        tank = parts[1];
        nozzleName = parts[2];
      }
    }

    setNozzleDetails([{ tank, pump, nozzle: nozzleName }]);
    setDetailsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>{'>'}</span><span>Add Daily Assignings</span></div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-none border-b">
        <button
          onClick={() => setActiveTab("lubs")}
          className={`px-6 py-2 text-sm font-medium transition-colors ${activeTab === "lubs"
            ? "bg-teal-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Lubs Assignings
        </button>
        <button
          onClick={() => setActiveTab("nozzles")}
          className={`px-6 py-2 text-sm font-medium transition-colors ${activeTab === "nozzles"
            ? "bg-teal-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Nozzels Assigning
        </button>
      </div>

      {activeTab === "lubs" ? (
        /* Lubricants Recovery Form */
        <Card className="bg-blue-700 text-white border-none rounded-md shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-xl font-semibold">Lubricants Recovery</CardTitle>
              <Button
                onClick={() => setOpen(true)}
                className="bg-white text-black hover:bg-gray-100 rounded-full px-4 py-1 h-8 text-sm font-bold flex items-center gap-1"
              >
                Add Assignings <span className="text-green-600 text-lg">+</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 flex items-center gap-0 bg-white rounded-md overflow-hidden">
                <div className="bg-yellow-400 text-black font-medium px-4 py-2 h-10 flex items-center">Date</div>
                <Input
                  type="date"
                  value={recoveryDate}
                  onChange={(e) => setRecoveryDate(e.target.value)}
                  className="border-none focus-visible:ring-0 h-10 rounded-none text-black"
                />
              </div>
              <div className="col-span-3">
                <Select value={employee} onValueChange={setEmployee}>
                  <SelectTrigger className="bg-white text-black h-10 border-none">
                    <SelectValue placeholder="Choose Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4 border border-white/30 rounded-md px-4 py-2 flex items-center justify-center gap-6">
                <label className="flex items-center cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 border-white mr-2 flex items-center justify-center ${shift === 'S-1' ? 'bg-white' : ''}`}>
                    {shift === 'S-1' && <div className="w-2 h-2 rounded-full bg-blue-700" />}
                  </div>
                  <input type="radio" name="shift" value="S-1" checked={shift === "S-1"} onChange={(e) => setShift(e.target.value)} className="hidden" />
                  S-1
                </label>
                <label className="flex items-center cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 border-white mr-2 flex items-center justify-center ${shift === 'S-2' ? 'bg-white' : ''}`}>
                    {shift === 'S-2' && <div className="w-2 h-2 rounded-full bg-blue-700" />}
                  </div>
                  <input type="radio" name="shift" value="S-2" checked={shift === "S-2"} onChange={(e) => setShift(e.target.value)} className="hidden" />
                  S-2
                </label>
              </div>
              <div className="col-span-2">
                <Button
                  onClick={() => setShowAssignsModal(true)}
                  className="bg-transparent border border-white/50 hover:bg-white/10 text-white w-full flex items-center justify-between px-3"
                >
                  Show Assigns <Network className="w-5 h-5 text-yellow-400" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Nozzles Assigning Form */
        <div className="space-y-6">
          <Card className="bg-blue-600 text-white border-none rounded-md shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-xl font-semibold">Nozzels Assign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 flex items-center gap-0 bg-white rounded-md overflow-hidden">
                  <div className="bg-yellow-400 text-black font-medium px-4 py-2 h-10 flex items-center">Date</div>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-none focus-visible:ring-0 h-10 rounded-none text-black"
                  />
                </div>
                <div className="col-span-3">
                  <Select value={employee} onValueChange={setEmployee}>
                    <SelectTrigger className="bg-white text-black h-10 border-none">
                      <SelectValue placeholder="Choose Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 border border-white/30 rounded-md px-4 py-2 flex items-center justify-center gap-6">
                  <label className="flex items-center cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 border-white mr-2 flex items-center justify-center ${shift === 'S-1' ? 'bg-white' : ''}`}>
                      {shift === 'S-1' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <input type="radio" name="shift" value="S-1" checked={shift === "S-1"} onChange={(e) => setShift(e.target.value)} className="hidden" />
                    S-1
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 border-white mr-2 flex items-center justify-center ${shift === 'S-2' ? 'bg-white' : ''}`}>
                      {shift === 'S-2' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <input type="radio" name="shift" value="S-2" checked={shift === "S-2"} onChange={(e) => setShift(e.target.value)} className="hidden" />
                    S-2
                  </label>
                </div>
                <div className="col-span-2">
                  <Button
                    onClick={() => {
                      if (!date) {
                        setCheckModalMessage("Please select the date");
                        setCheckModalOpen(true);
                        return;
                      }
                      if (!employee) {
                        setCheckModalMessage("Please select the employee");
                        setCheckModalOpen(true);
                        return;
                      }
                      // Shift is usually pre-selected, but good to check
                      if (!shift) {
                        setCheckModalMessage("Please select the shift");
                        setCheckModalOpen(true);
                        return;
                      }

                      handleShow();
                      setShowPumpCards(true);
                    }}
                    className="bg-transparent border border-white/50 hover:bg-white/10 text-white w-full flex items-center justify-between px-3"
                  >
                    Show Nozzels <Fuel className="w-5 h-5 text-red-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pump Cards Grid */}
          {showPumpCards && (
            <>
              <div className="grid grid-cols-3 gap-6">
                {renderPumpCard("P1", <Fuel className="w-8 h-8" />, p1Nozzles)}
                {renderPumpCard("P2", <Fuel className="w-8 h-8" />, p2Nozzles)}
                {renderPumpCard("P3", <Fuel className="w-8 h-8" />, p3Nozzles)}
              </div>

              <div className="flex justify-center">
                <Button onClick={onSaveNozzles} className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-md font-bold text-lg">
                  ✓ Submit
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Search/Filter Section */}
      <Card className="border shadow-sm">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-800 font-medium">Search From</span>
              <Input placeholder="Filter Date" type="date" className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-800 font-medium">To</span>
              <Input placeholder="Filter Date" type="date" className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-800 font-medium">Employee</span>
              <Select>
                <SelectTrigger className="w-56 bg-white">
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6">
                🔍 Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Show:</span>
                <Select>
                  <SelectTrigger className="w-20 h-8">
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
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">Copy</Button>
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">CSV</Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">PDF</Button>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">Print</Button>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-gray-600">Filter:</span>
                <Input placeholder="Type to filter..." className="w-56 h-8 bg-gray-50" />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                {activeTab === "lubs" ? (
                  <>
                    <TableHead className="w-10"><input type="checkbox" /></TableHead>
                    <TableHead className="w-10">^</TableHead>
                    <TableHead className="font-bold text-black">S.No</TableHead>
                    <TableHead className="font-bold text-black">Date</TableHead>
                    <TableHead className="font-bold text-black">Shift</TableHead>
                    <TableHead className="font-bold text-black">Employee</TableHead>
                    <TableHead className="font-bold text-black">Product</TableHead>
                    <TableHead className="font-bold text-black">Product Rate</TableHead>
                    <TableHead className="font-bold text-black">Assigned</TableHead>
                    <TableHead className="font-bold text-black">Sold</TableHead>
                    <TableHead className="font-bold text-black">Balance</TableHead>
                    <TableHead className="font-bold text-black">Collected</TableHead>
                    <TableHead className="font-bold text-black">Shortage</TableHead>
                    <TableHead className="font-bold text-black">Action</TableHead>
                    <TableHead className="font-bold text-black">User Log Details</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-bold text-black">S.No</TableHead>
                    <TableHead className="font-bold text-black">Action</TableHead>
                    <TableHead className="font-bold text-black">Date</TableHead>
                    <TableHead className="font-bold text-black">Shift</TableHead>
                    <TableHead className="font-bold text-black">Employee</TableHead>
                    <TableHead className="font-bold text-black">Nozzels</TableHead>
                    <TableHead className="font-bold text-black">User Log Details</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeTab === "lubs" ? dayAssigningsData : nozzleAssigningsData)?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === "lubs" ? 15 : 7} className="text-center text-muted-foreground h-24">
                    No data available in table
                  </TableCell>
                </TableRow>
              ) : (
                (activeTab === "lubs" ? dayAssigningsData : nozzleAssigningsData)?.map((r: any, idx: number) => (
                  <TableRow key={r.id || idx} className="hover:bg-gray-50">
                    {activeTab === "lubs" ? (
                      <>
                        <TableCell><input type="checkbox" /></TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{r.assign_date ? new Date(r.assign_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{r.shift || '-'}</TableCell>
                        <TableCell>{r.employee_id || '-'}</TableCell>
                        <TableCell>{r.product || '-'}</TableCell>
                        <TableCell>{r.product_rate || '-'}</TableCell>
                        <TableCell>{r.assigned || '-'}</TableCell>
                        <TableCell>{r.sold || '-'}</TableCell>
                        <TableCell>{r.balance || '-'}</TableCell>
                        <TableCell>{r.collected || '-'}</TableCell>
                        <TableCell>{r.shortage || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(r.id, "lubs")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell>-</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleDelete(r.id, "nozzles")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell>{r.assign_date ? new Date(r.assign_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{r.shift || '-'}</TableCell>
                        <TableCell>{r.employee_id || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 hover:bg-transparent"
                            onClick={() => handleShowDetails(r.nozzle)}
                          >
                            <span className="text-blue-500 text-lg">👁️</span>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-500">
                            <div>Created: {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</div>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )) || []
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Showing 0 to 0 of 0 entries
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">←</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-gray-200 text-black border-gray-300">1</Button>
              <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">→</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Lub Assigning Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lub Assigning</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {lubProducts.length > 0 ? (
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>
                  {lubProducts.map(p => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            ) : (
              <Input placeholder="Product" value={product} onChange={(e) => setProduct(e.target.value)} />
            )}
            <Input placeholder="Product Rate" value={productRate} onChange={(e) => setProductRate(e.target.value)} />
            <Input placeholder="Assigned" value={assigned} onChange={(e) => setAssigned(e.target.value)} />
            <Input placeholder="Sold" value={sold} onChange={(e) => setSold(e.target.value)} />
            <Input placeholder="Balance" value={balance} onChange={(e) => setBalance(e.target.value)} />
            <Input placeholder="Collected" value={collected} onChange={(e) => setCollected(e.target.value)} />
            <Input placeholder="Shortage" value={shortage} onChange={(e) => setShortage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Assigns Modal */}
      <Dialog open={showAssignsModal} onOpenChange={setShowAssignsModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="bg-blue-600 text-white p-4 -m-6 mb-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <DialogTitle>Select Day recovery</DialogTitle>
              <button onClick={() => setShowAssignsModal(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
          </DialogHeader>

          <div className="py-8 text-center">
            {/* Logic to show content or "No Found" message */}
            {/* For now, we'll show the "No Found" message as per screenshot if no data, or list if data exists */}
            {dayAssigningsData && dayAssigningsData.length > 0 ? (
              <div className="text-left px-4">
                <div className="text-green-600 font-medium text-center mb-4">
                  Found {dayAssigningsData.length} assignings.
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded p-2 bg-gray-50">
                  {dayAssigningsData.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-sm border-b pb-2 last:border-0 cursor-pointer hover:bg-blue-50 p-1 rounded"
                      onClick={() => {
                        // Populate form for editing/recovery
                        setSelectedId(item.id);
                        setDate(item.assign_date ? new Date(item.assign_date).toISOString().split('T')[0] : '');
                        setRecoveryDate(item.recovery_date ? new Date(item.recovery_date).toISOString().split('T')[0] : '');
                        setShift(item.shift || '');
                        setEmployee(item.employee_id || '');
                        setProduct(item.product || '');
                        setProductRate(item.product_rate || '');
                        setAssigned(item.assigned || '');
                        setSold(item.sold || '');
                        setBalance(item.balance || '');
                        setCollected(item.collected || '');
                        setShortage(item.shortage || '');

                        setShowAssignsModal(false);
                        setOpen(true); // Open the Add/Edit dialog
                      }}
                    >
                      <div className="font-semibold text-blue-600">{item.product}</div>
                      <div className="text-gray-600 flex justify-between">
                        <span>{new Date(item.assign_date).toLocaleDateString()} ({item.shift})</span>
                        <span>{item.employee_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-red-500 font-medium text-lg">
                No Lubricant Assignings Found!
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-center gap-4 sm:justify-center">
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white min-w-[120px]"
              onClick={async () => {
                // Logic to get assignings
                await handleShow();
                toast({ title: "Data refreshed" });
                setShowAssignsModal(false);
              }}
            >
              Get Assignings
            </Button>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white min-w-[100px]"
              onClick={() => setShowAssignsModal(false)}
            >
              ✖ Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nozzle Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <div className="bg-blue-600 p-3 flex justify-between items-center text-white">
            <h2 className="text-lg font-semibold">Nozzels Details</h2>
            <button onClick={() => setDetailsModalOpen(false)} className="text-white hover:text-gray-200">✕</button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-2 font-bold text-red-700 text-sm">
              <div>Tank</div>
              <div>Pump</div>
              <div>Nozzel</div>
            </div>
            {nozzleDetails.map((detail, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-4 mb-2 text-sm font-bold">
                <div>{detail.tank}</div>
                <div>{detail.pump}</div>
                <div>{detail.nozzle}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Check Yourself Validation Modal */}
      <Dialog open={checkModalOpen} onOpenChange={setCheckModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-0 overflow-hidden rounded-lg">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 uppercase tracking-wide">CHECK YOURSELF</h2>
            <p className="text-gray-600 text-lg">{checkModalMessage}</p>
            <div className="pt-2">
              <Button
                onClick={() => setCheckModalOpen(false)}
                className="bg-cyan-400 hover:bg-cyan-500 text-white px-8 py-2 rounded-md font-bold"
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

