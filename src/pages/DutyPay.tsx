
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Calendar, Save, ArrowLeft } from "lucide-react";

export default function DutyPay() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"LIST" | "ADD" | "DETAILS">("LIST");

  // LIST STATE
  const [filterMonth, setFilterMonth] = useState("");

  // DETAILS STATE
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // ADD STATE
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);

  const { data: attendanceSummaryData } = useQuery({
    queryKey: ["/api/attendance/summary", selectedEmployeeId, salaryDate],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      const d = new Date(salaryDate);
      // Backend expects 1-based month
      const res = await fetch(`/api/attendance/summary?employeeId=${selectedEmployeeId}&month=${d.getMonth() + 1}&year=${d.getFullYear()}`);
      const data = await res.json();
      return data.success ? data : null;
    },
    enabled: showAttendanceDialog && !!selectedEmployeeId
  });

  // Form Fields
  const [formData, setFormData] = useState({
    dutySalary: "",
    grossSalary: "",
    pf: "",
    esi: "",
    loanDeduction: "",
    advanceDeduction: "",
    businessShortage: "",
    payMode: "Cash"
  });

  // Derived Net Salary
  const netSalary = (Number(formData.grossSalary) || 0) -
    ((Number(formData.pf) || 0) + (Number(formData.esi) || 0) + (Number(formData.loanDeduction) || 0) +
      (Number(formData.advanceDeduction) || 0) + (Number(formData.businessShortage) || 0));

  // Data Fetching
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const d = await res.json();
      return d.success ? d.data : [];
    },
  });

  const { data: dutySummary = [] } = useQuery<any[]>({
    queryKey: ["/api/duty-pay/summary"],
    queryFn: async () => {
      const res = await fetch("/api/duty-pay/summary");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    enabled: view === "LIST"
  });

  const { data: dutyDetails = [] } = useQuery<any[]>({
    queryKey: ["/api/duty-pay/details", selectedYear, selectedMonth],
    queryFn: async () => {
      if (!selectedYear || !selectedMonth) return [];
      const res = await fetch(`/api/duty-pay/details?year=${selectedYear}&month=${selectedMonth}`);
      const d = await res.json();
      return d.success ? d.data : [];
    },
    enabled: view === "DETAILS" && !!selectedYear && !!selectedMonth
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/duty-pay/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      toast({ title: "Salary Saved", description: "Duty pay record created successfully." });
      setView("LIST");
      setFormData({
        dutySalary: "",
        grossSalary: "",
        pf: "",
        esi: "",
        loanDeduction: "",
        advanceDeduction: "",
        businessShortage: "",
        payMode: "Cash"
      });
      setSelectedEmployeeId("");
      queryClient.invalidateQueries({ queryKey: ["/api/duty-pay/summary"] });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
  });

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast({ variant: "destructive", title: "Missing Employee", description: "Please select an employee" });
      return;
    }
    saveMutation.mutate({
      ...formData,
      salaryDate,
      employeeId: selectedEmployeeId,
      shift,
      netSalary: netSalary.toString() // Passed for immediate validation, but backend re-calculates
    });
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  // VIEW: LIST
  if (view === "LIST") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">Dashboard &gt; View Duty Pay Details</h1>
          <Button className="bg-[#84cc16] hover:bg-[#65a30d] text-white" onClick={() => setView("ADD")}>
            <Plus className="w-4 h-4 mr-2" /> Add Salary
          </Button>
        </div>

        <Card className="bg-blue-600 text-white p-4">
          <div className="flex gap-4 items-center">
            <span className="font-bold">Filter Month</span>
            <Input
              placeholder="Filter Month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="max-w-xs text-black bg-white"
            />
            <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              Show <Select defaultValue="All"><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem></SelectContent></Select>
            </div>
            <Input placeholder="Type to filter..." className="w-64" />
          </div>
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>S.no</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Total Salary</TableHead>
                <TableHead>Total Employee</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dutySummary.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center p-4">No data available in table</TableCell></TableRow>
              ) : (
                dutySummary.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>{item.month}</TableCell>
                    <TableCell className="font-bold text-green-600">{Number(item.totalSalary).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{item.totalEmployee}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedYear(item.year);
                        setSelectedMonth(item.month);
                        setView("DETAILS");
                      }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 text-sm text-gray-500">
            Showing {dutySummary.length} entries
          </div>
        </Card>
      </div>
    );
  }

  // VIEW: DETAILS
  if (view === "DETAILS") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Duty Pay Details: {selectedMonth} {selectedYear}</h1>
          <Button variant="outline" onClick={() => setView("LIST")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>S.no</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Duty Salary</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Pay Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dutyDetails.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center p-4">No records found for this month</TableCell></TableRow>
              ) : (
                dutyDetails.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{new Date(item.salaryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{item.employeeName}</TableCell>
                    <TableCell>{item.shift}</TableCell>
                    <TableCell>{Number(item.dutySalary).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-bold text-green-600">{Number(item.netSalary).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{item.payMode}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    )
  }

  // VIEW: ADD
  return (
    <div className="space-y-4">
      {/* Header Filter for Add View (Top Section of Screenshot 1) */}
      <Card className="p-4 flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Filter Month</span>
          <Input placeholder="Filter Month" className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Employee</span>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-40"><SelectValue placeholder="---select---" /></SelectTrigger>
            <SelectContent>
              {employees.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.employeeName || e.employee_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Search className="w-4 h-4 mr-2" /> Search
        </Button>
        <div className="ml-auto">
          <Button variant="outline" onClick={() => setView("LIST")}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        </div>
      </Card>

      {/* Main Entry Section (Blue Header + Table) */}
      <div className="border rounded-lg overflow-hidden">
        {/* Blue Header */}
        <div className="bg-[#1e3a8a] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold">Salary Date</span>
            <Input
              type="date"
              value={salaryDate}
              onChange={e => setSalaryDate(e.target.value)}
              className="w-40 text-black"
            />
            <span className="font-bold ml-4">Employee</span>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-48 text-black"><SelectValue placeholder="---select---" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.employeeName || e.employee_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 border border-white/30 rounded px-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio"
                name="shift"
                checked={shift === "S-1"}
                onChange={() => setShift("S-1")}
                className="accent-orange-500"
              />
              <span className="font-bold text-orange-400">S-1</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio"
                name="shift"
                checked={shift === "S-2"}
                onChange={() => setShift("S-2")}
                className="accent-orange-500"
              />
              <span className="font-bold text-yellow-400">S-2</span>
            </label>
          </div>
        </div>

        {/* Entry Table Row */}
        <div className="bg-gray-100 p-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#e2e8f0] text-gray-700">
                <th className="border p-2 min-w-[150px]">Employee Name</th>
                <th className="border p-2">Designation</th>
                <th className="border p-2">Duty Salary</th>
                <th className="border p-2">Gross Salary</th>
                <th className="border p-2">PF(12%)</th>
                <th className="border p-2">ESI(0.75%)</th>
                <th className="border p-2 bg-blue-50">Loan Deductions (-)</th>
                <th className="border p-2 bg-blue-50">Adv.deductions (-)</th>
                <th className="border p-2 bg-blue-50">Business Shortage (-)</th>
                <th className="border p-2">Net Salary</th>
                <th className="border p-2">Pay Mode</th>
                <th className="border p-2">Attendance Report</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border p-2 font-medium">
                  {selectedEmployee?.employeeName || selectedEmployee?.employee_name || "Select..."}
                </td>
                <td className="border p-2 text-gray-500">
                  {selectedEmployee?.designation || "-"}
                </td>
                <td className="border p-2">
                  <Input
                    className="h-8 w-24"
                    value={formData.dutySalary}
                    onChange={e => setFormData({ ...formData, dutySalary: e.target.value })}
                  />
                </td>
                <td className="border p-2">
                  <Input
                    className="h-8 w-24"
                    value={formData.grossSalary}
                    onChange={e => setFormData({ ...formData, grossSalary: e.target.value })}
                  />
                </td>
                <td className="border p-2">
                  <Input
                    className="h-8 w-20"
                    value={formData.pf}
                    onChange={e => setFormData({ ...formData, pf: e.target.value })}
                  />
                </td>
                <td className="border p-2">
                  <Input
                    className="h-8 w-20"
                    value={formData.esi}
                    onChange={e => setFormData({ ...formData, esi: e.target.value })}
                  />
                </td>
                <td className="border p-2 bg-blue-50">
                  <Input
                    className="h-8 w-24"
                    value={formData.loanDeduction}
                    onChange={e => setFormData({ ...formData, loanDeduction: e.target.value })}
                  />
                </td>
                <td className="border p-2 bg-blue-50">
                  <Input
                    className="h-8 w-24"
                    value={formData.advanceDeduction}
                    onChange={e => setFormData({ ...formData, advanceDeduction: e.target.value })}
                  />
                </td>
                <td className="border p-2 bg-blue-50">
                  <Input
                    className="h-8 w-24"
                    value={formData.businessShortage}
                    onChange={e => setFormData({ ...formData, businessShortage: e.target.value })}
                  />
                </td>
                <td className="border p-2 font-bold text-green-600">
                  {netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="border p-2">
                  <Select
                    value={formData.payMode}
                    onValueChange={v => setFormData({ ...formData, payMode: v })}
                  >
                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="border p-2 text-center">
                  <Button
                    variant="link"
                    className="text-blue-600 h-8 p-0"
                    onClick={() => {
                      if (!selectedEmployeeId) {
                        toast({ variant: "destructive", title: "Error", description: "Please select an employee first" });
                        return;
                      }
                      setShowAttendanceDialog(true);
                    }}
                  >
                    View
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <Button className="bg-[#84cc16] hover:bg-[#65a30d]" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save Entry
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance Summary - {selectedEmployee?.employeeName || selectedEmployee?.employee_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg bg-gray-50 text-center">
                <p className="text-sm text-gray-500">Selected Month</p>
                <p className="text-xl font-bold">{new Date(salaryDate).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="border p-4 rounded-lg bg-green-50 text-center">
                <p className="text-sm text-green-600 font-medium">Days Present</p>
                <p className="text-3xl font-bold text-green-700">
                  {attendanceSummaryData ? attendanceSummaryData.daysPresent : <span className="text-sm font-normal text-gray-400">Loading...</span>}
                </p>
              </div>
            </div>
            {attendanceSummaryData && (
              <div className="text-center text-sm text-gray-500">
                Total calculated records for this month: {attendanceSummaryData.totalRecords}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
