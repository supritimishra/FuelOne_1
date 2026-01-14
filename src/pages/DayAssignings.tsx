import { useEffect, useState, useCallback } from "react";
import { Fuel, Trash2, Eye, Network, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Mock P1, P2, P3 Icons or Indicators
const PumpIcon = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
      <Fuel className="w-3 h-3" />
      <span>{label}</span>
    </div>
  </div>
);

export default function DayAssignings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"lubs" | "nozzles">("lubs");

  // Nozzles State
  const [nozzleDate, setNozzleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nozzleEmployee, setNozzleEmployee] = useState<string>("");
  const [nozzleShift, setNozzleShift] = useState<string>("S-1");
  const [showPumpCards, setShowPumpCards] = useState(false);
  const [selectedNozzles, setSelectedNozzles] = useState<Record<string, boolean>>({});

  // Lubs State
  const [lubDate, setLubDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [lubRecoveryDate, setLubRecoveryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [lubEmployee, setLubEmployee] = useState<string>("");
  const [lubShift, setLubShift] = useState<string>("S-1");
  const [lubModalOpen, setLubModalOpen] = useState(false);
  const [showAssignsModal, setShowAssignsModal] = useState(false);

  // Lub Form State
  const [product, setProduct] = useState("");
  const [productRate, setProductRate] = useState<string>("");
  const [assigned, setAssigned] = useState<string>("");
  const [sold, setSold] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [collected, setCollected] = useState<string>("");
  const [shortage, setShortage] = useState<string>("");
  const [editingLubId, setEditingLubId] = useState<string | null>(null);

  // Data State
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [lubProducts, setLubProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [nozzlesList, setNozzlesList] = useState<Array<{ id: string; name: string; tank: string }>>([]);

  // Fetch day assignings data (Lubs)
  const { data: dayAssigningsData, refetch: refetchDayAssignings } = useQuery({
    queryKey: ["/api/day-assignings"],
    queryFn: async () => {
      const response = await fetch('/api/day-assignings');
      const result = await response.json();
      return result.ok ? (result.rows || []) : [];
    },
  });

  // Fetch nozzle assignings data
  const { data: nozzleAssigningsData, refetch: refetchNozzleAssignings } = useQuery({
    queryKey: ["/api/nozzle-assignings"],
    queryFn: async () => {
      const response = await fetch('/api/nozzle-assignings');
      const result = await response.json();
      return result.ok ? (result.rows || []) : [];
    },
  });

  // Initial Data Fetch
  useEffect(() => {
    (async () => {
      try {
        const empRes = await fetch('/api/employees');
        const empData = await empRes.json();
        if (empData.ok) setEmployees((empData.rows || []).map((e: any) => ({ id: e.id, name: e.employee_name })));

        const lubRes = await fetch('/api/lubricants');
        const lubData = await lubRes.json();
        if (lubData.ok) setLubProducts((lubData.rows || []).map((p: any) => ({ id: p.id, name: p.lubricant_name })));

        const nozzleRes = await fetch('/api/nozzles-list');
        const nozzleData = await nozzleRes.json();
        if (nozzleData.ok) {
          setNozzlesList((nozzleData.rows || []).map((n: any) => ({
            id: n.id,
            name: n.nozzle_number,
            tank: n.tank_number || '-'
          })));
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      }
    })();
  }, []);

  // Lubs: Handle Save
  const onSaveLub = async () => {
    if (!lubEmployee || !product) {
      toast({ title: "Validation Error", description: "Employee and Product are required", variant: "destructive" });
      return;
    }

    try {
      const url = editingLubId ? `/api/day-assignings/${editingLubId}` : '/api/day-assignings';
      const method = editingLubId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assign_date: lubDate,
          recovery_date: lubRecoveryDate,
          shift: lubShift,
          employee_id: lubEmployee,
          product,
          product_rate: productRate ? Number(productRate) : 0,
          assigned: assigned ? Number(assigned) : 0,
          sold: sold ? Number(sold) : 0,
          balance: balance ? Number(balance) : 0,
          collected: collected ? Number(collected) : 0,
          shortage: shortage ? Number(shortage) : 0,
        })
      });

      const result = await response.json();
      if (result.ok) {
        toast({ title: "Success", description: "Lub assignment saved successfully" });
        setLubModalOpen(false);
        setEditingLubId(null);
        refetchDayAssignings();
        // Reset form
        setProduct(""); setProductRate(""); setAssigned(""); setSold(""); setBalance(""); setCollected(""); setShortage("");
      } else {
        toast({ title: "Error", description: result.error || "Failed to save", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  // Nozzles: Handle Show (Validate and Show Cards)
  const handleShowNozzles = () => {
    if (!nozzleDate || !nozzleEmployee || !nozzleShift) {
      toast({ title: "Validation", description: "Please select Date, Employee and Shift", variant: "destructive" });
      return;
    }
    setShowPumpCards(true);
  };

  // Nozzles: Handle Checkbox
  const toggleNozzle = (id: string, checked: boolean) => {
    setSelectedNozzles(prev => ({ ...prev, [id]: checked }));
  };

  // Nozzles: Submit
  const onSubmitNozzles = async () => {
    const selectedIds = Object.keys(selectedNozzles).filter(k => selectedNozzles[k]);
    if (selectedIds.length === 0) {
      toast({ title: "Validation", description: "Please select at least one nozzle", variant: "destructive" });
      return;
    }

    try {
      // Loop or batch? API seems to handle single. We'll loop for now as per previous implementation logic
      for (const nid of selectedIds) {
        const nozzleObj = nozzlesList.find(n => n.id === nid);
        const nozzleName = nozzleObj ? nozzleObj.name : nid;

        await fetch('/api/nozzle-assignings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assign_date: nozzleDate,
            shift: nozzleShift,
            employee_id: nozzleEmployee,
            nozzle: nozzleName
          })
        });
      }

      toast({ title: "Success", description: "Nozzles assigned successfully" });
      setSelectedNozzles({});
      setShowPumpCards(false);
      refetchNozzleAssignings();
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit nozzles", variant: "destructive" });
    }
  };

  // Delete Handler
  const handleDelete = async (id: string, type: "lubs" | "nozzles") => {
    if (!confirm("Delete this record?")) return;
    const url = type === "lubs" ? `/api/day-assignings/${id}` : `/api/nozzle-assignings/${id}`;

    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: "Deleted" });
        type === "lubs" ? refetchDayAssignings() : refetchNozzleAssignings();
      } else {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  // Render Pump Cards (Splitting nozzles into P1, P2, P3 for demo matching UI)
  const renderPumpSection = () => {
    const chunkSize = Math.ceil(nozzlesList.length / 3);
    const p1 = nozzlesList.slice(0, chunkSize);
    const p2 = nozzlesList.slice(chunkSize, chunkSize * 2);
    const p3 = nozzlesList.slice(chunkSize * 2);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[{ title: 'P1', list: p1 }, { title: 'P2', list: p2 }, { title: 'P3', list: p3 }].map((pump, idx) => (
          <div key={idx} className="bg-[#4361ee]/40 border border-white/20 rounded-lg p-4 text-white">
            <PumpIcon label={pump.title} />
            <div className="space-y-2">
              {pump.list.map(n => (
                <div key={n.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{n.name} (Tank: {n.tank})</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                    checked={!!selectedNozzles[n.id]}
                    onChange={(e) => toggleNozzle(n.id, e.target.checked)}
                  />
                </div>
              ))}
              {pump.list.length === 0 && <span className="text-xs opacity-50">No nozzles</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-semibold text-gray-900">Dashboard</span>
        <span>{'>'}</span>
        <span>Add Daily Assignings</span>
      </div>

      {/* TABS */}
      <div className="flex bg-white rounded-t-md border-b w-fit">
        <button
          onClick={() => setActiveTab("lubs")}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${activeTab === "lubs" ? "bg-teal-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          Lubs Assignings
        </button>
        <button
          onClick={() => setActiveTab("nozzles")}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${activeTab === "nozzles" ? "bg-teal-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          Nozzels Assigning
        </button>
      </div>

      {/* CONTENT AREA */}
      {activeTab === "lubs" ? (
        <Card className="bg-[#4361ee] text-white border-none rounded-b-md shadow-lg rounded-tr-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
            <CardTitle className="text-white text-lg font-bold">Lubricants Recovery</CardTitle>
            <Button
              onClick={() => { setEditingLubId(null); setLubModalOpen(true); }}
              className="bg-white text-[#4361ee] hover:bg-gray-100 font-bold rounded-full h-8 px-4 text-xs"
            >
              Add Assignings <span className="ml-1 text-green-600 text-sm font-extrabold">+</span>
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Date */}
              <div className="md:col-span-3 flex rounded-md overflow-hidden bg-white h-9">
                <div className="bg-[#fbce07] text-black font-bold px-3 flex items-center text-sm w-16 justify-center">Date</div>
                <Input
                  type="date"
                  value={lubDate}
                  onChange={(e) => setLubDate(e.target.value)}
                  className="border-none focus-visible:ring-0 text-gray-800 h-full rounded-none"
                />
              </div>

              {/* Recovery Date */}
              <div className="md:col-span-3 flex rounded-md overflow-hidden bg-white h-9">
                <div className="bg-[#fbce07] text-black font-bold px-2 flex items-center text-xs justify-center whitespace-nowrap">Recovery Date</div>
                <Input
                  type="date"
                  value={lubRecoveryDate}
                  onChange={(e) => setLubRecoveryDate(e.target.value)}
                  className="border-none focus-visible:ring-0 text-gray-800 h-full rounded-none"
                />
              </div>

              {/* Employee */}
              <div className="md:col-span-3">
                <Select value={lubEmployee} onValueChange={setLubEmployee}>
                  <SelectTrigger className="bg-white text-gray-800 border-none h-9">
                    <SelectValue placeholder="Choose Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Shift Radio */}
              <div className="md:col-span-2 border border-white/30 rounded h-9 flex items-center justify-center gap-4 px-2">
                <label className="flex items-center gap-1 cursor-pointer text-sm font-bold">
                  <div className={`w-4 h-4 rounded-full border border-white flex items-center justify-center ${lubShift === 'S-1' ? 'bg-white' : ''}`}>
                    {lubShift === 'S-1' && <div className="w-2 h-2 rounded-full bg-[#4361ee]" />}
                  </div>
                  S-1
                  <input type="radio" className="hidden" value="S-1" checked={lubShift === 'S-1'} onChange={(e) => setLubShift(e.target.value)} />
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-sm font-bold">
                  <div className={`w-4 h-4 rounded-full border border-white flex items-center justify-center ${lubShift === 'S-2' ? 'bg-white' : ''}`}>
                    {lubShift === 'S-2' && <div className="w-2 h-2 rounded-full bg-[#4361ee]" />}
                  </div>
                  S-2
                  <input type="radio" className="hidden" value="S-2" checked={lubShift === 'S-2'} onChange={(e) => setLubShift(e.target.value)} />
                </label>
              </div>

              {/* Show Assigns */}
              <div className="md:col-span-1">
                <Button onClick={() => setShowAssignsModal(true)} variant="outline" className="w-full bg-transparent border-white text-white hover:bg-white/10 h-9 px-2 text-xs font-bold flex gap-1">
                  Show <Network className="w-3 h-3 text-[#fbce07]" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#4361ee] text-white border-none rounded-b-md shadow-lg rounded-tr-md">
          <CardHeader className="pb-2 border-b border-white/10">
            <CardTitle className="text-white text-lg font-bold">Nozzels Assign</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Date */}
              <div className="md:col-span-4 flex rounded-md overflow-hidden bg-white h-9">
                <div className="bg-[#fbce07] text-black font-bold px-4 flex items-center text-sm">Date</div>
                <Input
                  type="date"
                  value={nozzleDate}
                  onChange={(e) => setNozzleDate(e.target.value)}
                  className="border-none focus-visible:ring-0 text-gray-800 h-full rounded-none"
                />
              </div>

              {/* Employee */}
              <div className="md:col-span-3">
                <Select value={nozzleEmployee} onValueChange={setNozzleEmployee}>
                  <SelectTrigger className="bg-white text-gray-800 border-none h-9">
                    <SelectValue placeholder="Choose Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Shift */}
              <div className="md:col-span-3 border border-white/30 rounded h-9 flex items-center justify-center gap-4 px-2">
                <label className="flex items-center gap-1 cursor-pointer text-sm font-bold">
                  <div className={`w-4 h-4 rounded-full border border-white flex items-center justify-center ${nozzleShift === 'S-1' ? 'bg-white' : ''}`}>
                    {nozzleShift === 'S-1' && <div className="w-2 h-2 rounded-full bg-[#4361ee]" />}
                  </div>
                  S-1
                  <input type="radio" className="hidden" value="S-1" checked={nozzleShift === 'S-1'} onChange={(e) => setNozzleShift(e.target.value)} />
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-sm font-bold">
                  <div className={`w-4 h-4 rounded-full border border-white flex items-center justify-center ${nozzleShift === 'S-2' ? 'bg-white' : ''}`}>
                    {nozzleShift === 'S-2' && <div className="w-2 h-2 rounded-full bg-[#4361ee]" />}
                  </div>
                  S-2
                  <input type="radio" className="hidden" value="S-2" checked={nozzleShift === 'S-2'} onChange={(e) => setNozzleShift(e.target.value)} />
                </label>
              </div>

              {/* Show Nozzles Button */}
              <div className="md:col-span-2">
                <Button onClick={handleShowNozzles} variant="outline" className="w-full bg-transparent border-white text-white hover:bg-white/10 h-9 px-2 text-xs font-bold flex gap-1">
                  Show Nozzels <Fuel className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </div>

            {/* EXPANDABLE SECTION (Mocking the popup/expanded view) */}
            {showPumpCards && (
              <div className="mt-4 border-t border-white/20 pt-4">
                {renderPumpSection()}
                <div className="flex justify-center mt-6">
                  <Button onClick={onSubmitNozzles} className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold h-9 px-8 rounded">
                    ✓ Submit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FILTER & TABLE SECTION */}
      <Card className="rounded-md shadow border">
        <CardContent className="p-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">Search From</span>
              <Input type="date" className="h-8 w-36" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">To</span>
              <Input type="date" className="h-8 w-36" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">Filter Date</span>
              <Input type="date" className="h-8 w-36" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">Employee</span>
              <Select>
                <SelectTrigger className="h-8 w-40 bg-white"><SelectValue placeholder="Choose employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 px-6 text-xs">
              🔍 Search
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-800 text-xs">S.No</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs">Action</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs">Date</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs">Shift</TableHead>
                  <TableHead className="font-bold text-gray-800 text-xs">Employee</TableHead>
                  {activeTab === "lubs" ? (
                    <>
                      <TableHead className="font-bold text-gray-800 text-xs">Product</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs">Rate</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs">Assigned</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs text-right">User Log Details</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="font-bold text-gray-800 text-xs">Nozzels</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs text-right">User Log Details</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab === "lubs" ? (
                  dayAssigningsData?.length ? dayAssigningsData.map((d: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-50 border-b">
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDelete(d.id, "lubs")}><Trash2 className="w-3 h-3" /></Button>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{d.assign_date ? new Date(d.assign_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-xs">{d.shift}</TableCell>
                      <TableCell className="text-xs">{d.employee_id}</TableCell>
                      <TableCell className="text-xs text-blue-600 font-bold">{d.product}</TableCell>
                      <TableCell className="text-xs">{d.product_rate}</TableCell>
                      <TableCell className="text-xs">{d.assigned}</TableCell>
                      <TableCell className="text-xs text-right text-gray-500">Created by Admin</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={9} className="text-center py-6 text-xs text-gray-500">No data available</TableCell></TableRow>
                ) : (
                  nozzleAssigningsData?.length ? nozzleAssigningsData.map((d: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-50 border-b">
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDelete(d.id, "nozzles")}><Trash2 className="w-3 h-3" /></Button>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{d.assign_date ? new Date(d.assign_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-xs">{d.shift}</TableCell>
                      <TableCell className="text-xs">{d.employee_id}</TableCell>
                      <TableCell className="text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-500" /> <span className="text-blue-600 font-bold">{d.nozzle}</span>
                      </TableCell>
                      <TableCell className="text-xs text-right text-gray-500">Created by Admin</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={7} className="text-center py-6 text-xs text-gray-500">No data available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lubs Add/Edit Dialog */}
      <Dialog open={lubModalOpen} onOpenChange={setLubModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLubId ? "Edit" : "Add"} Lub Assigning</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
              <SelectContent>{lubProducts.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Rate" value={productRate} onChange={(e) => setProductRate(e.target.value)} />
            <Input placeholder="Assigned Qty" value={assigned} onChange={(e) => setAssigned(e.target.value)} />
            <Input placeholder="Sold" value={sold} onChange={(e) => setSold(e.target.value)} />
            <Input placeholder="Balance" value={balance} onChange={(e) => setBalance(e.target.value)} />
            <Input placeholder="Collected" value={collected} onChange={(e) => setCollected(e.target.value)} />
            <Input placeholder="Shortage" value={shortage} onChange={(e) => setShortage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLubModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#4361ee]" onClick={onSaveLub}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Assigns (Lubs) Details Modal (Simplistic view) */}
      <Dialog open={showAssignsModal} onOpenChange={setShowAssignsModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assigned Lubs</DialogTitle></DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            {dayAssigningsData?.length ? (
              dayAssigningsData.map((d: any, i: number) => (
                <div key={i} className="border-b p-2 flex justify-between text-sm">
                  <span>{d.product}</span>
                  <span className="font-bold">{d.assigned}</span>
                </div>
              ))
            ) : <div className="text-center text-gray-500">No data found</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
