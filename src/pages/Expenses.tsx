import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { handleAPIError, logError } from "@/lib/errorHandler";

const formSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  expense_type_id: z.string().uuid("Select a valid type"),
  flow_type: z.enum(["Inflow", "Outflow"]).default("Outflow"),
  payment_mode: z.enum(["Cash", "Bank", "UPI"]).default("Cash"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  shift: z.enum(["S-1", "S-2"]).optional(),
  employee_id: z.string().uuid().optional(),
  paid_to: z.string().optional(),
  effect_asset: z.enum(["Yes", "No"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Expenses() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);

  const { data: types } = useQuery({
    queryKey: ["/api/expense-types"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/expense-types', {
          credentials: 'include'
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || 'Failed to fetch expense types');
        return result.rows || [];
      } catch (error) {
        logError(error, 'Expense Types Fetch');
        throw error;
      }
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/employees', {
          credentials: 'include'
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
        return result.rows || [];
      } catch (error) {
        logError(error, 'Employees Fetch');
        throw error;
      }
    },
  });

  const { data: recentExpenses, isLoading: loadingList } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/expenses', {
          credentials: 'include'
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || 'Failed to fetch expenses');
        console.log('[EXPENSES][FRONTEND] Received expenses:', result.rows?.length || 0);
        if (result.rows && result.rows.length > 0) {
          console.log('[EXPENSES][FRONTEND] First row:', result.rows[0]);
        }
        return result.rows || [];
      } catch (error) {
        logError(error, 'Expenses Fetch');
        throw error;
      }
    },
  });

  const defaultDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [effectAsset, setEffectAsset] = useState<"Yes" | "No">("No");

  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expense_date: defaultDate,
      flow_type: "Outflow",
      payment_mode: "Cash",
      shift: "S-1",
      effect_asset: "No",
    },
  });

  useEffect(() => {
    setValue("expense_date", defaultDate);
  }, [defaultDate, setValue]);

  const onAddType = async () => {
    const name = newTypeName.trim();
    if (!name) {
      toast({ title: "Type name required", description: "Enter an expense type name.", variant: "destructive" });
      return;
    }
    setAddingType(true);
    
    try {
      const response = await fetch('/api/expense-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ expense_type_name: name })
      });
      const result = await response.json();
      setAddingType(false);

      if (!result.ok) {
        toast({ title: "Failed to add type", description: result.error, variant: "destructive" });
        return;
      }

      const data = result.row;
      toast({ title: "Expense type added", description: data.expense_name });
      setNewTypeName("");
      // refresh list and preselect the newly created type
      await qc.invalidateQueries({ queryKey: ["/api/expense-types"] });
      setValue("expense_type_id", data.id as any, { shouldValidate: true });
    } catch (error) {
      setAddingType(false);
      toast({ title: "Failed to add type", description: "An error occurred", variant: "destructive" });
    }
  };

  const onDeleteType = async (id: string, name: string) => {
    const ok = window.confirm(`Delete expense type "${name}"? This cannot be undone.`);
    if (!ok) return;
    
    try {
      const response = await fetch(`/api/expense-types/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();
      
      if (!result.ok) {
        // Most common: foreign key constraint when the type is already used in expenses
        toast({ title: "Delete failed", description: result.error, variant: "destructive" });
        return;
      }
      
      toast({ title: "Expense type deleted", description: name });
      await qc.invalidateQueries({ queryKey: ["/api/expense-types"] });
      // Clear selection if the deleted type was selected
      setValue("expense_type_id", undefined as any, { shouldValidate: true });
    } catch (error) {
      toast({ title: "Delete failed", description: "An error occurred", variant: "destructive" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    const amountNumber = Number(values.amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive amount", variant: "destructive" });
      return;
    }

    const payload = {
      expense_date: values.expense_date,
      expense_type_id: values.expense_type_id,
      flow_type: values.flow_type,
      payment_mode: values.payment_mode,
      amount: amountNumber,
      description: values.description || null,
      shift: shift,
      employee_id: values.employee_id || null,
      paid_to: values.paid_to || null,
      effect_asset: effectAsset,
    };
    console.log('[EXPENSES][FRONTEND] Sending payload:', payload);
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!result.ok) {
        const errorInfo = handleAPIError(result, 'Expense Creation');
        toast({ 
          title: errorInfo.title, 
          description: errorInfo.description, 
          variant: "destructive" 
        });
        return;
      }

      toast({ title: "Expense added" });
      setShift("S-1");
      setEffectAsset("No");
      reset({ expense_date: defaultDate, expense_type_id: undefined as any, flow_type: "Outflow", payment_mode: "Cash", amount: "", description: "", paid_to: "", employee_id: undefined as any });
      qc.invalidateQueries({ queryKey: ["/api/expenses"] });
    } catch (error) {
      logError(error, 'Expense Creation');
      const errorInfo = handleAPIError(error, 'Expense Creation');
      toast({ 
        title: errorInfo.title, 
        description: errorInfo.description, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Expenses</span></div>

      {/* Blue panel same-to-same */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader className="space-y-4">
          <CardTitle className="text-white">Expenses</CardTitle>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 h-10 bg-white/90 text-black rounded-md flex items-center px-3">Total Outflow</div>
            <div className="col-span-3 h-10 bg-white text-black rounded-md flex items-center px-3">Cash Out</div>
            <div className="col-span-3 h-10 bg-white/90 text-black rounded-md flex items-center px-3">Total Inflow</div>
            <div className="col-span-3 h-10 bg-white text-black rounded-md flex items-center px-3">Cash In</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row: Choose Date + Shift */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <span className="text-white font-medium">Choose Date</span>
              <button 
                type="button" 
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => document.getElementById('exp_date')?.showPicker()}
              >
                {watch("expense_date") || 'Date'}
              </button>
              <input 
                id="exp_date" 
                type="date" 
                className="hidden" 
                {...register("expense_date")} 
              />
            </div>
            <div className="h-10 col-span-3 px-3 flex items-center rounded-md bg-white text-black">Date</div>
            <div className="col-span-4">
              <div className="flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift==='S-1'} onChange={()=> setShift('S-1')} /> S-1</label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift==='S-2'} onChange={()=> setShift('S-2')} /> S-2</label>
              </div>
            </div>
            <div className="col-span-3" />
          </div>

          {/* Auto-Fill */}
          <div className="rounded-lg border border-white/40 bg-white/10 p-4">
            <div className="text-sm opacity-90 mb-3">AUTO-FILL</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-white text-sm">Employee</div>
                <Select value={watch("employee_id")} onValueChange={(v) => setValue("employee_id", v as any)}>
                  <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                  <SelectContent>
                    {employees?.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-white text-sm">Expenses Type</div>
                <Select value={watch("expense_type_id")} onValueChange={(v) => setValue("expense_type_id", v as any)}>
                  <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Type" /></SelectTrigger>
                  <SelectContent>
                    {types?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.expense_type_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Entry row: labeled fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Employee</div>
              <Select value={watch("employee_id")} onValueChange={(v) => setValue("employee_id", v as any)}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                <SelectContent>
                  {employees?.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Expenses Type</div>
              <Select value={watch("expense_type_id")} onValueChange={(v) => setValue("expense_type_id", v as any)}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Type" /></SelectTrigger>
                <SelectContent>
                  {types?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.expense_type_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expense_type_id && <p className="text-xs text-yellow-200 mt-1">{errors.expense_type_id.message}</p>}
            </div>
            <div className="col-span-1 space-y-2">
              <div className="text-white text-sm">Flow</div>
              <Select value={watch("flow_type") || "Outflow"} onValueChange={(v) => setValue("flow_type", v as any)}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Flow" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outflow">Outflow</SelectItem>
                  <SelectItem value="Inflow">Inflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-2">
              <div className="text-white text-sm">Mode</div>
              <Select value={watch("payment_mode") || "Cash"} onValueChange={(v) => setValue("payment_mode", v as any)}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-2">
              <div className="text-white text-sm">Effect Asset</div>
              <Select value={effectAsset} onValueChange={(v) => setEffectAsset(v as "Yes" | "No")}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Amount</div>
              <Input type="number" step="0.01" placeholder="0.00" className="bg-white text-black" {...register("amount")} />
              {errors.amount && <p className="text-xs text-yellow-200 mt-1">{errors.amount.message}</p>}
            </div>
            <div className="col-span-1 space-y-2">
              <div className="text-white text-sm">Paid To</div>
              <Input placeholder="Name" className="bg-white text-black" {...register("paid_to")} />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="text-white text-sm">Description</div>
              <Input placeholder="Note" className="bg-white text-black" {...register("description")} />
            </div>
            <div className="col-span-12 flex justify-center mt-2">
              <Button type="submit" disabled={isSubmitting} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">CONFIRM</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 flex items-center gap-2"><span>Search From</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="col-span-3 flex items-center gap-2"><span>To</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="col-span-3 flex items-center gap-2"><span>Flow Type</span><Select><SelectTrigger className="w-56"><SelectValue placeholder="Choose Flow"/></SelectTrigger><SelectContent><SelectItem value="Outflow">Outflow</SelectItem><SelectItem value="Inflow">Inflow</SelectItem></SelectContent></Select></div>
            <div className="col-span-3 flex items-center justify-end"><Button className="bg-orange-500 hover:bg-orange-600">Search</Button></div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar + Recent list */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Button variant="destructive">Delete</Button><Button variant="outline">Direct Print</Button></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm">Copy</Button><Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button><Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button><Button variant="outline" size="sm">Print</Button><div className="flex items-center gap-2 ml-4"><span>Filter:</span><Input placeholder="Type to filter..." className="w-56" /></div></div>
          </div>

          {loadingList ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentExpenses && recentExpenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Expenses Type</TableHead>
                  <TableHead>Flow</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid To</TableHead>
                  <TableHead>Effect Asset</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Picture</TableHead>
                  <TableHead>User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExpenses.map((e: any, idx: number) => {
                  console.log(`[EXPENSES][TABLE] Row ${idx + 1}:`, {
                    shift: e.shift,
                    employee_name: e.employee_name,
                    flow_type: e.flow_type,
                    payment_mode: e.payment_mode,
                    paid_to: e.paid_to,
                    effect_asset: e.effect_asset
                  });
                  return (
                  <TableRow key={e.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</TableCell>
                    <TableCell>{(e.shift && String(e.shift).trim() !== '') ? e.shift : '-'}</TableCell>
                    <TableCell>{(e.employee_name && String(e.employee_name).trim() !== '') ? e.employee_name : '-'}</TableCell>
                    <TableCell>{(e.expense_type && String(e.expense_type).trim() !== '') ? e.expense_type : '-'}</TableCell>
                    <TableCell>{(e.flow_type && String(e.flow_type).trim() !== '') ? e.flow_type : '-'}</TableCell>
                    <TableCell>{(e.payment_mode && String(e.payment_mode).trim() !== '') ? e.payment_mode : '-'}</TableCell>
                    <TableCell>{Number(e.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{(e.paid_to && String(e.paid_to).trim() !== '') ? e.paid_to : '-'}</TableCell>
                    <TableCell>{(e.effect_asset && String(e.effect_asset).trim() !== '') ? e.effect_asset : '-'}</TableCell>
                    <TableCell>{(e.description && String(e.description).trim() !== '') ? e.description : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 justify-center">
                        <a href={`#edit-${e.id}`} onClick={(ev)=> { ev.preventDefault(); /* TODO: implement edit */ }} className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
                          <img src="https://ramkrishna.ymtsindia.in/assets/images/edit.png" alt="Edit" width={28} height={28} />
                        </a>
                        <a href={`#delete-${e.id}`} onClick={async (ev)=> { ev.preventDefault(); if (!confirm('Delete this expense?')) return; const r = await fetch(`/api/expenses/${e.id}`, { method: 'DELETE' }); const j = await r.json(); if (!j.ok) { alert(j.error || 'Delete failed'); } else { await qc.invalidateQueries({ queryKey: ["/api/expenses"] }); } }} className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
                          <img src="https://ramkrishna.ymtsindia.in/assets/images/delete.png" alt="Delete" width={28} height={28} />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{e.created_at ? `Created: ${new Date(e.created_at).toLocaleString()}` : '-'}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No expenses yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
