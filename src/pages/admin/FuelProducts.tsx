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
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { fuelProductSchema, type FuelProductFormValues } from "@/lib/validations";

interface FuelProductRow {
  tempId: string;
  product_name: string;
  short_name: string;
  wgt_percentage: number | string;
  tds_percentage: number | string;
  gst_percentage: number | string;
  lfrn: string;
}

export default function FuelProducts() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>('all');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formRows, setFormRows] = useState<FuelProductRow[]>([{
    tempId: crypto.randomUUID(),
    product_name: "",
    short_name: "",
    wgt_percentage: 0,
    tds_percentage: 0,
    gst_percentage: 0,
    lfrn: "",
  }]);
  const [errors, setErrors] = useState<Partial<Record<keyof FuelProductFormValues, string>>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Apply filter whenever products or filterText changes
    let filtered = products;

    if (filterText) {
      filtered = products.filter(product =>
        product.product_name?.toLowerCase().includes(filterText.toLowerCase()) ||
        product.short_name?.toLowerCase().includes(filterText.toLowerCase()) ||
        product.lfrn?.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [products, filterText]);

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
    setFormRows([{
      tempId: crypto.randomUUID(),
      product_name: product.product_name || "",
      short_name: product.short_name || "",
      wgt_percentage: parseFloat(product.wgt_percentage) || 0,
      tds_percentage: parseFloat(product.tds_percentage) || 0,
      gst_percentage: parseFloat(product.gst_percentage) || 18.0,
      lfrn: product.lfrn || "",
    }]);
    setShowForm(true);
  };

  const addNewRow = () => {
    setFormRows([...formRows, {
      tempId: crypto.randomUUID(),
      product_name: "",
      short_name: "",
      wgt_percentage: 0,
      tds_percentage: 0,
      gst_percentage: 0,
      lfrn: "",
    }]);
  };

  const removeRow = (tempId: string) => {
    if (formRows.length > 1) {
      setFormRows(formRows.filter(row => row.tempId !== tempId));
    }
  };

  const updateRow = (tempId: string, field: keyof FuelProductFormValues, value: any) => {
    setFormRows(formRows.map(row =>
      row.tempId === tempId ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all rows
    let hasErrors = false;
    for (const row of formRows) {
      const result = fuelProductSchema.safeParse(row);
      if (!result.success) {
        hasErrors = true;
        toast({ variant: "destructive", title: "Validation Error", description: "Please fill all required fields in all rows" });
        break;
      }
    }

    if (hasErrors) return;

    setErrors({});

    try {
      if (editingId) {
        // Update single product (only first row when editing)
        const row = formRows[0];
        const submitData = {
          product_name: row.product_name,
          short_name: row.short_name,
          lfrn: row.lfrn || "",
          gst_percentage: typeof row.gst_percentage === 'string' && row.gst_percentage === '' ? 0 : Number(row.gst_percentage),
          tds_percentage: typeof row.tds_percentage === 'string' && row.tds_percentage === '' ? 0 : Number(row.tds_percentage),
          wgt_percentage: typeof row.wgt_percentage === 'string' && row.wgt_percentage === '' ? 0 : Number(row.wgt_percentage),
        };
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
          setFormRows([{
            tempId: crypto.randomUUID(),
            product_name: "",
            short_name: "",
            wgt_percentage: 0,
            tds_percentage: 0,
            gst_percentage: 0,
            lfrn: "",
          }]);
          fetchProducts();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update fuel product" });
        }
      } else {
        // Create multiple products
        let successCount = 0;
        for (const row of formRows) {
          const submitData = {
            product_name: row.product_name,
            short_name: row.short_name,
            lfrn: row.lfrn || "",
            gst_percentage: typeof row.gst_percentage === 'string' && row.gst_percentage === '' ? 0 : Number(row.gst_percentage),
            tds_percentage: typeof row.tds_percentage === 'string' && row.tds_percentage === '' ? 0 : Number(row.tds_percentage),
            wgt_percentage: typeof row.wgt_percentage === 'string' && row.wgt_percentage === '' ? 0 : Number(row.wgt_percentage),
          };

          const response = await fetch('/api/fuel-products', {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify(submitData)
          });
          const result = await response.json();

          if (result.ok) {
            successCount++;
          }
        }

        if (successCount > 0) {
          toast({ title: "Success", description: `${successCount} fuel product(s) added successfully` });
          setShowForm(false);
          setFormRows([{
            tempId: crypto.randomUUID(),
            product_name: "",
            short_name: "",
            wgt_percentage: 0,
            tds_percentage: 0,
            gst_percentage: 0,
            lfrn: "",
          }]);
          fetchProducts();
        } else {
          toast({ variant: "destructive", title: "Error", description: "Failed to add fuel products" });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save fuel product" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/fuel-products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
        fetchProducts();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update status" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
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
        // Remove from local state immediately
        setProducts(products.filter(p => p.id !== id));
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
            {formRows.map((row, index) => (
              <div key={row.tempId} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 bg-white rounded-lg border-2 border-blue-200 relative">
                <div>
                  <Label htmlFor={`product_name_${row.tempId}`} className="text-blue-900 font-semibold">Product <span className="text-red-500">*</span></Label>
                  <Input
                    id={`product_name_${row.tempId}`}
                    value={row.product_name}
                    onChange={(e) => updateRow(row.tempId, 'product_name', e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="Product Name"
                  />
                </div>

                <div>
                  <Label htmlFor={`short_name_${row.tempId}`} className="text-blue-900 font-semibold">Short Name <span className="text-red-500">*</span></Label>
                  <Input
                    id={`short_name_${row.tempId}`}
                    value={row.short_name}
                    onChange={(e) => updateRow(row.tempId, 'short_name', e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="Short Name"
                  />
                </div>

                <div>
                  <Label htmlFor={`wgt_percentage_${row.tempId}`} className="text-blue-900 font-semibold">VAT(%) <span className="text-red-500">*</span></Label>
                  <Input
                    id={`wgt_percentage_${row.tempId}`}
                    type="number"
                    step="0.01"
                    value={row.wgt_percentage}
                    onChange={(e) => updateRow(row.tempId, 'wgt_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor={`tds_percentage_${row.tempId}`} className="text-blue-900 font-semibold">TCS(%) <span className="text-red-500">*</span></Label>
                  <Input
                    id={`tds_percentage_${row.tempId}`}
                    type="number"
                    step="0.01"
                    value={row.tds_percentage}
                    onChange={(e) => updateRow(row.tempId, 'tds_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor={`gst_percentage_${row.tempId}`} className="text-blue-900 font-semibold">GST(%)</Label>
                  <Input
                    id={`gst_percentage_${row.tempId}`}
                    type="number"
                    step="0.01"
                    value={row.gst_percentage}
                    onChange={(e) => updateRow(row.tempId, 'gst_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="Percentage"
                  />
                </div>

                <div>
                  <Label htmlFor={`lfrn_${row.tempId}`} className="text-blue-900 font-semibold">LFR/KL <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      id={`lfrn_${row.tempId}`}
                      value={row.lfrn}
                      onChange={(e) => updateRow(row.tempId, 'lfrn', e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500"
                      placeholder="0"
                    />
                    {index === formRows.length - 1 ? (
                      <Button
                        type="button"
                        size="icon"
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        onClick={addNewRow}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="shrink-0"
                        onClick={() => removeRow(row.tempId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

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
              <select
                className="border rounded p-1 text-sm bg-white"
                value={itemsPerPage}
                onChange={(e) => {
                  const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filter:</span>
                <Input
                  placeholder="Type to filter..."
                  className="h-8 w-48"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
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
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    {filterText ? 'No matching products found.' : 'No fuel products found. Add your first product above.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>{product.short_name}</TableCell>
                    <TableCell>{parseFloat(product.wgt_percentage).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(product.tds_percentage).toFixed(2)}</TableCell>
                    <TableCell>{product.gst_percentage}</TableCell>
                    <TableCell>{product.lfrn}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.isActive !== false)}
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${product.isActive !== false
                            ? 'bg-blue-600 focus:ring-blue-500'
                            : 'bg-gray-300 focus:ring-gray-400'
                            }`}
                          role="switch"
                          aria-checked={product.isActive !== false}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${product.isActive !== false ? 'translate-x-9' : 'translate-x-1'
                              }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${product.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {product.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
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
            <span>
              Showing {filteredProducts.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              {filterText && ` (filtered from ${products.length} total entries)`}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || itemsPerPage === 'all'}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                &larr;
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  className={currentPage === page ? "bg-blue-100" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || itemsPerPage === 'all'}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                &rarr;
              </Button>
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
            </AlertDialogDescription >
          </AlertDialogHeader >
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent >
      </AlertDialog >
    </div >
  );
}
