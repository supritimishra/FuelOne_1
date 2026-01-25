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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Calendar, Save, X } from "lucide-react";

type ExpiryItemRow = {
  tempId: string;
  category: string;
  item_name: string;
  item_no: string;
  expiry_date: string;
  no_of_days: string;
  note: string;
};

type ExpiryItem = {
  id: string;
  item_name: string;
  issue_date: string | null;
  expiry_date: string;
  status: string;
  created_at: string;
  category_name?: string;
  s_no: number;
};

type Category = {
  id: string;
  category_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export default function ExpiryItems() {
  const { toast } = useToast();
  const [expiryItems, setExpiryItems] = useState<ExpiryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'items' | 'category'>('items');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Multi-row form state
  const [formRows, setFormRows] = useState<ExpiryItemRow[]>([
    {
      tempId: crypto.randomUUID(),
      category: "",
      item_name: "",
      item_no: "",
      expiry_date: "",
      no_of_days: "",
      note: ""
    }
  ]);

  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    description: ""
  });

  const fetchExpiryItems = useCallback(async () => {
    try {
      const response = await fetch('/api/expiry-items');
      const result = await response.json();

      if (result.ok) {
        setExpiryItems(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch expiry items" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch expiry items" });
    }
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();

      if (result.ok) {
        // Remove duplicate categories by category_name
        const uniqueCategories = (result.rows || []).filter((cat: Category, index: number, self: Category[]) =>
          index === self.findIndex((c) => c.category_name === cat.category_name)
        );
        setCategories(uniqueCategories);
      } else {
        console.error('Failed to fetch categories:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchExpiryItems();
    fetchCategories();
  }, [fetchExpiryItems, fetchCategories]);

  const addNewRow = () => {
    setFormRows([
      ...formRows,
      {
        tempId: crypto.randomUUID(),
        category: "",
        item_name: "",
        item_no: "",
        expiry_date: "",
        no_of_days: "",
        note: ""
      }
    ]);
  };

  const removeRow = (tempId: string) => {
    if (formRows.length > 1) {
      setFormRows(formRows.filter(row => row.tempId !== tempId));
    }
  };

  const updateRow = (tempId: string, field: keyof ExpiryItemRow, value: string) => {
    setFormRows(formRows.map(row =>
      row.tempId === tempId ? { ...row, [field]: value } : row
    ));
  };

  const handleItemSubmit = async () => {
    try {
      // Validate all rows
      for (const row of formRows) {
        if (!row.category || !row.item_name || !row.expiry_date) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill all required fields (Category, Item Name, Expiry Date)",
          });
          return;
        }
      }

      // Submit all rows
      for (const row of formRows) {
        const response = await fetch('/api/expiry-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: row.category,
            item_name: row.item_name,
            item_no: row.item_no,
            expiry_date: row.expiry_date,
            no_of_days: row.no_of_days,
            note: row.note,
            status: "Active"
          }),
        });

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || "Failed to save item");
        }
      }

      toast({
        title: "Success",
        description: `${formRows.length} item(s) added successfully`,
      });
      
      // Reset form to single empty row
      setFormRows([{
        tempId: crypto.randomUUID(),
        category: "",
        item_name: "",
        item_no: "",
        expiry_date: "",
        no_of_days: "",
        note: ""
      }]);
      
      fetchExpiryItems();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save items",
      });
    }
  };

  const handleCategorySubmit = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Category Added",
          description: "Expiry category added successfully",
        });
        setCategoryForm({
          category_name: "",
          description: ""
        });
        fetchCategories();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save category",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save category",
      });
    }
  };

  // Item handlers
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`/api/expiry-items/${id}`, { method: 'DELETE', credentials: 'include' });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Item deleted successfully" });
        fetchExpiryItems();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item" });
    }
  };

  const handleEditItem = (item: ExpiryItem) => {
    setEditingItemId(item.id);
    setFormRows([{
      tempId: crypto.randomUUID(),
      category: item.category_name || "",
      item_name: item.item_name,
      item_no: "",
      expiry_date: item.expiry_date,
      no_of_days: "",
      note: ""
    }]);
    setActiveTab('items');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Category handlers
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Category deleted successfully" });
        fetchCategories();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete category" });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({ category_name: category.category_name, description: category.description || "" });
    setActiveTab('category');
  };

  const filteredItems = expiryItems.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedItems = itemsPerPage === 'all' ? filteredItems : filteredItems.slice(startIndex, endIndex);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Item Registrations</span>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => setActiveTab('items')}
          className={activeTab === 'items' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-black border border-gray-300 hover:bg-gray-50'}
        >
          Create ExpiryItems
        </Button>
        <Button
          onClick={() => setActiveTab('category')}
          className={activeTab === 'category' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-black border border-gray-300 hover:bg-gray-50'}
        >
          Create ExpiryCategory
        </Button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <Card className="border-t-4 border-t-blue-600 shadow-md">
          <CardHeader className="bg-blue-600 text-white py-3">
            <CardTitle className="text-lg font-medium">Create ExpiryItems</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-blue-50">
            <div className="space-y-4">
              {/* Multi-row form with labels */}
              <div className="space-y-3">
                {formRows.map((row, rowIndex) => (
                  <div key={row.tempId} className="space-y-2">
                    {rowIndex === 0 && (
                      <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-blue-900">
                        <div className="col-span-2">Category *</div>
                        <div className="col-span-2">Item Name *</div>
                        <div className="col-span-2">Item No.</div>
                        <div className="col-span-2">Expiry Date *</div>
                        <div className="col-span-1">No of Days</div>
                        <div className="col-span-2">Note</div>
                        <div className="col-span-1">Action</div>
                      </div>
                    )}
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-2">
                        <Select
                          value={row.category}
                          onValueChange={(v) => updateRow(row.tempId, 'category', v)}
                        >
                          <SelectTrigger className="bg-white text-black border-blue-200 h-10">
                            <SelectValue placeholder="Choose Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.category_name}>
                                {cat.category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Input
                          className="bg-white text-black border-blue-200 h-10"
                          placeholder="Item Name"
                          value={row.item_name}
                          onChange={(e) => updateRow(row.tempId, 'item_name', e.target.value)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Input
                          className="bg-white text-black border-blue-200 h-10"
                          placeholder="Item No."
                          value={row.item_no}
                          onChange={(e) => updateRow(row.tempId, 'item_no', e.target.value)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Input
                          className="bg-white text-black border-blue-200 h-10"
                          type="date"
                          value={row.expiry_date}
                          onChange={(e) => updateRow(row.tempId, 'expiry_date', e.target.value)}
                        />
                      </div>

                      <div className="col-span-1">
                        <Input
                          className="bg-white text-black border-blue-200 h-10"
                          placeholder="Days"
                          type="number"
                          value={row.no_of_days}
                          onChange={(e) => updateRow(row.tempId, 'no_of_days', e.target.value)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Input
                          className="bg-white text-black border-blue-200 h-10"
                          placeholder="Note"
                          value={row.note}
                          onChange={(e) => updateRow(row.tempId, 'note', e.target.value)}
                        />
                      </div>

                      <div className="col-span-1 flex gap-1">
                        {rowIndex === formRows.length - 1 && (
                          <Button
                            type="button"
                            onClick={addNewRow}
                            className="h-10 w-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        )}
                        {formRows.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeRow(row.tempId)}
                            variant="outline"
                            className="h-10 w-10 bg-red-500 hover:bg-red-600 text-white border-0 rounded-full p-0"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-center mt-6">
                <Button onClick={handleItemSubmit} className="rounded-full bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 py-2 font-bold">
                  <Save className="h-4 w-4 mr-2" />
                  SAVE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tab */}
      {activeTab === 'category' && (
        <Card className="border-t-4 border-t-blue-600 shadow-md">
          <CardHeader className="bg-blue-600 text-white py-3">
            <CardTitle className="text-lg font-medium">Create ExpiryCategory</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-blue-50">
            <div className="space-y-4">
              <div className="text-blue-900 font-semibold underline">Category</div>
              <div className="flex items-center gap-2">
                <Input
                  className="bg-white text-black w-1/3"
                  placeholder="Item Category"
                  value={categoryForm.category_name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                />
                <Button type="button" variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center mt-4">
                <Button onClick={handleCategorySubmit} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">
                  <Save className="h-4 w-4 mr-2" />
                  SAVE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">S.No</TableHead>
                  {activeTab === 'items' ? (
                    <>
                      <TableHead className="font-bold text-gray-700">Category</TableHead>
                      <TableHead className="font-bold text-gray-700">Item Name</TableHead>
                      <TableHead className="font-bold text-gray-700">ViewList</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                      <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="font-bold text-gray-700">Item Name</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                      <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab === 'items' ? (
                  paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No data available in table
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>{startIndex + idx + 1}</TableCell>
                        <TableCell>{item.category_name || '-'}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleEditItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          Created: Super Admin {formatDate(item.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : (
                  categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No data available in table
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category, idx) => (
                      <TableRow key={category.id} className="hover:bg-gray-50">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{category.category_name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          Created: Super Admin {formatDate(category.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4 p-4 border-t">
              <div className="text-sm text-gray-500">
                {activeTab === 'items' ? (
                  <span>
                    Showing {paginatedItems.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    {searchTerm && ` (filtered from ${expiryItems.length} total entries)`}
                  </span>
                ) : (
                  <span>Showing 1 to {categories.length} of {categories.length} entries</span>
                )}
              </div>
              {activeTab === 'items' && (
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1 || itemsPerPage === 'all'}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ←
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
                    →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}