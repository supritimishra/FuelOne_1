import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function SwipeUI() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for form fields
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [totalValue, setTotalValue] = useState<string>("");

  // Auto-fill
  const [autoFillEmployee, setAutoFillEmployee] = useState<string>("");
  const [autoFillSwipeType, setAutoFillSwipeType] = useState<string>("");

  // Single Entry Row
  const [employee, setEmployee] = useState<string>("");
  const [swipeMode, setSwipeMode] = useState<string>("");
  const [batchNo, setBatchNo] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Filters
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [filterSwipeMode, setFilterSwipeMode] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    }
  });

  // Fetch swipe machines
  const { data: swipeMachinesData } = useQuery({
    queryKey: ["/api/swipe-machines"],
    queryFn: async () => {
      const response = await fetch('/api/swipe-machines', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch swipe machines');
      return result.rows || [];
    }
  });

  // Fetch swipe transactions
  // Use /api/swipe-transactions (MongoDB backend) instead of /api/swipe-sales which might be the old postgres one or non-existent
  const { data: swipeTransactionsData, refetch } = useQuery({
    queryKey: ["/api/swipe-transactions", searchFrom, searchTo, filterSwipeMode],
    queryFn: async () => {
      let url = `/api/swipe-transactions?mode=${filterSwipeMode}`;
      if (searchFrom) url += `&from=${searchFrom}`;
      if (searchTo) url += `&to=${searchTo}`;

      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch swipe transactions');
      return result.rows || [];
    }
  });

  const swipeTransactionsRows = swipeTransactionsData || [];
  const employees = employeesData || [];
  const swipeMachines = swipeMachinesData || [];

  // Auto-fill logic
  useEffect(() => {
    if (autoFillEmployee) {
      setEmployee(autoFillEmployee);
    }
  }, [autoFillEmployee]);

  useEffect(() => {
    if (autoFillSwipeType) {
      setSwipeMode(autoFillSwipeType);
    }
  }, [autoFillSwipeType]);

  // Total Value Sync
  useEffect(() => {
    const val = parseFloat(amount);
    setTotalValue(isNaN(val) ? "" : val.toFixed(2));
  }, [amount]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile(reader.result as string);
        toast({ title: "File uploaded successfully" });
      };
      reader.readAsDataURL(file);
    }
  };

  const createSwipeTransaction = useMutation({
    mutationFn: async () => {
      const payload = {
        employee_id: employee,
        swipe_type: autoFillSwipeType || "Card",
        swipe_mode: swipeMode,
        batch_number: batchNo || "0",
        amount: parseFloat(amount),
        transaction_date: saleDate,
        shift: shift,
        note: note,
        image_url: uploadedFile
      };

      const response = await fetch('/api/swipe-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to save');
      return result;
    },
    onSuccess: () => {
      toast({ title: "Saved successfully", className: "bg-green-500 text-white" });
      if (!autoFillEmployee) setEmployee("");
      // Keep swipe mode if needed or reset? Resetting for fresh entry
      if (!autoFillSwipeType) setSwipeMode("");
      setBatchNo("");
      setAmount("");
      setNote("");
      setUploadedFile(null);
      refetch();
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const handleConfirm = () => {
    if (!employee || !amount || !swipeMode) {
      toast({ title: "Validation Error", description: "Please fill Employee, Swipe Mode and Amount", variant: "destructive" });
      return;
    }
    createSwipeTransaction.mutate();
  };

  // Filter local rows by text search
  const filteredRows = swipeTransactionsRows.filter((r: any) => {
    if (!searchText) return true;
    const s = searchText.toLowerCase();
    return (
      (r.employee_name && r.employee_name.toLowerCase().includes(s)) ||
      (r.swipe_mode && r.swipe_mode.toLowerCase().includes(s)) ||
      (r.amount && String(r.amount).includes(s))
    );
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-semibold text-gray-700">Dashboard</span>
        <span>{'>'}</span>
        <span>Swipe</span>
      </div>

      {/* Main Card */}
      <Card className="border-none shadow-md overflow-hidden bg-blue-600">
        <div className="p-4">
          <h2 className="text-white text-xl font-semibold mb-6">Swipe</h2>

          {/* Top Row: Date, Shift, Total Value */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="flex items-center">
              <div className="bg-[#fbbf24] text-black font-medium px-4 py-2 rounded-l-md text-sm whitespace-nowrap">
                Choose Date
              </div>
              <Input
                type="date"
                className="rounded-l-none rounded-r-md border-none h-[36px] w-[180px]"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>

            <div className="flex-1 bg-white/20 rounded-md p-2 flex items-center justify-center gap-6 border border-white/30 text-white min-w-[200px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="shift" checked={shift === 'S-1'} onChange={() => setShift('S-1')} className="accent-white w-4 h-4" />
                <span className="font-medium">S-1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="shift" checked={shift === 'S-2'} onChange={() => setShift('S-2')} className="accent-white w-4 h-4" />
                <span className="font-medium">S-2</span>
              </label>
            </div>

            <div className="bg-white rounded-md h-[36px] w-[200px] flex items-center px-3 text-gray-700">
              {totalValue || "0"}
            </div>
          </div>

          {/* Auto Fill Container */}
          <div className="border border-white/30 rounded-lg p-4 mb-4 relative">
            <span className="absolute -top-3 left-4 bg-blue-600 px-2 text-white text-sm font-medium">AUTO-FILL</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-white text-xs">Employee</Label>
                <Select value={autoFillEmployee} onValueChange={setAutoFillEmployee}>
                  <SelectTrigger className="bg-white text-gray-700 border-none h-9">
                    <SelectValue placeholder="choose Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-white text-xs">Swipe Type</Label>
                <Select value={autoFillSwipeType} onValueChange={setAutoFillSwipeType}>
                  <SelectTrigger className="bg-white text-gray-700 border-none h-9">
                    <SelectValue placeholder="Choose Swipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="QR">QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Entry Row */}
          <div className="grid grid-cols-12 gap-2 items-end mb-8">
            <div className="col-span-12 md:col-span-2">
              <Label className="text-white text-xs mb-1 block">Employee</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-gray-700 border-none h-9">
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 md:col-span-2">
              <Label className="text-white text-xs mb-1 block">Swipe Mode</Label>
              <Select value={swipeMode} onValueChange={setSwipeMode}>
                <SelectTrigger className="bg-white text-gray-700 border-none h-9">
                  <SelectValue placeholder="Swipe Mode" />
                </SelectTrigger>
                <SelectContent>
                  {swipeMachines.map((m: any) => (
                    <SelectItem key={m.machine_name} value={m.machine_name}>{m.machine_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-6 md:col-span-1">
              <Label className="text-white text-xs mb-1 block">Batch No</Label>
              <Input className="h-9 bg-white border-none text-gray-700" placeholder="0" value={batchNo} onChange={e => setBatchNo(e.target.value)} />
            </div>
            <div className="col-span-6 md:col-span-2">
              <Label className="text-white text-xs mb-1 block">Amount</Label>
              <Input className="h-9 bg-white border-none text-gray-700" placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-4 relative">
              <div className="flex justify-between items-center mb-1">
                <Label className="text-white text-xs">Note</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white h-5 text-[10px] px-2 rounded-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  UPLOAD
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
              </div>
              <Input className="h-9 bg-white border-none text-gray-700" placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-1 flex justify-center pb-1">
              <Button size="icon" className="bg-transparent border border-white text-white hover:bg-white/20 rounded-full h-8 w-8">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center">
            <Button
              className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold px-12 rounded-full shadow-lg"
              onClick={handleConfirm}
              disabled={createSwipeTransaction.isPending}
            >
              {createSwipeTransaction.isPending ? "SAVING..." : "CONFIRM"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Search From</span>
            <Input type="date" className="w-[150px] h-9" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">To</span>
            <Input type="date" className="w-[150px] h-9" value={searchTo} onChange={e => setSearchTo(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Swipe Mode</span>
            <Select value={filterSwipeMode} onValueChange={setFilterSwipeMode}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Choose Swipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {swipeMachines.map((m: any) => (
                  <SelectItem key={m.machine_name} value={m.machine_name}>{m.machine_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-6">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
      </div>

      {/* Controls & Table */}
      <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter:</span>
            <Input
              placeholder="Type to filter..."
              className="h-9 w-[200px]"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left w-10"><input type="checkbox" /></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">S.No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Employee</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Shift</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Swipe</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Batch No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Picture</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">User Log Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-8 text-gray-500">No records found</td></tr>
              ) : (
                filteredRows.map((row: any, i: number) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(row.transaction_date).toLocaleDateString("en-GB", {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }).replace(/ /g, '-')}
                    </td>
                    <td className="px-4 py-3">
                      {employees.find((e: any) => e.id === row.employee_id)?.employee_name || row.employee_name || '-'}
                    </td>
                    <td className="px-4 py-3">{row.shift || 'S-1'}</td>
                    <td className="px-4 py-3">{row.swipe_mode}</td>
                    <td className="px-4 py-3 font-medium">{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">{row.batch_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-500 hover:text-blue-700"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.note || '-'}</td>
                    <td className="px-4 py-3">
                      {row.image_url ? (
                        <a href={row.image_url} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">View</a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      Created: Super Admin {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
