import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, DollarSign, CreditCard, Banknote } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { daySettlementSchema } from "@/lib/validations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

type DaySettlementForm = z.infer<typeof daySettlementSchema>;

export default function Settlement() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<DaySettlementForm>({
    resolver: zodResolver(daySettlementSchema),
    defaultValues: {
      opening_balance: 0,
      meter_sale: 0,
      lubricant_sale: 0,
      credit_amount: 0,
      total_sale: 0,
      expenses: 0,
      closing_balance: 0,
      shortage: 0,
      notes: "",
    }
  });

  // Fetch sales data for selected date
  const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ["/api/settlement-sales", selectedDate],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      try {
      // Get guest sales
      const guestResponse = await fetch('/api/guest-sales', { credentials: 'include', signal: controller.signal });
      const guestResult = await guestResponse.json();
      const guestSales = (guestResult.ok ? guestResult.rows : [])
        .filter((s: any) => s.sale_date === selectedDate);
      
      // Get swipe transactions
      const swipeResponse = await fetch('/api/swipe-sales', { credentials: 'include', signal: controller.signal });
      const swipeResult = await swipeResponse.json();
      const swipeSales = (swipeResult.ok ? swipeResult.rows : [])
        .filter((s: any) => s.transaction_date === selectedDate);
      
      // Get credit sales
      const creditResponse = await fetch('/api/credit-sales', { credentials: 'include', signal: controller.signal });
      const creditResult = await creditResponse.json();
      const creditSales = (creditResult.ok ? creditResult.rows : [])
        .filter((s: any) => s.sale_date === selectedDate);
      
      // Get lubricant sales
      const lubResponse = await fetch('/api/lub-sales', { credentials: 'include', signal: controller.signal });
      const lubResult = await lubResponse.json();
      const lubricantSales = (lubResult.ok ? lubResult.rows : [])
        .filter((s: any) => s.sale_date === selectedDate);
      
      const cashSales = guestSales.filter((s: any) => s.payment_mode === "Cash")
        .reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0;
      
      const cardSales = guestSales.filter((s: any) => s.payment_mode === "Card")
        .reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0;
      
      const upiSales = guestSales.filter((s: any) => s.payment_mode === "UPI")
        .reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0;
      
      const swipeTotal = swipeSales.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0;
      
      const creditTotal = creditSales.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0;
      
      const lubricantTotal = lubricantSales.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0;
      
      const totalSales = cashSales + cardSales + upiSales + swipeTotal + creditTotal + lubricantTotal;
      
      return {
        cashSales,
        cardSales,
        upiSales: upiSales + swipeTotal,
        creditSales: creditTotal,
        lubricantSales: lubricantTotal,
        totalSales,
      };
      } finally { clearTimeout(timeoutId); }
    },
  });

  // Fetch expenses for selected date
  const { data: expensesData, isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ["/api/settlement-expenses", selectedDate],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      try {
      const response = await fetch('/api/expenses', { credentials: 'include', signal: controller.signal });
      const result = await response.json();
      
      if (!result.ok) throw new Error(result.error);
      
      const filteredExpenses = (result.rows || [])
        .filter((e: any) => e.expense_date === selectedDate);
      
      return filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;
      } finally { clearTimeout(timeoutId); }
    },
  });

  const closingBalance = watch("closing_balance");
  const expectedCash = (salesData?.cashSales || 0) - (expensesData || 0);
  const difference = closingBalance ? closingBalance - expectedCash : 0;

  // Create or update settlement mutation
  const saveSettlement = useMutation({
    mutationFn: async (formData: DaySettlementForm) => {
      const settlementData = {
        settlement_date: selectedDate,
        opening_balance: formData.opening_balance,
        meter_sale: salesData?.totalSales || 0,
        lubricant_sale: salesData?.lubricantSales || 0,
        credit_amount: salesData?.creditSales || 0,
        total_sale: salesData?.totalSales || 0,
        expenses: expensesData || 0,
        closing_balance: formData.closing_balance,
        shortage: difference,
        notes: formData.notes || null,
        created_by: null,
      };

      const isEdit = Boolean(editingId);
      const url = isEdit ? `/api/day-settlements/${editingId}` : '/api/day-settlements';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settlementData)
      });
      const result = await response.json();

      if (!result.ok) throw new Error(result.error || 'Failed to save settlement');
    },
    onSuccess: () => {
      toast({
        title: "Saved",
        description: "Settlement saved successfully",
      });
      reset();
      setEditingId(null);
      // Refresh recent settlements list immediately
      queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey?.[0] || "").includes("/api/day-settlements") });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DaySettlementForm) => {
    saveSettlement.mutate(data);
  };

  return (
    <div className="p-6 space-y-2">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Day Settlement</span></div>

      {/* Remove stats cards to match screenshot */}

      {/* Top blue gradient entry panel */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Settlement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(salesError || expensesError) && (
            <div className="p-3 rounded bg-red-600 text-white text-sm">
              <strong>Error:</strong> {String((salesError || expensesError) as any)}
            </div>
          )}
          {(salesLoading || expensesLoading) && (
            <div className="text-sm text-blue-100">Loading sales/expenses...</div>
          )}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4 flex items-center gap-3">
              <span className="text-white font-medium">Choose Date</span>
              <button 
                type="button" 
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => (document.getElementById('settlement_date_hidden') as HTMLInputElement | null)?.showPicker?.()}
              >
                {selectedDate || 'Date'}
              </button>
              <input 
                id="settlement_date_hidden" 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="hidden" 
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <Button type="button" className="bg-cyan-500 hover:bg-cyan-600 text-white">OK</Button>
            </div>
            {/* Right-side area intentionally left empty to match screenshot (no S-1/S-2) */}
            <div className="col-span-6" />
          </div>

          {/* Form fields in blue panel - simplified to match screenshot */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Row: Day Settlement with Cash (Others) + Day Opening Cash (Hand) */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <div className="text-white/90 mb-1">Day Settlement bal. Cash (Inhand)</div>
                <Input placeholder="Busi.Transaction balance" className="bg-white text-black" />
              </div>
              <div className="col-span-6">
                <div className="text-white/90 mb-1">Day Opening Cash(Inhand)</div>
                <Input type="number" step="0.01" placeholder="0" className="bg-white text-black" {...register("opening_balance", { valueAsNumber: true })} />
                {errors.opening_balance && (<p className="text-xs text-yellow-200 mt-1">{errors.opening_balance.message}</p>)}
              </div>
            </div>

            {/* Row: Balance cash Flow radios */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 md:col-span-6">
                <div className="text-white/90 mb-1">Balance cash Flow</div>
                <div className="flex items-center gap-6 rounded-md border border-white/40 px-4 py-2">
                  <label className="flex items-center gap-2"><input type="radio" name="bal_flow" defaultChecked /> In</label>
                  <label className="flex items-center gap-2"><input type="radio" name="bal_flow" /> Out</label>
                </div>
              </div>
            </div>

            {/* Row: Day Closing Cash + Note */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7 flex flex-col gap-2">
                <div className="text-white/90">Day Closing Bal. Cash(Inhand)</div>
                <Input type="number" step="0.01" placeholder="Day Closing Bal. Cash(Inhand)" className="bg-white text-black" {...register("closing_balance", { valueAsNumber: true })} />
                <Button type="button" variant="secondary" className="rounded-md bg-amber-400 text-black border-0">DENOMINATIONS</Button>
                {errors.closing_balance && (<p className="text-xs text-yellow-200">{errors.closing_balance.message}</p>)}
              </div>
              <div className="col-span-5">
                <div className="text-white/90 mb-1">Note</div>
                <Textarea rows={2} placeholder="Note" className="bg-white text-black" {...register("notes")} />
              </div>
            </div>

            {/* Upload row */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7">
                <div className="text-white/90 mb-1">Upload Slips <span className="text-xs">(Each file size should be below 5MB)</span></div>
                <div className="flex items-center gap-2">
                  <Input type="file" className="bg-white text-black" />
                  <Button type="button" variant="secondary" className="bg-white text-black">Browse</Button>
                </div>
              </div>
            </div>

            {/* Confirm */}
            <div className="flex justify-center">
              <Button type="submit" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8" disabled={saveSettlement.isPending}>
                {saveSettlement.isPending ? "Processing..." : (editingId ? "UPDATE" : "CONFIRM")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent settlements table with toolbar */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Button variant="destructive">Delete</Button><Button variant="outline">Direct Print</Button></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm">Copy</Button><Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button><Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button><Button variant="outline" size="sm">Print</Button></div>
          </div>
          <RecentSettlements 
            selectedDate={selectedDate}
            onEdit={(row:any) => {
              setEditingId(String(row.id));
              setSelectedDate(String(row.settlement_date).slice(0,10));
              reset({
                opening_balance: Number(row.opening_balance || 0),
                meter_sale: Number(row.meter_sale || 0),
                lubricant_sale: Number(row.lubricant_sale || 0),
                credit_amount: Number(row.credit_amount || 0),
                total_sale: Number(row.total_sale || 0),
                expenses: Number(row.expenses || 0),
                closing_balance: Number(row.closing_balance || 0),
                shortage: Number(row.shortage || 0),
                notes: row.notes || "",
              });
            }}
            onDeleted={() => queryClient.invalidateQueries({ queryKey: ["day-settlements"] })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentSettlements({ selectedDate, onEdit, onDeleted }: { selectedDate: string; onEdit: (row:any)=>void; onDeleted: ()=>void; }) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["/api/day-settlements"],
    queryFn: async () => {
      const response = await fetch('/api/day-settlements');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch settlements');
      return (result.rows || []).slice(0, 7);
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No settlements recorded.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-2 pr-3">S.No</th>
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">DayBusi CashIn Hand</th>
            <th className="py-2 pr-3">Open Balance</th>
            <th className="py-2 pr-3">Close Balance</th>
            <th className="py-2 pr-3">Note</th>
            <th className="py-2 pr-3">Action</th>
            <th className="py-2 pr-3">Settlement</th>
            <th className="py-2 pr-3">Pictures</th>
            <th className="py-2 pr-3">User</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, index: number) => (
            <React.Fragment key={row.id || `${row.settlement_date}-${index}`}>
              <tr className="border-b last:border-0">
                <td className="py-2 pr-3">{index + 1}</td>
                <td className="py-2 pr-3">{new Date(row.settlement_date).toLocaleDateString()}</td>
                <td className="py-2 pr-3">₹{(() => {
                  const total = Number(row.total_sale || 0);
                  const meterLub = Number(row.meter_sale || 0) + Number(row.lubricant_sale || 0);
                  const businessCash = total || meterLub || (Number(row.opening_balance || 0) + meterLub - Number(row.expenses || 0));
                  return Number(businessCash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                })()}</td>
                <td className="py-2 pr-3">₹{Number(row.opening_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="py-2 pr-3">₹{Number(row.closing_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="py-2 pr-3">{row.notes || ""}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Edit</Button>
                    <Button size="sm" variant="destructive" disabled={deletingId===String(row.id)} onClick={async ()=>{
                      if (!row.id) return;
                      if (!confirm('Delete this settlement?')) return;
                      try {
                        setDeletingId(String(row.id));
                        const r = await fetch(`/api/day-settlements/${row.id}`, { method: 'DELETE', credentials: 'include' });
                        const txt = await r.text();
                        let j: any = {}; try { j = JSON.parse(txt || '{}'); } catch {}
                        if (!r.ok || !j?.ok) throw new Error(j?.error || `Server error (${r.status})`);
                        queryClient.setQueryData(["/api/day-settlements"], (old: any) => {
                          const arr = Array.isArray(old) ? old : [];
                          return arr.filter((it:any) => String(it.id) !== String(row.id));
                        });
                        onDeleted();
                      } catch (e:any) {
                        alert(e?.message || 'Delete failed');
                      } finally { setDeletingId(null); }
                    }}>Delete</Button>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <button className="px-2 py-1 rounded bg-white text-black" onClick={() => setExpandedId(expandedId===String(row.id)?null:String(row.id))} title="View settlement details">{expandedId===String(row.id)?'▼':'▶'}</button>
                </td>
                <td className="py-2 pr-3">-</td>
                <td className="py-2 pr-3">{(() => {
                  const author = row.created_by || 'Super Admin';
                  const d = row.created_at ? new Date(row.created_at) : null;
                  const raw = d ? d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '';
                  const fmt = raw ? raw.split('/').join('-') : '';
                  return `Created: ${author}${fmt ? ' ' + fmt : ''}`;
                })()}</td>
              </tr>
              {expandedId===String(row.id) && (
                <tr className="bg-white">
                  <td colSpan={10} className="py-3 px-3">
                    <div className="text-black">
                      <div className="font-semibold mb-2">Settlement {new Date(row.settlement_date).toLocaleDateString()}</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1">
                        <div>Opening Handcash&nbsp; <span className="font-medium">₹{Number(row.opening_balance||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Meter Sale&nbsp; <span className="font-medium">₹{Number(row.meter_sale||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Lubricant Sale&nbsp; <span className="font-medium">₹{Number(row.lubricant_sale||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Credit Amount&nbsp; <span className="font-medium">₹{Number(row.credit_amount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Total Sale&nbsp; <span className="font-medium">₹{Number(row.total_sale||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Expenses&nbsp; <span className="font-medium">₹{Number(row.expenses||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Shortage/Excess&nbsp; <span className={`font-medium ${Number(row.shortage||0) < 0 ? 'text-red-600' : 'text-green-600'}`}>₹{Number(row.shortage||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                        <div>Day Closing Bal. cash&nbsp; <span className="font-medium">₹{Number(row.closing_balance||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
