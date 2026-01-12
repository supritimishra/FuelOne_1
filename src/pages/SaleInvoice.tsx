import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { handleAPIError } from "@/lib/errorHandler";
import { useQuery } from "@tanstack/react-query";

export default function SaleInvoice() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("102.50");
  const [paymentMode, setPaymentMode] = useState("");
  const [selectedFuelProductId, setSelectedFuelProductId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Fetch fuel products
  const { data: fuelProducts } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  // Fetch credit customers
  const { data: creditCustomers } = useQuery({
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

  const handleViewAllInvoices = () => {
    navigate("/generated-invoices");
  };

  const handleGenerateInvoice = async () => {
    if (!customerName || !selectedFuelProductId || !quantity || !paymentMode) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      const totalAmount = parseFloat(quantity) * parseFloat(rate);

      // Save to credit_sales table using backend API
      const response = await fetch('/api/credit-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sale_date: new Date().toISOString().slice(0, 10),
          credit_customer_id: selectedCustomerId || '550e8400-e29b-41d4-a716-446655440000', // Use selected customer or default
          vehicle_number: vehicleNo,
          fuel_product_id: selectedFuelProductId, // Use actual fuel product ID
          quantity: parseFloat(quantity),
          price_per_unit: parseFloat(rate),
          total_amount: totalAmount,
          employee_id: null,
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        const errorInfo = handleAPIError(result, "Invoice Generation");
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Invoice Generated Successfully",
        description: `Invoice ${invoiceNumber} created for ${customerName}`,
      });

      // Reset form
      setCustomerName("");
      setVehicleNo("");
      setQuantity("");
      setFuelType("");
      setPaymentMode("");
      setSelectedFuelProductId("");
      setSelectedCustomerId("");
    } catch (error: any) {
      const errorInfo = handleAPIError(error, "Invoice Generation");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const totalAmount = quantity ? (parseFloat(quantity) * parseFloat(rate)).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Generate Sale Invoice</h1>
        <Button variant="outline" className="gap-2" onClick={handleViewAllInvoices}>
          <FileText className="h-4 w-4" />
          View All Invoices
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Select value={selectedCustomerId} onValueChange={(value) => {
                setSelectedCustomerId(value);
                const customer = creditCustomers?.find(c => c.id === value);
                setCustomerName(customer?.organization_name || "");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {creditCustomers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.organization_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNo">Vehicle Number</Label>
              <Input
                id="vehicleNo"
                placeholder="XX-00-XX-0000"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode *</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type *</Label>
              <Select value={selectedFuelProductId} onValueChange={(value) => {
                setSelectedFuelProductId(value);
                const product = fuelProducts?.find(p => p.id === value);
                setFuelType(product?.product_name || "");
                if (product?.current_rate) {
                  setRate(product.current_rate);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelProducts?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_name} ({product.short_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Liters) *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate per Liter (₹)</Label>
              <Input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Add any additional notes or comments..." rows={3} />
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
        <Button onClick={handleGenerateInvoice} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Invoice
        </Button>
      </div>
    </div>
  );
}
