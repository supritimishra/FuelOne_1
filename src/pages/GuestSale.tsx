import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Edit, Trash2, Save, Plus, Search, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

// Schema using camelCase to match Backend Drizzle Schema
const guestEntrySchema = z.object({
  saleDate: z.string().min(1, "Date is required"),
  shift: z.enum(["S-1", "S-2"]).default("S-1"),
  customerName: z.string().optional(),
  mobileNumber: z.string().optional(),
  billNo: z.string().optional(),
  vehicleNumber: z.string().optional(),
  fuelProductId: z.string().min(1, "Product is required"),
  pricePerUnit: z.coerce.number().min(0.01, "Price must be greater than 0"),
  amount: z.coerce.number().min(0, "Amount is required"),
  discount: z.coerce.number().default(0),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  description: z.string().optional(),
  paymentMode: z.enum(["Cash", "UPI", "Card", "Credit"]).default("Cash"),
  employeeId: z.string().optional(),
  sendSms: z.boolean().default(false).optional(),
  gstNumber: z.string().optional(),
});

type GuestEntryForm = z.infer<typeof guestEntrySchema>;

export default function GuestSale() {
  const queryClient = useQueryClient();
  const [gstModalOpen, setGstModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({ from: '', to: '', mobile: '' });
  const [tempGst, setTempGst] = useState("");

  // Fetch Master Data
  const { data: fuelProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const res = await fetch("/api/fuel-products");
      const d = await res.json();
      return d.data || d.rows || [];
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const d = await res.json();
      return d.data || d.rows || [];
    },
  });

  const { data: guestEntries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/guest-sales", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.from) params.append('from', searchParams.from);
      if (searchParams.to) params.append('to', searchParams.to);
      if (searchParams.mobile) params.append('mobile', searchParams.mobile);

      const res = await fetch(`/api/guest-sales?${params.toString()}`);
      const d = await res.json();
      return d.data || d.rows || [];
    },
  });

  const form = useForm<GuestEntryForm>({
    resolver: zodResolver(guestEntrySchema),
    defaultValues: {
      saleDate: new Date().toISOString().slice(0, 10),
      shift: "S-1",
      customerName: "",
      mobileNumber: "",
      billNo: "",
      vehicleNumber: "",
      fuelProductId: "",
      pricePerUnit: 0,
      amount: 0,
      discount: 0,
      quantity: 0,
      description: "",
      paymentMode: "Cash",
      employeeId: "",
      sendSms: false,
      gstNumber: "",
    },
  });

  // Watchers for Calculations
  const watchPrice = form.watch("pricePerUnit");
  const watchAmount = form.watch("amount");
  const watchQty = form.watch("quantity");
  const watchProduct = form.watch("fuelProductId");
  const watchGst = form.watch("gstNumber");

  // Price calculation is now handled in onChange events directly


  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: GuestEntryForm) => {
      const res = await fetch("/api/guest-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), // Send data exactly as is (camelCase)
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Failed to create");
      return d;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-sales"] });
      toast({ title: "Success", description: "Sale saved successfully" });
      form.reset({
        saleDate: new Date().toISOString().slice(0, 10),
        shift: "S-1",
        pricePerUnit: 0,
        amount: 0,
        quantity: 0,
        discount: 0,
        paymentMode: "Cash",
        sendSms: false,
        gstNumber: "",
        customerName: "",
        mobileNumber: "",
        billNo: "",
        vehicleNumber: "",
        description: "",
        fuelProductId: "", // Reset product too if desired
      });
      setTempGst("");
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const onSubmit = (data: GuestEntryForm) => {
    // If price is missing but we have amount and quantity, calculate it and set it
    if (data.pricePerUnit <= 0 && data.amount > 0 && data.quantity > 0) {
      data.pricePerUnit = Number((data.amount / data.quantity).toFixed(2));
    }

    // Force update the hidden input so the form state is consistent
    if (data.pricePerUnit > 0) {
      form.setValue("pricePerUnit", data.pricePerUnit);
    }

    if (data.pricePerUnit <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Could not determine Price. Please ensure both Amount and Quantity are entered." });
      return;
    }
    createMutation.mutate(data);
  };

  // Calculation Handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    form.setValue("amount", val);

    // If we have quantity, back-calculate price
    const qty = form.getValues("quantity");
    if (qty > 0) {
      form.setValue("pricePerUnit", parseFloat((val / qty).toFixed(2)));
    }
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    form.setValue("quantity", val);

    // If we have amount, back-calculate price
    const amt = form.getValues("amount");
    if (amt > 0 && val > 0) {
      form.setValue("pricePerUnit", parseFloat((amt / val).toFixed(2)));
    }
  };

  const handleSaveGst = () => {
    form.setValue("gstNumber", tempGst);
    setGstModalOpen(false);
    toast({ title: "GST Saved", description: "GST Number added to current form" });
  };

  // Prepare Search state updaters
  const updateSearch = (key: string, val: string) => {
    setSearchParams(prev => ({ ...prev, [key]: val }));
  };

  const triggerSearch = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Top Info Bar Placeholder */}
      <div className="flex gap-4 mb-4">
        <div className="bg-cyan-500 text-white px-3 py-1 rounded font-bold">MS : 105.74</div>
        <div className="bg-cyan-500 text-white px-3 py-1 rounded font-bold">HSD : 92.32</div>
        <div className="bg-cyan-500 text-white px-3 py-1 rounded font-bold">XP : 113.2</div>
      </div>

      <Card className="bg-blue-600 border-none shadow-lg text-white">
        <CardHeader className="py-4">
          <CardTitle>Regular Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Total Display */}
              <div className="bg-white text-black p-2 rounded w-1/3 mb-4 flex justify-between">
                <span className="font-bold">Total Amount Value: {watchAmount}</span>
                {watchGst && <span className="text-blue-600 font-bold ml-2">GST: {watchGst}</span>}
              </div>

              {/* Date & Shift */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex bg-white rounded overflow-hidden w-full md:w-auto">
                  <div className="bg-yellow-400 text-black px-4 py-2 font-bold">Choose Date</div>
                  <Input
                    type="date"
                    {...form.register("saleDate")}
                    className="border-none focus-visible:ring-0 text-black w-40"
                  />
                </div>

                <div className="border border-white/30 rounded px-4 py-2 flex gap-4 items-center">
                  <Controller
                    name="shift"
                    control={form.control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="S-1" id="s1" className="border-white text-white" />
                          <Label htmlFor="s1" className="text-white">S-1</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="S-2" id="s2" className="border-white text-white" />
                          <Label htmlFor="s2" className="text-white">S-2</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>
              </div>

              {/* Row 1: Details */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input className="bg-white text-black" placeholder="Mobile Number" {...form.register("mobileNumber")} />
                <Input className="bg-white text-black" placeholder="Name" {...form.register("customerName")} />
                <Input className="bg-white text-black" placeholder="Bill No" {...form.register("billNo")} />
                <Input className="bg-white text-black" placeholder="Vehicle No" {...form.register("vehicleNumber")} />

                <Controller
                  name="fuelProductId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.productName || p.product_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Row 2: Amounts - MODIFIED LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">

                {/* 1. Amount */}
                <div className="flex flex-col">
                  <Input
                    className="bg-white text-black placeholder:text-gray-500 font-semibold"
                    placeholder="Amount"
                    type="number" step="0.01"
                    value={watchAmount === 0 ? '' : watchAmount}
                    onChange={handleAmountChange}
                  />
                </div>

                {/* 2. Discount */}
                <div className="flex flex-col">
                  <Input
                    className="bg-white text-black placeholder:text-gray-500 font-semibold"
                    placeholder="Discount"
                    type="number" step="0.01"
                    {...form.register("discount")}
                  />
                </div>

                {/* 3. Quantity */}
                <div className="flex flex-col">
                  <Input
                    className="bg-white text-black placeholder:text-gray-500 font-semibold"
                    placeholder="Qty(Lts)"
                    type="number" step="0.01"
                    value={watchQty === 0 ? '' : watchQty}
                    onChange={handleQtyChange}
                  />
                </div>

                {/* 4. Description (replaces the zero box) */}
                <Input className="bg-white text-black placeholder:text-gray-500" placeholder="Description" {...form.register("description")} />

                {/* Hidden Price field to satisfy requirement */}
                <input type="hidden" {...form.register("pricePerUnit")} />
              </div>

              {/* Row 3: Payment & Employee */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Controller
                  name="paymentMode"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue placeholder="Collection Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                <Controller
                  name="employeeId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.employeeName || e.employee_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Row 4: Actions */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded text-black">
                    <Controller
                      name="sendSms"
                      control={form.control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="sms"
                        />
                      )}
                    />
                    <label htmlFor="sms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Send SMS ?
                    </label>
                  </div>

                  <Dialog open={gstModalOpen} onOpenChange={setGstModalOpen}>
                    <Button type="button" variant="outline" onClick={() => setGstModalOpen(true)} className="bg-blue-200 border-none hover:bg-blue-300">
                      <FileText className="w-5 h-5 text-blue-800" />
                      <span className="ml-2 text-blue-900 font-bold">Fill GST</span>
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enter GST Information</DialogTitle>
                        <DialogDescription>
                          Enter the GST Number for this customer/transaction.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label>GST Number</Label>
                        <Input
                          value={tempGst}
                          onChange={(e) => setTempGst(e.target.value)}
                          placeholder="e.g. 29AAAAA0000A1Z5"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setGstModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveGst}>Save GST</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                </div>

                <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold px-8 rounded-full shadow-lg transform active:scale-95 transition-all">
                  SAVE
                </Button>

                <Button type="button" size="icon" className="rounded-full bg-blue-400/50 hover:bg-blue-400 text-white">
                  <Plus />
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Bottom Filter/List Section */}
      <Card>
        <CardContent className="p-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-end mb-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">From Date</span>
              <Input
                type="date"
                className="w-32"
                value={searchParams.from}
                onChange={(e) => updateSearch('from', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">To Date</span>
              <Input
                type="date"
                className="w-32"
                value={searchParams.to}
                onChange={(e) => updateSearch('to', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="font-bold text-sm">Mobile No</span>
              <Input
                placeholder="Search by Mobile No"
                className="flex-1"
                value={searchParams.mobile}
                onChange={(e) => updateSearch('mobile', e.target.value)}
              />
            </div>
            <Button
              onClick={triggerSearch}
              className="bg-[#f97316] hover:bg-[#ea580c] text-white"
            >
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </div>

          {/* Data Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100 whitespace-nowrap">
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mobile No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost (₹)</TableHead>
                  <TableHead>Discount (₹)</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-4">Loading...</TableCell>
                  </TableRow>
                ) : guestEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-4">No records found</TableCell>
                  </TableRow>
                ) : (
                  guestEntries.map((entry: any, index: number) => {
                    const empName = employees.find((e: any) => e.id === entry.employeeId)?.employeeName || "-";
                    const prodName = entry.productName || entry.fuelProductId; // Fallback
                    // Assuming 'paymentType' is not in schema but might be added later, using 'Cash'/Default for now or mapping if available
                    const paymentType = "-";

                    return (
                      <TableRow key={index} className="whitespace-nowrap">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{entry.saleDate ? new Date(entry.saleDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>{entry.mobileNumber || "-"}</TableCell>
                        <TableCell>{entry.customerName || "-"}</TableCell>
                        <TableCell>{entry.billNo || "-"}</TableCell>
                        <TableCell>{entry.vehicleNumber || "-"}</TableCell>
                        <TableCell>{empName}</TableCell>
                        <TableCell>{prodName}</TableCell>
                        <TableCell>{entry.paymentMode}</TableCell>
                        <TableCell>{paymentType}</TableCell>
                        <TableCell>{Number(entry.pricePerUnit).toFixed(2)}</TableCell>
                        <TableCell>{Number(entry.quantity).toFixed(2)}</TableCell>
                        <TableCell>{Number(entry.amount).toFixed(2)}</TableCell>
                        <TableCell>{Number(entry.discount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-500"><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell>{entry.shift}</TableCell>
                        <TableCell>{entry.description || "-"}</TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {/* Placeholder for User Log Details if available */}
                          {entry.createdBy || "System"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}