import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Eye, Lock, Square } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const creditCustomerSchema = z.object({
  registered_date: z.string().optional(),
  organization_name: z.string().optional(),
  tin_gst_no: z.string().optional(),
  representative_name: z.string().optional(),
  organization_address: z.string().optional(),
  advance_no: z.string().optional(),
  phone_number: z.string().optional(),
  alt_phone_no: z.string().optional(),
  credit_limit: z.coerce.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().optional(),
  opening_balance: z.coerce.number().optional(),
  opening_date: z.string().optional(),
  balance_type: z.string().optional(),
  discount_amount: z.coerce.number().optional(),
  offer_type: z.string().optional(),
  vehicle_no: z.string().optional(),
  vehicle_type: z.string().optional(),
  penalty_interest: z.any().optional(),
});

type CreditCustomerForm = z.infer<typeof creditCustomerSchema>;

export default function CreditCustomers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Active" | "Inactive" | "All">("Active");

  const form = useForm<CreditCustomerForm>({
    resolver: zodResolver(creditCustomerSchema),
    defaultValues: {
      registered_date: new Date().toISOString().split('T')[0],
      organization_name: "",
      tin_gst_no: "",
      representative_name: "",
      organization_address: "",
      advance_no: "",
      phone_number: "",
      alt_phone_no: "",
      credit_limit: 0,
      username: "",
      password: "",
      email: "",
      opening_balance: 0,
      opening_date: new Date().toISOString().split('T')[0],
      balance_type: "Credit",
      discount_amount: 0,
      offer_type: "Per 1 ltr",
      vehicle_no: "",
      vehicle_type: "",
      penalty_interest: false,
    },
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/credit-customers', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setCustomers(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch customers" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch customers" });
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onSubmit = async (data: CreditCustomerForm) => {
    const submitData = {
      ...data,
      mobile_number: data.phone_number, // Mapping Phone No to mobile_number for backend compatibility
      balance_type: data.balance_type === "Credit" ? "Due" : "Excess", // Mapping back to backend values if needed
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/credit-customers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Customer updated successfully" });
          setEditingId(null);
          form.reset();
          fetchCustomers();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update customer" });
        }
      } else {
        const response = await fetch('/api/credit-customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Customer added successfully" });
          form.reset();
          fetchCustomers();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to add customer" });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save customer" });
    }
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    form.reset({
      registered_date: customer.registered_date ? new Date(customer.registered_date).toISOString().split('T')[0] : "",
      organization_name: customer.organization_name,
      tin_gst_no: customer.tin_gst_no || "",
      representative_name: customer.representative_name || "",
      organization_address: customer.organization_address || "",
      advance_no: customer.advance_no || "",
      phone_number: customer.mobile_number || "", // Mapping back
      alt_phone_no: customer.alt_phone_no || "",
      credit_limit: parseFloat(customer.credit_limit) || 0,
      username: customer.username || "",
      email: customer.email || "",
      opening_balance: parseFloat(customer.opening_balance) || 0,
      opening_date: customer.opening_date ? new Date(customer.opening_date).toISOString().split('T')[0] : "",
      balance_type: customer.balance_type === "Due" ? "Credit" : (customer.balance_type === "Excess" ? "Debit" : (customer.balance_type || "Credit")),
      discount_amount: parseFloat(customer.discount_amount) || 0,
      offer_type: customer.offer_type || "Per 1 ltr",
      vehicle_no: customer.vehicle_no || "",
      vehicle_type: customer.vehicle_type || "",
      penalty_interest: Boolean(customer.penalty_interest),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/credit-customers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        if (result.softDeleted) {
          toast({ title: "Deactivated", description: result.message || "Customer deactivated due to existing records" });
        } else {
          toast({ title: "Success", description: "Customer deleted successfully" });
        }
        fetchCustomers();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete customer" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete customer" });
    }
    setDeleteConfirm(null);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.representative_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "Active") return c.is_active !== false;
    if (statusFilter === "Inactive") return c.is_active === false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Credit Customer</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            const errorMessages = Object.values(errors).map((e: any) => e.message).join(", ");
            toast({ variant: "destructive", title: "Validation Error", description: errorMessages || "Check form for errors" });
          })} className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="registered_date" className="text-blue-900 font-semibold">Registered Date</Label>
                <Input
                  id="registered_date"
                  type="date"
                  {...form.register("registered_date")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
                {form.formState.errors.registered_date && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.registered_date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="organization_name" className="text-blue-900 font-semibold">Organization Name</Label>
                <Input
                  id="organization_name"
                  {...form.register("organization_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
                {form.formState.errors.organization_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.organization_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="tin_gst_no" className="text-blue-900 font-semibold">TIN / GST NO</Label>
                <Input
                  id="tin_gst_no"
                  {...form.register("tin_gst_no")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="representative_name" className="text-blue-900 font-semibold">Cust/Represent Name</Label>
                <Input
                  id="representative_name"
                  {...form.register("representative_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
                {form.formState.errors.representative_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.representative_name.message}</p>
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="organization_address" className="text-blue-900 font-semibold">Organization Address</Label>
                <Input
                  id="organization_address"
                  {...form.register("organization_address")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="advance_no" className="text-blue-900 font-semibold">Advance Rs/-</Label>
                <Input
                  id="advance_no"
                  {...form.register("advance_no")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-blue-900 font-semibold">Upload Image</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    className="bg-white border-blue-200 focus:border-blue-500 text-xs"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Allowed: JPEG, JPG, TIF, GIF, PNG | MaxSize: 2MB</p>
              </div>
              <div>
                <Label htmlFor="phone_number" className="text-blue-900 font-semibold">Phone No</Label>
                <Input
                  id="phone_number"
                  {...form.register("phone_number")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="alt_phone_no" className="text-blue-900 font-semibold">Alt Phone No</Label>
                <Input
                  id="alt_phone_no"
                  {...form.register("alt_phone_no")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="credit_limit" className="text-blue-900 font-semibold">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  {...form.register("credit_limit", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="username" className="text-blue-900 font-semibold">User Name</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-blue-900 font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="email" className="text-blue-900 font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="opening_balance" className="text-blue-900 font-semibold">Opening Balance (₹)</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  {...form.register("opening_balance", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="opening_date" className="text-blue-900 font-semibold">Opening Date</Label>
                <Input
                  id="opening_date"
                  type="date"
                  {...form.register("opening_date")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">Cutoff Date (Ex:31-Mar-202X)</p>
              </div>
              <div>
                <Label className="text-blue-900 font-semibold">Balance Type</Label>
                <Select
                  onValueChange={(val) => form.setValue("balance_type", val as "Credit" | "Debit")}
                  defaultValue={form.getValues("balance_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500" aria-label="Balance Type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-[10px] text-gray-500 mt-1">
                  <span className="block">Due : Will Receive</span>
                  <span className="block">Excess : Will Payback</span>
                </div>
              </div>
            </div>

            {/* Row 5 & Penalty Interest */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div>
                <Label htmlFor="discount_amount" className="text-blue-900 font-semibold">Discount Amount</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  {...form.register("discount_amount", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="offer_type" className="text-blue-900 font-semibold">Offer Type</Label>
                <Select
                  onValueChange={(val) => form.setValue("offer_type", val)}
                  defaultValue={form.getValues("offer_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500" aria-label="Offer Type">
                    <SelectValue placeholder="Select Offer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per 1 ltr">Per 1 ltr</SelectItem>
                    <SelectItem value="Per Transaction">Per Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Penalty Interest Checkbox - Spanning remaining columns or just placed on the right */}
              <div className="md:col-span-2 flex justify-end items-center h-full pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50 flex items-center gap-2"
                  onClick={() => form.setValue("penalty_interest", !form.getValues("penalty_interest"))}
                >
                  <div className={`w-4 h-4 border border-blue-900 rounded-sm flex items-center justify-center ${form.watch("penalty_interest") ? "bg-blue-900" : ""}`}>
                    {form.watch("penalty_interest") && <span className="text-white text-xs">✓</span>}
                  </div>
                  Penalty Interest
                </Button>
              </div>
            </div>

            {/* Row 6 - Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="vehicle_no" className="text-blue-900 font-semibold">Vehicle No</Label>
                <Input
                  id="vehicle_no"
                  {...form.register("vehicle_no")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Vehicle No"
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="vehicle_type" className="text-blue-900 font-semibold">Vehicle Type</Label>
                  <Select
                    onValueChange={(val) => form.setValue("vehicle_type", val)}
                    defaultValue={form.getValues("vehicle_type")}
                  >
                    <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500" aria-label="Vehicle Type">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Bike">Bike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 shrink-0" aria-label="Add Vehicle Type">
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
              <span className="text-sm text-gray-500">Status:</span>
              <select
                className="border rounded p-1 text-sm bg-white"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="All">All</option>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center whitespace-nowrap">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Date</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Organization</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">GST NO</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Phone Number</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Discount</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Opening Details</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Advance</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Limit</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Email</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Address</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Represent</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Image</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">Vehicles</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">App Login</TableHead>
                  <TableHead className="font-bold text-gray-700 whitespace-nowrap">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-8 text-gray-500">
                      No customers found. Add your first customer above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(item)}
                            aria-label="Edit customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteConfirm(item.id)}
                            aria-label="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_active ? (
                          <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded font-bold">
                            ACTIVATED
                          </span>
                        ) : (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                            INACTIVE
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{item.registered_date ? new Date(item.registered_date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="font-medium">{item.organization_name}</TableCell>
                      <TableCell>{item.tin_gst_no || "-"}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>Phone: {item.mobile_number || "-"}</div>
                          <div>Alt No: {item.alt_phone_no || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>Offer: {item.discount_amount || "0"}</div>
                          <div>Type: {item.offer_type || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {item.opening_balance} ({item.balance_type || "Due"})
                        </div>
                      </TableCell>
                      <TableCell>{item.advance_no || "0"}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{Number(item.credit_limit || 0).toFixed(2)}</div>
                          <div>Days: 0</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.email || "-"}</TableCell>
                      <TableCell>{item.organization_address || "-"}</TableCell>
                      <TableCell>{item.representative_name}</TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="text-xs h-6">View</Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>User Name: {item.username || "-"}</div>
                          <div>Password: {item.password ? "********" : "-"}</div>
                        </div>
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
            <span>Showing 1 to {filteredCustomers.length} of {filteredCustomers.length} entries</span>
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
              This action will delete this customer. This action cannot be undone.
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
}
