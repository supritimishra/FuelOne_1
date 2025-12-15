import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function StockVariation() {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const { toast } = useToast();

  const { data: openingStockData, refetch, isFetching } = useQuery({
    queryKey: ["/api/opening-stock", fromDate, toDate],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (fromDate) p.append("from", fromDate);
      if (toDate) p.append("to", toDate);
      const r = await fetch(`/api/opening-stock?${p.toString()}`, { credentials: 'include' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Failed to fetch opening stock');
      return j.rows || [];
    },
    enabled: false // Disable auto-fetch on mount if desired, or keep default. User seems to want manual search.
    // Actually user flow implies "Search" triggers update. keeping default behavior is fine but let's
    // handle the button click explicitly.
  });

  const handleSearch = async () => {
    try {
      const result = await refetch();
      if (result.status === 'error') {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error?.message || "Failed to fetch stock data",
        });
      } else if (result.data) {
        if (result.data.length === 0) {
          toast({
            description: "No records found for the selected date range.",
          });
        } else {
          toast({
            description: `Found ${result.data.length} records.`,
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const rows = (openingStockData as any[]) || [];

  const totals = useMemo(() => {
    const sumBy = (predicate: (r: any) => boolean) => rows.filter(predicate)
      .reduce((acc: number, r: any) => acc + Number(r.opening_stock || 0), 0);
    return {
      ms: sumBy((r) => String(r.product || r.product_name || '').toLowerCase().includes('motor')),
      hsd: sumBy((r) => String(r.product || r.product_name || '').toLowerCase().includes('high')),
      xp: sumBy((r) => String(r.product || r.product_name || '').toLowerCase().includes('extra')),
    };
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Stock Variation</span></div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Variation</CardTitle>
            <Link to="/day-opening-stock"><Button variant="outline" className="bg-white">Stock Entry +</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 flex items-center gap-3">
              <span>Search From</span>
              <Input type="date" placeholder="Date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-span-5">
              <Input type="date" placeholder="Date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Button
                className="bg-orange-500 hover:bg-orange-600 w-full"
                onClick={handleSearch}
                disabled={isFetching}
              >
                {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-8">
        <div className="bg-indigo-900 text-white rounded-md text-center py-3 font-semibold">MS : {totals.ms.toLocaleString('en-IN', { minimumFractionDigits: 2 })}(Lt.)</div>
        <div className="bg-indigo-900 text-white rounded-md text-center py-3 font-semibold">HSD : {totals.hsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}(Lt.)</div>
        <div className="bg-indigo-900 text-white rounded-md text-center py-3 font-semibold">XP : {totals.xp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}(Lt.)</div>
      </div>
    </div>
  );
}


