import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Pencil } from "lucide-react";
import { fuelProductSchema, type FuelProductFormValues } from "@/lib/validations";

export default function FuelProducts() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FuelProductFormValues>({
    product_name: "",
    short_name: "",
    wgt_percentage: 0,
    tds_percentage: 0,
    gst_percentage: 18.0,
    lfrn: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FuelProductFormValues, string>>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/fuel-products', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        setProducts(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch fuel products" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch fuel products" });
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      product_name: product.product_name || "",
      short_name: product.short_name || "",
      wgt_percentage: parseFloat(product.wgt_percentage) || 0,
      tds_percentage: parseFloat(product.tds_percentage) || 0,
      gst_percentage: parseFloat(product.gst_percentage) || 18.0,
      lfrn: product.lfrn || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = fuelProductSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FuelProductFormValues, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof FuelProductFormValues] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({ variant: "destructive", title: "Validation Error", description: "Please fix the errors in the form" });
      return;
    }

    setErrors({});
    const submitData = {
      product_name: result.data.product_name,
      short_name: result.data.short_name,
      lfrn: result.data.lfrn || "",
      gst_percentage: result.data.gst_percentage,
      tds_percentage: result.data.tds_percentage,
      wgt_percentage: result.data.wgt_percentage,
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/fuel-products/${editingId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Fuel product updated successfully" });
          setShowForm(false);
          setEditingId(null);
          setFormData({
            product_name: "",
            short_name: "",
            wgt_percentage: 0,
            tds_percentage: 0,
            gst_percentage: 18.0,
            lfrn: "",
          });
          fetchProducts();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update fuel product" });
        }
      } else {
        const response = await fetch('/api/fuel-products', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Fuel product added successfully" });
          setShowForm(false);
          setFormData({
            product_name: "",
            short_name: "",
            wgt_percentage: 0,
            tds_percentage: 0,
            gst_percentage: 18.0,
            lfrn: "",
          });
          fetchProducts();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to add fuel product" });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save fuel product" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/fuel-products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Fuel product deleted successfully" });
        fetchProducts();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete fuel product" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete fuel product" });
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Fuel Products</h2>
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Add Liquid</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div>
                <Label htmlFor="product_name" className="text-blue-900 font-semibold">Product <span className="text-red-500">*</span></Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Product Name"
                />
                {errors.product_name && <p className="text-xs text-red-500 mt-1">{errors.product_name}</p>}
              </div>

              <div>
                <Label htmlFor="short_name" className="text-blue-900 font-semibold">Short Name <span className="text-red-500">*</span></Label>
                <Input
                  id="short_name"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Short Name"
                />
              </div>

              <div>
                <Label htmlFor="wgt_percentage" className="text-blue-900 font-semibold">VAT(%) <span className="text-red-500">*</span></Label>
                <Input
                  id="wgt_percentage"
                  type="number"
                  step="0.01"
                  value={formData.wgt_percentage}
                  onChange={(e) => setFormData({ ...formData, wgt_percentage: parseFloat(e.target.value) || 0 })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="tds_percentage" className="text-blue-900 font-semibold">TCS(%) <span className="text-red-500">*</span></Label>
                <Input
                  id="tds_percentage"
                  type="number"
                  step="0.01"
                  value={formData.tds_percentage}
                  onChange={(e) => setFormData({ ...formData, tds_percentage: parseFloat(e.target.value) || 0 })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="gst_percentage" className="text-blue-900 font-semibold">GST(%)</Label>
                <Input
                  id="gst_percentage"
                  type="number"
                  step="0.01"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) || 0 })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Percentage"
                />
                {errors.gst_percentage && <p className="text-xs text-red-500 mt-1">{errors.gst_percentage}</p>}
              </div>

              <div>
                <Label htmlFor="lfrn" className="text-blue-900 font-semibold">LFR/KL <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="lfrn"
                    value={formData.lfrn}
                    onChange={(e) => setFormData({ ...formData, lfrn: e.target.value })}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    onClick={() => {
                      // Optional: Clear form or some other action
                      setFormData({
                        product_name: "",
                        short_name: "",
                        wgt_percentage: 0,
                        tds_percentage: 0,
                        gst_percentage: 18.0,
                        lfrn: "",
                      });
                      setEditingId(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                <Input placeholder="Type to filter..." className="h-8 w-48" />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-gray-700">S.No</TableHead>
                <TableHead className="font-bold text-gray-700">Product Name</TableHead>
                <TableHead className="font-bold text-gray-700">Short Name</TableHead>
                <TableHead className="font-bold text-gray-700">VAT</TableHead>
                <TableHead className="font-bold text-gray-700">TCS</TableHead>
                <TableHead className="font-bold text-gray-700">GST</TableHead>
                <TableHead className="font-bold text-gray-700">LFR/KL</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No fuel products found. Add your first product above.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>{product.short_name}</TableCell>
                    <TableCell>{parseFloat(product.wgt_percentage).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(product.tds_percentage).toFixed(2)}</TableCell>
                    <TableCell>{product.gst_percentage}</TableCell>
                    <TableCell>{product.lfrn}</TableCell>
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
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                          onClick={() => setDeleteConfirm(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      Created: Super Admin {product.created_at ? new Date(product.created_at).toLocaleString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing 1 to {products.length} of {products.length} entries</span>
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
              This action will deactivate this fuel product. It will no longer appear in the active products list.
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
