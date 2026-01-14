import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function CreditRequests() {
  const { toast } = useToast();

  // State for Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);

  // State for Data
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State for Table Filter
  const [rowLimit, setRowLimit] = useState("10");
  const [tableSearch, setTableSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/credit-customers');
      const result = await response.json();
      if (result.success) {
        setCustomers(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load customers", error);
    }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (organization && organization !== 'all') params.append('organization', organization);

      const response = await fetch(`/api/credit-requests?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setRequests(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, organization, toast]);

  // Initial Load
  useEffect(() => {
    fetchCustomers();
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter(r => {
    if (!tableSearch) return true;
    const searchLower = tableSearch.toLowerCase();
    return (
      r.orgName?.toLowerCase().includes(searchLower) ||
      r.productName?.toLowerCase().includes(searchLower) ||
      r.vehicleNumber?.toLowerCase().includes(searchLower) ||
      r.status?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'approved') return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Approved</Badge>;
    if (s === 'rejected') return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Pending</Badge>;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center text-sm text-slate-500 mb-4">
        <span className="font-semibold text-slate-700">Dashboard</span>
        <span className="mx-2">›</span>
        <span>Credit Requests</span>
      </div>

      {/* Filter Section */}
      <Card className="rounded-lg shadow-sm border-slate-200 bg-white">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 border-slate-300 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</Label>
              <Select value={organization} onValueChange={setOrganization}>
                <SelectTrigger className="h-10 border-slate-300">
                  <SelectValue placeholder="choose Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.organizationName}>{c.organizationName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchRequests}
              className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Section */}
      <Card className="rounded-lg shadow-sm border-slate-200 bg-white">
        <CardContent className="p-0">
          {/* Table Controls */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Show:</span>
              <Select value={rowLimit} onValueChange={setRowLimit}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Filter:</span>
              <Input
                placeholder="Type to filter..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="h-8 w-[200px] bg-slate-50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-16 font-bold text-slate-700">S.no</TableHead>
                  <TableHead className="w-24 font-bold text-slate-700 text-center">Action</TableHead>
                  <TableHead className="w-28 font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Request Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Org/Cust.</TableHead>
                  <TableHead className="font-bold text-slate-700">Vehicle No</TableHead>
                  <TableHead className="font-bold text-slate-700">Product</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Ordered Unit</TableHead>
                  <TableHead className="font-bold text-slate-700">Ordered Type</TableHead>
                  <TableHead className="font-bold text-slate-700">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.slice(0, Number(rowLimit)).map((row, index) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-600">{index + 1}</TableCell>
                      <TableCell className="text-center">
                        {/* Action Placeholder - Screenshot implies buttons e.g. Edit/View */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Menu</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                        </Button>
                      </TableCell>
                      <TableCell>{getStatusBadge(row.status)}</TableCell>
                      <TableCell className="text-slate-600">{format(new Date(row.requestDate), 'dd-MMM-yyyy')}</TableCell>
                      <TableCell className="font-medium text-slate-700">{row.orgName}</TableCell>
                      <TableCell className="text-slate-600">{row.vehicleNumber}</TableCell>
                      <TableCell className="text-slate-600">{row.productName}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700">{row.orderedUnit}</TableCell>
                      <TableCell className="text-slate-600">{row.orderedType}</TableCell>
                      <TableCell className="text-slate-500 text-xs max-w-[200px] truncate" title={row.description}>{row.description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-slate-400">
                      No data available in table
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
            <span>Showing {filteredRequests.length > 0 ? 1 : 0} to {Math.min(filteredRequests.length, Number(rowLimit))} of {filteredRequests.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">‹</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-slate-100 font-bold border-slate-300 text-slate-700">1</Button>
              <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">›</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
