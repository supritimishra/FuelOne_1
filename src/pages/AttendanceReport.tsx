
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
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Search, ArrowLeft } from "lucide-react";

// Types
interface Employee {
  id: string;
  employeeName: string;
  designation?: string;
  employee_name?: string; // fallback
}

interface DutyShift {
  id: string;
  shiftName: string;
}

interface AttendanceRecord {
  employeeId: string;
  status: "PRESENT" | "ABSENT" | "HALF-DAY" | "NO DUTY";
  shiftId?: string;
  notes?: string;
  type?: string;
}

export default function AttendanceReport() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"LIST" | "ADD">("LIST");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ADD View State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Record<string, AttendanceRecord>>({});

  // LIST View State
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch Master Data
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const d = await res.json();
      const all: Employee[] = d.success ? d.data : [];
      return all;
    },
  });

  const { data: shifts = [] } = useQuery<DutyShift[]>({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/duty-shifts");
        const d = await res.json();
        if (d.success && d.data && d.data.length > 0) {
          return d.data;
        }
        // Fallback
        return [{ id: "S-1", shiftName: "S-1" }, { id: "S-2", shiftName: "S-2" }, { id: "General", shiftName: "General" }];
      } catch (e) {
        return [{ id: "S-1", shiftName: "S-1" }, { id: "S-2", shiftName: "S-2" }, { id: "General", shiftName: "General" }];
      }
    },
  });

  // Fetch List Data
  const { data: attendanceList = [] } = useQuery<any[]>({
    queryKey: ["/api/attendance/list", fromDate, toDate],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (fromDate) qs.set("from", fromDate);
      if (toDate) qs.set("to", toDate);
      const res = await fetch(`/api/attendance/list?${qs}`);
      const d = await res.json();
      return d.success ? d.data : [];
    },
    enabled: view === "LIST"
  });

  // Fetch Details Data for Modal
  const { data: dailyDetails = [], isLoading: isDetailsLoading } = useQuery({
    queryKey: ["/api/attendance/details", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const res = await fetch(`/api/attendance/details?date=${selectedDate}`);
      const d = await res.json();
      return d.success ? d.data : [];
    },
    enabled: !!selectedDate
  });

  // Initialize form rows when employees load or view changes
  useEffect(() => {
    if (view === "ADD" && employees.length > 0) {
      const newRows: Record<string, AttendanceRecord> = {};
      employees.forEach(e => {
        newRows[e.id] = {
          employeeId: e.id,
          status: "PRESENT", // Default
          shiftId: "S-1",
          notes: "",
          type: "Regular"
        };
      });
      setRows(prev => Object.keys(prev).length === 0 ? newRows : prev);
    }
  }, [view, employees]);

  const bulkMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      const res = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Attendance saved successfully" });
      setView("LIST");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/list"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message })
  });

  const handleSave = () => {
    const payload = Object.values(rows).map(r => ({
      attendanceDate,
      employeeId: r.employeeId,
      status: r.status,
      shiftId: r.shiftId || "S-1",
      notes: r.notes,
      type: r.type || "Regular"
    }));
    bulkMutation.mutate(payload);
  };

  const updateRow = (empId: string, field: keyof AttendanceRecord, value: any) => {
    setRows(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value }
    }));
  };

  if (view === "LIST") {
    return (
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border">
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            Dashboard &gt; View Staff Attendance
          </h1>
          <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white" onClick={() => setView("ADD")}>
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Button>
        </div>

        {/* Filter Section */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold">From Date</span>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold">To Date</span>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </CardContent>
        </Card>

        {/* List Table */}
        <Card>
          <div className="p-4 border-b flex justify-between">
            <div className="flex items-center gap-2">
              Show <Select defaultValue="All"><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem></SelectContent></Select>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Total Presents</TableHead>
                <TableHead className="text-center">Total Absents</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center p-4">No data available in table</TableCell></TableRow>
              ) : (
                attendanceList.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center font-bold text-green-600">{item.totalPresents}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">{item.totalAbsents}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(item.date)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 text-sm text-gray-500">
            Showing {attendanceList.length} of {attendanceList.length} entries
          </div>
        </Card>

        {/* View Details Modal */}
        <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Attendance Details - {selectedDate ? new Date(selectedDate).toLocaleDateString() : ""}</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDetailsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : !dailyDetails || dailyDetails.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">No records found</TableCell></TableRow>
                ) : (
                  dailyDetails.map((detail: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{detail.employeeName}</TableCell>
                      <TableCell>{detail.designation || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${detail.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                          detail.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                            detail.status === 'HALF-DAY' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {detail.status}
                        </span>
                      </TableCell>
                      <TableCell>{detail.shiftId || '-'}</TableCell>
                      <TableCell>{detail.type || '-'}</TableCell>
                      <TableCell>{detail.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <DialogFooter>
              <Button onClick={() => setSelectedDate(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ADD VIEW
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-600 p-4 rounded-lg text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold opacity-80 uppercase">Date</span>
            <Input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="text-black bg-white w-48 font-bold h-10"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Button className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold px-6 shadow-md" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> SAVE
          </Button>
          <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 font-bold" onClick={() => setView("LIST")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-t-4 border-t-blue-500 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px] font-bold text-gray-700">#</TableHead>
                <TableHead className="font-bold text-gray-700">Emp Name</TableHead>
                <TableHead className="font-bold text-gray-700">Designation</TableHead>
                <TableHead className="w-[350px] font-bold text-gray-700">Attendance</TableHead>
                <TableHead className="font-bold text-gray-700">Shift</TableHead>
                <TableHead className="font-bold text-gray-700">Type</TableHead>
                <TableHead className="font-bold text-gray-700">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, idx) => {
                const row = rows[emp.id] || {};
                return (
                  <TableRow key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{emp.employeeName || emp.employee_name}</TableCell>
                    <TableCell className="text-gray-500">{emp.designation || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Custom Radio Button Styling */}
                        {[
                          { val: "PRESENT", label: "PRESENT", color: "peer-checked:bg-green-500 peer-checked:text-white border-green-200 text-green-600 hover:bg-green-50" },
                          { val: "ABSENT", label: "ABSENT", color: "peer-checked:bg-red-500 peer-checked:text-white border-red-200 text-red-600 hover:bg-red-50" },
                          { val: "HALF-DAY", label: "HALF-DAY", color: "peer-checked:bg-blue-500 peer-checked:text-white border-blue-200 text-blue-600 hover:bg-blue-50" },
                          { val: "NO DUTY", label: "NO DUTY", color: "peer-checked:bg-gray-500 peer-checked:text-white border-gray-200 text-gray-600 hover:bg-gray-50" }
                        ].map((opt) => (
                          <label key={opt.val} className="cursor-pointer relative">
                            <input
                              type="radio"
                              name={`status-${emp.id}`}
                              value={opt.val}
                              checked={row.status === opt.val}
                              onChange={() => updateRow(emp.id, "status", opt.val)}
                              className="peer sr-only"
                            />
                            <div className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wide transition-all shadow-sm ${opt.color}`}>
                              {opt.label}
                            </div>
                          </label>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.shiftId}
                        onValueChange={(v) => updateRow(emp.id, "shiftId", v)}
                      >
                        <SelectTrigger className="w-[120px] bg-white border-gray-200">
                          <SelectValue placeholder="- Select -" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map(s => <SelectItem key={s.id} value={s.id}>{s.shiftName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.type}
                        onValueChange={(v) => updateRow(emp.id, "type", v)}
                      >
                        <SelectTrigger className="w-[120px] bg-white border-gray-200">
                          <SelectValue placeholder="- Select -" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Overtime">Overtime</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder=""
                        value={row.notes || ""}
                        onChange={e => updateRow(emp.id, "notes", e.target.value)}
                        className="bg-white border-gray-200"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
