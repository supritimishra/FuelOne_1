import { useState, useEffect, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

type NozzleRow = { id?: string; nozzle_number: string; tank_id: string; };

export default function AddNozzle() {
  const { toast } = useToast();
  const { tankId } = useParams<{ tankId: string }>();
  const navigate = useNavigate();
  const [tank, setTank] = useState<any>(null);
  const [nozzles, setNozzles] = useState<any[]>([]);
  const [fuelProducts, setFuelProducts] = useState<any[]>([]);
  const [newNozzles, setNewNozzles] = useState<NozzleRow[]>([{ nozzle_number: "", tank_id: tankId || "" }]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchTankDetails = useCallback(async () => {
    if (!tankId) return;
    try {
      const response = await fetch(`/api/tanks/${tankId}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setTank(result.row);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch tank details" });
    }
  }, [tankId, toast]);

  const fetchFuelProducts = useCallback(async () => {
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
  }, []);

  const fetchNozzles = useCallback(async () => {
    if (!tankId) return;
    try {
      const response = await fetch(`/api/nozzles-list?tank_id=${tankId}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setNozzles(result.rows || []);
      }
    } catch (error) {
      console.error('Error fetching nozzles:', error);
    }
  }, [tankId]);

  useEffect(() => {
    fetchTankDetails();
    fetchFuelProducts();
    fetchNozzles();
  }, [fetchTankDetails, fetchFuelProducts, fetchNozzles]);

  const addNewNozzleRow = () => {
    setNewNozzles(r => [...r, { nozzle_number: "", tank_id: tankId || "" }]);
  };

  const updateNewNozzleRow = (i: number, patch: Partial<NozzleRow>) => {
    setNewNozzles(r => r.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  };

  const removeNewNozzleRow = (i: number) => {
    setNewNozzles(r => r.filter((_, idx) => idx !== i));
  };

  const handleSaveNewNozzles = async () => {
    const payload = newNozzles.filter(r => r.nozzle_number);
    if (payload.length === 0) {
      toast({ variant: "destructive", title: "Nothing to save" });
      return;
    }

    try {
      const results = await Promise.all(payload.map(async (item) => {
        const response = await fetch('/api/nozzles-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nozzle_number: item.nozzle_number,
            tank_id: item.tank_id,
            fuel_product_id: tank?.fuel_product_id || null,
            pump_station: null
          }),
        });
        return response.json();
      }));

      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        toast({ variant: "destructive", title: "Some nozzles failed to save", description: failed[0].error });
      } else {
        toast({ title: "Saved successfully" });
        setNewNozzles([{ nozzle_number: "", tank_id: tankId || "" }]);
        setShowForm(false);
        fetchNozzles();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Save failed" });
    }
  };

  const filteredNozzles = nozzles.filter(n =>
    n.nozzle_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (!tank) {
    return <div className="text-center py-8">Loading tank details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/master/tank-nozzel')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Dashboard Tank Add Nozzle</h1>
      </div>

      {/* Tank Information - Single Row Layout */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <div><strong>Tank Name :</strong> {tank.tank_name || tank.tank_number}</div>
            <div><strong>Capacity :</strong> {tank.capacity}KL</div>
            <div><strong>Product :</strong> {fuelProducts.find(fp => fp.id === tank.fuel_product_id)?.product_name || "N/A"}</div>
          </div>
        </CardContent>
      </Card>

      {/* Add Nozzles Button */}
      <div className="flex justify-start">
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Nozzles
        </Button>
      </div>

      {/* Conditional Form Display */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Nozzles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {newNozzles.map((row, i) => (
              <div key={i} className="flex items-center gap-4">
                <Input
                  placeholder="Nozzle*"
                  value={row.nozzle_number}
                  onChange={(e) => updateNewNozzleRow(i, { nozzle_number: e.target.value })}
                  data-testid={`input-nozzle-number-${i}`}
                  required
                  className="text-black bg-white"
                />
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={addNewNozzleRow} data-testid={`button-add-${i}`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  {newNozzles.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => removeNewNozzleRow(i)} data-testid={`button-remove-${i}`}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-center">
              <Button onClick={handleSaveNewNozzles} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8" data-testid="button-save-nozzles">
                SAVE
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nozzles Table */}
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
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Filter:</span>
              <Input
                placeholder="Type to filter..."
                className="w-56 text-black bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S no</TableHead>
                <TableHead>Nozzle</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNozzles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No nozzles found for this tank.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNozzles.map((nozzle, idx) => (
                  <TableRow key={nozzle.id} data-testid={`row-nozzle-${nozzle.id}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{nozzle.nozzle_number}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" data-testid={`button-edit-nozzle-${nozzle.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="bg-[#10b981] text-white text-xs px-3 py-1 rounded font-bold">
                        ACTIVATED
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing 1 to {filteredNozzles.length} of {filteredNozzles.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                ←
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-500 text-white">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
