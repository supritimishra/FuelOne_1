import { useState } from "react";
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
import { useForm } from "react-hook-form";
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
import { Edit, Trash2, Save, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const guestEntrySchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  customer_name: z.string().min(1, "Customer Name is required"),
  mobile_number: z.string().min(10, "Mobile Number must be at least 10 digits"),
  discount: z.coerce.number().optional(),
  fuel_product_id: z.string().min(1, "Product is required"),
  bill_no: z.string().optional(), // GST / TIN
  vehicle_number: z.string().min(1, "Vehicle Number is required"),
});

type GuestEntryForm = z.infer<typeof guestEntrySchema>;

export default function GuestSale() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: fuelProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch("/api/fuel-products", { credentials: "include" });
      const result = await response.json();
      return result.rows || [];
    },
  });

  const { data: guestEntries = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/guest-sales"],
    queryFn: async () => {
      const response = await fetch("/api/guest-sales", { credentials: "include" });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to fetch");
      return result.rows || [];
    },
  });

  const form = useForm<GuestEntryForm>({
    resolver: zodResolver(guestEntrySchema),
    defaultValues: {
      sale_date: new Date().toISOString().slice(0, 10),
      customer_name: "",
      mobile_number: "",
      discount: 0,
      fuel_product_id: "",
      bill_no: "",
      vehicle_number: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: GuestEntryForm) => {
      const response = await fetch("/api/guest-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          quantity: 0,
          price_per_unit: 0,
          total_amount: 0,
          payment_mode: "Cash",
          sale_type: "S-1",
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to create");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-sales"] });
      toast({ title: "Guest entry added successfully" });
      form.reset({
        sale_date: new Date().toISOString().slice(0, 10),
        customer_name: "",
        mobile_number: "",
        discount: 0,
        fuel_product_id: "",
        bill_no: "",
        vehicle_number: "",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to add guest entry",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: GuestEntryForm & { id: string }) => {
      const response = await fetch(`/api/guest-sales/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          quantity: 0,
          price_per_unit: 0,
          total_amount: 0,
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to update");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-sales"] });
      toast({ title: "Guest entry updated successfully" });
      setEditingId(null);
      form.reset({
        sale_date: new Date().toISOString().slice(0, 10),
        customer_name: "",
        mobile_number: "",
        discount: 0,
        fuel_product_id: "",
        bill_no: "",
        vehicle_number: "",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update guest entry",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/guest-sales/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to delete");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-sales"] });
      toast({ title: "Guest entry deleted successfully" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to delete guest entry",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      sale_date: item.sale_date ? new Date(item.sale_date).toISOString().slice(0, 10) : "",
      customer_name: item.customer_name || "",
      mobile_number: item.mobile_number || "",
      discount: item.discount || 0,
      fuel_product_id: item.fuel_product_id || "",
      bill_no: item.bill_no || "",
      vehicle_number: item.vehicle_number || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = (data: GuestEntryForm) => {
    if (editingId) {
      updateMutation.mutate({ ...data, id: editingId });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredEntries = guestEntries.filter((item) =>
    (item.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (item.mobile_number || "").includes(searchTerm) ||
    (item.vehicle_number?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Guest Customer</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="sale_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">Choose Date</FormLabel>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4"
                        >
                          Choose Date
                        </Button>
                        <FormControl>
                          <Input type="date" {...field} className="bg-white border-blue-200 focus:border-blue-500" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">
                        Customer Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-blue-200 focus:border-blue-500"
                          placeholder="Enter Name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">
                        Mobile Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-blue-200 focus:border-blue-500"
                          placeholder="Enter Mobile Number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">Discount Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="bg-white border-blue-200 focus:border-blue-500"
                          placeholder="Enter Discount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuel_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">Select</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fuelProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bill_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">GST / TIN</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-blue-200 focus:border-blue-500"
                          placeholder="Enter GST / TIN"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">
                        Vehicle Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-white border-blue-200 focus:border-blue-500"
                            placeholder="Enter Vehicle Number"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          size="icon"
                          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  type="submit"
                  className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />{" "}
                  {createMutation.isPending || updateMutation.isPending ? "SAVING..." : "SAVE"}
                </Button>
              </div>
            </form>
          </Form>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 bg-green-50"
                >
                  CSV
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">
                  PDF
                </Button>
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
                  <TableHead className="font-bold text-gray-700">Sl No</TableHead>
                  <TableHead className="font-bold text-gray-700">Date</TableHead>
                  <TableHead className="font-bold text-gray-700">Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Number</TableHead>
                  <TableHead className="font-bold text-gray-700">Offer Amount</TableHead>
                  <TableHead className="font-bold text-gray-700">Offer Type</TableHead>
                  <TableHead className="font-bold text-gray-700">Gst / TIN No</TableHead>
                  <TableHead className="font-bold text-gray-700">Vehicle Number</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        {item.sale_date
                          ? new Date(item.sale_date).toLocaleDateString("en-GB")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{item.customer_name || "-"}</TableCell>
                      <TableCell>{item.mobile_number || "-"}</TableCell>
                      <TableCell>{item.discount || "0"}</TableCell>
                      <TableCell>{item.product_name || "-"}</TableCell>
                      <TableCell>{item.bill_no || "-"}</TableCell>
                      <TableCell>{item.vehicle_number || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        Created: {item.created_by_name || "Super Admin"}{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-GB")
                          : ""}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded font-bold">
                          ACTIVATED
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>
              Showing 1 to {filteredEntries.length} of {filteredEntries.length} entries
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                &larr;
              </Button>
              <Button variant="outline" size="sm" className="bg-gray-100">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                &rarr;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guest Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guest entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}