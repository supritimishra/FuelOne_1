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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Fuel, Edit, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function TanksNozzles() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tanks, setTanks] = useState<any[]>([]);
  const [fuelProducts, setFuelProducts] = useState<any[]>([]);
  const [editingTankId, setEditingTankId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [tankData, setTankData] = useState({
    tank_name: "",
    tank_capacity: "",
    fuel_product_id: "",
  });

  useEffect(() => {
    fetchFuelProducts();
    fetchTanks();
  }, []);

  const fetchFuelProducts = async () => {
    try {
      const response = await fetch('/api/fuel-products', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setFuelProducts(result.rows || []);
      }
    } catch (error) {
      console.error('Error fetching fuel products:', error);
    }
  };

  const fetchTanks = async () => {
    try {
      const response = await fetch('/api/tanks-list', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setTanks(result.rows || []);
      }
    } catch (error) {
      console.error('Error fetching tanks:', error);
    }
  };


  const handleTankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTankId ? `/api/tanks-list/${editingTankId}` : '/api/tanks-list';
      const method = editingTankId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tank_number: tankData.tank_name,
          capacity: parseFloat(tankData.tank_capacity || "0"),
          fuel_product_id: tankData.fuel_product_id
        })
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: editingTankId ? "Tank updated successfully" : "Tank added successfully" });
        setTankData({ tank_name: "", tank_capacity: "", fuel_product_id: "" });
        setEditingTankId(null);
        fetchTanks();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save tank" });
    }
  };

  const handleDeleteTank = async (id: string) => {
    try {
      const response = await fetch(`/api/tanks-list/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Tank deleted" });
        fetchTanks();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete tank" });
    }
    setDeleteConfirm(null);
  };

  const filteredTanks = tanks.filter((tank) =>
    (tank.tank_name || tank.tank_number).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredTanks.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedTanks = itemsPerPage === 'all' ? filteredTanks : filteredTanks.slice(startIndex, endIndex);

  const handleStatusToggle = async (tankId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const response = await fetch(`/api/tanks-list/${tankId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Success", description: `Tank ${newStatus.toLowerCase()}` });
        fetchTanks();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardHeader className="bg-blue-600 text-white py-3">
              <CardTitle className="text-lg font-medium">{editingTankId ? 'Edit Tank' : 'Create Tank'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-blue-50">
              <form onSubmit={handleTankSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tank_name" className="text-blue-900 font-semibold">Tank Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="tank_name"
                      className="bg-white border-blue-200 focus:border-blue-500"
                      placeholder="Tank Name"
                      value={tankData.tank_name}
                      onChange={(e) => setTankData({ ...tankData, tank_name: e.target.value })}
                      required
                      data-testid="input-tank-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tank_capacity" className="text-blue-900 font-semibold">Tank Capacity <span className="text-red-500">*</span></Label>
                    <Input
                      id="tank_capacity"
                      className="bg-white border-blue-200 focus:border-blue-500"
                      placeholder="Tank Capacity Eg: 9KL"
                      type="number"
                      step="0.01"
                      value={tankData.tank_capacity}
                      onChange={(e) => setTankData({ ...tankData, tank_capacity: e.target.value })}
                      required
                      data-testid="input-tank-capacity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-semibold">Product Name <span className="text-red-500">*</span></Label>
                    <Select value={tankData.fuel_product_id} onValueChange={(v) => setTankData({ ...tankData, fuel_product_id: v })}>
                      <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500" data-testid="select-fuel-product">
                        <SelectValue placeholder="Product Name" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelProducts.map(p => (<SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-center mt-6">
                  <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full" data-testid="button-save-tank">
                    <Save className="h-4 w-4 mr-2" /> {editingTankId ? 'UPDATE' : 'SAVE'}
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
                      <TableHead className="font-bold text-gray-700">Tank Name</TableHead>
                      <TableHead className="font-bold text-gray-700">Tank Capacity</TableHead>
                      <TableHead className="font-bold text-gray-700">Product Name</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Add Nozzles</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTanks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No tanks found. Add your first tank above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTanks.map((tank, idx) => (
                        <TableRow key={tank.id} data-testid={`row-tank-${tank.id}`} className="hover:bg-gray-50">
                          <TableCell>{startIndex + idx + 1}</TableCell>
                          <TableCell data-testid={`text-tank-name-${tank.id}`} className="font-medium">
                            {tank.tank_name || tank.tank_number} <span className="text-xs text-gray-400 ml-1">Id: {tank.id?.slice(-2).toUpperCase()}</span>
                          </TableCell>
                          <TableCell>{tank.tank_capacity || tank.capacity}KL</TableCell>
                          <TableCell>{tank.product_name || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => navigate(`/master/tank/add-nozzle/${tank.id}`)}
                              data-testid={`button-add-nozzles-${tank.id}`}
                            >
                              <Fuel className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                data-testid={`button-edit-tank-${tank.id}`}
                                onClick={() => {
                                  setTankData({
                                    tank_name: tank.tank_name || tank.tank_number || "",
                                    tank_capacity: tank.tank_capacity || tank.capacity || "",
                                    fuel_product_id: tank.fuel_product_id || ""
                                  });
                                  setEditingTankId(tank.id);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                                data-testid={`button-delete-tank-${tank.id}`}
                                onClick={() => setDeleteConfirm(tank.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleStatusToggle(tank.id, tank.status || 'Active')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  (tank.status || 'Active') === 'Active' ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    (tank.status || 'Active') === 'Active' ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className={`text-xs px-3 py-1 rounded font-bold ${
                                (tank.status || 'Active') === 'Active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {(tank.status || 'Active') === 'Active' ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            Created: Super Admin {new Date().toLocaleDateString('en-GB')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
                <span>
                  Showing {paginatedTanks.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  {searchTerm && ` (filtered from ${tanks.length} total entries)`}
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
              This action will delete this tank. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteTank(deleteConfirm)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
