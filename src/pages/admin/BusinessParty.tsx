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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const businessPartySchema = z.object({
  party_name: z.string().min(1, "Party Name is required"),
  opening_balance: z.coerce.number().min(0, "Opening Balance must be positive"),
  opening_date: z.string().optional(),
  opening_type: z.enum(["Payable", "Receivable"]).optional(), // Balance Type
  address: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  description: z.string().optional(),
  party_type: z.string().min(1, "Party Type is required"),
});

type BusinessPartyFormData = z.infer<typeof businessPartySchema>;

const BusinessParty = () => {
  const [parties, setParties] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<BusinessPartyFormData>({
    resolver: zodResolver(businessPartySchema),
    defaultValues: {
      party_name: "",
      opening_balance: 0,
      opening_date: new Date().toISOString().split('T')[0],
      opening_type: "Payable",
      address: "",
      phone_number: "",
      email: "",
      description: "",
      party_type: "",
    }
  });

  const fetchParties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/business-parties', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        setParties(result.rows || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch business parties",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load business parties",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const onSubmit = async (data: BusinessPartyFormData) => {
    const submitData = {
      ...data,
      date: new Date().toISOString().split('T')[0], // Required by backend
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/business-parties/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Business party updated successfully" });
          setEditingId(null);
          form.reset();
          fetchParties();
        } else {
          toast({ title: "Error", description: result.error || "Failed to update business party", variant: "destructive" });
        }
      } else {
        const response = await fetch('/api/business-parties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Business party added successfully" });
          form.reset();
          fetchParties();
        } else {
          toast({ title: "Error", description: result.error || "Failed to add business party", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save business party", variant: "destructive" });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      party_name: item.party_name,
      opening_balance: parseFloat(item.opening_balance) || 0,
      opening_date: item.opening_date ? new Date(item.opening_date).toISOString().split('T')[0] : "",
      opening_type: item.opening_type || "Payable",
      address: item.address || "",
      phone_number: item.phone_number || "",
      email: item.email || "",
      description: item.description || "",
      party_type: item.party_type || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/business-parties/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Business party deleted successfully" });
        fetchParties();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete business party", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete business party", variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const filteredParties = parties.filter((item) =>
    item.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.party_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Business Cr/Dr Party</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="party_name" className="text-blue-900 font-semibold">Party Name <span className="text-red-500">*</span></Label>
                <Input
                  id="party_name"
                  {...form.register("party_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Party Name"
                />
                {form.formState.errors.party_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.party_name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="party_type" className="text-blue-900 font-semibold">Party Type <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => form.setValue("party_type", value)}
                  defaultValue={form.getValues("party_type")}
                  value={form.watch("party_type")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Capital">Capital</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Creditor">Creditor</SelectItem>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Tanker">Tanker</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.party_type && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.party_type.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="opening_balance" className="text-blue-900 font-semibold">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-blue-900 font-semibold">Balance Type</Label>
                <RadioGroup
                  onValueChange={(val) => form.setValue("opening_type", val as "Payable" | "Receivable")}
                  defaultValue={form.getValues("opening_type")}
                  value={form.watch("opening_type")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Receivable" id="r1" />
                    <Label htmlFor="r1">Debit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Payable" id="r2" />
                    <Label htmlFor="r2">Credit</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="phone_number" className="text-blue-900 font-semibold">Phone No.</Label>
                <Input
                  id="phone_number"
                  {...form.register("phone_number")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-blue-900 font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Email"
                />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-blue-900 font-semibold">Address</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  className="bg-white border-blue-200 focus:border-blue-500 h-[38px] min-h-[38px]"
                  placeholder="Address"
                />
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
                  <TableHead className="font-bold text-gray-700">Party Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Mobile Num</TableHead>
                  <TableHead className="font-bold text-gray-700">Address</TableHead>
                  <TableHead className="font-bold text-gray-700">Description</TableHead>
                  <TableHead className="font-bold text-gray-700">Opening Balance</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No parties found. Add your first party above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParties.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.party_name}</TableCell>
                      <TableCell>{item.phone_number || "-"}</TableCell>
                      <TableCell>{item.address || "-"}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>₹{item.opening_balance || 0}</TableCell>
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
                        <span className={`text-xs px-2 py-1 rounded font-bold ${item.is_active ? 'bg-[#10b981] text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {item.is_active ? 'ACTIVATED' : 'DISABLED'}
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
            <span>Showing 1 to {filteredParties.length} of {filteredParties.length} entries</span>
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
              This action will delete this party. This action cannot be undone.
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

export default BusinessParty;
