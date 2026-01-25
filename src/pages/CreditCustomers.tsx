import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------- SCHEMA ---------------- */

const creditCustomerSchema = z.object({
  registered_date: z.string().min(1, "Registered date is required"),
  organization_name: z.string().min(1, "Organization name is required"),
  tin_gst_no: z.string().optional(),
  representative_name: z.string().min(1, "Customer/Representative name is required"),
  organization_address: z.string().optional(),
  advance_no: z.string().optional(),
  phone_number: z.string().refine((val) => !val || val.length === 10, {
    message: "Phone number must be exactly 10 digits"
  }).optional(),
  alt_phone_no: z.string().refine((val) => !val || val.length === 10, {
    message: "Alternate phone number must be exactly 10 digits"
  }).optional(),
  credit_limit: z.coerce.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  opening_balance: z.coerce.number().optional(),
  opening_date: z.string().optional(),
  balance_type: z.string().optional(),
  discount_amount: z.coerce.number().optional(),
  offer_type: z.string().optional(),
  vehicle_no: z.string().optional(),
  vehicle_type: z.string().optional(),
  penalty_interest: z.any().optional(),
  run_interest: z.string().optional(),
  grace_days: z.coerce.number().optional(),
  interest_percentage: z.coerce.number().optional(),
  image_url: z.string().optional(),
});

type CreditCustomerForm = z.infer<typeof creditCustomerSchema>;

/* ---------------- COMPONENT ---------------- */

export default function CreditCustomers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showRunInterest, setShowRunInterest] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [balanceType, setBalanceType] = useState("Credit");
  const [offerType, setOfferType] = useState("Per 1 ltr");
  const [vehicleType, setVehicleType] = useState("");
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Active" | "Inactive" | "All">("Active");

  const form = useForm<CreditCustomerForm>({
    resolver: zodResolver(creditCustomerSchema),
    defaultValues: {
      registered_date: new Date().toISOString().split("T")[0],
      opening_date: new Date().toISOString().split("T")[0],
      balance_type: "Credit",
      offer_type: "Per 1 ltr",
      credit_limit: 0,
      opening_balance: 0,
      discount_amount: 0,
      penalty_interest: false,
    },
  });

  /* ---------------- FETCH ---------------- */

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/credit-customers", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) setCustomers(data.rows || []);
      else toast({ variant: "destructive", title: "Error", description: data.error || "Failed to fetch customers" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch customers" });
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = async (data: CreditCustomerForm) => {
    const payload = {
      ...data,
      mobile_number: data.phone_number,
      balance_type: data.balance_type === "Credit" ? "Due" : "Excess",
    };

    const url = editingId
      ? `/api/credit-customers/${editingId}`
      : "/api/credit-customers";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.ok) {
      toast({
        title: "Success",
        description: editingId ? "Updated successfully" : "Saved successfully"
      });
      form.reset();
      setEditingId(null);
      setShowRunInterest(false);
      setUploadedImage(null);
      setBalanceType("Credit");
      setOfferType("Per 1 ltr");
      setVehicleType("");
      fetchCustomers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save",
        variant: "destructive"
      });
    }
  };

  /* ---------------- EDIT ---------------- */

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    form.reset({
      registered_date: customer.registered_date || new Date().toISOString().split("T")[0],
      organization_name: customer.organization_name || "",
      tin_gst_no: customer.tin_gst_no || "",
      representative_name: customer.representative_name || "",
      organization_address: customer.organization_address || "",
      advance_no: customer.advance_no || "",
      phone_number: customer.phone_number || customer.mobile_number || "",
      alt_phone_no: customer.alt_phone_no || "",
      credit_limit: customer.credit_limit || 0,
      username: customer.username || "",
      password: customer.password || "",
      email: customer.email || "",
      opening_balance: customer.opening_balance || 0,
      opening_date: customer.opening_date || new Date().toISOString().split("T")[0],
      balance_type: customer.balance_type || "Credit",
      discount_amount: customer.discount_amount || 0,
      offer_type: customer.offer_type || "Per 1 ltr",
      vehicle_no: customer.vehicle_no || "",
      vehicle_type: customer.vehicle_type || "",
      penalty_interest: customer.penalty_interest || false,
      run_interest: customer.run_interest || "No",
      grace_days: customer.grace_days || 0,
      interest_percentage: customer.interest_percentage || 0,
      image_url: customer.image_url || "",
    });

    setUploadedImage(customer.image_url || null);
    setBalanceType(customer.balance_type || "Credit");
    setOfferType(customer.offer_type || "Per 1 ltr");
    setVehicleType(customer.vehicle_type || "");

    if (customer.penalty_interest) {
      setShowRunInterest(true);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    const res = await fetch(`/api/credit-customers/${deleteConfirm}`, {
      method: "DELETE",
      credentials: "include",
    });

    const result = await res.json();

    if (result.ok) {
      toast({ title: "Success", description: "Deleted successfully" });
      setDeleteConfirm(null);
      fetchCustomers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete",
        variant: "destructive"
      });
    }
  };

  /* ---------------- TOGGLE STATUS ---------------- */

  const toggleStatus = async (customerId: string, currentStatus: boolean) => {
    const res = await fetch(`/api/credit-customers/${customerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ is_active: !currentStatus }),
    });

    const result = await res.json();

    if (result.ok) {
      toast({
        title: "Success",
        description: `Customer ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      fetchCustomers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  /* ---------------- IMAGE UPLOAD ---------------- */

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

  /* ---------------- FILTERING ---------------- */

  const filteredCustomers = customers
    .filter((customer) => {
      // Search filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || (
        customer.organization_name?.toLowerCase().includes(query) ||
        customer.representative_name?.toLowerCase().includes(query) ||
        customer.phone_number?.toLowerCase().includes(query) ||
        customer.mobile_number?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.tin_gst_no?.toLowerCase().includes(query)
      );

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "Active") return customer.is_active !== false;
      if (statusFilter === "Inactive") return customer.is_active === false;
      return true;
    });

  const paginatedCustomers = filteredCustomers.slice(0, showCount === 999999 ? filteredCustomers.length : showCount);

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-4">

      <Card className="border-t-4 border-blue-700">
        <CardHeader className="bg-blue-600 text-white py-2">
          <CardTitle>
            {editingId ? "Edit Credit Customer" : "Create Credit Customer"}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-blue-50 p-3">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

            {/* ROW 1 */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Registered Date*</Label>
                <Input type="date" {...form.register("registered_date")} className="mt-0.5 h-8 text-xs" />
                {form.formState.errors.registered_date && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.registered_date.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Organization Name*</Label>
                <Input placeholder="Organization Name" {...form.register("organization_name")} className="mt-0.5 h-8 text-xs" />
                {form.formState.errors.organization_name && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.organization_name.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">TIN / GST NO</Label>
                <Input placeholder="TIN / GST NO" {...form.register("tin_gst_no")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Cust/Represent Name*</Label>
                <Input placeholder="Cust/Represent Name" {...form.register("representative_name")} className="mt-0.5 h-8 text-xs" />
                {form.formState.errors.representative_name && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.representative_name.message}</p>
                )}
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Organization Address</Label>
                <Input placeholder="Organization Address" {...form.register("organization_address")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Advance Rs/-</Label>
                <Input placeholder="Advance Rs/-" {...form.register("advance_no")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Upload Image</Label>
                <Input
                  type="file"
                  className="h-8 text-[10px] mt-0.5"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/tiff"
                  onChange={handleImageUpload}
                />
                <p className="text-[10px] text-blue-700 mt-0.5">
                  Allowed (JPEG, JPG, TIF, GIF, PNG) MaxSize:2MB
                </p>
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Phone No (10 digits)</Label>
                <Input
                  placeholder="Phone No"
                  {...form.register("phone_number")}
                  className="mt-0.5 h-8 text-xs"
                  maxLength={10}
                  type="tel"
                />
                {form.formState.errors.phone_number && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.phone_number.message}</p>
                )}
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Alt Phone No (10 digits)</Label>
                <Input
                  placeholder="Alt Phone No"
                  {...form.register("alt_phone_no")}
                  className="mt-0.5 h-8 text-xs"
                  maxLength={10}
                  type="tel"
                />
                {form.formState.errors.alt_phone_no && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.alt_phone_no.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Credit Limit</Label>
                <Input type="number" placeholder="Credit Limit" {...form.register("credit_limit")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">User Name</Label>
                <Input placeholder="User Name" {...form.register("username")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Password</Label>
                <Input type="password" placeholder="Password" {...form.register("password")} className="mt-0.5 h-8 text-xs" />
              </div>
            </div>

            {/* OPENING BALANCE SECTION */}
            <div className="grid grid-cols-12 gap-2 bg-blue-100 p-3 rounded">
              <div className="col-span-3">
                <Label className="text-xs text-blue-900 font-semibold">Email</Label>
                <Input placeholder="Email" type="email" {...form.register("email")} className="mt-0.5 h-8 text-xs" />
                {form.formState.errors.email && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-900 font-semibold">Opening Balance (₹)</Label>
                <Input type="number" placeholder="0" {...form.register("opening_balance")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-900 font-semibold">Opening Date</Label>
                <Input type="date" {...form.register("opening_date")} className="mt-0.5 h-8 text-xs" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-900 font-semibold">Balance Type</Label>
                <Select
                  value={balanceType}
                  onValueChange={(v) => {
                    setBalanceType(v);
                    form.setValue("balance_type", v);
                  }}
                >
                  <SelectTrigger className="mt-0.5 h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Due : Will Receive</SelectItem>
                    <SelectItem value="Debit">Excess : Will Payback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 flex items-end">
                <div className="flex items-center space-x-2 pb-1">
                  <input
                    type="checkbox"
                    id="penalty_interest"
                    {...form.register("penalty_interest")}
                    onChange={(e) => setShowRunInterest(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="penalty_interest" className="text-xs text-blue-900 font-semibold cursor-pointer">
                    Penalty Interest
                  </Label>
                </div>
              </div>
            </div>

            {showRunInterest && (
              <div className="bg-blue-200 p-3 rounded">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs text-blue-900 font-semibold">Run Interest</Label>
                    <div className="flex gap-3 mt-1">
                      <div className="flex items-center space-x-1">
                        <input type="radio" id="ryes" value="Yes" {...form.register("run_interest")} className="h-3 w-3" />
                        <Label htmlFor="ryes" className="text-[10px]">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <input type="radio" id="rno" value="No" {...form.register("run_interest")} className="h-3 w-3" defaultChecked />
                        <Label htmlFor="rno" className="text-[10px]">No</Label>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs text-blue-900 font-semibold">Grace days</Label>
                    <Input type="number" {...form.register("grace_days")} className="h-8 text-xs mt-0.5" />
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs text-blue-900 font-semibold">Interest (%)</Label>
                    <Input type="number" step="0.01" {...form.register("interest_percentage")} className="h-8 text-xs mt-0.5" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2Items-end">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Discount Amount</Label>
                <Input type="number" {...form.register("discount_amount")} className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Offer Type</Label>
                <Select value={offerType} onValueChange={(v) => { setOfferType(v); form.setValue("offer_type", v); }}>
                  <SelectTrigger className="mt-0.5 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per 1 ltr">Per 1 ltr</SelectItem>
                    <SelectItem value="Flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Status Filter</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="mt-0.5 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-center">
                <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold h-8 text-xs">
                  {editingId ? "UPDATE" : "SAVE"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="p-3 bg-white border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Show:</span>
            <Select value={String(showCount)} onValueChange={(v) => setShowCount(Number(v))}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="999999">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search customers..."
              className="h-7 w-48 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="font-bold text-[11px] h-8">S.No</TableHead>
                <TableHead className="font-bold text-[11px] h-8 text-center">Status</TableHead>
                <TableHead className="font-bold text-[11px] h-8 text-center">Action</TableHead>
                <TableHead className="font-bold text-[11px] h-8">Organization</TableHead>
                <TableHead className="font-bold text-[11px] h-8">Representative</TableHead>
                <TableHead className="font-bold text-[11px] h-8">Mobile</TableHead>
                <TableHead className="font-bold text-[11px] h-8 text-right">Limit</TableHead>
                <TableHead className="font-bold text-[11px] h-8 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-xs text-gray-500">No customers found.</TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer, index) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50 h-10">
                    <TableCell className="text-xs">{index + 1}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggleStatus(customer.id, customer.is_active !== false)}
                          className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${customer.is_active !== false ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.is_active !== false ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-[9px] font-bold ${customer.is_active !== false ? 'text-green-600' : 'text-gray-500'}`}>
                          {customer.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleEdit(customer)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setDeleteConfirm(customer.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-blue-900">{customer.organization_name}</TableCell>
                    <TableCell className="text-xs">{customer.representative_name}</TableCell>
                    <TableCell className="text-xs">{customer.mobile_number || customer.phone_number || "-"}</TableCell>
                    <TableCell className="text-xs text-right">{parseFloat(customer.credit_limit || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">
                      {parseFloat(customer.opening_balance || 0).toLocaleString()}
                      <span className="text-[10px] ml-1 text-gray-500">{customer.balance_type === 'Due' ? 'DR' : 'CR'}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this customer. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
