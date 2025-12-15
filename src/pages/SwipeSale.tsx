import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function SwipeSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for form fields - v7 UI - COMPLETE REWRITE TO FORCE REBUILD 20251027-1920
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [totalValue, setTotalValue] = useState<string>("");
  const [autoFillEmployee, setAutoFillEmployee] = useState<string>("");
  const [autoFillSwipeType, setAutoFillSwipeType] = useState<string>("");
  const [employee, setEmployee] = useState<string>("");
  const [swipeMode, setSwipeMode] = useState<string>("");
  const [batchNo, setBatchNo] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);

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
  const { data: swipeTransactionsData, refetch } = useQuery({
    queryKey: ["/api/swipe-transactions"],
    queryFn: async () => {
      const response = await fetch('/api/swipe-transactions', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch swipe transactions');
      return result.rows || [];
    }
  });

  const swipeTransactionsRows = swipeTransactionsData || [];
  const employees = employeesData || [];
  const swipeMachines = swipeMachinesData || [];

  // Auto-fill employee from AUTO-FILL section to Row 2
  useEffect(() => {
    if (autoFillEmployee && !employee) {
      setEmployee(autoFillEmployee);
    }
  }, [autoFillEmployee, employee]);

  // Auto-fill swipe mode based on swipe type
  useEffect(() => {
    if (autoFillSwipeType && swipeMachines.length > 0) {
      const matchedMachine = swipeMachines.find((m: any) => m.machine_name === autoFillSwipeType);
      if (matchedMachine && !swipeMode) {
        setSwipeMode(matchedMachine.machine_name);
      }
    }
  }, [autoFillSwipeType, swipeMachines, swipeMode]);

  // Calculate total value
  useEffect(() => {
    const total = parseFloat(amount) || 0;
    setTotalValue(total.toFixed(2));
  }, [amount]);

  // Create swipe transaction mutation
  const createSwipeTransaction = useMutation({
    mutationFn: async () => {
      const transactionData = {
        employee_id: autoFillEmployee || employee,
        swipe_type: autoFillSwipeType,
        swipe_mode: swipeMode,
        batch_number: batchNo,
        amount: parseFloat(amount) || 0,
        transaction_date: saleDate
      };

      const response = await fetch('/api/swipe-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transactionData)
      });
      const result = await response.json();

      if (!result.ok) throw new Error(result.error || 'Failed to save swipe transaction');
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Swipe transaction saved successfully",
      });
      // Reset form
      setEmployee("");
      setSwipeMode("");
      setBatchNo("");
      setAmount("");
      setNote("");
      setAutoFillEmployee("");
      setAutoFillSwipeType("");
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    // Validate required fields
    const finalEmployee = autoFillEmployee || employee;
    if (!finalEmployee || !swipeMode || !amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields (Employee, Swipe Mode, and Amount)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate employee_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalEmployee)) {
      toast({
        title: "Error",
        description: "Please select a valid employee from the dropdown",
        variant: "destructive",
      });
      return;
    }
    
    createSwipeTransaction.mutate();
  };

  const handleAddRow = () => {
    setRows([...rows, { employee, swipeMode, batchNo, amount, note }]);
    setEmployee("");
    setSwipeMode("");
    setBatchNo("");
    setAmount("");
    setNote("");
  };

  return (
    <div className="p-6 space-y-6 bg-blue-50">
      {/* Title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Swipe</span>
      </div>

      {/* Main Blue Card */}
      <Card className="bg-blue-500 border-none">
            <CardHeader>
          <CardTitle className="text-white text-2xl">Swipe</CardTitle>
            </CardHeader>
        <CardContent className="bg-blue-500 text-white pt-6">
          {/* Row 1: Choose Date, Date Picker, S-1/S-2, Total Value - v7 COMPLETE REWRITE 20251027-1920 */}
          <div className="grid grid-cols-12 gap-4 items-center mb-4">
            <div className="bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-center col-span-2" style={{backgroundColor: '#ea580c', color: 'white', fontSize: '18px', fontWeight: 'bold'}}>
              Select Date
            </div>
            <Input 
              type="date" 
              value={saleDate} 
              onChange={(e) => setSaleDate(e.target.value)} 
              className="w-48 h-10 bg-white text-black col-span-3"
            />
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="shift" 
                  checked={shift==='S-1'} 
                  onChange={()=> setShift('S-1')}
                  className="w-4 h-4"
                />
                <span>S-1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="shift" 
                  checked={shift==='S-2'} 
                  onChange={()=> setShift('S-2')}
                  className="w-4 h-4"
                />
                <span>S-2</span>
              </label>
            </div>
            <div className="col-span-2">
              <span className="text-white font-medium mb-1 block">Total Value</span>
              <Input 
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="bg-white text-black"
                readOnly
              />
            </div>
          </div>

          {/* AUTO-FILL Section */}
          <div className="border-2 border-blue-300 rounded p-4 mb-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <Label className="text-white">Employee</Label>
                <Select value={autoFillEmployee} onValueChange={setAutoFillEmployee}>
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="choose Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.employee_name}
                    </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6">
                <Label className="text-white">Swipe Type</Label>
                <Select value={autoFillSwipeType} onValueChange={setAutoFillSwipeType}>
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Choose Swipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {swipeMachines.map((machine: any) => (
                      <SelectItem key={machine.id} value={machine.machine_name}>
                        {machine.machine_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
              </div>

          {/* Row 2: Employee, Swipe Mode, Batch No, Amount, Note, Plus Button */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-2">
              <Label className="text-white">Employee</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-white">Swipe Mode</Label>
              <Select value={swipeMode} onValueChange={setSwipeMode}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="ICICI CARD" />
                </SelectTrigger>
                <SelectContent>
                  {swipeMachines.map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.machine_name}>
                      {machine.machine_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-white">Batch No</Label>
              <Input 
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-white">Amount</Label>
                <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <Label className="text-white">Note</Label>
                <Button size="sm" variant="secondary" className="bg-orange-500 text-white">
                  SUBTITLE
                </Button>
              </div>
              <Input 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-1 flex items-end">
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white text-blue-500 rounded-full border-none"
                onClick={handleAddRow}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* CONFIRM Button */}
          <div className="flex justify-center mt-6">
            <Button 
              onClick={handleConfirm}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full"
              disabled={createSwipeTransaction.isPending}
            >
              {createSwipeTransaction.isPending ? "Processing..." : "CONFIRM"}
            </Button>
              </div>
            </CardContent>
          </Card>

      {/* Transactions Table */}
          <Card>
            <CardHeader>
          <CardTitle>Swipe Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          {/* Search and Filter Section */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Search From</span>
              <Input type="date" className="w-40" />
              <span className="text-sm">To</span>
              <Input type="date" className="w-40" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Swipe Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {swipeMachines.map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.machine_name}>
                      {machine.machine_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Search
              </Button>
            </div>
              </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="destructive">Delete</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline">Copy</Button>
              <Button variant="outline" className="bg-green-100">CSV</Button>
              <Button variant="outline" className="bg-red-100">PDF</Button>
              <Button variant="outline">Print</Button>
                </div>
              </div>

          {/* Filter Input */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Filter:</span>
            <Input placeholder="Type to filter..." className="w-56" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 min-w-full">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-2 border border-gray-300 min-w-[60px]">S.No</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[120px]">Date</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[120px]">Employee</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[100px]">Shift</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[100px]">Swipe</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[120px]">Amount</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[100px]">Batch No</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[100px]">Action</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[150px]">Description</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[80px]">Picture</th>
                  <th className="text-left p-2 border border-gray-300 min-w-[250px]">User Log Details</th>
                </tr>
              </thead>
              <tbody>
                {swipeTransactionsRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center p-4 text-gray-500 border border-gray-300">
                      No data available. Add some swipe entries to see them here.
                    </td>
                  </tr>
                ) : (
                  swipeTransactionsRows.map((row: any, idx: number) => (
                    <tr key={row.id || idx} className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-300 text-center">{idx + 1}</td>
                      <td className="p-2 border border-gray-300">
                        {row.transaction_date 
                          ? new Date(row.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') 
                          : '-'}
                      </td>
                      <td className="p-2 border border-gray-300">{row.employee_name || '-'}</td>
                      <td className="p-2 border border-gray-300">-</td>
                      <td className="p-2 border border-gray-300">{row.swipe_mode || '-'}</td>
                      <td className="p-2 border border-gray-300">{Number(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 border border-gray-300">{row.batch_number || '-'}</td>
                      <td className="p-2 border border-gray-300 text-center">
                        <div className="flex gap-1 justify-center items-center">
                          <a href={`#edit-${row.id}`} onClick={(e) => { e.preventDefault(); }} className="p-1 mr-1">
                            <img src="https://ramkrishna.ymtsindia.in/assets/images/edit.png" alt="Edit" className="w-5 h-5" />
                          </a>
                          <a href={`#delete-${row.id}`} onClick={(e) => { e.preventDefault(); }} className="p-1">
                            <img src="https://ramkrishna.ymtsindia.in/assets/images/delete.png" alt="Delete" className="w-5 h-5" />
                          </a>
                        </div>
                      </td>
                      <td className="p-2 border border-gray-300">-</td>
                      <td className="p-2 border border-gray-300">-</td>
                      <td className="p-2 border border-gray-300 text-xs">
                        Created: Super Admin {
                          row.created_at 
                            ? new Date(row.created_at).toLocaleString('en-IN', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                second: '2-digit' 
                              }) 
                            : '-'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
              </div>
            </CardContent>
          </Card>
    </div>
  );
}
