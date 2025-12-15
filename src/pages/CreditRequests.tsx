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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function CreditRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [fuelProducts, setFuelProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const today = format(new Date(), "yyyy-MM-dd");
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [status, setStatus] = useState<string>("All");
  const [customerId, setCustomerId] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [formData, setFormData] = useState({
    credit_customer_id: "",
    fuel_product_id: "",
    request_date: format(new Date(), "yyyy-MM-dd"),
    ordered_quantity: "",
    notes: "",
  });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (status && status !== 'All') params.append('status', status);
      if (customerId && customerId !== 'ALL') params.append('customer_id', customerId);
      if (search.trim()) params.append('search', search.trim());
      
      const response = await fetch(`/api/credit-requests?${params.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.ok) {
        setRequests(result.rows || []);
      } else {
        setError(result.error || 'Failed to load credit requests');
        setRequests([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load credit requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, status, customerId, search]);

  useEffect(() => {
    fetchRequests();
    fetchCustomers();
    fetchFuelProducts();
  }, [fetchRequests]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchRequests();
    }
  }, [fromDate, toDate, status, customerId, search, fetchRequests]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/credit-customers', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setCustomers(result.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const exportCsv = () => {
    const header = ["Date", "Customer", "Fuel", "Quantity(L)", "Status", "Notes"];
    const rows = requests.map((r) => [
      format(new Date(r.request_date), "yyyy-MM-dd"),
      r.credit_customers?.organization_name || "",
      r.fuel_products?.product_name || "",
      r.ordered_quantity ?? "",
      r.status,
      (r.notes || "").replaceAll(",", " "),
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-requests_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchFuelProducts = async () => {
    try {
      const response = await fetch('/api/fuel-products', {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.ok) {
        setFuelProducts(result.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch fuel products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      toast({ 
        variant: "destructive", 
        title: "Request Timeout", 
        description: "The request timed out. Please try again or restart the server." 
      });
    }, 15000); // 15 second timeout
    
    try {
      const response = await fetch('/api/credit-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          credit_customer_id: formData.credit_customer_id,
          fuel_product_id: formData.fuel_product_id || null,
          request_date: formData.request_date,
          ordered_quantity: formData.ordered_quantity ? parseFloat(formData.ordered_quantity) : null,
          notes: formData.notes,
          status: "Pending",
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Credit request created successfully" });
        setShowForm(false);
        setFormData({
          credit_customer_id: "",
          fuel_product_id: "",
          request_date: format(new Date(), "yyyy-MM-dd"),
          ordered_quantity: "",
          notes: "",
        });
        fetchRequests();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to create request" });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        toast({ 
          variant: "destructive", 
          title: "Request Timeout", 
          description: "The request timed out. Please try again or restart the server." 
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create request" });
      }
    }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/credit-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: `Request ${status.toLowerCase()}` });
        fetchRequests();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update status" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update status" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Requests</h1>
          <p className="text-muted-foreground">Manage credit extension requests from customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-auto" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Customer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Customers</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.organization_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} className="w-[200px]" />
          <Button variant="secondary" onClick={exportCsv}>Export</Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Credit Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={formData.credit_customer_id}
                    onValueChange={(value) => setFormData({ ...formData, credit_customer_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.organization_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Request Date *</Label>
                  <Input
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Product</Label>
                  <Select
                    value={formData.fuel_product_id}
                    onValueChange={(value) => setFormData({ ...formData, fuel_product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ordered Quantity (Liters)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.ordered_quantity}
                    onChange={(e) => setFormData({ ...formData, ordered_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Request details, reason for credit extension, etc."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Request</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Credit Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive p-4">{error}</div>
          ) : loading ? (
            <div className="text-sm text-muted-foreground p-4">Loading...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Fuel Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{format(new Date(request.request_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.credit_customers?.organization_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Limit: ₹{request.credit_customers?.credit_limit} | 
                        Balance: ₹{request.credit_customers?.current_balance}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{request.fuel_products?.product_name || "-"}</TableCell>
                  <TableCell>{request.ordered_quantity ? `${request.ordered_quantity} L` : "-"}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {request.notes || "-"}
                  </TableCell>
                  <TableCell>
                    {request.status === "Pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, "Approved")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, "Rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No credit requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
