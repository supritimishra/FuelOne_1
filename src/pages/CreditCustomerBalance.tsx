import React, { useMemo, useState } from "react";
import { Download, Filter, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function CreditCustomerBalance() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState("");
  const [onlyDue, setOnlyDue] = useState(true);
  const [sortBy, setSortBy] = useState("closing"); // "closing" | "name"

  // Customers + closing balances
  const customersQuery = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const r = await fetch("/api/credit-customers", { credentials: "include" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Failed to load credit customers");
      return j.rows || [];
    },
  });

  // Combined statement for the selected day (credit + lub credit + recoveries)
  const statementQuery = useQuery({
    queryKey: ["/api/reports/customer-account-statement", date],
    queryFn: async () => {
      const url = `/api/reports/customer-account-statement?from=${date}&to=${date}&all=true`;
      const r = await fetch(url, { credentials: "include" });
      const j = await r.json().catch(() => null);
      return j?.rows || [];
    },
  });

  const { rows, creditMap, recoveryMap } = useMemo(() => {
    const customers = customersQuery.data || [];
    const rows = customers.map((c: any) => {
      const name = c.organization_name || c.name || c.customer_name || "Unknown";
      return {
        id: c.id || name,
        name,
        closing: Number(c.current_balance || 0),
        opening: 0,
        creditToday: 0,
        recoveryToday: 0,
      };
    });

    const creditMap = new Map<string, number>();
    const recoveryMap = new Map<string, number>();
    const stmt = statementQuery.data || [];
    for (const r of stmt) {
      const name = r.organization_name || r.customer_name || r.customer || r.name || "";
      if (!name) continue;
      const amount = Number(r.total_amount ?? r.amount ?? 0);
      // Heuristic: recoveries often have recovery_date; sales have sale_date
      const isRecovery = Boolean(r.recovery_date) || String(r.type || "").toLowerCase().includes("recovery");
      if (isRecovery) {
        recoveryMap.set(name, (recoveryMap.get(name) || 0) + amount);
      } else {
        creditMap.set(name, (creditMap.get(name) || 0) + amount);
      }
    }

    // Merge into rows and compute opening: closing - credit + recovery
    for (const row of rows) {
      const c = creditMap.get(row.name) || 0;
      const rv = recoveryMap.get(row.name) || 0;
      row.creditToday = c;
      row.recoveryToday = rv;
      row.opening = row.closing - c + rv;
    }

    // Filter/sort
    let filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
    if (onlyDue) filtered = filtered.filter((r) => (r.closing || 0) > 0);
    const sorted = [...filtered].sort((a, b) => (sortBy === "name" ? a.name.localeCompare(b.name) : (b.closing || 0) - (a.closing || 0)));

    return { rows: sorted, creditMap, recoveryMap };
  }, [customersQuery.data, statementQuery.data, q, onlyDue, sortBy]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.opening += Number(r.opening || 0);
        acc.credit += Number(r.creditToday || 0);
        acc.recovery += Number(r.recoveryToday || 0);
        acc.closing += Number(r.closing || 0);
        return acc;
      },
      { opening: 0, credit: 0, recovery: 0, closing: 0 }
    );
  }, [rows]);

  function downloadCSV() {
    const header = ["Customer", "Opening Due", "Credit Today", "Recovery Today", "Closing Due"];
    const body = rows.map((r) => [r.name, r.opening, r.creditToday, r.recoveryToday, r.closing]);
    const csv = [header, ...body].map((line) => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-balance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Credit Customer Balance (Running Ledger)</h2>
        <div className="flex gap-2">
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={downloadCSV} className="inline-flex items-center gap-1 border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border p-3">
          <div className="text-sm text-gray-500">Opening Due</div>
          <div className="text-2xl font-bold">{inr(totals.opening)}</div>
        </div>
        <div className="rounded-2xl border p-3">
          <div className="text-sm text-gray-500">Credit Today</div>
          <div className="text-2xl font-bold text-blue-700">{inr(totals.credit)}</div>
        </div>
        <div className="rounded-2xl border p-3">
          <div className="text-sm text-gray-500">Recovery Today</div>
          <div className="text-2xl font-bold text-green-700">{inr(totals.recovery)}</div>
        </div>
        <div className="rounded-2xl border p-3">
          <div className="text-sm text-gray-500">Closing Due</div>
          <div className="text-2xl font-bold">{inr(totals.closing)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
          <input
            placeholder="Search customer"
            className="pl-7 pr-3 py-2 border rounded w-64 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <label className="inline-flex items-center gap-2 border rounded px-3 py-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} />
          Show only due &gt; 0
        </label>
        <div className="inline-flex items-center gap-2 border rounded px-3 py-2 text-sm">
          <Filter className="w-4 h-4" />
          <select className="outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="closing">Sort: Highest Due</option>
            <option value="name">Sort: Name (A→Z)</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 w-1/3">Customer</th>
              <th className="text-right p-2">Opening Due</th>
              <th className="text-right p-2">Credit Today</th>
              <th className="text-right p-2">Recovery Today</th>
              <th className="text-right p-2">Closing Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2 text-right">{inr(r.opening)}</td>
                <td className="p-2 text-right text-blue-700">{inr(r.creditToday)}</td>
                <td className="p-2 text-right text-green-700">{inr(r.recoveryToday)}</td>
                <td className="p-2 text-right font-semibold">{inr(r.closing)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-500" colSpan={5}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t">
              <td className="p-2 font-semibold">Total</td>
              <td className="p-2 text-right font-semibold">{inr(totals.opening)}</td>
              <td className="p-2 text-right font-semibold">{inr(totals.credit)}</td>
              <td className="p-2 text-right font-semibold">{inr(totals.recovery)}</td>
              <td className="p-2 text-right font-bold">{inr(totals.closing)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Tip: “Closing Due = Opening Due + Credit Today − Recovery Today”. Export CSV to share on WhatsApp.
      </p>
    </div>
  );
}


