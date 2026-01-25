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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, Eye, X } from "lucide-react";
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
  salary_type: z.enum(["Monthly", "Daily", "Hourly", "Per Duty"]),
  salary: z.coerce.number().min(0, "Salary must be positive"),
  address: z.string().optional(),
  description: z.string().optional(),
  has_pf: z.boolean().default(false),
  has_esi: z.boolean().default(false),
  has_income_tax: z.boolean().default(false),
  image_url: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeRow {
  tempId: string;
  join_date: string;
  employee_name: string;
  employee_number: string;
  mobile_number: string;
  id_proof_no: string;
  designation: string;
  salary_type: string;
  salary: number | string;
  address: string;
  description: string;
  has_pf: boolean;
  has_esi: boolean;
  has_income_tax: boolean;
  image_url: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [formRows, setFormRows] = useState<EmployeeRow[]>([
    {
      tempId: crypto.randomUUID(),
      join_date: new Date().toISOString().split('T')[0],
      employee_name: "",
      employee_number: "",
      mobile_number: "",
      id_proof_no: "",
      designation: "",
      salary_type: "Per Duty",
      salary: 0,
      address: "",
      description: "",
      has_pf: false,
      has_esi: false,
      has_income_tax: false,
      image_url: "",
    },
  ]);
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
      salary_type: "Per Duty",
      salary: 0,
      address: "",
      description: "",
      has_pf: false,
      has_esi: false,
      has_income_tax: false,
      image_url: "",
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

  const addNewRow = () => {
    setFormRows([...formRows, {
      tempId: crypto.randomUUID(),
      join_date: new Date().toISOString().split('T')[0],
      employee_name: "",
      employee_number: "",
      mobile_number: "",
      id_proof_no: "",
      designation: "",
      salary_type: "Per Duty",
      salary: 0,
      address: "",
      description: "",
      has_pf: false,
      has_esi: false,
      has_income_tax: false,
      image_url: "",
    }]);
  };

  const removeRow = (tempId: string) => {
    if (formRows.length > 1) {
      setFormRows(formRows.filter(row => row.tempId !== tempId));
    }
  };

  const updateRow = (tempId: string, field: keyof EmployeeRow, value: any) => {
    setFormRows(formRows.map(row =>
      row.tempId === tempId ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update mode - use first row only
        const row = formRows[0];
        const submitData = {
          ...row,
          phone_no: row.mobile_number,
        };

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
          setUploadedImage(null);
          setFormRows([{
            tempId: crypto.randomUUID(),
            join_date: new Date().toISOString().split('T')[0],
            employee_name: "",
            employee_number: "",
            mobile_number: "",
            id_proof_no: "",
            designation: "",
            salary_type: "Per Duty",
            salary: 0,
            address: "",
            description: "",
            has_pf: false,
            has_esi: false,
            has_income_tax: false,
            image_url: "",
          }]);
          fetchEmployees();
        } else {
          toast({ title: "Error", description: result.error || "Failed to update employee", variant: "destructive" });
        }
      } else {
        // Create mode - submit all rows
        for (const row of formRows) {
          const submitData = {
            ...row,
            phone_no: row.mobile_number,
          };

          const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(submitData)
          });
          const result = await response.json();

          if (!result.ok) {
            toast({ title: "Error", description: result.error || `Failed to add employee: ${row.employee_name}`, variant: "destructive" });
            return;
          }
        }

        toast({ title: "Success", description: `${formRows.length} employee(s) added successfully` });
        setUploadedImage(null);
        setFormRows([{
          tempId: crypto.randomUUID(),
          join_date: new Date().toISOString().split('T')[0],
          employee_name: "",
          employee_number: "",
          mobile_number: "",
          id_proof_no: "",
          designation: "",
          salary_type: "Per Duty",
          salary: 0,
          address: "",
          description: "",
          has_pf: false,
          has_esi: false,
          has_income_tax: false,
          image_url: "",
        }]);
        fetchEmployees();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save employee", variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUploadedImage(base64String);
        // Apply to all rows or current row? Adopt upstream approach: apply to currently being added rows
        setFormRows(formRows.map(row => ({ ...row, image_url: base64String })));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingId(employee.id);
    setFormRows([{
      tempId: crypto.randomUUID(),
      join_date: employee.join_date ? new Date(employee.join_date).toISOString().split('T')[0] : "",
      employee_name: employee.employee_name || employee.employeeName || "",
      employee_number: employee.employee_number || "",
      mobile_number: employee.mobile_number || employee.mobileNumber || "",
      id_proof_no: employee.id_proof_no || "",
      designation: employee.designation || "",
      salary_type: employee.salary_type || "Per Duty",
      salary: parseFloat(employee.salary) || 0,
      address: employee.address || "",
      description: employee.description || "",
      has_pf: employee.has_pf || false,
      has_esi: employee.has_esi || false,
      has_income_tax: employee.has_income_tax || false,
      image_url: employee.image_url || "",
    }]);
    setUploadedImage(employee.image_url || null);
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

  const toggleStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Success",
          description: `Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        });
        fetchEmployees();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (employee.employee_name?.toLowerCase() || '').includes(searchLower) ||
      (employee.designation?.toLowerCase() || '').includes(searchLower) ||
      (employee.mobile_number?.toLowerCase() || '').includes(searchLower) ||
      (employee.employee_number?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-blue-700 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-2">
          <CardTitle className="text-lg font-medium">Create Employee</CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-blue-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            {formRows.map((row, index) => (
              <div key={row.tempId} className="p-4 bg-white rounded-lg border-2 border-blue-200 space-y-3 relative">
                {formRows.length > 1 && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Row {index + 1}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor={`join_date_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Join Date <span className="text-red-500">*</span></Label>
                    <Input
                      id={`join_date_${row.tempId}`}
                      type="date"
                      value={row.join_date}
                      onChange={(e) => updateRow(row.tempId, 'join_date', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`employee_name_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Employee Name <span className="text-red-500">*</span></Label>
                    <Input
                      id={`employee_name_${row.tempId}`}
                      value={row.employee_name}
                      onChange={(e) => updateRow(row.tempId, 'employee_name', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                      placeholder="Employee Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`employee_number_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Employee Number</Label>
                    <Input
                      id={`employee_number_${row.tempId}`}
                      value={row.employee_number}
                      onChange={(e) => updateRow(row.tempId, 'employee_number', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                      placeholder="Emp No"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`mobile_number_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Phone No.</Label>
                    <Input
                      id={`mobile_number_${row.tempId}`}
                      value={row.mobile_number}
                      onChange={(e) => updateRow(row.tempId, 'mobile_number', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor={`id_proof_no_${row.tempId}`} className="text-xs text-blue-900 font-semibold">ID Proof No.</Label>
                    <Input
                      id={`id_proof_no_${row.tempId}`}
                      value={row.id_proof_no}
                      onChange={(e) => updateRow(row.tempId, 'id_proof_no', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                      placeholder="Aadhaar/PAN"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`designation_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Designation <span className="text-red-500">*</span></Label>
                    <Input
                      id={`designation_${row.tempId}`}
                      value={row.designation}
                      onChange={(e) => updateRow(row.tempId, 'designation', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                      placeholder="Designation"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`salary_type_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Salary Type <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => updateRow(row.tempId, 'salary_type', value)}
                      value={row.salary_type}
                    >
                      <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500 h-8 mt-0.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                        <SelectItem value="Per Duty">Per Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`salary_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Salary</Label>
                    <Input
                      id={`salary_${row.tempId}`}
                      type="number"
                      value={row.salary}
                      onChange={(e) => updateRow(row.tempId, 'salary', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                      placeholder="Salary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-blue-900 font-semibold">Upload Image</Label>
                    <Input
                      type="file"
                      onChange={handleImageUpload}
                      className="bg-white border-blue-200 focus:border-blue-500 h-8 text-xs mt-0.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`address_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Address</Label>
                    <Textarea
                      id={`address_${row.tempId}`}
                      value={row.address}
                      onChange={(e) => updateRow(row.tempId, 'address', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 h-8 min-h-[32px] mt-0.5"
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`description_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Description</Label>
                    <Textarea
                      id={`description_${row.tempId}`}
                      value={row.description}
                      onChange={(e) => updateRow(row.tempId, 'description', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500 h-8 min-h-[32px] mt-0.5"
                      placeholder="Description"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`has_pf_${row.tempId}`}
                      checked={row.has_pf}
                      onCheckedChange={(checked) => updateRow(row.tempId, 'has_pf', checked as boolean)}
                    />
                    <Label htmlFor={`has_pf_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Provident Fund</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`has_income_tax_${row.tempId}`}
                      checked={row.has_income_tax}
                      onCheckedChange={(checked) => updateRow(row.tempId, 'has_income_tax', checked as boolean)}
                    />
                    <Label htmlFor={`has_income_tax_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Income Tax</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`has_esi_${row.tempId}`}
                      checked={row.has_esi}
                      onCheckedChange={(checked) => updateRow(row.tempId, 'has_esi', checked as boolean)}
                    />
                    <Label htmlFor={`has_esi_${row.tempId}`} className="text-xs text-blue-900 font-semibold">Employees State Insurance</Label>
                  </div>

                  <div className="flex-1 flex justify-end gap-2">
                    {index === formRows.length - 1 ? (
                      <Button
                        type="button"
                        size="icon"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8"
                        onClick={addNewRow}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="rounded-full h-8 w-8"
                        onClick={() => removeRow(row.tempId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center mt-4">
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
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700">Employee Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Employee No</TableHead>
                  <TableHead className="font-bold text-gray-700">Mobile No</TableHead>
                  <TableHead className="font-bold text-gray-700">Designation</TableHead>
                  <TableHead className="font-bold text-gray-700">Date of Join</TableHead>
                  <TableHead className="font-bold text-gray-700">Salary</TableHead>
                  <TableHead className="font-bold text-gray-700">Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">Loading employees...</TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No employees found. Add your first employee above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => toggleStatus(employee.id, employee.is_active !== false)}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${employee.is_active !== false
                                ? 'bg-blue-600 focus:ring-blue-500'
                                : 'bg-gray-300 focus:ring-gray-400'
                              }`}
                            role="switch"
                            aria-checked={employee.is_active !== false}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${employee.is_active !== false ? 'translate-x-9' : 'translate-x-1'
                                }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${employee.is_active !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {employee.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {employee.image_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setViewingImage({ url: employee.image_url, name: employee.employee_name })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{employee.employee_name}</TableCell>
                      <TableCell>{employee.employee_number || "-"}</TableCell>
                      <TableCell>{employee.mobile_number || "-"}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>{new Date(employee.join_date).toLocaleDateString()}</TableCell>
                      <TableCell>{employee.salary || "0.00"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{employee.address || "-"}</TableCell>
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
              This action will delete this employee record. This action cannot be undone.
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

      <Dialog open={viewingImage !== null} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewingImage?.name} - Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {viewingImage?.url && (
              <img src={viewingImage.url} alt={viewingImage.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
