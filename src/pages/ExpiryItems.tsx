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
import { Plus, Search, Edit, Trash2, Calendar, Save } from "lucide-react";

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

  // Form states for both tabs
  const [itemForm, setItemForm] = useState({
    item_name: "",
    issue_date: "",
    expiry_date: "",
    status: "Active",
    category: "",
    item_no: "",
    no_of_days: "",
    note: ""
  });

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
        setCategories(result.rows || []);
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

  const handleItemSubmit = async () => {
    try {
      const response = await fetch('/api/expiry-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm),
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Item Added",
          description: "Expiry item added successfully",
        });
        setItemForm({
          item_name: "",
          issue_date: "",
          expiry_date: "",
          status: "Active",
          category: "",
          item_no: "",
          no_of_days: "",
          note: ""
        });
        fetchExpiryItems();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save item",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save item",
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
    setItemForm({ item_name: item.item_name, issue_date: item.issue_date || "", expiry_date: item.expiry_date, category: item.category_name || "", item_no: "", no_of_days: "", note: "", status: item.status });
    setActiveTab('items');
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
              {/* Date Fields */}
              <div className="flex gap-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Choose Date
                </Button>
                <Input
                  className="bg-white text-black w-48"
                  placeholder="Created Date"
                  type="date"
                  value={itemForm.issue_date}
                  onChange={(e) => setItemForm({ ...itemForm, issue_date: e.target.value })}
                />
              </div>

              {/* Item Details */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Choose Category*" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.category_name}>{cat.category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  className="bg-white text-black"
                  placeholder="Item Name*"
                  value={itemForm.item_name}
                  onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                />

                <Input
                  className="bg-white text-black"
                  placeholder="Item No.*"
                  value={itemForm.item_no}
                  onChange={(e) => setItemForm({ ...itemForm, item_no: e.target.value })}
                />

                <Input
                  className="bg-white text-black"
                  placeholder="Expiry Date*"
                  type="date"
                  value={itemForm.expiry_date}
                  onChange={(e) => setItemForm({ ...itemForm, expiry_date: e.target.value })}
                />

                <Input
                  className="bg-white text-black"
                  placeholder="No of Days*"
                  type="number"
                  value={itemForm.no_of_days}
                  onChange={(e) => setItemForm({ ...itemForm, no_of_days: e.target.value })}
                />

                <div className="flex items-center gap-2">
                  <Input
                    className="bg-white text-black"
                    placeholder="Note"
                    value={itemForm.note}
                    onChange={(e) => setItemForm({ ...itemForm, note: e.target.value })}
                  />
                  <Button type="button" variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-center mt-4">
                <Button onClick={handleItemSubmit} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">
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
                <span>Show:</span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50">
                CSV
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">
                PDF
              </Button>
              <div className="flex items-center gap-2">
                <span>Filter:</span>
                <Input
                  placeholder="Type to filter..."
                  className="w-56"
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
                  filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No data available in table
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>{idx + 1}</TableCell>
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
                Showing 1 to {activeTab === 'items' ? filteredItems.length : categories.length} of {activeTab === 'items' ? filteredItems.length : categories.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  ←
                </Button>
                <Button variant="outline" size="sm" className="bg-gray-100">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  →
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}