import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Pump = {
  id: string;
  pump: string;
  pump_name: string;
  status: string;
};

export default function Pumps() {
  const { toast } = useToast();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [pumpForm, setPumpForm] = useState({
    pump: "",
    pump_name: ""
  });

  useEffect(() => {
    fetchPumps();
  }, []);

  const fetchPumps = async () => {
    try {
      const response = await fetch('/api/pumps', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setPumps(result.rows || []);
      }
    } catch (error) {
      console.error('Error fetching pumps:', error);
    }
  };

  const handleSubmit = async () => {
    if (!pumpForm.pump || !pumpForm.pump_name) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields" });
      return;
    }

    try {
      const url = editingId ? `/api/pumps/${editingId}` : '/api/pumps';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pumpForm)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: editingId ? "Pump updated successfully" : "Pump created successfully" });
        setPumpForm({ pump: "", pump_name: "" });
        setEditingId(null);
        fetchPumps();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save pump" });
    }
  };

  const handleEdit = (pump: Pump) => {
    setEditingId(pump.id);
    setPumpForm({
      pump: pump.pump,
      pump_name: pump.pump_name
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/pumps/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Pump deleted successfully" });
        fetchPumps();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete pump" });
    }
    setDeleteConfirm(null);
  };

  const handleStatusToggle = async (pumpId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const response = await fetch(`/api/pumps/${pumpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Success", description: `Pump ${newStatus.toLowerCase()}` });
        fetchPumps();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const filteredPumps = pumps.filter(p =>
    p.pump?.toLowerCase().includes(search.toLowerCase()) ||
    p.pump_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredPumps.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedPumps = itemsPerPage === 'all' ? filteredPumps : filteredPumps.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">{editingId ? 'Edit Pump' : 'Create Pump'}*</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-blue-900 font-semibold">Pump <span className="text-red-500">*</span></label>
                <Input
                  className="bg-white text-black border-blue-200 focus:border-blue-500"
                  placeholder="Pump"
                  value={pumpForm.pump}
                  onChange={(e) => setPumpForm({ ...pumpForm, pump: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-blue-900 font-semibold">Pump Name <span className="text-red-500">*</span></label>
                <Input
                  className="bg-white text-black border-blue-200 focus:border-blue-500"
                  placeholder="Pump Name"
                  value={pumpForm.pump_name}
                  onChange={(e) => setPumpForm({ ...pumpForm, pump_name: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleSubmit} className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full">
                <Save className="h-4 w-4 mr-2" /> SAVE
              </Button>
            </div>
          </div>
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <Input
                placeholder="Type to filter..."
                className="h-8 w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700">Pump</TableHead>
                  <TableHead className="font-bold text-gray-700">Pump Name</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPumps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No pumps found. Add your first pump above.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPumps.map((pump, idx) => (
                    <TableRow key={pump.id} className="hover:bg-gray-50">
                      <TableCell>{startIndex + idx + 1}</TableCell>
                      <TableCell className="font-medium">{pump.pump}</TableCell>
                      <TableCell>{pump.pump_name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(pump)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteConfirm(pump.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleStatusToggle(pump.id, pump.status || 'Active')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              (pump.status || 'Active') === 'Active' ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                (pump.status || 'Active') === 'Active' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs px-3 py-1 rounded font-bold ${
                            (pump.status || 'Active') === 'Active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {(pump.status || 'Active') === 'Active' ? 'ACTIVATED' : 'INACTIVE'}
                          </span>
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
              Showing {paginatedPumps.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              {search && ` (filtered from ${pumps.length} total entries)`}
            </span>
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
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete this pump. This action cannot be undone.
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
