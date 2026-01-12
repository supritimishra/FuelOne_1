import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Save } from "lucide-react";
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

export default function SwipeMachines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    machine_name: "",
    attach_type: "Bank" as "Bank" | "Vendor",
    bank_type: "",
    vendor_id: "",
    status: "Active" as "Active" | "Inactive",
  });

  const { data: machines = [] } = useQuery<any[]>({
    queryKey: ["/api/swipe-machines"],
    queryFn: async () => {
      const response = await fetch("/api/swipe-machines", { credentials: "include" });
      const result = await response.json();
      if (result.ok) return result.rows || [];
      throw new Error(result.error || "Failed to fetch machines");
    },
  });

  useQuery<any[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const response = await fetch("/api/vendors", { credentials: "include" });
      const result = await response.json();
      if (result.ok) {
        const activeVendors = (result.rows || []).filter((v: any) => v.is_active);
        setVendors(activeVendors);
        return activeVendors;
      }
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        machine_name: data.machine_name,
        machine_type: "Card",
        provider: "Other",
        status: data.status || "Active",
        attach_type: data.attach_type,
        bank_type: data.attach_type === "Bank" ? data.bank_type : null,
        vendor_id: data.attach_type === "Vendor" ? data.vendor_id : null,
      };

      const url = editingId ? `/api/swipe-machines/${editingId}` : "/api/swipe-machines";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to save");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swipe-machines"] });
      toast({ title: editingId ? "Updated successfully" : "Saved successfully" });
      setEditingId(null);
      setFormData({
        machine_name: "",
        attach_type: "Bank",
        bank_type: "",
        vendor_id: "",
        status: "Active",
      });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ machine, status }: { machine: any; status: "Active" | "Inactive" }) => {
      const payload = {
        machine_name: machine.machine_name || "",
        machine_type: machine.machine_type || "Card",
        provider: machine.provider || "Other",
        machine_id: machine.machine_id || null,
        status,
        attach_type: machine.attach_type || null,
        bank_type: machine.bank_type || null,
        vendor_id: machine.vendor_id || null,
      };

      const response = await fetch(`/api/swipe-machines/${machine.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || "Failed to update status");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swipe-machines"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update status", description: e.message, variant: "destructive" });
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/swipe-machines/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (result.ok) {
        toast({ title: "Deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/swipe-machines"] });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (machine: any) => {
    setEditingId(machine.id);
    setFormData({
      machine_name: machine.machine_name,
      attach_type: machine.attach_type || "Bank",
      bank_type: machine.bank_type || "",
      vendor_id: machine.vendor_id || "",
      status: machine.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredMachines = machines.filter((item: any) =>
    (item.machine_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Swipe Machine</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <Label htmlFor="machine_name" className="text-blue-900 font-semibold">
                  Machine Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="machine_name"
                  value={formData.machine_name}
                  onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Machine Name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-blue-900 font-semibold">Attach Type (optional)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="bank"
                      name="attach_type"
                      checked={formData.attach_type === "Bank"}
                      onChange={() => setFormData({ ...formData, attach_type: "Bank" })}
                      className="accent-blue-600 h-4 w-4"
                    />
                    <Label htmlFor="bank" className="font-normal">
                      Bank
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="vendor"
                      name="attach_type"
                      checked={formData.attach_type === "Vendor"}
                      onChange={() => setFormData({ ...formData, attach_type: "Vendor" })}
                      className="accent-blue-600 h-4 w-4"
                    />
                    <Label htmlFor="vendor" className="font-normal">
                      Vendor
                    </Label>
                  </div>
                </div>

                {formData.attach_type === "Bank" && (
                  <Input
                    placeholder="Type (e.g., PNB CURRENT)"
                    value={formData.bank_type}
                    onChange={(e) => setFormData({ ...formData, bank_type: e.target.value })}
                    className="bg-white border-blue-200 focus:border-blue-500 mt-2"
                  />
                )}

                {formData.attach_type === "Vendor" && (
                  <Select
                    value={formData.vendor_id}
                    onValueChange={(val) => setFormData({ ...formData, vendor_id: val })}
                  >
                    <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500 mt-2">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vendor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full"
              >
                <Save className="h-4 w-4 mr-2" /> {editingId ? "UPDATE" : "SAVE"}
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
                <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50">
                  CSV
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">
                  PDF
                </Button>
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
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700">Machine Name</TableHead>
                  <TableHead className="font-bold text-gray-700">Attached Type</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Edit</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Delete</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No machines found. Add your first machine above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMachines.map((item: any, index: number) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.machine_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.attach_type}</span>
                          <span className="text-xs text-gray-500">
                            Type: {item.attach_type === "Vendor" ? item.vendor_name : item.bank_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                          onClick={() => setDeleteConfirm(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                              type="checkbox"
                              name="toggle"
                              id={`toggle-${item.id}`}
                              checked={item.status === "Active"}
                              onChange={() =>
                                statusMutation.mutate({
                                  machine: item,
                                  status: item.status === "Active" ? "Inactive" : "Active",
                                })
                              }
                              className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                            />
                            <label
                              htmlFor={`toggle-${item.id}`}
                              className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded font-bold ${
                              item.status === "Active" ? "bg-[#10b981] text-white" : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {item.status === "Active" ? "ACTIVATED" : "DISABLED"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        Created: Super Admin {item.created_at ? new Date(item.created_at).toLocaleString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>
              Showing 1 to {filteredMachines.length} of {filteredMachines.length} entries
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                &larr;
              </Button>
              <Button variant="outline" size="sm" className="bg-gray-100">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
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
              This action will delete this machine. This action cannot be undone.
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