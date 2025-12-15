import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function GenerateSaleInvoice() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch credit sales
      const { data: creditSales } = await supabase
        .from("credit_sales")
        .select(`
          id,
          sale_date,
          invoice_no,
          total_amount,
          quantity,
          price_per_unit,
          credit_customers(organization_name),
          fuel_products(product_name),
          employees(employee_name)
        `)
        .order("sale_date", { ascending: false });

      // Fetch lubricant sales
      const { data: lubricantSales } = await supabase
        .from("lub_sales")
        .select(`
          id,
          sale_date,
          invoice_no,
          total_amount,
          quantity,
          price_per_unit,
          customer_name,
          lubricants(lubricant_name),
          employees(employee_name)
        `)
        .order("sale_date", { ascending: false });

      // Combine all transactions
      const allTransactions = [
        ...(creditSales || []).map((sale: any) => ({
          id: sale.id,
          date: sale.sale_date,
          transaction_type: "Credit Sale",
          org_cust: sale.credit_customers?.organization_name || "Unknown",
          vehicle_no: "-",
          product: sale.fuel_products?.product_name || "Unknown",
          quantity: sale.quantity || 0,
          price: sale.price_per_unit || 0,
          cost: sale.total_amount || 0,
          discount: 0,
          misc_charges: 0,
          emp_name: sale.employees?.employee_name || "Unknown",
          type: "credit_sale"
        })),
        ...(lubricantSales || []).map((sale: any) => ({
          id: sale.id,
          date: sale.sale_date,
          transaction_type: "Lubricants",
          org_cust: sale.customer_name || "Unknown",
          vehicle_no: "-",
          product: sale.lubricants?.lubricant_name || "Unknown",
          quantity: sale.quantity || 0,
          price: sale.price_per_unit || 0,
          cost: sale.total_amount || 0,
          discount: 0,
          misc_charges: 0,
          emp_name: sale.employees?.employee_name || "Unknown",
          type: "lubricant_sale"
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t =>
    t.transaction_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.org_cust?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.emp_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewAllInvoices = () => {
    navigate("/generated-invoices");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Generate Bill</span></div>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="outline">Generate Bill / Invoice</Button>
              <Button variant="outline">Print</Button>
              <Button variant="outline" onClick={handleViewAllInvoices}>→ Go To Records</Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input 
                placeholder="Search transactions..." 
                className="w-56" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Org/Cust</TableHead>
                <TableHead>Vehicle No</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Misc. Charges</TableHead>
                <TableHead>Emp Name</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground">Loading transactions...</TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground">No transactions found</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, idx) => (
                  <TableRow key={`${transaction.type}-${transaction.id}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{transaction.transaction_type}</TableCell>
                    <TableCell>{transaction.org_cust}</TableCell>
                    <TableCell>{transaction.vehicle_no}</TableCell>
                    <TableCell>{transaction.product}</TableCell>
                    <TableCell>{Number(transaction.quantity).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(transaction.price).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(transaction.cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>₹{Number(transaction.discount).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(transaction.misc_charges).toFixed(2)}</TableCell>
                    <TableCell>{transaction.emp_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" title="Print">
                          🖨️
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete">
                          🗑️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
