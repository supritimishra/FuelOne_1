import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function SwipeUI() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [employee, setEmployee] = useState("");
  const [swipeType, setSwipeType] = useState("");
  const [swipeMode, setSwipeMode] = useState("");
  const [batchNo, setBatchNo] = useState<string>("0");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch swipe transactions data
  const { data: swipeTransactionsData, refetch: refetchSwipeTransactions } = useQuery({
    queryKey: ["/api/swipe-sales"],
    queryFn: async () => {
      const response = await fetch('/api/swipe-sales');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch swipe sales');
      return result.rows || [];
    },
  });

  // Fetch employees for dropdown (use UUID ids so saves succeed)
  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to fetch employees');
      return json.rows || [];
    }
  });

  // Load swipe modes/types for auto-fill from API (fallback to defaults)
  const { data: swipeModes } = useQuery({
    queryKey: ["/api/swipe-modes"],
    queryFn: async () => {
      const res = await fetch('/api/swipe-modes');
      const json = await res.json();
      return json.rows || [];
    }
  });
  const { data: swipeTypes } = useQuery({
    queryKey: ["/api/swipe-types"],
    queryFn: async () => {
      const res = await fetch('/api/swipe-types');
      const json = await res.json();
      return json.rows || [];
    }
  });

  const rows = swipeTransactionsData || [];

  const onConfirm = async () => {
    if (!employee || !swipeType || !amount) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }

    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/swipe-sales/${editingId}` : '/api/swipe-sales';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_date: date,
          sale_date: date,
          shift,
          employee_id: employee || null,
          swipe_type: swipeType,
          swipe_mode: swipeMode || null,
          batch_number: batchNo || null,
          amount: amount ? Number(amount) : null,
          note,
        })
      });

      const result = await response.json();
      if (!result.ok) {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: isEdit ? "Updated successfully" : "Saved successfully" });
      setBatchNo("0");
      setAmount("");
      setNote("");
      setEditingId(null);
      refetchSwipeTransactions(); // Refresh the table data
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Swipe</span></div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Swipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <span className="text-white font-medium">Choose Date</span>
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => document.getElementById('sw_date')?.showPicker()}
              >
                {date || 'Date'}
              </button>
              <input
                id="sw_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="hidden"
              />
            </div>
            <div className="h-10 col-span-3 px-3 flex items-center rounded-md bg-white text-black">Date</div>
            <div className="col-span-4">
              <div className="flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift === 'S-1'} onChange={() => setShift('S-1')} /> S-1</label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift === 'S-2'} onChange={() => setShift('S-2')} /> S-2</label>
              </div>
            </div>
            <div className="h-10 col-span-3 px-3 flex items-center rounded-md bg-white text-black">Total Value</div>
          </div>

          {/* Auto-fill */}
          <div className="rounded-lg border border-white/40 bg-white/10 p-4">
            <div className="text-sm opacity-90 mb-3">AUTO-FILL</div>
            <div className="grid grid-cols-2 gap-4">
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="choose Employee" /></SelectTrigger>
                <SelectContent>
                  {(employees || []).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={swipeType} onValueChange={setSwipeType}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Swipe" /></SelectTrigger>
                <SelectContent>
                  {(swipeTypes && swipeTypes.length ? swipeTypes : ["account pay", "BANK", "CCMS", "ICICI CARD", "ICICI SCAN", "ICICI SWIPE", "phone pe"]).map((t: string) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-3">
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Employee" /></SelectTrigger>
                <SelectContent>
                  {(employees || []).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Select value={swipeMode} onValueChange={setSwipeMode}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Swipe Mode" /></SelectTrigger>
                <SelectContent>
                  {(swipeModes && swipeModes.length ? swipeModes : ["account pay", "BANK", "CCMS", "ICICI CARD", "ICICI SCAN", "ICICI SWIPE", "phone pe"]).map((m: string) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input className="bg-white text-black col-span-2" placeholder="0" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="col-span-3 flex items-center gap-2">
              <span>Note</span>
              <Button size="sm" variant="secondary" className="text-black">UPLOAD</Button>
              <Input className="bg-white text-black flex-1" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" variant="secondary" className="text-black">+</Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={onConfirm} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">{editingId ? 'SAVE' : 'CONFIRM'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-6 gap-4">
            <div className="flex items-center gap-2"><span>Search From</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="flex items-center gap-2"><span>To</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="flex items-center gap-2"><span>Swipe Mode</span>
              <Select>
                <SelectTrigger className="w-56"><SelectValue placeholder="Choose Swipe" /></SelectTrigger>
                <SelectContent>
                  {(swipeModes && swipeModes.length ? swipeModes : ["account pay", "BANK", "CCMS", "ICICI CARD", "ICICI SCAN", "ICICI SWIPE", "phone pe"]).map((m: string) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 col-span-2" />
            <div className="flex items-center gap-2"><Button className="bg-orange-500 hover:bg-orange-600">Search</Button></div>
          </div>
        </CardContent>
      </Card>

      {/* Actions + Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="destructive">Delete</Button>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm">Copy</Button><Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button><Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button><Button variant="outline" size="sm">Print</Button><div className="flex items-center gap-2 ml-4"><span>Filter:</span><Input placeholder="Type to filter..." className="w-56" /></div></div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Swipe</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Batch No</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Picture</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any, idx: number) => (
                <TableRow key={r.id || idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{r.transaction_date ? new Date(r.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</TableCell>
                  <TableCell>{r.employee_name || '-'}</TableCell>
                  <TableCell>{r.shift || '-'}</TableCell>
                  <TableCell>{r.swipe_mode || '-'}</TableCell>
                  <TableCell>{Number(r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{r.batch_number || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-4 items-center justify-center">
                      <a
                        href={`#edit-${r.id}`}
                        onClick={(e) => { e.preventDefault(); setEditingId(r.id); setDate(r.transaction_date ? r.transaction_date.slice(0, 10) : new Date().toISOString().slice(0, 10)); setShift((r.shift === 'S-2' ? 'S-2' : 'S-1') as any); setEmployee(r.employee_id || ''); setSwipeType(r.swipe_type || ''); setSwipeMode(r.swipe_mode || ''); setBatchNo(r.batch_number || '0'); setAmount(String(r.amount || '')); setNote(r.note || r.notes || ''); }}
                        className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center"
                      >
                        <img src="https://ramkrishna.ymtsindia.in/assets/images/edit.png" alt="Edit" width={36} height={36} />
                      </a>
                      <a
                        href={`#delete-${r.id}`}
                        onClick={async (e) => { e.preventDefault(); if (!confirm('Delete this entry?')) return; await fetch(`/api/swipe-sales/${r.id}`, { method: 'DELETE' }); await refetchSwipeTransactions(); }}
                        className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center"
                      >
                        <img src="https://ramkrishna.ymtsindia.in/assets/images/delete.png" alt="Delete" width={36} height={36} />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>{r.note || r.notes || r.description || "-"}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
