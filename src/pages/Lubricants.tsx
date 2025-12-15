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
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lubricantSchema, type LubricantFormValues } from "@/lib/validations";
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

export default function Lubricants() {
  const { toast } = useToast();
  const [lubricants, setLubricants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const form = useForm<LubricantFormValues>({
    resolver: zodResolver(lubricantSchema),
    defaultValues: {
      lubricant_name: "",
      hsn_code: "",
      gst_percentage: 18,
      mrp_rate: 0,
      sale_rate: 0,
      minimum_stock: 0,
      current_stock: 0,
      is_active: true,
    },
  });

  const fetchLubricants = useCallback(async () => {
    try {
      const response = await fetch('/api/lubricants', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        setLubricants(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch lubricants" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch lubricants" });
    }
  }, [toast]);

  useEffect(() => {
    fetchLubricants();
  }, [fetchLubricants]);

  const onSubmit = async (data: LubricantFormValues) => {
    const submitData = {
      lubricant_name: data.lubricant_name,
      hsn_code: data.hsn_code || null,
      gst_percentage: data.gst_percentage,
      mrp_rate: data.mrp_rate || 0,
      sale_rate: data.sale_rate || 0,
      minimum_stock: data.minimum_stock || 0,
      current_stock: data.current_stock ?? 0,
      is_active: data.is_active ?? true,
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/lubricants/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Lubricant updated successfully" });
          setEditingId(null);
          form.reset({
            lubricant_name: "",
            hsn_code: "",
            gst_percentage: 18,
            mrp_rate: 0,
            sale_rate: 0,
            minimum_stock: 0,
            current_stock: 0,
            is_active: true,
          });
          fetchLubricants();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update lubricant" });
        }
      } else {
        const response = await fetch('/api/lubricants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Lubricant added successfully" });
          form.reset({
            lubricant_name: "",
            hsn_code: "",
            gst_percentage: 18,
            mrp_rate: 0,
            sale_rate: 0,
            minimum_stock: 0,
            current_stock: 0,
            is_active: true,
          });
          fetchLubricants();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to add lubricant" });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save lubricant" });
    }
  };

  const handleEdit = (lubricant: any) => {
    setEditingId(lubricant.id);
    form.reset({
      lubricant_name: lubricant.lubricant_name,
      hsn_code: lubricant.hsn_code || "",
      gst_percentage: lubricant.gst_percentage || 18,
      mrp_rate: parseFloat(lubricant.mrp_rate) || 0,
      sale_rate: parseFloat(lubricant.sale_rate) || 0,
      minimum_stock: parseFloat(lubricant.minimum_stock) || 0,
      current_stock: parseFloat(lubricant.current_stock) || 0,
      is_active: lubricant.is_active,
    });
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/lubricants/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Lubricant deleted successfully" });
        fetchLubricants();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete lubricant" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete lubricant" });
    }
    setDeleteConfirm(null);
  };

  const filteredLubricants = lubricants.filter((item) =>
    item.lubricant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {/* Breadcrumb or Title if needed, but screenshot shows Dashboard > Lubricants */}
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Lubricants</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="col-span-1 md:col-span-2">
                <Label htmlFor="lubricant_name" className="text-blue-900 font-semibold">Product <span className="text-red-500">*</span></Label>
                <Input
                  id="lubricant_name"
                  {...form.register("lubricant_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Product Name"
                />
                {form.formState.errors.lubricant_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.lubricant_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gst_percentage" className="text-blue-900 font-semibold">GST(%) <span className="text-red-500">*</span></Label>
                <Input
                  id="gst_percentage"
                  type="number"
                  step="0.01"
                  {...form.register("gst_percentage", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="18"
                />
              </div>

              <div>
                <Label htmlFor="hsn_code" className="text-blue-900 font-semibold">HSN Code</Label>
                <Input
                  id="hsn_code"
                  {...form.register("hsn_code")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="mrp_rate" className="text-blue-900 font-semibold">MRP Rate</Label>
                <Input
                  id="mrp_rate"
                  type="number"
                  step="0.01"
                  {...form.register("mrp_rate", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="sale_rate" className="text-blue-900 font-semibold">Sale Rate</Label>
                <Input
                  id="sale_rate"
                  type="number"
                  step="0.01"
                  {...form.register("sale_rate", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Sale Rate"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div>
                <Label htmlFor="minimum_stock" className="text-blue-900 font-semibold">Minimum Stock</Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  {...form.register("minimum_stock", { valueAsNumber: true })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Minimum Stock"
                />
              </div>
              <div className="col-span-1 md:col-span-5 flex justify-end items-center">
                <Button
                  type="button"
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8"
                  onClick={() => {
                    form.reset({
                      lubricant_name: "",
                      hsn_code: "",
                      gst_percentage: 18,
                      mrp_rate: 0,
                      sale_rate: 0,
                      minimum_stock: 0,
                      current_stock: 0,
                      is_active: true,
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
              <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs">Rate Master &gt;</Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-gray-700">S.No</TableHead>
                <TableHead className="font-bold text-gray-700">Product Name</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">GST(%)</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">HSN Code</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">MRP Rate</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Sale Rate</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Minimum Quantity</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLubricants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No lubricants found. Add your first lubricant above.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLubricants.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.lubricant_name}</TableCell>
                    <TableCell className="text-center">{item.gst_percentage}</TableCell>
                    <TableCell className="text-center">{item.hsn_code || "0"}</TableCell>
                    <TableCell className="text-center">{parseFloat(item.mrp_rate || "0").toFixed(0)}</TableCell>
                    <TableCell className="text-center">{parseFloat(item.sale_rate || "0").toFixed(2)}</TableCell>
                    <TableCell className="text-center">{parseFloat(item.minimum_stock || "0").toFixed(2)}</TableCell>
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

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing 1 to {filteredLubricants.length} of {filteredLubricants.length} entries</span>
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
              This action will delete this lubricant. This action cannot be undone.
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
