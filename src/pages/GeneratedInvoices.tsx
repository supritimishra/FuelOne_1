import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function GeneratedInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInvoices();
    }, 30000);

    // Refresh when user returns to the page
    const handleFocus = () => {
      fetchInvoices();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchInvoices();
    setLoading(false);
  };

  const fetchInvoices = async () => {
    try {
      console.log("Fetching invoices...");

      // Fetch vendor invoices
      const vendorResponse = await fetch('/api/vendor-invoices', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      let vendorInvoices = [];
      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        vendorInvoices = vendorData.rows || [];
        console.log("Vendor invoices fetched:", vendorInvoices.length);
      } else {
        console.error("Error fetching vendor invoices:", vendorResponse.status);
      }

      // Fetch credit sales (generated invoices)
      console.log("Fetching credit sales...");
      const creditSalesResponse = await fetch('/api/credit-sales', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      let creditSalesInvoices = [];
      if (creditSalesResponse.ok) {
        const creditSalesData = await creditSalesResponse.json();
        console.log("Credit sales raw data:", creditSalesData);
        creditSalesInvoices = creditSalesData.rows || [];
        console.log("Credit sales fetched:", creditSalesInvoices.length);
      } else {
        console.error("Error fetching credit sales:", creditSalesResponse.status, await creditSalesResponse.text());
      }

      // Combine and map to common format
      const allInvoices = [
        ...vendorInvoices.map((invoice: any) => ({
          id: invoice.id,
          reference_no: invoice.invoice_number,
          date: invoice.invoice_date,
          party_type: "Vendor",
          party_name: invoice.vendor_name || "Unknown",
          amount: Number(invoice.total_amount) || 0,
          type: "purchase"
        })),
        ...creditSalesInvoices.map((sale: any) => ({
          id: sale.id,
          reference_no: sale.bill_no || `SALE-${sale.id.slice(0, 8)}`, // Fallback if bill_no is missing
          date: sale.sale_date,
          party_type: "Customer",
          party_name: sale.organization_name || "Unknown Customer",
          amount: Number(sale.total_amount) || 0,
          type: "sale"
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log("All invoices combined:", allInvoices);
      setInvoices(allInvoices);
    } catch (error) {
      console.error("Error in fetchInvoices:", error);
      setInvoices([]);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.reference_no?.toLowerCase().includes(searchLower) ||
      invoice.party_name?.toLowerCase().includes(searchLower) ||
      invoice.party_type?.toLowerCase().includes(searchLower)
    );
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Generated Invoices</h1>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party Type</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.reference_no || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.date ? format(new Date(invoice.date), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{invoice.party_type}</TableCell>
                      <TableCell>{invoice.party_name}</TableCell>
                      <TableCell>₹{(invoice.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}