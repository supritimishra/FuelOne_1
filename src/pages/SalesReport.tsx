import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Search, TrendingUp, DollarSign, CreditCard, Droplet } from "lucide-react";
import { format } from "date-fns";

interface SaleRecord {
  date: string;
  invoiceNo: string;
  customer: string;
  fuelType: string;
  quantity: number;
  rate: number;
  amount: number;
  paymentMode: string;
}

export default function SalesReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Fetch guest sales
      const guestResponse = await fetch('/api/guest-sales');
      const guestResult = await guestResponse.json();
      const guestSales = guestResult.ok ? guestResult.rows || [] : [];

      // Fetch credit sales
      const creditResponse = await fetch('/api/credit-sales');
      const creditResult = await creditResponse.json();
      const creditSales = creditResult.ok ? creditResult.rows || [] : [];

      const allSales: SaleRecord[] = [
        ...(guestSales || []).map((sale: any) => ({
          date: format(new Date(sale.sale_date), "yyyy-MM-dd"),
          invoiceNo: sale.invoice_no || "N/A",
          customer: "Guest Sale",
          fuelType: sale.fuel_products?.product_name || "Unknown",
          quantity: sale.quantity || 0,
          rate: sale.price_per_unit || 0,
          amount: sale.total_amount || 0,
          paymentMode: sale.payment_mode || "Cash"
        })),
        ...(creditSales || []).map((sale: any) => ({
          date: format(new Date(sale.sale_date), "yyyy-MM-dd"),
          invoiceNo: sale.invoice_no || "N/A",
          customer: sale.credit_customers?.organization_name || "Unknown",
          fuelType: sale.fuel_products?.product_name || "Unknown",
          quantity: sale.quantity || 0,
          rate: sale.price_per_unit || 0,
          amount: sale.total_amount || 0,
          paymentMode: "Credit"
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSalesData(allSales);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = salesData.filter(record => {
    const matchesSearch = 
      record.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDateFrom = !dateFrom || record.date >= dateFrom;
    const matchesDateTo = !dateTo || record.date <= dateTo;
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const totalSales = filteredData.reduce((sum, record) => sum + record.amount, 0);
  const totalQuantity = filteredData.reduce((sum, record) => sum + record.quantity, 0);
  const cashSales = filteredData.filter(r => r.paymentMode === "Cash").reduce((sum, r) => sum + r.amount, 0);
  const cardSales = filteredData.filter(r => r.paymentMode === "Card" || r.paymentMode === "UPI").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Sales Report</h1>
        <Button className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{filteredData.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toFixed(2)}L</div>
            <p className="text-xs text-muted-foreground">Across all fuel types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cashSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{totalSales > 0 ? ((cashSales/totalSales)*100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Digital Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cardSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{totalSales > 0 ? ((cardSales/totalSales)*100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Filter Sales</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer or invoice..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-8 w-[140px]"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    data-testid="input-date-from"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-8 w-[140px]"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    data-testid="input-date-to"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sales data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Quantity (L)</TableHead>
                  <TableHead>Rate (₹)</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell className="font-medium">{record.invoiceNo}</TableCell>
                    <TableCell>{record.customer}</TableCell>
                    <TableCell>{record.fuelType}</TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>₹{record.rate}</TableCell>
                    <TableCell className="font-semibold">₹{record.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.paymentMode === "Cash" ? "bg-blue-100 text-blue-700" :
                        record.paymentMode === "Credit" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {record.paymentMode}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No sales data found
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
