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
import { Plus, Pencil, Trash2 } from "lucide-react";
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
    const res = await fetch("/api/credit-customers", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) setCustomers(data.rows || []);
  }, []);

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
      phone_number: customer.phone_number || "",
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
    
    // Scroll to form
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
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          customer.organization_name?.toLowerCase().includes(query) ||
          customer.representative_name?.toLowerCase().includes(query) ||
          customer.phone_number?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.tin_gst_no?.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .slice(0, showCount);

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-4">

      {/* ================= FORM ================= */}
      <Card className="border-t-4 border-blue-700">
        <CardHeader className="bg-blue-600 text-white py-2">
          <CardTitle>
            {editingId ? "Edit Credit Customer" : "Create Credit Customer"}
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-blue-50 p-3">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

            {/* ROW 1 */}
            <div className="grid grid-cols-4 gap-1">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Registered Date*</Label>
                <Input type="date" {...form.register("registered_date")} className="mt-0.5" />
                {form.formState.errors.registered_date && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.registered_date.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Organization Name*</Label>
                <Input placeholder="Organization Name" {...form.register("organization_name")} className="mt-0.5" />
                {form.formState.errors.organization_name && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.organization_name.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">TIN / GST NO</Label>
                <Input placeholder="TIN / GST NO" {...form.register("tin_gst_no")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Cust/Represent Name *</Label>
                <Input placeholder="Cust/Represent Name" {...form.register("representative_name")} className="mt-0.5" />
                {form.formState.errors.representative_name && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.representative_name.message}</p>
                )}
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-4 gap-1">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Organization Address</Label>
                <Input placeholder="Organization Address" {...form.register("organization_address")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Advance Rs/-</Label>
                <Input placeholder="Advance Rs/-" {...form.register("advance_no")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Upload Image</Label>
                <Input 
                  type="file" 
                  className="h-8 text-xs mt-0.5" 
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
                  className="mt-0.5" 
                  maxLength={10}
                  type="tel"
                />
                {form.formState.errors.phone_number && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.phone_number.message}</p>
                )}
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-4 gap-1">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Alt Phone No (10 digits)</Label>
                <Input 
                  placeholder="Alt Phone No" 
                  {...form.register("alt_phone_no")} 
                  className="mt-0.5" 
                  maxLength={10}
                  type="tel"
                />
                {form.formState.errors.alt_phone_no && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.alt_phone_no.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Credit Limit</Label>
                <Input type="number" placeholder="Credit Limit" {...form.register("credit_limit")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">User Name</Label>
                <Input placeholder="User Name" {...form.register("username")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Password</Label>
                <Input type="password" placeholder="Password" {...form.register("password")} className="mt-0.5" />
              </div>
            </div>

            {/* OPENING BALANCE SECTION */}
            <div className="grid grid-cols-12 gap-2 bg-blue-100 p-3 rounded">
              <div className="col-span-3">
                <Label className="text-xs text-blue-900 font-semibold">Email</Label>
                <Input placeholder="Email" type="email" {...form.register("email")} className="mt-0.5" />
                {form.formState.errors.email && (
                  <p className="text-[10px] text-red-600 mt-0.5">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-900 font-semibold">Opening Balance (Γé╣)</Label>
                <Input type="number" placeholder="0" {...form.register("opening_balance")} className="mt-0.5" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-900 font-semibold">Opening Date</Label>
                <Input type="date" {...form.register("opening_date")} className="mt-0.5" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-blue-900 font-semibold">Balance Cutoff Date</Label>
                <Input type="date" className="mt-0.5" placeholder="Balance Cutoff Date" />
                <p className="text-[10px] text-blue-700 mt-0.5">
                  Cutoff Date (Ex:31-Mar-202X)
                </p>
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
                  <SelectTrigger className="mt-0.5">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Due : Will Receive</SelectItem>
                    <SelectItem value="Debit">Excess : Will Payback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 flex items-end">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="penalty_interest" 
                    {...form.register("penalty_interest")}
                    onChange={(e) => setShowRunInterest(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="penalty_interest" className="text-xs text-blue-900 font-semibold cursor-pointer">
                    Penality Interest
                  </Label>
                </div>
              </div>
            </div>

            {/* RUN INTEREST SECTION - Conditional */}
            {showRunInterest && (
              <div className="bg-blue-200 p-3 rounded">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs text-blue-900 font-semibold">Run Interest</Label>
                    <div className="flex gap-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="run_interest_yes" 
                          value="Yes"
                          {...form.register("run_interest")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="run_interest_yes" className="text-xs cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="run_interest_no" 
                          value="No"
                          {...form.register("run_interest")}
                          defaultChecked
                          className="h-4 w-4"
                        />
                        <Label htmlFor="run_interest_no" className="text-xs cursor-pointer text-yellow-400 font-bold">
                          No
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs text-blue-900 font-semibold">Grace days</Label>
                    <Input 
                      type="number" 
                      placeholder="Grace days" 
                      {...form.register("grace_days")} 
                      className="mt-0.5" 
                    />
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs text-blue-900 font-semibold">Interest (%)</Label>
                    <Input 
                      type="number" 
                      placeholder="Interest (%)" 
                      {...form.register("interest_percentage")} 
                      className="mt-0.5" 
                      step="0.01"
                    />
                    <p className="text-[10px] text-white mt-1">
                      Interest per year.
                    </p>
                    <p className="text-[10px] text-white">
                      <span className="font-semibold">Example:</span> If interest per month is 2 % Per Year it will be 2 x 12 months = 24 %
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DISCOUNT SECTION */}
            <div className="grid grid-cols-4 gap-1">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Discount Amount</Label>
                <Input type="number" placeholder="0" {...form.register("discount_amount")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Offer Type</Label>
                <Select 
                  value={offerType} 
                  onValueChange={(v) => {
                    setOfferType(v);
                    form.setValue("offer_type", v);
                  }}
                >
                  <SelectTrigger className="mt-0.5">
                    <SelectValue placeholder="Offer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per 1 ltr">Per 1 ltr</SelectItem>
                    <SelectItem value="Per Transaction">Per Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* VEHICLE SECTION */}
            <div className="grid grid-cols-4 gap-1">
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Vehicle No</Label>
                <Input placeholder="Vehicle No" {...form.register("vehicle_no")} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-xs text-blue-900 font-semibold">Vehicle Type</Label>
                <Select 
                  value={vehicleType} 
                  onValueChange={(v) => {
                    setVehicleType(v);
                    form.setValue("vehicle_type", v);
                  }}
                >
                  <SelectTrigger className="mt-0.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ambulance">Ambulance</SelectItem>
                    <SelectItem value="Auto">Auto</SelectItem>
                    <SelectItem value="Barrel">Barrel</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Cab">Cab</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="JCB">JCB</SelectItem>
                    <SelectItem value="Jeep">Jeep</SelectItem>
                    <SelectItem value="Eicher">Eicher</SelectItem>
                    <SelectItem value="Mini Lorry">Mini Lorry</SelectItem>
                    <SelectItem value="Sumo">Sumo</SelectItem>
                    <SelectItem value="Tractor">Tractor</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SAVE */}
            <div className="flex justify-center gap-2 pt-2">
              {editingId && (
                <Button 
                  type="button" 
                  className="px-10 bg-gray-600 hover:bg-gray-700"
                  onClick={() => {
                    setEditingId(null);
                    setShowRunInterest(false);
                    setUploadedImage(null);
                    setBalanceType("Credit");
                    setOfferType("Per 1 ltr");
                    setVehicleType("");
                    form.reset();
                  }}
                >
                  CANCEL
                </Button>
              )}
              <Button className="px-10 bg-green-600">
                {editingId ? "UPDATE" : "SAVE"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ================= TABLE ================= */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Show:</Label>
              <Select value={String(showCount)} onValueChange={(v) => setShowCount(Number(v))}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="999999">All</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>

            <div className="flex-1 max-w-md">
              <Input
                placeholder="Type to filter by name, phone, email, GST..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCustomers.length}</span> of <span className="font-semibold">{customers.length}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sl</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>GST NO</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Opening Details</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Represent</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>More Info</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCustomers.map((item, i) => (
                  <TableRow key={item.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => setDeleteConfirm(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>{item.registered_date || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{item.organization_name || 'N/A'}</TableCell>
                    <TableCell>{item.tin_gst_no || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div>Phone: {item.phone_number || 'N/A'}</div>
                        {item.alt_phone_no && <div className="text-gray-500">Alt No: {item.alt_phone_no}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div>Offer: {item.discount_amount || 0}</div>
                        <div className="text-gray-500">Type: {item.offer_type || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div>Γé╣{item.opening_balance || 0}</div>
                        <div className="text-gray-500">{item.balance_type || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>Γé╣{item.advance_no || 0}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">Γé╣{item.credit_limit || 0}</div>
                        <div className="text-gray-500 text-xs">Days: {item.grace_days || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.email || 'N/A'}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.organization_address || 'N/A'}</TableCell>
                    <TableCell>{item.representative_name || 'N/A'}</TableCell>
                    <TableCell>
                      {item.image_url ? (
                        <div className="flex items-center justify-center">
                          <img 
                            src={item.image_url} 
                            alt="Customer" 
                            className="h-8 w-8 object-cover rounded border border-gray-300"
                          />
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {item.vehicle_no ? (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600">≡ƒÜ¢</span>
                          <span className="text-xs">{item.vehicle_no}</span>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => setViewingCustomer(item)}
                      >
                        ≡ƒôï
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ================= DELETE DIALOG ================= */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this credit customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================= VIEW DETAILS DIALOG ================= */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Customer Details - {viewingCustomer?.organization_name || 'N/A'}
            </DialogTitle>
            <DialogDescription>
              Complete information for this credit customer
            </DialogDescription>
          </DialogHeader>

          {viewingCustomer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">≡ƒôï</span> Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Registered Date:</span>
                    <span className="ml-2">{viewingCustomer.registered_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Organization Name:</span>
                    <span className="ml-2">{viewingCustomer.organization_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">TIN/GST No:</span>
                    <span className="ml-2">{viewingCustomer.tin_gst_no || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Representative Name:</span>
                    <span className="ml-2">{viewingCustomer.representative_name || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Organization Address:</span>
                    <span className="ml-2">{viewingCustomer.organization_address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                      (viewingCustomer.is_active ?? true) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(viewingCustomer.is_active ?? true) ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">≡ƒô₧</span> Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Phone Number:</span>
                    <span className="ml-2">{viewingCustomer.phone_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Alternate Phone:</span>
                    <span className="ml-2">{viewingCustomer.alt_phone_no || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2">{viewingCustomer.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">≡ƒÆ░</span> Financial Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Credit Limit:</span>
                    <span className="ml-2">Γé╣{viewingCustomer.credit_limit || 0}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Advance Amount:</span>
                    <span className="ml-2">Γé╣{viewingCustomer.advance_no || 0}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Opening Balance:</span>
                    <span className="ml-2">Γé╣{viewingCustomer.opening_balance || 0}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Balance Type:</span>
                    <span className="ml-2">{viewingCustomer.balance_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Opening Date:</span>
                    <span className="ml-2">{viewingCustomer.opening_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Discount Amount:</span>
                    <span className="ml-2">Γé╣{viewingCustomer.discount_amount || 0}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offer Type:</span>
                    <span className="ml-2">{viewingCustomer.offer_type || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Interest & Penalty Information */}
              {viewingCustomer.penalty_interest && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">ΓÜá∩╕Å</span> Penalty & Interest Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Penalty Interest:</span>
                      <span className="ml-2">{viewingCustomer.penalty_interest ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Run Interest:</span>
                      <span className="ml-2">{viewingCustomer.run_interest || 'No'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Grace Days:</span>
                      <span className="ml-2">{viewingCustomer.grace_days || 0} days</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Interest Percentage:</span>
                      <span className="ml-2">{viewingCustomer.interest_percentage || 0}% per year</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Information */}
              {viewingCustomer.vehicle_no && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">≡ƒÜ¢</span> Vehicle Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Vehicle Number:</span>
                      <span className="ml-2">{viewingCustomer.vehicle_no || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Vehicle Type:</span>
                      <span className="ml-2">{viewingCustomer.vehicle_type || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Image */}
              {viewingCustomer.image_url && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">≡ƒû╝∩╕Å</span> Customer Image
                  </h3>
                  <div className="flex justify-center">
                    <img 
                      src={viewingCustomer.image_url} 
                      alt="Customer" 
                      className="max-h-48 object-contain rounded border border-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => setViewingCustomer(null)} className="bg-blue-600">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
