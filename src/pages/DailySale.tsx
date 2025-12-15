import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";
import { validateFormData } from "@/lib/validation";

export default function DailySale() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    sale_date: format(new Date(), "yyyy-MM-dd"),
    shift_id: "",
    employee_id: "",
    nozzle_id: "",
    fuel_product_id: "",
    opening_reading: "",
    closing_reading: "",
    price_per_unit: "",
    pump_station: "",
  });

  // Fetch master data using backend API
  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch shifts');
      return result.rows || [];
    },
  });

  const { data: fuelProducts = [] } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
  });

  const { data: nozzles = [] } = useQuery({
    queryKey: ["/api/nozzles-list"],
    queryFn: async () => {
      const response = await fetch('/api/nozzles-list');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch nozzles');
      return result.rows || [];
    },
  });

  // Fetch today's sales data
  const { data: todaySales = { fuelSale: 0, lubricantSale: 0, cash: 0, credit: 0 } } = useQuery({
    queryKey: ["/api/today-sales"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const [saleEntriesRes, lubricantSalesRes] = await Promise.all([
        fetch(`/api/sale-entries?date=${today}`, {
          credentials: 'include'
        }),
        fetch(`/api/lubricant-sales?date=${today}`, {
          credentials: 'include'
        })
      ]);
      
      const saleEntriesResult = await saleEntriesRes.json();
      const lubricantSalesResult = await lubricantSalesRes.json();
      
      const fuelTotal = saleEntriesResult.rows?.reduce((sum: number, item: any) => sum + (item.net_sale_amount || 0), 0) || 0;
      const lubricantTotal = lubricantSalesResult.rows?.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0) || 0;
      
      return {
        fuelSale: fuelTotal,
        lubricantSale: lubricantTotal,
        cash: 0,
        credit: 0,
      };
    },
  });

  // derive computed values for UI
  const openingReadingNum = parseFloat(formData.opening_reading || "0");
  const closingReadingNum = parseFloat(formData.closing_reading || "0");
  const pricePerUnitNum = parseFloat(formData.price_per_unit || "0");
  const computedQuantity = closingReadingNum > openingReadingNum ? (closingReadingNum - openingReadingNum) : 0;
  const computedNetSale = computedQuantity * (isNaN(pricePerUnitNum) ? 0 : pricePerUnitNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = validateFormData(formData, {
      required: ['shift_id', 'employee_id', 'nozzle_id', 'fuel_product_id'],
      uuid: ['shift_id', 'employee_id', 'nozzle_id', 'fuel_product_id'],
      numeric: ['opening_reading', 'closing_reading', 'price_per_unit']
    });

    if (!validation.valid) {
      toast({ 
        variant: "destructive", 
        title: "Validation Error", 
        description: validation.errors.join(', ') 
      });
      return;
    }

    const openingReading = openingReadingNum;
    const closingReading = closingReadingNum;
    const pricePerUnit = pricePerUnitNum;

    if (closingReading <= openingReading) {
      toast({ variant: "destructive", title: "Error", description: "Closing reading must be greater than opening reading" });
      return;
    }

    const quantity = computedQuantity;
    const netSaleAmount = computedNetSale;

    try {
      const response = await fetch('/api/sale-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale_date: formData.sale_date,
          shift_id: formData.shift_id,
          employee_id: formData.employee_id,
          nozzle_id: formData.nozzle_id,
          fuel_product_id: formData.fuel_product_id,
          opening_reading: openingReading,
          closing_reading: closingReading,
          quantity,
          price_per_unit: pricePerUnit,
          net_sale_amount: netSaleAmount,
          pump_station: formData.pump_station || null,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Sale entry saved successfully!" });
        
        // Reset form
        setFormData({
          sale_date: format(new Date(), "yyyy-MM-dd"),
          shift_id: "",
          employee_id: "",
          nozzle_id: "",
          fuel_product_id: "",
          opening_reading: "",
          closing_reading: "",
          price_per_unit: "",
          pump_station: "",
        });
      } else {
        const errorInfo = handleAPIError(result, "Daily Sale");
        toast({ 
          variant: "destructive", 
          title: errorInfo.title, 
          description: errorInfo.description 
        });
      }
    } catch (error: any) {
      const errorInfo = handleAPIError(error, "Daily Sale");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    }
  };

  // When nozzle changes, auto-infer product
  useEffect(() => {
    if (!formData.nozzle_id) return;
    const nozzle = nozzles.find((n: any) => n.id === formData.nozzle_id);
    const inferredProduct = (nozzle as any)?.tanks?.fuel_product_id;
    if (inferredProduct && inferredProduct !== formData.fuel_product_id) {
      setFormData((prev) => ({ ...prev, fuel_product_id: inferredProduct }));
    }
  }, [formData.nozzle_id, formData.fuel_product_id, nozzles]);

  // Filter nozzles by selected fuel product if chosen
  const filteredNozzles = formData.fuel_product_id
    ? nozzles.filter((n: any) => (n as any)?.tanks?.fuel_product_id === formData.fuel_product_id)
    : nozzles;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Daily Sale Entry
        </h2>
        <p className="text-muted-foreground">
          Record daily fuel and lubricant sales
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Summary - Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Total Fuel Sale</span>
              <span className="font-semibold">₹{todaySales.fuelSale.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Lubricant Sale</span>
              <span className="font-semibold">₹{todaySales.lubricantSale.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Total Cash</span>
              <span className="font-semibold">₹{todaySales.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Total Credit</span>
              <span className="font-semibold">₹{todaySales.credit.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sale Entry Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Sale Date</Label>
                <Input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Select
                    value={formData.shift_id}
                    onValueChange={(value) => setFormData({ ...formData, shift_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.shift_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nozzle</Label>
                  <Select
                    value={formData.nozzle_id}
                    onValueChange={(value) => setFormData({ ...formData, nozzle_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nozzle" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredNozzles.map((nozzle) => (
                        <SelectItem key={nozzle.id} value={nozzle.id}>
                          Nozzle {nozzle.nozzle_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fuel Product *</Label>
                  <Select
                    value={formData.fuel_product_id}
                    onValueChange={(value) => setFormData({ ...formData, fuel_product_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Opening Reading *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.opening_reading}
                    onChange={(e) => setFormData({ ...formData, opening_reading: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Closing Reading *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.closing_reading}
                    onChange={(e) => setFormData({ ...formData, closing_reading: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rate per Liter *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Computed preview */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-3 bg-muted rounded-lg flex justify-between">
                  <span className="text-sm text-muted-foreground">Quantity (L)</span>
                  <span className="font-semibold">{computedQuantity.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 flex justify-between">
                  <span className="text-sm font-medium">Net Sale Amount</span>
                  <span className="font-bold">₹{computedNetSale.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pump Station</Label>
                <Input
                  value={formData.pump_station}
                  onChange={(e) => setFormData({ ...formData, pump_station: e.target.value })}
                  placeholder="Enter pump station"
                />
              </div>

              <Button type="submit" className="gap-2 w-full">
                <Save className="h-4 w-4" />
                Save Sale Entry
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
