import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Search, Pencil, Eye, Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Extended schema to match the form fields
const employeeFormSchema = z.object({
  join_date: z.string().min(1, "Join date is required"),
  employee_name: z.string().min(1, "Employee name is required"),
  employee_number: z.string().optional(),
  mobile_number: z.string().optional(),
  id_proof_no: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  salary_type: z.enum(["Monthly", "Daily", "Hourly"]),
  salary: z.coerce.number().min(0, "Salary must be positive"),
  address: z.string().optional(),
  description: z.string().optional(),
  has_pf: z.boolean().default(false),
  has_esi: z.boolean().default(false),
  has_income_tax: z.boolean().default(false),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

const Employees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      join_date: new Date().toISOString().split('T')[0],
      employee_name: "",
      employee_number: "",
      mobile_number: "",
      id_proof_no: "",
      designation: "",
      salary_type: "Monthly",
      salary: 0,
      address: "",
      description: "",
      has_pf: false,
      has_esi: false,
      has_income_tax: false,
    }
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employees', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        setEmployees(result.rows || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch employees",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onSubmit = async (data: EmployeeFormData) => {
    const submitData = {
      ...data,
      phone_no: data.mobile_number, // Mapping for backend if needed
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/employees/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Employee updated successfully" });
          setEditingId(null);
          form.reset();
          fetchEmployees();
        } else {
          toast({ title: "Error", description: result.error || "Failed to update employee", variant: "destructive" });
        }
      } else {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Employee added successfully" });
          form.reset();
          fetchEmployees();
        } else {
          toast({ title: "Error", description: result.error || "Failed to add employee", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save employee", variant: "destructive" });
    }
  };

  const handleEdit = (employee: any) => {
    setEditingId(employee.id);
    form.reset({
      join_date: employee.join_date ? new Date(employee.join_date).toISOString().split('T')[0] : "",
      employee_name: employee.employee_name,
      employee_number: employee.employee_number || "",
      mobile_number: employee.mobile_number || "",
      id_proof_no: employee.id_proof_no || "",
      designation: employee.designation || "",
      salary_type: employee.salary_type || "Monthly",
      salary: parseFloat(employee.salary) || 0,
      address: employee.address || "",
      description: employee.description || "",
      has_pf: employee.has_pf || false,
      has_esi: employee.has_esi || false,
      has_income_tax: employee.has_income_tax || false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Employee deleted successfully" });
        fetchEmployees();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete employee", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete employee", variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Employee</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="join_date" className="text-blue-900 font-semibold">Join Date <span className="text-red-500">*</span></Label>
                <Input
                  id="join_date"
                  type="date"
                  {...form.register("join_date")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
                {form.formState.errors.join_date && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.join_date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employee_name" className="text-blue-900 font-semibold">Employee Name <span className="text-red-500">*</span></Label>
                <Input
                  id="employee_name"
                  {...form.register("employee_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Employee Name"
                />
                {form.formState.errors.employee_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.employee_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employee_number" className="text-blue-900 font-semibold">Employee Number</Label>
                <Input
                  id="employee_number"
                  {...form.register("employee_number")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Emp No"
                />
              </div>
              <div>
                <Label htmlFor="mobile_number" className="text-blue-900 font-semibold">Phone No.</Label>
                <Input
                  id="mobile_number"
                  {...form.register("mobile_number")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="id_proof_no" className="text-blue-900 font-semibold">ID Proof No.</Label>
                <Input
                  id="id_proof_no"
                  {...form.register("id_proof_no")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Aadhaar/PAN"
                />
              </div>
              <div>
                <Label htmlFor="designation" className="text-blue-900 font-semibold">Designation <span className="text-red-500">*</span></Label>
                <Input
                  id="designation"
                  {...form.register("designation")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Designation"
                />
                {form.formState.errors.designation && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.designation.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="salary_type" className="text-blue-900 font-semibold">Salary Type <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => form.setValue("salary_type", value as any)}
                  defaultValue={form.getValues("salary_type")}
                  value={form.watch("salary_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary" className="text-blue-900 font-semibold">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  {...form.register("salary", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Salary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-blue-900 font-semibold">Upload Image</Label>
                <Input
                  type="file"
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-blue-900 font-semibold">Address</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  className="bg-white border-blue-200 focus:border-blue-500 h-[38px] min-h-[38px]"
                  placeholder="Address"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-blue-900 font-semibold">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="bg-white border-blue-200 focus:border-blue-500 h-[38px] min-h-[38px]"
                  placeholder="Description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-6 col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_pf"
                    checked={form.watch("has_pf")}
                    onCheckedChange={(checked) => form.setValue("has_pf", checked as boolean)}
                  />
                  <Label htmlFor="has_pf" className="text-blue-900 font-semibold">Provident Fund</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_income_tax"
                    checked={form.watch("has_income_tax")}
                    onCheckedChange={(checked) => form.setValue("has_income_tax", checked as boolean)}
                  />
                  <Label htmlFor="has_income_tax" className="text-blue-900 font-semibold">Income Tax</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_esi"
                    checked={form.watch("has_esi")}
                    onCheckedChange={(checked) => form.setValue("has_esi", checked as boolean)}
                  />
                  <Label htmlFor="has_esi" className="text-blue-900 font-semibold">Employees State Insurance</Label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8"
                  onClick={() => {
                    form.reset({
                      join_date: new Date().toISOString().split('T')[0],
                      employee_name: "",
                      employee_number: "",
                      mobile_number: "",
                      id_proof_no: "",
                      designation: "",
                      salary_type: "Monthly",
                      salary: 0,
                      address: "",
                      description: "",
                      has_pf: false,
                      has_esi: false,
                      has_income_tax: false,
                    });
                    setEditingId(null);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold">
                {editingId ? "UPDATE" : "SAVE"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex justify-between items-center bg-white border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <select className="border rounded p-1 text-sm bg-white">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50">CSV</Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">PDF</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filter:</span>
                <Input
                  placeholder="Type to filter..."
                  className="h-8 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700">Emp Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Emp Num</TableHead>
                  <TableHead className="font-bold text-gray-700">Mobile Num</TableHead>
                  <TableHead className="font-bold text-gray-700">Salary</TableHead>
                  <TableHead className="font-bold text-gray-700">Aadhaar Num</TableHead>
                  <TableHead className="font-bold text-gray-700">Designation</TableHead>
                  <TableHead className="font-bold text-gray-700">Address</TableHead>
                  <TableHead className="font-bold text-gray-700">Description</TableHead>
                  <TableHead className="font-bold text-gray-700">Image</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700">Benefits</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-gray-500">
                      No employees found. Add your first employee above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.employee_name}</TableCell>
                      <TableCell>{item.employee_number || "-"}</TableCell>
                      <TableCell>{item.mobile_number || "-"}</TableCell>
                      <TableCell>Γé╣{item.salary || 0}</TableCell>
                      <TableCell>{item.id_proof_no || "-"}</TableCell>
                      <TableCell>{item.designation}</TableCell>
                      <TableCell>{item.address || "-"}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {item.has_pf && <span className="bg-blue-100 text-blue-800 px-1 rounded w-fit">Provident Fund</span>}
                          {item.has_esi && <span className="bg-purple-100 text-purple-800 px-1 rounded w-fit">Employees State Insurance</span>}
                          {item.has_income_tax && <span className="bg-yellow-100 text-yellow-800 px-1 rounded w-fit">Income Tax</span>}
                          {!item.has_pf && !item.has_esi && !item.has_income_tax && "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded font-bold">
                          ACTIVATED
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        Created: Super Admin {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing 1 to {filteredEmployees.length} of {filteredEmployees.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>&larr;</Button>
              <Button variant="outline" size="sm" className="bg-gray-100">1</Button>
              <Button variant="outline" size="sm" disabled>&rarr;</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete this employee. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Employees;
