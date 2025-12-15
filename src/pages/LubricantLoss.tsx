import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv, toCsv } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface LubProduct { id: string; product_name?: string; lubricant_name?: string; name?: string; unit?: string }
interface LossRow { id: string; loss_date: string; lubricant_id: string; quantity: number; note: string | null }

export default function LubricantLoss() {
  const { toast } = useToast();
  const [pickerDate, setPickerDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [lossDate, setLossDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [product, setProduct] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // List state
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [rows, setRows] = useState<LossRow[]>([]);

  // Fetch lubricants using backend API
  const { data: lubricants = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["/api/lubricants"],
    queryFn: async () => {
      const response = await fetch('/api/lubricants', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch lubricants');
      return result.rows || [];
    },
  });

  const productNameById = useMemo(() => {
    const m = new Map<string, string>();
    lubricants.forEach(l => m.set(l.id, l.product_name || l.lubricant_name || l.name || (l as any).product_code || l.id));
    return m;
  }, [lubricants]);

  // Fetch lubricant losses using backend API
  const { data: losses = [], isLoading: loadingLosses, refetch: refetchLosses } = useQuery({
    queryKey: ["/api/lub-loss"],
    queryFn: async () => {
      const response = await fetch('/api/lub-loss', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch lubricant losses');
      return result.rows || [];
    },
  });

  // Update rows when losses data changes
  useEffect(() => {
    setRows(losses);
  }, [losses]);

  const handleSave = async () => {
    if (!product || !qty) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/lub-loss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lubricant_id: product,
          quantity: parseFloat(qty),
          loss_date: lossDate,
          note: note || null,
        }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to save lubricant loss');

      toast({
        title: "Success",
        description: "Lubricant loss recorded successfully",
      });

      // Reset form
      setProduct("");
      setQty("");
      setNote("");
      setLossDate(new Date().toISOString().slice(0,10));

      // Refresh data
      refetchLosses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lubricant loss",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/lub-loss/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to delete lubricant loss');

      toast({
        title: "Success",
        description: "Lubricant loss deleted successfully",
      });

      // Refresh data
      refetchLosses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lubricant loss",
        variant: "destructive",
      });
    }
  };

  const filteredRows = useMemo(() => {
    let filtered = rows;
    
    if (from) {
      filtered = filtered.filter(r => r.loss_date >= from);
    }
    if (to) {
      filtered = filtered.filter(r => r.loss_date <= to);
    }
    if (productFilter && productFilter !== "all") {
      filtered = filtered.filter(r => r.lubricant_id === productFilter);
    }
    if (filterText) {
      filtered = filtered.filter(r => 
        productNameById.get(r.lubricant_id)?.toLowerCase().includes(filterText.toLowerCase()) ||
        r.note?.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    
    return filtered;
  }, [rows, from, to, productFilter, filterText, productNameById]);

  const rowsCsv = filteredRows.map(r => ({
    Date: r.loss_date,
    Product: productNameById.get(r.lubricant_id) || r.lubricant_id,
    Quantity: r.quantity,
    Note: r.note || '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Add Product</span>
        <span>/</span>
        <span>Lubricant Loss</span>
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardHeader>
          <CardTitle className="text-white">Lubricant Loss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loss Date</label>
              <Input
                type="date"
                value={lossDate}
                onChange={(e) => setLossDate(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lubricant Product</label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Select lubricant" />
                </SelectTrigger>
                <SelectContent>
                  {lubricants.map((lub) => (
                    <SelectItem key={lub.id} value={lub.id}>
                      {lub.product_name || lub.lubricant_name || lub.name || lub.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity Lost</label>
              <Input
                type="number"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Enter quantity lost"
                className="bg-white text-black"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter notes"
                className="bg-white text-black"
              />
            </div>
          </div>
          <Button onClick={handleSave} className="bg-white text-blue-600 hover:bg-gray-100">
            Record Loss
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loss Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Filter</label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {lubricants.map((lub) => (
                      <SelectItem key={lub.id} value={lub.id}>
                        {lub.product_name || lub.lubricant_name || lub.name || lub.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Search products or notes"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  onClick={() => downloadCsv('lubricant-losses.csv', toCsv(rowsCsv))}
                  variant="outline"
                >
                  Export CSV
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sl.No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>User Log Details</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.loss_date}</TableCell>
                    <TableCell>{productNameById.get(row.lubricant_id) || row.lubricant_id}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No lubricant loss records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}