import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { handleAPIError } from "@/lib/errorHandler";

const DEFAULT_TABLES = [
  "tanks",
  "fuel_products",
  "sale_entries",
  "guest_sales",
  "credit_sales",
  "lubricant_sales",
  "expenses",
  "recoveries",
  "vendor_invoices",
  "vendor_transactions",
  "employees",
  "attendance",
  "duty_shifts",
  "nozzles",
];

export default function BackupData() {
  const { toast } = useToast();
  const today = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [tables, setTables] = useState<string[]>(DEFAULT_TABLES);
  const [loading, setLoading] = useState(false);
  const [allTables, setAllTables] = useState<string[]>(DEFAULT_TABLES);

  useEffect(() => {
    // Try to read available tables from supabase typed schema if needed
    // For now we keep DEFAULT_TABLES and allow manual entry below
  }, []);

  const toggleTable = (t: string) => {
    setTables((prev) => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  };

  const toCsv = (rows: any[]): string => {
    if (!rows || rows.length === 0) return "";
    const headers = Array.from(new Set(rows.flatMap((r:any) => Object.keys(r))));
    const esc = (v:any) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      const needsQuote = /[",\n]/.test(s);
      return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(headers.map(h => esc((r as any)[h])).join(","));
    }
    return lines.join("\n");
  };

  const fetchAll = async () => {
    const out: Record<string, any[]> = {};
    for (const t of tables) {
      try {
        // Map table names to API endpoints
        const apiEndpoint = getApiEndpoint(t);
        const response = await fetch(`/api/${apiEndpoint}`);
        const result = await response.json();
        
        if (!result.ok) {
          const errorInfo = handleAPIError(result.error, `Table ${t}`);
          toast({ variant: "destructive", title: errorInfo.title, description: errorInfo.description });
          out[t] = [];
        } else {
          out[t] = result.rows || [];
        }
      } catch (error) {
        const errorInfo = handleAPIError(error, `Table ${t}`);
        toast({ variant: "destructive", title: errorInfo.title, description: errorInfo.description });
        out[t] = [];
      }
    }
    return out;
  };

  const getApiEndpoint = (tableName: string): string => {
    const endpointMap: Record<string, string> = {
      "tanks": "tanks-list",
      "fuel_products": "fuel-products",
      "sale_entries": "sale-entries",
      "guest_sales": "guest-sales",
      "credit_sales": "credit-sales",
      "lubricant_sales": "lubricant-sales",
      "expenses": "expenses",
      "recoveries": "recoveries",
      "vendor_invoices": "vendor-invoices",
      "vendor_transactions": "vendor-transactions",
      "employees": "employees",
      "attendance": "attendance",
      "duty_shifts": "duty-shifts",
      "nozzles": "nozzles-list",
    };
    return endpointMap[tableName] || tableName;
  };

  const exportJson = async () => {
    try {
      setLoading(true);
      const data = await fetchAll();
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup_${today}.json`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup JSON exported" });
    } finally {
      setLoading(false);
    }
  };

  const exportCsvZip = async () => {
    try {
      setLoading(true);
      const dataset = await fetchAll();
      // Build a simple multi-file download by opening multiple tabs if JSZip not available.
      // To avoid adding a new dependency, we generate one CSV at a time for selected tables.
      let exported = 0;
      for (const t of Object.keys(dataset)) {
        const csv = toCsv(dataset[t]);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${t}_${today}.csv`; a.click();
        URL.revokeObjectURL(url);
        exported++;
      }
      toast({ title: `Exported ${exported} CSV file(s)` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Backup Data</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select tables to export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allTables.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <Checkbox checked={tables.includes(t)} onCheckedChange={() => toggleTable(t)} />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Note: For large datasets the export runs table-by-table in the browser.
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={exportJson} disabled={loading}>{loading ? "Exporting..." : "Export as JSON"}</Button>
            <Button variant="secondary" onClick={exportCsvZip} disabled={loading}>{loading ? "Exporting..." : "Export each as CSV"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
