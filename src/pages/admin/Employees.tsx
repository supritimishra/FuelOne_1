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
import { Trash2, Plus, Pencil, Eye } from "lucide-react";
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

const Employees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
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

  const onSubmit = async (data: EmployeeFormData) => {
    const submitData = {
      ...data,
      phone_no: data.mobile_number,
    };

    console.log('Submitting employee data:', submitData);
    console.log('Editing ID:', editingId);

    try {
      if (editingId) {
        console.log('Making PUT request to:', `/api/employees/${editingId}`);
        const response = await fetch(`/api/employees/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 500));
          throw new Error(`Server returned ${response.status}: Expected JSON but got ${contentType}. Check server logs.`);
        }
        
        const result = await response.json();
        console.log('Response result:', result);

        if (result.ok) {
          toast({ title: "Success", description: "Employee updated successfully" });
          setEditingId(null);
          setUploadedImage(null);
          form.reset({
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
          });
          fetchEmployees();
        } else {
          toast({ title: "Error", description: result.error || "Failed to update employee", variant: "destructive" });
        }
      } else {
        console.log('Making POST request to: /api/employees');
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 500));
          throw new Error(`Server returned ${response.status}: Expected JSON but got ${contentType}. Check server logs.`);
        }
        
        const result = await response.json();
        console.log('Response result:', result);

        if (result.ok) {
          toast({ title: "Success", description: "Employee added successfully" });
          setUploadedImage(null);
          form.reset({
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
          });
          fetchEmployees();
        } else {
          toast({ title: "Error", description: result.error || "Failed to add employee", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({ title: "Error", description: `Failed to save employee: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUploadedImage(base64String);
        form.setValue("image_url", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingId(employee.id);
    form.reset({
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
    });
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
      console.log('Toggling status for employee:', { employeeId, currentStatus, newStatus: !currentStatus });
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      console.log('Toggle response status:', response.status);
      
      const result = await response.json();
      console.log('Toggle response result:', result);

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
      console.error('Toggle status error:', error);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="join_date" className="text-xs text-blue-900 font-semibold">Join Date <span className="text-red-500">*</span></Label>
                <Input
                  id="join_date"
                  type="date"
                  {...form.register("join_date")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                />
                {form.formState.errors.join_date && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.join_date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employee_name" className="text-xs text-blue-900 font-semibold">Employee Name <span className="text-red-500">*</span></Label>
                <Input
                  id="employee_name"
                  {...form.register("employee_name")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Employee Name"
                />
                {form.formState.errors.employee_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.employee_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employee_number" className="text-xs text-blue-900 font-semibold">Employee Number</Label>
                <Input
                  id="employee_number"
                  {...form.register("employee_number")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Emp No"
                />
              </div>
              <div>
                <Label htmlFor="mobile_number" className="text-xs text-blue-900 font-semibold">Phone No.</Label>
                <Input
                  id="mobile_number"
                  {...form.register("mobile_number")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Phone Number"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="id_proof_no" className="text-xs text-blue-900 font-semibold">ID Proof No.</Label>
                <Input
                  id="id_proof_no"
                  {...form.register("id_proof_no")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Aadhaar/PAN"
                />
              </div>
              <div>
                <Label htmlFor="designation" className="text-xs text-blue-900 font-semibold">Designation <span className="text-red-500">*</span></Label>
                <Input
                  id="designation"
                  {...form.register("designation")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Designation"
                />
                {form.formState.errors.designation && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.designation.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="salary_type" className="text-xs text-blue-900 font-semibold">Salary Type <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => form.setValue("salary_type", value as any)}
                  value={form.watch("salary_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500 mt-0.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per Duty">Per Duty</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary" className="text-xs text-blue-900 font-semibold">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  {...form.register("salary", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Upload Image</Label>
                <Input
                  type="file"
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5 text-xs h-9"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/tiff"
                  onChange={handleImageUpload}
                />
                <p className="text-[10px] text-blue-700 mt-0.5">
                  Max 2MB
                </p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-xs text-blue-900 font-semibold">Address</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Address"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-xs text-blue-900 font-semibold">Description</Label>
                <Input
                  id="description"
                  {...form.register("description")}
                  className="bg-white border-blue-200 focus:border-blue-500 mt-0.5"
                  placeholder="Description"
                />
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-blue-100 p-3 rounded-md">
              <Label className="text-xs text-blue-900 font-semibold mb-2 block">Benefits</Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_pf"
                    checked={form.watch("has_pf")}
                    onCheckedChange={(checked) => form.setValue("has_pf", checked as boolean)}
                  />
                  <Label htmlFor="has_pf" className="text-xs text-blue-900 font-medium cursor-pointer">Provident Fund</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_income_tax"
                    checked={form.watch("has_income_tax")}
                    onCheckedChange={(checked) => form.setValue("has_income_tax", checked as boolean)}
                  />
                  <Label htmlFor="has_income_tax" className="text-xs text-blue-900 font-medium cursor-pointer">Income Tax</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_esi"
                    checked={form.watch("has_esi")}
                    onCheckedChange={(checked) => form.setValue("has_esi", checked as boolean)}
                  />
                  <Label htmlFor="has_esi" className="text-xs text-blue-900 font-medium cursor-pointer">Employees State Insurance</Label>
                </div>
                <div className="ml-auto">
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
                        salary_type: "Per Duty",
                        salary: 0,
                        address: "",
                        description: "",
                        has_pf: false,
                        has_esi: false,
                        has_income_tax: false,
                        image_url: "",
                      });
                      setEditingId(null);
                      setUploadedImage(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      toast({ 
                        title: "Ready for new entry", 
                        description: "Form cleared. You can now add another employee." 
                      });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-12 py-2 font-bold text-sm">
                <span className="mr-2">≡ƒÆ╛</span>
                SAVE
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
                <option value="9999999">ALL</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
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
                  <TableHead className="font-bold text-gray-700 text-xs">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Emp Name</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Emp Num</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Mobile Num</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Salary</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Aadhaar Num</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Designation</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Address</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Description</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">Image</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">PF / ESI / IT</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-xs">User Log Details</TableHead>
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
                      <TableCell className="text-xs">{index + 1}</TableCell>
                      <TableCell className="font-medium text-xs">{item.employee_name || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.employee_number || "N/A"}</TableCell>
                      <TableCell className="text-xs">{item.mobile_number || "N/A"}</TableCell>
                      <TableCell className="text-xs">
                        <div className="space-y-0.5">
                          <div>Salary Type: {item.salary_type || "N/A"}</div>
                          <div>Salary: {item.salary || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{item.id_proof_no || "N/A"}</TableCell>
                      <TableCell className="text-xs">{item.designation || 'N/A'}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{item.address || "N/A"}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{item.description || "N/A"}</TableCell>
                      <TableCell className="text-center">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt="Employee" 
                            className="h-8 w-8 object-cover rounded border border-gray-300 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewingImage({ url: item.image_url, name: item.employee_name })}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mx-auto">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[10px]">
                          {item.has_pf && <span className="bg-blue-100 text-blue-800 px-1 rounded">Provident Fund</span>}
                          {item.has_esi && <span className="bg-purple-100 text-purple-800 px-1 rounded">Employees State Insurance</span>}
                          {item.has_income_tax && <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Income Tax</span>}
                          {!item.has_pf && !item.has_esi && !item.has_income_tax && <span className="text-xs">N/A</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => toggleStatus(item.id, item.is_active ?? true)}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              (item.is_active ?? true)
                                ? 'bg-blue-600 focus:ring-blue-500' 
                                : 'bg-gray-300 focus:ring-gray-400'
                            }`}
                            role="switch"
                            aria-checked={item.is_active ?? true}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                                (item.is_active ?? true) ? 'translate-x-9' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span 
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              (item.is_active ?? true)
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {(item.is_active ?? true) ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[200px]">
                        <div>Created: Super Admin</div>
                        <div>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</div>
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

      <Dialog open={viewingImage !== null} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Employee Image - {viewingImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {viewingImage && (
              <img 
                src={viewingImage.url} 
                alt={viewingImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded border border-gray-300"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
