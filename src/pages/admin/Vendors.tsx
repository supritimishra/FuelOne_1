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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const vendorSchema = z.object({
  vendor_name: z.string().min(1, "Vendor Name is required"),
  vendor_type: z.string().min(1, "Vendor Type is required"),
  phone_number: z.string().optional(),
  gst_tin: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  opening_balance: z.coerce.number().min(0, "Opening Balance must be positive"),
  opening_date: z.string().optional(),
  opening_type: z.string().optional(),
  description: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function Vendors() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendor_name: "",
      vendor_type: "Liquids",
      phone_number: "",
      gst_tin: "",
      email: "",
      address: "",
      opening_balance: 0,
      opening_date: new Date().toISOString().split('T')[0],
      opening_type: "",
      description: "",
    }
  });

  const fetchVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vendors', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        setVendors(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch vendors" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch vendors" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const onSubmit = async (data: VendorFormData) => {
    const submitData = {
      ...data,
      phone_number: data.phone_number || null,
      gst_tin: data.gst_tin || null,
      email: data.email || null,
      address: data.address || null,
      opening_date: data.opening_date || null,
      opening_type: data.opening_type || null,
      description: data.description || null,
      current_balance: data.opening_balance, // Initialize current balance with opening balance
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/vendors/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Vendor updated successfully" });
          setEditingId(null);
          form.reset();
          fetchVendors();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update vendor" });
        }
      } else {
        const response = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Vendor added successfully" });
          form.reset();
          fetchVendors();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to add vendor" });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save vendor" });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      vendor_name: item.vendor_name,
      vendor_type: item.vendor_type,
      phone_number: item.phone_number || "",
      gst_tin: item.gst_tin || "",
      email: item.email || "",
      address: item.address || "",
      opening_balance: parseFloat(item.opening_balance) || 0,
      opening_date: item.opening_date ? new Date(item.opening_date).toISOString().split('T')[0] : "",
      opening_type: item.opening_type || "",
      description: item.description || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Vendor deleted" });
        fetchVendors();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete vendor" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete vendor" });
    }
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (item: any) => {
    try {
      const newStatus = item.is_active === false; // Toggle status
      const response = await fetch(`/api/vendors/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...item, is_active: newStatus })
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: `Vendor ${newStatus ? 'activated' : 'disabled'}` });
        fetchVendors();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update status" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const filteredVendors = vendors.filter((item) =>
    item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Vendor</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="vendor_name" className="text-blue-900 font-semibold">Vendor Name <span className="text-red-500">*</span></Label>
                <Input
                  id="vendor_name"
                  {...form.register("vendor_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Vendor Name"
                />
                {form.formState.errors.vendor_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.vendor_name.message}</p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="vendor_type" className="text-blue-900 font-semibold">Vendor Type <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => form.setValue("vendor_type", value)}
                  defaultValue={form.getValues("vendor_type")}
                  value={form.watch("vendor_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Liquids">Liquids</SelectItem>
                    <SelectItem value="Lubricants">Lubricants</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.vendor_type && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.vendor_type.message}</p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="phone_number" className="text-blue-900 font-semibold">Phone Num</Label>
                <Input
                  id="phone_number"
                  {...form.register("phone_number")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Phone Num"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="gst_tin" className="text-blue-900 font-semibold">TIN / GST NO</Label>
                <Input
                  id="gst_tin"
                  {...form.register("gst_tin")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="TIN / GST NO"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="email" className="text-blue-900 font-semibold">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Email ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <Label htmlFor="address" className="text-blue-900 font-semibold">Address</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="opening_balance" className="text-blue-900 font-semibold">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  {...form.register("opening_balance", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="0.00"
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
                <div className="text-[10px] text-gray-500 mt-1">Balance Cutoff Date (Ex:31-Mar-202X)</div>
              </div>
              <div>
                <Label htmlFor="opening_type" className="text-blue-900 font-semibold">Opening Type</Label>
                <Select
                  onValueChange={(value) => form.setValue("opening_type", value)}
                  defaultValue={form.getValues("opening_type")}
                  value={form.watch("opening_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Choose Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Payable">Payable</SelectItem>
                    <SelectItem value="Receivable">Receivable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description" className="text-blue-900 font-semibold">Description</Label>
                <Input
                  id="description"
                  {...form.register("description")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Description"
                />
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full">
                <Save className="h-4 w-4 mr-2" /> {editingId ? "UPDATE" : "SAVE"}
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
                  <TableHead className="font-bold text-gray-700">Vendor Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Phone Num</TableHead>
                  <TableHead className="font-bold text-gray-700">GSTIN</TableHead>
                  <TableHead className="font-bold text-gray-700">Type</TableHead>
                  <TableHead className="font-bold text-gray-700">Opening Balance</TableHead>
                  <TableHead className="font-bold text-gray-700">Email</TableHead>
                  <TableHead className="font-bold text-gray-700">Address</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No vendors found. Add your first vendor above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.vendor_name}</TableCell>
                      <TableCell>{item.phone_number || "-"}</TableCell>
                      <TableCell>{item.gst_tin || "-"}</TableCell>
                      <TableCell>{item.vendor_type}</TableCell>
                      <TableCell>₹{item.opening_balance || 0}</TableCell>
                      <TableCell>{item.email || "N/A"}</TableCell>
                      <TableCell>{item.address || "-"}</TableCell>
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={item.is_active !== false}
                            onCheckedChange={() => handleToggleStatus(item)}
                          />
                          <span
                            className={`text-xs px-2 py-1 rounded font-bold ${item.is_active !== false
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {item.is_active !== false ? "ACTIVE" : "INACTIVE"}
                          </span>
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
            <span>Showing 1 to {filteredVendors.length} of {filteredVendors.length} entries</span>
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
              This action will delete this vendor. This action cannot be undone.
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
