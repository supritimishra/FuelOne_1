import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function CreditLimitReport() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch credit customers using backend API
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const response = await fetch('/api/credit-customers', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch credit customers');
      return result.rows || [];
    },
  });

  const filteredCustomers = customers.filter(customer =>
    customer.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.mobile_number?.includes(searchQuery)
  );

  const getUtilizationPercentage = (customer: any) => {
    if (!customer.credit_limit || customer.credit_limit === 0) return 0;
    return (customer.current_balance / customer.credit_limit) * 100;
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) return { label: "Critical", variant: "destructive" as const, icon: AlertTriangle };
    if (percentage >= 75) return { label: "High", variant: "secondary" as const, icon: AlertCircle };
    if (percentage >= 50) return { label: "Medium", variant: "default" as const, icon: AlertCircle };
    return { label: "Low", variant: "default" as const, icon: CheckCircle2 };
  };

  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const averageUtilization = totalCreditLimit > 0 ? (totalOutstanding / totalCreditLimit) * 100 : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Dashboard</span>
          <span>/</span>
          <span>Credit Limit Report</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading credit customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Credit Limit Report</span>
      </div>

      {/* Top sync strip */}
      <div className="flex items-center justify-between">
        <button className="px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">SYNC DATA TO COLLECTIONAPP</button>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select className="h-9 rounded-md border bg-background px-2 text-sm">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 rounded-md border">CSV</button>
              <button className="h-8 px-3 rounded-md border border-red-400 text-red-600">PDF</button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Input
                  placeholder="Type to filter..."
                  className="w-56"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sl.No</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Limit Fixed</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-center">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c: any, idx: number) => {
                const utilization = getUtilizationPercentage(c);
                const status = getUtilizationStatus(utilization);
                const StatusIcon = status.icon;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{c.organization_name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.mobile_number || '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(c.credit_limit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${c.current_balance > 0 ? 'text-destructive font-semibold' : ''}`}>
                      {Number(c.current_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant={status.variant} className="gap-1 px-2">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No credit customers found matching your filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
