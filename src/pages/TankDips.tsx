import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Droplet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

export default function TankDips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [date, setDate] = useState<string>(today);
  const [productId, setProductId] = useState<string>("ALL");
  const [dipValues, setDipValues] = useState<Record<string, string>>({}); // tank_id -> dip (L)
  const [loading, setLoading] = useState(false);

  // Fetch fuel products data using backend API
  const { data: products = [] } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  // Fetch tanks data using backend API
  const { data: tanks = [] } = useQuery({
    queryKey: ["/api/tanks-list"],
    queryFn: async () => {
      const response = await fetch('/api/tanks-list');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch tanks');
      return result.rows || [];
    },
  });

  // Fetch nozzles data using backend API
  const { data: nozzles = [] } = useQuery({
    queryKey: ["/api/nozzles-list"],
    queryFn: async () => {
      const response = await fetch('/api/nozzles-list');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch nozzles');
      return result.rows || [];
    },
  });

  // Tank dip mutation
  const dipMutation = useMutation({
    mutationFn: async (dipData: { tank_id: string; dip_value: number; dip_date: string }) => {
      const response = await fetch('/api/tank-dips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dipData),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to record tank dip');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Tank dip recorded successfully" });
      setDipValues({});
      queryClient.invalidateQueries({ queryKey: ["/api/tanks-list"] });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "Tank Dip");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    },
  });

  const filteredTanks = (productId && productId !== "ALL") ? tanks.filter((t: any) => t.fuel_product_id === productId) : tanks;

  const onSave = async () => {
    const rows = filteredTanks
      .filter((t: any) => dipValues[t.id] && !Number.isNaN(parseFloat(dipValues[t.id])))
      .map((t: any) => ({
        tank_id: t.id,
        dip_value: parseFloat(dipValues[t.id] || "0"),
        dip_date: date,
      }));

    if (rows.length === 0) {
      toast({ variant: "destructive", title: "No data to save", description: "Please enter dip values for at least one tank" });
      return;
    }

    // Save each tank dip
    for (const row of rows) {
      dipMutation.mutate(row);
    }
  };

  const exportCsv = () => {
    const header = ["Date", "Tank", "Product", "Capacity (L)", "Current Stock (L)", "Dip (L)", "Variance (L)"];
    const body = filteredTanks.map((t: any) => {
      const dip = parseFloat(dipValues[t.id] || "0");
      const current = Number(t.current_stock || 0);
      const variance = dip - current;
      return [
        date,
        `Tank ${t.tank_number}`,
        t.fuel_products?.product_name || "",
        Number(t.capacity || 0),
        current,
        dip,
        variance,
      ];
    });
    const csv = [header, ...body].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tank-dips_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tank-wise Dip Entry</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              {products.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={exportCsv}>Export</Button>
          <Button onClick={onSave} disabled={loading}>{loading ? "Saving..." : "Save Dips"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Droplet className="h-4 w-4" /> Tank Dips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Capacity (L)</TableHead>
                  <TableHead>Current Stock (L)</TableHead>
                  <TableHead>Dip (L)</TableHead>
                  <TableHead>Variance (L)</TableHead>
                  <TableHead>Nozzles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTanks.map((t: any) => {
                  const dip = parseFloat(dipValues[t.id] || "0");
                  const current = Number(t.current_stock || 0);
                  const variance = dip - current;
                  const tankNozzles = nozzles.filter((n: any) => n.tank_id === t.id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">Tank {t.tank_number}</TableCell>
                      <TableCell>{t.fuel_products?.product_name || "-"}</TableCell>
                      <TableCell>{Number(t.capacity || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>{current.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={dipValues[t.id] || ""}
                          onChange={(e) => setDipValues(prev => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="0.00"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell className={variance < 0 ? "text-red-600" : variance > 0 ? "text-green-700" : ""}>
                        {variance.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tankNozzles.length > 0 ? tankNozzles.map((n: any) => `#${n.nozzle_number}`).join(", ") : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTanks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No tanks</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
