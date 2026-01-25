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
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
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

interface LubricantRow {
  tempId: string;
  lubricant_name: string;
  hsn_code: string;
  gst_percentage: number | string;
  mrp_rate: number | string;
  sale_rate: number | string;
  minimum_stock: number | string;
  current_stock: number | string;
}

export default function Lubricants() {
  const { toast } = useToast();
  const [lubricants, setLubricants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRateMaster, setShowRateMaster] = useState(false);
  const [rateMasterData, setRateMasterData] = useState<{id: string, lubricant_name: string, sale_rate: string}[]>([]);
  const [formRows, setFormRows] = useState<LubricantRow[]>([{
    tempId: crypto.randomUUID(),
    lubricant_name: "",
    hsn_code: "",
    gst_percentage: 18,
    mrp_rate: 0,
    sale_rate: 0,
    minimum_stock: 0,
    current_stock: 0,
  }]);

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

  const addNewRow = () => {
    setFormRows([...formRows, {
      tempId: crypto.randomUUID(),
      lubricant_name: "",
      hsn_code: "",
      gst_percentage: 18,
      mrp_rate: 0,
      sale_rate: 0,
      minimum_stock: 0,
      current_stock: 0,
    }]);
  };

  const removeRow = (tempId: string) => {
    if (formRows.length > 1) {
      setFormRows(formRows.filter(row => row.tempId !== tempId));
    }
  };

  const updateRow = (tempId: string, field: keyof LubricantRow, value: any) => {
    setFormRows(formRows.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update single lubricant (only first row when editing)
        const row = formRows[0];
        const submitData = {
          lubricant_name: row.lubricant_name,
          hsn_code: row.hsn_code || null,
          gst_percentage: typeof row.gst_percentage === 'string' && row.gst_percentage === '' ? 18 : Number(row.gst_percentage),
          mrp_rate: typeof row.mrp_rate === 'string' && row.mrp_rate === '' ? 0 : Number(row.mrp_rate),
          sale_rate: typeof row.sale_rate === 'string' && row.sale_rate === '' ? 0 : Number(row.sale_rate),
          minimum_stock: typeof row.minimum_stock === 'string' && row.minimum_stock === '' ? 0 : Number(row.minimum_stock),
          current_stock: typeof row.current_stock === 'string' && row.current_stock === '' ? 0 : Number(row.current_stock),
        };

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
          setFormRows([{
            tempId: crypto.randomUUID(),
            lubricant_name: "",
            hsn_code: "",
            gst_percentage: 18,
            mrp_rate: 0,
            sale_rate: 0,
            minimum_stock: 0,
            current_stock: 0,
          }]);
          fetchLubricants();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update lubricant" });
        }
      } else {
        // Create multiple lubricants
        let successCount = 0;
        for (const row of formRows) {
          if (!row.lubricant_name.trim()) continue; // Skip empty rows

          const submitData = {
            lubricant_name: row.lubricant_name,
            hsn_code: row.hsn_code || null,
            gst_percentage: typeof row.gst_percentage === 'string' && row.gst_percentage === '' ? 18 : Number(row.gst_percentage),
            mrp_rate: typeof row.mrp_rate === 'string' && row.mrp_rate === '' ? 0 : Number(row.mrp_rate),
            sale_rate: typeof row.sale_rate === 'string' && row.sale_rate === '' ? 0 : Number(row.sale_rate),
            minimum_stock: typeof row.minimum_stock === 'string' && row.minimum_stock === '' ? 0 : Number(row.minimum_stock),
            current_stock: typeof row.current_stock === 'string' && row.current_stock === '' ? 0 : Number(row.current_stock),
            is_active: true,
          };

          const response = await fetch('/api/lubricants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(submitData)
          });
          const result = await response.json();

          if (result.ok) {
            successCount++;
          }
        }

        if (successCount > 0) {
          toast({ title: "Success", description: `${successCount} lubricant(s) added successfully` });
          setFormRows([{
            tempId: crypto.randomUUID(),
            lubricant_name: "",
            hsn_code: "",
            gst_percentage: 18,
            mrp_rate: 0,
            sale_rate: 0,
            minimum_stock: 0,
            current_stock: 0,
          }]);
          fetchLubricants();
        } else {
          toast({ variant: "destructive", title: "Error", description: "Failed to add lubricants" });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save lubricant" });
    }
  };

  const handleEdit = (lubricant: any) => {
    setEditingId(lubricant.id);
    setFormRows([{
      tempId: crypto.randomUUID(),
      lubricant_name: lubricant.lubricant_name || "",
      hsn_code: lubricant.hsn_code || "",
      gst_percentage: lubricant.gst_percentage || 18,
      mrp_rate: parseFloat(lubricant.mrp_rate) || 0,
      sale_rate: parseFloat(lubricant.sale_rate) || 0,
      minimum_stock: parseFloat(lubricant.minimum_stock) || 0,
      current_stock: parseFloat(lubricant.current_stock) || 0,
    }]);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRateMaster = () => {
    const rateData = lubricants.map(lube => ({
      id: lube.id,
      lubricant_name: lube.lubricant_name,
      sale_rate: lube.sale_rate || '0'
    }));
    setRateMasterData(rateData);
    setShowRateMaster(true);
  };

  const updateRateMasterValue = (id: string, value: string) => {
    setRateMasterData(rateMasterData.map(item => 
      item.id === id ? { ...item, sale_rate: value } : item
    ));
  };

  const handleSubmitRates = async () => {
    try {
      const updates = rateMasterData.map(item => ({
        id: item.id,
        sale_rate: parseFloat(item.sale_rate) || 0
      }));

      for (const update of updates) {
        const response = await fetch(`/api/lubricants/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sale_rate: update.sale_rate })
        });
        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Failed to update rate');
        }
      }

      toast({ title: "Success", description: "All rates updated successfully" });
      setShowRateMaster(false);
      fetchLubricants();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update rates" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/lubricants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: `Lubricant ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
        fetchLubricants();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update status" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
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

  // Calculate pagination
  const totalItems = filteredLubricants.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedLubricants = filteredLubricants.slice(startIndex, endIndex);

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {formRows.map((row, index) => (
              <div key={row.tempId} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 bg-white rounded-lg border-2 border-blue-200 relative">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor={`lubricant_name_${row.tempId}`} className="text-blue-900 font-semibold">Product <span className="text-red-500">*</span></Label>
                  <Input
                    id={`lubricant_name_${row.tempId}`}
                    value={row.lubricant_name}
                    onChange={(e) => updateRow(row.tempId, 'lubricant_name', e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="Product Name"
                  />
                </div>

                <div>
                  <Label htmlFor={`gst_percentage_${row.tempId}`} className="text-blue-900 font-semibold">GST(%) <span className="text-red-500">*</span></Label>
                  <Input
                    id={`gst_percentage_${row.tempId}`}
                    type="number"
                    step="0.01"
                    value={row.gst_percentage}
                    onChange={(e) => updateRow(row.tempId, 'gst_percentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="18"
                  />
                </div>

                <div>
                  <Label htmlFor={`hsn_code_${row.tempId}`} className="text-blue-900 font-semibold">HSN Code</Label>
                  <Input
                    id={`hsn_code_${row.tempId}`}
                    value={row.hsn_code}
                    onChange={(e) => updateRow(row.tempId, 'hsn_code', e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor={`mrp_rate_${row.tempId}`} className="text-blue-900 font-semibold">MRP Rate</Label>
                  <Input
                    id={`mrp_rate_${row.tempId}`}
                    type="number"
                    step="0.01"
                    value={row.mrp_rate}
                    onChange={(e) => updateRow(row.tempId, 'mrp_rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor={`sale_rate_${row.tempId}`} className="text-blue-900 font-semibold">Sale Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`sale_rate_${row.tempId}`}
                      type="number"
                      step="0.01"
                      value={row.sale_rate}
                      onChange={(e) => updateRow(row.tempId, 'sale_rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="bg-white border-blue-200 focus:border-blue-500"
                      placeholder="Sale Rate"
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

                <div>
                  <Label htmlFor={`minimum_stock_${row.tempId}`} className="text-blue-900 font-semibold">Minimum Stock</Label>
                  <Input
                    id={`minimum_stock_${row.tempId}`}
                    type="number"
                    value={row.minimum_stock}
                    onChange={(e) => updateRow(row.tempId, 'minimum_stock', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="Minimum Stock"
                  />
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                onClick={openRateMaster}
              >
                Rate Master &gt;
              </Button>
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
                paginatedLubricants.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
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
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item.id, item.is_active !== false)}
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            item.is_active !== false 
                              ? 'bg-blue-600 focus:ring-blue-500' 
                              : 'bg-gray-300 focus:ring-gray-400'
                          }`}
                          role="switch"
                          aria-checked={item.is_active !== false}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                              item.is_active !== false ? 'translate-x-9' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span 
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            item.is_active !== false 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
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

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>
              Showing {filteredLubricants.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              {searchTerm && ` (filtered from ${lubricants.length} total entries)`}
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

      {/* Rate Master Modal */}
      {showRateMaster && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-center gap-4">
                <Button 
                  className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold"
                  onClick={handleSubmitRates}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  SUBMIT RATES
                </Button>
                <Button 
                  variant="outline" 
                  className="px-8 font-bold"
                  onClick={() => setShowRateMaster(false)}
                >
                  Go Back
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-[#1e5a6b] sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-bold text-white text-center w-24">S.No</TableHead>
                    <TableHead className="font-bold text-white">Product Name</TableHead>
                    <TableHead className="font-bold text-white text-center w-64">Sale Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateMasterData.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.lubricant_name}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.sale_rate}
                          onChange={(e) => updateRateMasterValue(item.id, e.target.value)}
                          className="w-40 mx-auto text-center"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
