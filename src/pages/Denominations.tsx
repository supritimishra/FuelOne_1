import { useState, useEffect } from "react";
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
import { Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DenominationField {
  tempId: string;
  value: string;
}

interface Denomination {
  id: string;
  denomination: string;
  status: string;
  created_at: string;
  created_by_name?: string;
}

export default function Denominations() {
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [denominationFields, setDenominationFields] = useState<DenominationField[]>([
    { tempId: crypto.randomUUID(), value: '' }
  ]);

  useEffect(() => {
    fetchDenominations();
  }, []);

  const fetchDenominations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/master/denominations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.ok && result.rows) {
        // Map backend fields to frontend expected fields
        setDenominations(result.rows.map((row: any) => ({
          ...row,
          value: row.denomination, // for compatibility with UI
          status: row.status && row.status.toLowerCase() === 'active' ? 'ACTIVATED' : 'INACTIVATED',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch denominations:', error);
      toast({ title: "Failed to load denominations", variant: "destructive" });
    }
  };

  const addDenominationField = () => {
    setDenominationFields([...denominationFields, { tempId: crypto.randomUUID(), value: '' }]);
  };

  const removeDenominationField = (tempId: string) => {
    if (denominationFields.length > 1) {
      setDenominationFields(denominationFields.filter(f => f.tempId !== tempId));
    }
  };

  const updateDenominationField = (tempId: string, value: string) => {
    setDenominationFields(denominationFields.map(f =>
      f.tempId === tempId ? { ...f, value } : f
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validFields = denominationFields.filter(f => f.value.trim());
    if (validFields.length === 0) {
      toast({ title: "Please enter at least one denomination", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const promises = validFields.map(field =>
        fetch('/api/master/denominations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ denomination: field.value })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const successCount = results.filter(r => r.ok).length;
      if (successCount > 0) {
        toast({ title: `${successCount} denomination(s) added successfully` });
        setDenominationFields([{ tempId: crypto.randomUUID(), value: '' }]);
        await fetchDenominations();
      } else {
        toast({ title: "Failed to add denominations", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error adding denominations:', error);
      toast({ title: "Failed to add denominations", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/master/denominations/${deleteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.ok) {
          toast({ title: "Denomination deleted successfully" });
          await fetchDenominations();
        } else {
          toast({ title: "Failed to delete denomination", variant: "destructive" });
        }
      } catch (error) {
        console.error('Error deleting denomination:', error);
        toast({ title: "Failed to delete denomination", variant: "destructive" });
      }
      setDeleteId(null);
    }
  };

  const handleStatusToggle = async (id: string) => {
    const denomination = denominations.find(d => d.id === id);
    if (!denomination) return;

    const newStatus = denomination.status === 'ACTIVATED' ? 'inactivated' : 'active';
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/master/denominations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Status updated successfully" });
        await fetchDenominations();
      } else {
        toast({ title: "Failed to update status", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const filteredDenominations = denominations.filter((item) =>
    (item.value || item.denomination || '').includes(searchTerm)
  );

  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredDenominations.length / itemsPerPage);
  const paginatedDenominations = itemsPerPage === 'all'
    ? filteredDenominations
    : filteredDenominations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Add Denomination</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-blue-700 font-semibold">Denomination <span className="text-red-500">*</span></label>
              <div className="space-y-2">
                {denominationFields.map((field, index) => (
                  <div key={field.tempId} className="flex gap-2">
                    <Input
                      value={field.value}
                      onChange={(e) => updateDenominationField(field.tempId, e.target.value)}
                      className="bg-white border-blue-200 focus:border-blue-500"
                      placeholder="Enter Denomination"
                    />
                    {index === denominationFields.length - 1 ? (
                      <Button
                        type="button"
                        onClick={addDenominationField}
                        size="icon"
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => removeDenominationField(field.tempId)}
                        size="icon"
                        className="bg-red-500 hover:bg-red-600 text-white shrink-0"
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8">
                 SAVE
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
                value={String(itemsPerPage)}
                onChange={(e) => {
                  setItemsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
              </select>
              <span className="text-sm text-gray-500">entries</span>
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
                  <TableHead className="font-bold text-gray-700">Denomination</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDenominations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDenominations.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{itemsPerPage === 'all' ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.value}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => handleStatusToggle(item.id)}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              item.status === 'ACTIVATED'
                                ? 'bg-blue-600 focus:ring-blue-500' 
                                : 'bg-gray-300 focus:ring-gray-400'
                            }`}
                            role="switch"
                            aria-checked={item.status === 'ACTIVATED'}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                                item.status === 'ACTIVATED' ? 'translate-x-9' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span 
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              item.status === 'ACTIVATED'
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.status === 'ACTIVATED' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        <div>Created: {item.created_by_name || 'Super Admin'}</div>
                        <div className="text-gray-400">{new Date(item.created_at).toLocaleDateString('en-GB')}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing {paginatedDenominations.length === 0 ? 0 : (currentPage - 1) * (itemsPerPage === 'all' ? filteredDenominations.length : itemsPerPage) + 1} to {Math.min(currentPage * (itemsPerPage === 'all' ? filteredDenominations.length : itemsPerPage), filteredDenominations.length)} of {filteredDenominations.length} entries</span>
            {itemsPerPage !== 'all' && totalPages > 1 && (
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  &larr;
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button 
                    key={page}
                    variant={currentPage === page ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  &rarr;
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Denomination?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the denomination.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
