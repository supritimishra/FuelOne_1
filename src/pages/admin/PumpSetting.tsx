import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Fuel, Save, Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Row = { pump_station: string; tank_id: string; nozzle_number: string };

export default function PumpSetting() {
  const { toast } = useToast();
  const [tanks, setTanks] = useState<any[]>([]);
  const [nozzles, setNozzles] = useState<any[]>([]);
  const [rows, setRows] = useState<Row[]>([{ pump_station: "", tank_id: "", nozzle_number: "" }]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchTanks();
    fetchNozzles();
  }, []);

  const fetchTanks = async () => {
    try {
      const response = await fetch('/api/tanks-list', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setTanks(result.rows || []);
      } else {
        toast({ title: "Error loading tanks", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error loading tanks", variant: "destructive" });
    }
  };

  const fetchNozzles = async () => {
    try {
      const response = await fetch('/api/nozzles-list', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setNozzles(result.rows || []);
      } else {
        toast({ title: "Error loading nozzles", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error loading nozzles", variant: "destructive" });
    }
  };

  const addRow = () => setRows(r => [...r, { pump_station: "", tank_id: "", nozzle_number: "" }]);
  const updateRow = (i: number, patch: Partial<Row>) => setRows(r => r.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const save = async () => {
    const payload = rows.filter(r => r.nozzle_number && r.tank_id && r.pump_station);
    if (payload.length === 0) {
      toast({ variant: "destructive", title: "Nothing to save" });
      return;
    }

    try {
      if (editingId) {
        // Update single item
        const item = payload[0];
        const response = await fetch(`/api/nozzles-list/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nozzle_number: item.nozzle_number,
            tank_id: item.tank_id,
            pump_station: item.pump_station
          }),
        });
        const result = await response.json();
        if (result.ok) {
          toast({ title: "Updated successfully" });
          setEditingId(null);
          setRows([{ pump_station: "", tank_id: "", nozzle_number: "" }]);
          fetchNozzles();
        } else {
          toast({ variant: "destructive", title: "Update failed", description: result.error });
        }
      } else {
        // Create multiple items
        const results = await Promise.all(payload.map(async (item) => {
          const response = await fetch('/api/nozzles-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              nozzle_number: item.nozzle_number,
              tank_id: item.tank_id,
              pump_station: item.pump_station
            }),
          });
          return response.json();
        }));

        const failed = results.filter(r => !r.ok);
        if (failed.length > 0) {
          toast({ variant: "destructive", title: "Some nozzles failed to save", description: failed[0].error });
        } else {
          toast({ title: "Saved successfully" });
          setRows([{ pump_station: "", tank_id: "", nozzle_number: "" }]);
          fetchNozzles();
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Save failed" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/nozzles-list/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Deleted successfully" });
        fetchNozzles();
      } else {
        toast({ variant: "destructive", title: "Failed to delete", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (nozzle: any) => {
    setEditingId(nozzle.id);
    setRows([{
      pump_station: nozzle.pump_station || "",
      tank_id: nozzle.tank_id || "",
      nozzle_number: nozzle.nozzle_number || ""
    }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredNozzles = nozzles.filter(n =>
    (n.nozzle_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (n.tank_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (n.tank_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (n.pump_station?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pump Nozzels</h1>
        </div>
        {!editingId && (
          <Button type="button" variant="outline" onClick={addRow} className="border-blue-600 text-blue-700 hover:bg-blue-50" data-testid="button-add-row">
            Add New Pump +
          </Button>
        )}
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">{editingId ? 'Edit Pump Nozzle' : 'Create Pump Nozzle'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <div className="space-y-4">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Pump Station <span className="text-red-500">*</span></Label>
                  <Input
                    className="bg-white border-blue-200 focus:border-blue-500"
                    placeholder="Pump Station"
                    value={row.pump_station}
                    onChange={(e) => updateRow(i, { pump_station: e.target.value })}
                    data-testid={`input-pump-station-${i}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Tank <span className="text-red-500">*</span></Label>
                  <Select value={row.tank_id} onValueChange={(v) => updateRow(i, { tank_id: v })}>
                    <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500" data-testid={`select-tank-${i}`}>
                      <SelectValue placeholder="Select Tank" />
                    </SelectTrigger>
                    <SelectContent>
                      {tanks.map(t => (<SelectItem key={t.id} value={t.id}>{t.tank_name || t.tank_number || t.id}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Nozzle <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input
                      className="bg-white border-blue-200 focus:border-blue-500"
                      placeholder="Nozzle Number"
                      value={row.nozzle_number}
                      onChange={(e) => updateRow(i, { nozzle_number: e.target.value })}
                      data-testid={`input-nozzle-${i}`}
                    />
                    {!editingId && (
                      <>
                        <Button type="button" variant="outline" size="icon" onClick={addRow} className="text-blue-600 border-blue-200 hover:bg-blue-50" data-testid={`button-add-${i}`}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        {rows.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeRow(i)} className="text-red-600 border-red-200 hover:bg-red-50" data-testid={`button-remove-${i}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center mt-6">
              <Button onClick={save} className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full" data-testid="button-save">
                <Save className="h-4 w-4 mr-2" /> {editingId ? 'UPDATE' : 'SAVE'}
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
                <Input
                  placeholder="Type to filter..."
                  className="h-8 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700">Pump Station</TableHead>
                  <TableHead className="font-bold text-gray-700">Nozzle</TableHead>
                  <TableHead className="font-bold text-gray-700">Tank Name</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNozzles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No nozzles found. Add your first nozzle above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNozzles.map((nozzle, idx) => (
                    <TableRow key={nozzle.id} data-testid={`row-nozzle-${nozzle.id}`} className="hover:bg-gray-50">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{nozzle.pump_station || "-"}</TableCell>
                      <TableCell data-testid={`text-nozzle-${nozzle.id}`} className="font-medium">{nozzle.nozzle_number}</TableCell>
                      <TableCell>{nozzle.tank_name || nozzle.tank_number || "-"}</TableCell>
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
                            data-testid={`button-edit-${nozzle.id}`}
                            onClick={() => handleEdit(nozzle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteConfirm(nozzle.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <span>Showing 1 to {filteredNozzles.length} of {filteredNozzles.length} entries</span>
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
              This action will delete this nozzle. This action cannot be undone.
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
