
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
      const res = await fetch("/api/duty-shifts");
      const d = await res.json();
      return d.success ? d.data : [];
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
          shiftId: "",
          notes: ""
        };
      });
      // Preserve existing edits if any? For now reset on view switch or load
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
      shiftId: r.shiftId || null, // Handle empty string
      notes: r.notes
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
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            Dashboard &gt; View Staff Attendance
          </h1>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setView("ADD")}>
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
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
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
            <Input placeholder="Type to filter..." className="w-64" />
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Attendance Details - {selectedDate ? new Date(selectedDate).toLocaleDateString() : ""}</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDetailsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : !dailyDetails || dailyDetails.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No records found</TableCell></TableRow>
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
        <div>
          <h2 className="text-xl font-bold border-b border-blue-400 pb-1 mb-2">Staff Attendance</h2>
          <div className="flex items-center gap-4">
            <span className="font-bold">Date</span>
            <Input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="text-black w-48"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Button className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> SAVE
          </Button>
          <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => setView("LIST")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Emp Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="w-[350px]">Attendance</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, idx) => {
                const row = rows[emp.id] || {};
                return (
                  <TableRow key={emp.id} className="hover:bg-gray-50">
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{emp.employeeName || emp.employee_name}</TableCell>
                    <TableCell>{emp.designation || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Custom Radio Button Styling */}
                        {[
                          { val: "PRESENT", label: "PRESENT", color: "peer-checked:bg-green-500 peer-checked:text-white" },
                          { val: "ABSENT", label: "ABSENT", color: "peer-checked:bg-red-500 peer-checked:text-white" },
                          { val: "HALF-DAY", label: "HALF-DAY", color: "peer-checked:bg-blue-500 peer-checked:text-white" },
                          { val: "NO DUTY", label: "NO DUTY", color: "peer-checked:bg-orange-500 peer-checked:text-white" }
                        ].map((opt) => (
                          <label key={opt.val} className="cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${emp.id}`}
                              value={opt.val}
                              checked={row.status === opt.val}
                              onChange={() => updateRow(emp.id, "status", opt.val)}
                              className="peer sr-only"
                            />
                            <div className={`px-2 py-1 rounded border text-xs font-bold text-gray-500 transition-all ${opt.color}`}>
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
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="- Select -" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map(s => <SelectItem key={s.id} value={s.id}>{s.shiftName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger className="w-[120px]"><SelectValue placeholder="- Select -" /></SelectTrigger>
                        <SelectContent><SelectItem value="Regular">Regular</SelectItem></SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder=""
                        value={row.notes || ""}
                        onChange={e => updateRow(emp.id, "notes", e.target.value)}
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
