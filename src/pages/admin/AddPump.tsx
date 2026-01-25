import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AddPump() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pumpName, setPumpName] = useState("");
  const [pumps, setPumps] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPumps();
  }, []);

  const fetchPumps = async () => {
    try {
      const response = await fetch('/api/pump-stations', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setPumps(result.rows || []);
      } else {
        toast({ title: "Error loading pumps", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error loading pumps", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!pumpName.trim()) {
      toast({ title: "Error", description: "Please enter a pump name", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        // Update existing pump
        const response = await fetch(`/api/pump-stations/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ pump_name: pumpName.trim() }),
        });
        
        const result = await response.json();
        if (result.ok) {
          toast({ title: "Success", description: "Pump station updated successfully" });
          setPumpName("");
          setEditingId(null);
          fetchPumps();
        } else {
          toast({ title: "Error", description: result.error || "Failed to update pump station", variant: "destructive" });
        }
      } else {
        // Create new pump
        const response = await fetch('/api/pump-stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ pump_name: pumpName.trim() }),
        });
        
        const result = await response.json();
        if (result.ok) {
          toast({ title: "Success", description: "Pump station created successfully" });
          setPumpName("");
          fetchPumps();
        } else {
          toast({ title: "Error", description: result.error || "Failed to create pump station", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save pump station", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const pump = pumps.find(p => p.id === id);
      if (!pump) return;

      const response = await fetch(`/api/pump-stations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !pump.is_active }),
      });
      
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Success", description: "Status updated successfully" });
        fetchPumps();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleEdit = (pump: any) => {
    setEditingId(pump.id);
    setPumpName(pump.pump_name || pump.pump || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/pump-stations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Success", description: "Pump station deleted successfully" });
        fetchPumps();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete pump station", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete pump station", variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const filteredPumps = pumps.filter(p =>
    (p.pump?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (p.pump_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md">
        <CardContent className="p-8 bg-blue-600">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Create Pump*"
              value={pumpName}
              onChange={(e) => setPumpName(e.target.value)}
              className="bg-white text-black max-w-md"
            />
            <Button 
              onClick={handleSave} 
              className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded"
            >
              <Save className="h-4 w-4 mr-2" /> {editingId ? 'UPDATE' : 'SAVE'}
            </Button>
            {editingId && (
              <Button 
                onClick={() => {
                  setEditingId(null);
                  setPumpName("");
                }}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pumps Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex justify-between items-center bg-white border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <Input 
                placeholder="Type to filter..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 h-8"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center font-bold">S.No</TableHead>
                <TableHead className="text-center font-bold">Pump</TableHead>
                <TableHead className="text-center font-bold">Pump Name</TableHead>
                <TableHead className="text-center font-bold">Action</TableHead>
                <TableHead className="text-center font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPumps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No pumps found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPumps.map((pump, index) => (
                  <TableRow key={pump.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="text-center">{pump.pump}</TableCell>
                    <TableCell className="text-center">{pump.pump_name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pump)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(pump.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Switch
                          checked={pump.is_active}
                          onCheckedChange={() => handleToggleStatus(pump.id)}
                          className="data-[state=checked]:bg-blue-500"
                        />
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            pump.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {pump.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 flex justify-between items-center border-t">
            <div className="text-sm text-gray-600">
              Showing 1 to {filteredPumps.length} of {filteredPumps.length} entries
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8">←</Button>
              <Button variant="outline" size="sm" className="h-8 px-3">1</Button>
              <Button variant="outline" size="icon" className="h-8 w-8">→</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete this pump station. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
