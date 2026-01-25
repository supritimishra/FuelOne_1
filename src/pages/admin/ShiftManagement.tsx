import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Edit, Trash2, Save } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const shiftSchema = z.object({
  shift_name: z.string().min(1, "Shift name is required"),
  duties: z.coerce.number().int().min(0, "Enter duties in number").optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

type ShiftForm = z.infer<typeof shiftSchema>;

export default function ShiftManagement() {
  const queryClient = useQueryClient();
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: shifts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch');
      return result.rows || [];
    },
  });

  const form = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      shift_name: "",
      duties: 0,
      start_time: "",
      end_time: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ShiftForm) => {
      const response = await fetch('/api/duty-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shift_name: formData.shift_name,
          duties: formData.duties ?? null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to create');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/duty-shifts"] });
      toast({ title: "Shift added successfully" });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Failed to add shift",
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: ShiftForm & { id: string }) => {
      const response = await fetch(`/api/duty-shifts/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shift_name: formData.shift_name,
          duties: formData.duties ?? null,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to update');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/duty-shifts"] });
      toast({ title: "Shift updated successfully" });
      setEditingShift(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Failed to update shift",
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/duty-shifts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to delete');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/duty-shifts"] });
      toast({ title: "Shift deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete shift",
        variant: "destructive"
      });
    },
  });

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    form.reset({
      shift_name: shift.shift_name,
      duties: shift.duties || 0,
      start_time: shift.start_time || "",
      end_time: shift.end_time || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: ShiftForm) => {
    if (editingShift) {
      updateMutation.mutate({ ...data, id: editingShift.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredShifts = shifts.filter((shift) =>
    shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Shifts</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="shift_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">Shift name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white border-blue-200 focus:border-blue-500" placeholder="Enter Shift Type" data-testid="input-shift-name" />
                      </FormControl>
                      <p className="text-xs text-blue-400">Eg:24Hrs (NightShift,DayShift,GeneralShift)</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">Duties <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white border-blue-200 focus:border-blue-500" placeholder="Enter Duties in number" data-testid="input-duties" />
                      </FormControl>
                      <p className="text-xs text-blue-400">Eg: 2 Duties (No. of Duties to consider for Salary)</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">From Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="bg-white border-blue-200 focus:border-blue-500" data-testid="input-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-900 font-semibold">To Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="bg-white border-blue-200 focus:border-blue-500" data-testid="input-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-center mt-6">
                <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold rounded-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                  <Save className="h-4 w-4 mr-2" /> {createMutation.isPending || updateMutation.isPending ? "SAVING..." : "SAVE"}
                </Button>
              </div>
            </form>
          </Form>
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
                  <TableHead className="font-bold text-gray-700">Shift Type</TableHead>
                  <TableHead className="font-bold text-gray-700">From Time</TableHead>
                  <TableHead className="font-bold text-gray-700">To Time</TableHead>
                  <TableHead className="font-bold text-gray-700">Duties</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShifts.map((shift, idx) => (
                    <TableRow key={shift.id} data-testid={`row-shift-${shift.id}`} className="hover:bg-gray-50">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell data-testid={`text-shift-name-${shift.id}`} className="font-medium">{shift.shift_name}</TableCell>
                      <TableCell>{shift.start_time || "-"}</TableCell>
                      <TableCell>{shift.end_time || "-"}</TableCell>
                      <TableCell>{shift.duties || "-"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(shift)}
                            data-testid={`button-edit-${shift.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteId(shift.id)}
                            data-testid={`button-delete-${shift.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded font-bold">
                          ACTIVATED
                        </span>
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
            <span>Showing 1 to {filteredShifts.length} of {filteredShifts.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>&larr;</Button>
              <Button variant="outline" size="sm" className="bg-gray-100">1</Button>
              <Button variant="outline" size="sm" disabled>&rarr;</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shift.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
