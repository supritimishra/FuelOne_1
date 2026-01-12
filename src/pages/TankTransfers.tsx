import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

export default function TankTransfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [date, setDate] = useState<string>(today);
  const [fromTankId, setFromTankId] = useState<string>("");
  const [toTankId, setToTankId] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch tanks data using backend API
  const { data: tanks = [], refetch: refetchTanks } = useQuery({
    queryKey: ["/api/tanks-list"],
    queryFn: async () => {
      const response = await fetch('/api/tanks-list');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch tanks');
      return result.rows || [];
    },
  });

  // Tank transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (transferData: { fromTankId: string; toTankId: string; amount: number; date: string }) => {
      const response = await fetch('/api/tank-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to transfer fuel');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Fuel transfer completed successfully" });
      setFromTankId("");
      setToTankId("");
      setQty("");
      queryClient.invalidateQueries({ queryKey: ["/api/tanks-list"] });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "Tank Transfer");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    },
  });

  const onTransfer = async () => {
    const amount = parseFloat(qty || "0");
    if (!fromTankId || !toTankId || fromTankId === toTankId || isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid input", description: "Select different tanks and a positive quantity" });
      return;
    }
    
    const from = tanks.find((t) => t.id === fromTankId);
    if (!from) return;
    if (Number(from.current_stock || 0) < amount) {
      toast({ variant: "destructive", title: "Insufficient stock in source tank" });
      return;
    }

    transferMutation.mutate({
      fromTankId,
      toTankId,
      amount,
      date
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tank Transfers</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Fuel Between Tanks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">From Tank</label>
              <Select value={fromTankId} onValueChange={setFromTankId}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select Tank" /></SelectTrigger>
                <SelectContent>
                  {tanks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{`Tank ${t.tank_number} (${t.fuel_products?.product_name || '-'})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">To Tank</label>
              <Select value={toTankId} onValueChange={setToTankId}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select Tank" /></SelectTrigger>
                <SelectContent>
                  {tanks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{`Tank ${t.tank_number} (${t.fuel_products?.product_name || '-'})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Quantity (L)</label>
              <Input type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} className="w-[160px]" />
            </div>
            <Button onClick={onTransfer} disabled={loading}>{loading ? "Transferring..." : "Transfer"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tank Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Tank</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-right p-2">Current Stock (L)</th>
                </tr>
              </thead>
              <tbody>
                {tanks.map((t: any) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-2">Tank {t.tank_number}</td>
                    <td className="p-2">{t.fuel_products?.product_name || '-'}</td>
                    <td className="p-2 text-right">{Number(t.current_stock || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
