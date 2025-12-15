import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function EmployeeCashRecovery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeBusinessAmount, setEmployeeBusinessAmount] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    recovery_date: new Date().toISOString().split("T")[0],
    balance_amount: "0",
    collection_amount: "",
    shortage_amount: "0",
    notes: "",
    shift: "S-1",
    cumulative_shortage_amount: "0",
    total_recovery_amount: "0",
    employee_business_amount: "0",
  });

  // Fetch employee cash recovery data
  const { data: employeeCashRecoveryData, refetch: refetchEmployeeCashRecovery } = useQuery({
    queryKey: ["/api/employee-cash-recovery"],
    queryFn: async () => {
      const response = await fetch('/api/employee-cash-recovery');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employee cash recovery');
      return result.rows || [];
    },
  });

  const employeeCashRecoveryRows = employeeCashRecoveryData || [];

  const totalRecoveryCash = useMemo(() => {
    const col = parseFloat(formData.collection_amount || "0");
    const shortage = parseFloat(formData.shortage_amount || "0");
    const total = col - shortage;
    return Number.isFinite(total) ? total : 0;
  }, [formData.collection_amount, formData.shortage_amount]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/employee-cash-recovery/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Employee cash recovery deleted successfully" });
      refetchEmployeeCashRecovery();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete" });
    },
  });

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle edit
  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setFormData({
      employee_id: row.employee_id || "",
      recovery_date: row.recovery_date || new Date().toISOString().split("T")[0],
      balance_amount: String(row.balance_amount || "0"),
      collection_amount: String(row.collection_amount || ""),
      shortage_amount: String(row.shortage_amount || "0"),
      notes: row.notes || "",
      shift: row.shift || "S-1",
      cumulative_shortage_amount: "0",
      total_recovery_amount: "0",
      employee_business_amount: "0",
    });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Recompute Employee Business Amount when employee/date/query rows change
  useEffect(() => {
    if (!formData.employee_id) {
      setEmployeeBusinessAmount(0);
      return;
    }
    const empId = formData.employee_id;
    const date = formData.recovery_date;
    const rows = (employeeCashRecoveryRows as any[]) || [];
    const sameDay = rows
      .filter((e:any) => String(e.employee_id) === String(empId) && String(e.recovery_date) === String(date))
      .sort((a:any,b:any)=> new Date(b.created_at||b.recovery_date).getTime() - new Date(a.created_at||a.recovery_date).getTime());
    const latestSameDay = sameDay[0];
    if (latestSameDay && typeof latestSameDay.balance_amount !== 'undefined') {
      setEmployeeBusinessAmount(Number(latestSameDay.balance_amount || 0));
      return;
    }
    const empAll = rows
      .filter((e:any) => String(e.employee_id) === String(empId))
      .sort((a:any,b:any)=> new Date(b.created_at||b.recovery_date).getTime() - new Date(a.created_at||a.recovery_date).getTime());
    const latest = empAll[0];
    setEmployeeBusinessAmount(Number(latest?.balance_amount || 0));
  }, [formData.employee_id, formData.recovery_date, employeeCashRecoveryRows]);

  // Initialize/editable field with computed business amount
  useEffect(() => {
    setFormData((prev) => ({ ...prev, employee_business_amount: String(employeeBusinessAmount || 0) }));
  }, [employeeBusinessAmount]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.ok) {
        setEmployees((result.rows || []).filter((emp: any) => emp.is_active));
      } else {
        console.error('Error fetching employees:', result.error);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  // No local fetch for entries; using react-query result above

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      toast({ variant: "destructive", title: "Employee required" });
      return;
    }
    const collection = parseFloat(formData.collection_amount || "0");
    if (collection <= 0) {
      toast({ variant: "destructive", title: "Enter a positive collection amount" });
      return;
    }

    const payload = {
      recovery_date: formData.recovery_date,
      employee_id: formData.employee_id,
      balance_amount: parseFloat(formData.balance_amount || "0"),
      collection_amount: collection,
      shortage_amount: parseFloat(formData.shortage_amount || "0"),
      notes: formData.notes || null,
      shift: formData.shift,
    };

    try {
      const isEdit = Boolean(editingId);
      const url = isEdit ? `/api/employee-cash-recovery/${editingId}` : '/api/employee-cash-recovery';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save employee cash recovery');
      }

      toast({ title: "Success", description: isEdit ? "Record updated successfully" : "Employee cash recovery recorded" });
      setEditingId(null);
      setFormData({
        employee_id: "",
        recovery_date: new Date().toISOString().split("T")[0],
        balance_amount: "0",
        collection_amount: "",
        shortage_amount: "0",
        notes: "",
        shift: "S-1",
        cumulative_shortage_amount: "0",
        total_recovery_amount: "0",
        employee_business_amount: "0",
      });
      refetchEmployeeCashRecovery();
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Save failed", 
        description: error instanceof Error ? error.message : "Failed to save employee cash recovery"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Add Emp CashRecovery</span></div>

      {/* Blue panel same-to-same */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Employee Cash Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row */}
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <Label className="text-white">Choose Date</Label>
              <input 
                id="ecr_date" 
                type="date" 
                value={formData.recovery_date} 
                onChange={(e) => setFormData({ ...formData, recovery_date: e.target.value })} 
                className="mt-1 h-10 w-full rounded-md bg-white text-black px-3"
              />
            </div>
            <div className="col-span-4">
              <Label className="text-white">Shift</Label>
              <div className="mt-1 flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="shift" 
                    checked={formData.shift === 'S-1'} 
                    onChange={() => setFormData({ ...formData, shift: 'S-1' })}
                  /> S-1
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="shift" 
                    checked={formData.shift === 'S-2'} 
                    onChange={() => setFormData({ ...formData, shift: 'S-2' })}
                  /> S-2
                </label>
              </div>
            </div>
            <div className="col-span-5">
              <Label className="text-white">Total Recovery Cash</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Total Recovery Cash" 
                className="mt-1 bg-white text-black" 
                value={formData.total_recovery_amount} 
                onChange={(e)=> setFormData({ ...formData, total_recovery_amount: e.target.value })} 
              />
            </div>
          </div>

          {/* Entry row */}
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <Label className="text-white">Employee Name</Label>
              <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
                <SelectTrigger className="mt-1 bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label className="text-white">Emp. Business Amount</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Emp. Business Amount" 
                className="mt-1 bg-white text-black" 
                value={formData.employee_business_amount}
                onChange={(e)=> setFormData({ ...formData, employee_business_amount: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-white">Balance</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Balance" 
                className="mt-1 bg-white text-black" 
                value={formData.balance_amount} 
                onChange={(e)=> setFormData({ ...formData, balance_amount: e.target.value })} 
              />
            </div>
            <div className="col-span-2">
              <Label className="text-white">Collection Denominations</Label>
              <Input type="number" step="0.01" placeholder="Collection" className="mt-1 bg-white text-black" value={formData.collection_amount} onChange={(e)=> setFormData({ ...formData, collection_amount: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="text-white">Shortage</Label>
              <Input type="number" step="0.01" placeholder="Shortage" className="mt-1 bg-white text-black" value={formData.shortage_amount} onChange={(e)=> setFormData({ ...formData, shortage_amount: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label className="text-white">Cumulative Shortage</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Cumulative Shortage" 
                className="mt-1 bg-white text-black" 
                value={formData.cumulative_shortage_amount} 
                onChange={(e)=> setFormData({ ...formData, cumulative_shortage_amount: e.target.value })} 
              />
              </div>
            <div className="col-span-3">
              <Label className="text-white">Note</Label>
              <Input placeholder="Note" className="mt-1 bg-white text-black" value={formData.notes} onChange={(e)=> setFormData({ ...formData, notes: e.target.value })} />
            </div>

            <div className="col-span-12 flex justify-end mt-2">
              <Button type="submit" className="rounded-md bg-green-400 hover:bg-green-500 text-black px-6">Confirm</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Button variant="destructive">Delete</Button><Button variant="outline">Direct Print</Button></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2"><span>From</span><Input type="date" className="w-44" /></div>
              <div className="flex items-center gap-2"><span>To</span><Input type="date" className="w-44" /></div>
              <div className="flex items-center gap-2"><span>Employee</span>
                <Select onValueChange={() => {}}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {employees.map((e: any) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.employee_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 ml-2"><span>Filter:</span><Input placeholder="Type to filter..." className="w-56" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <Button variant="outline" size="sm">Copy</Button>
              <Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
              <Button variant="outline" size="sm">Print</Button>
            </div>
          </div>
          
          {(() => {
            const filteredRows = employeeCashRecoveryRows.filter((row: any) =>
              !searchTerm || 
              (row.employee_name && row.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (row.recovery_date && row.recovery_date.includes(searchTerm)) ||
              (row.notes && row.notes.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Busi. Cash</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Shortage</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User Log Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-500">
                        {searchTerm ? `No entries found matching "${searchTerm}"` : "No employee cash recovery data available. Add some entries to see them here."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{new Date(row.recovery_date).toLocaleDateString()}</TableCell>
                        <TableCell>{row.employee_name || "-"}</TableCell>
                        <TableCell>{row.shift || "S-1"}</TableCell>
                        <TableCell>₹{Number(row.balance_amount || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{Number(row.balance_amount || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{Number(row.collection_amount || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{Number(row.shortage_amount || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{row.notes || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id)} disabled={deleteMutation.isPending}>Delete</Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {`Created: ${row.created_by || 'User'} ${row.created_at ? new Date(row.created_at).toLocaleString() : ''}`}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
