import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Search, Pencil, Lock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const expenseTypeSchema = z.object({
  expense_type_name: z.string().min(1, "Expense Type is required"),
  effect_for: z.enum(["Employee", "Profit"]),
  options: z.string().optional(),
});

type ExpenseTypeFormData = z.infer<typeof expenseTypeSchema>;

const ExpenseTypes = () => {
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCount, setShowCount] = useState(10);
  const { toast } = useToast();

  const form = useForm<ExpenseTypeFormData>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: {
      expense_type_name: "",
      effect_for: "Employee",
      options: "",
    }
  });

  const fetchExpenseTypes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expense-types', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        setExpenseTypes(result.rows || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch expense types",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load expense types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExpenseTypes();
  }, [fetchExpenseTypes]);

  const onSubmit = async (data: ExpenseTypeFormData) => {
    // Wrap single object in array as backend expects array for bulk insert, 
    // or check if backend handles single object. 
    // Previous code used bulk insert: `body: JSON.stringify(payload.map(r => ...))`
    // But `handleEdit` implies single update.
    // Let's check if we can adapt. The previous code had `saveMutation` taking `RowValues[]`.
    // I will assume for now I can send a single object for update, or array for create if I want to keep bulk capability,
    // but the UI is now single form.
    // Actually, the previous code's `saveMutation` was strictly for creating multiple.
    // And `toggleStatus` used PUT /:id.
    // I should check if there is a PUT /:id for updating details.
    // If not, I might need to stick to create-only or refactor backend.
    // Assuming standard REST: POST / (create), PUT /:id (update).

    try {
      if (editingId) {
        // Assuming PUT endpoint exists for updating details, similar to toggleStatus
        const response = await fetch(`/api/expense-types/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Expense type updated successfully" });
          setEditingId(null);
          form.reset();
          fetchExpenseTypes();
        } else {
          toast({ title: "Error", description: result.error || "Failed to update expense type", variant: "destructive" });
        }
      } else {
        // Backend expects array for POST?
        // Previous code: `body: JSON.stringify(payload.map(r => ...))`
        // So I should send an array of one item.
        const response = await fetch('/api/expense-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify([data])
        });
        const result = await response.json();

        if (result.ok) {
          toast({ title: "Success", description: "Expense type added successfully" });
          form.reset();
          fetchExpenseTypes();
        } else {
          toast({ title: "Error", description: result.error || "Failed to add expense type", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save expense type", variant: "destructive" });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      expense_type_name: item.expense_type_name,
      effect_for: item.effect_for || "Employee",
      options: item.options || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/expense-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();

      if (result.ok) {
        toast({ title: "Success", description: "Expense type deleted successfully" });
        fetchExpenseTypes();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete expense type", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete expense type", variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const filteredTypes = expenseTypes.filter((item) =>
    item.expense_type_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Create Expense Type</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="expense_type_name" className="text-blue-900 font-semibold">Expense Type <span className="text-red-500">*</span></Label>
                <Input
                  id="expense_type_name"
                  {...form.register("expense_type_name")}
                  className="bg-white border-blue-200 focus:border-blue-500"
                  placeholder="Expense Type Name"
                />
                {form.formState.errors.expense_type_name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.expense_type_name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-blue-900 font-semibold">Effect For</Label>
                <RadioGroup
                  onValueChange={(val) => form.setValue("effect_for", val as "Employee" | "Profit")}
                  defaultValue={form.getValues("effect_for")}
                  value={form.watch("effect_for")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Employee" id="r1" />
                    <Label htmlFor="r1">Employee</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Profit" id="r2" />
                    <Label htmlFor="r2">Profit</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="options" className="text-blue-900 font-semibold">Options</Label>
                <Select
                  onValueChange={(value) => form.setValue("options", value)}
                  defaultValue={form.getValues("options")}
                  value={form.watch("options")}
                >
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500" aria-label="Select Option">
                    <SelectValue placeholder="Select Option" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.watch("effect_for") === 'Employee' ? (
                      <>
                        <SelectItem value="Benefit">Benefit</SelectItem>
                        <SelectItem value="Loan">Loan</SelectItem>
                        <SelectItem value="Penality">Penality</SelectItem>
                        <SelectItem value="Salary">Salary</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="Income">Income</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-8 font-bold">
                {editingId ? "UPDATE" : "SAVE"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex justify-between items-center bg-white border-b">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Show:</Label>
              <Select value={String(showCount)} onValueChange={(v) => setShowCount(Number(v))}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                  <SelectItem value="999999">All</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="flex items-center gap-4">
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
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">Expense Type</TableHead>
                  <TableHead className="font-bold text-gray-700">Effect For</TableHead>
                  <TableHead className="font-bold text-gray-700">Options</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No expense types found. Add your first one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleEdit(item)}
                            aria-label="Edit expense type"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            onClick={() => setDeleteConfirm(item.id)}
                            aria-label="Delete expense type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => toggleStatus(item.id, item.is_active ?? true)}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${(item.is_active ?? true)
                                ? 'bg-blue-600 focus:ring-blue-500'
                                : 'bg-gray-300 focus:ring-gray-400'
                              }`}
                            role="switch"
                            aria-checked={item.is_active ?? true}
                          >
                            <span
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${(item.is_active ?? true) ? 'translate-x-9' : 'translate-x-1'
                                }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${(item.is_active ?? true)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {(item.is_active ?? true) ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.expense_type_name}</TableCell>
                      <TableCell>{item.effect_for}</TableCell>
                      <TableCell>{item.options || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        Created: Super Admin {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing 1 to {filteredTypes.length} of {filteredTypes.length} entries</span>
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
              This action will delete this expense type. This action cannot be undone.
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
};

export default ExpenseTypes;
