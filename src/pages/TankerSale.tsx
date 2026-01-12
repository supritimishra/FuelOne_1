import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Truck, Fuel } from "lucide-react";
import { tankerSaleSchema } from "@/lib/validations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { invalidateQueries } from "@/lib/cacheInvalidation";

function RecentTankerSales() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/tanker-sales"],
    queryFn: async () => {
      const response = await fetch('/api/tanker-sales', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch tanker sales');
      return result.rows || [];
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No tanker sales yet.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Product</th>
            <th className="py-2 pr-3">Before Dip</th>
            <th className="py-2 pr-3">Gross</th>
            <th className="py-2 pr-3">Received (L)</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row: any, idx: number) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="py-2 pr-3">{new Date(row.sale_date).toLocaleDateString()}</td>
              <td className="py-2 pr-3">{row.fuel_product_name || 'Unknown'}</td>
              <td className="py-2 pr-3">{Number(row.before_dip_stock || 0).toFixed(2)} L</td>
              <td className="py-2 pr-3">{Number(row.gross_stock || 0).toFixed(2)} L</td>
              <td className="py-2 pr-3 font-semibold">{Number(row.tanker_sale_quantity || 0).toFixed(2)} L</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type TankerSaleForm = z.infer<typeof tankerSaleSchema>;

export default function TankerSale() {
  const queryClient = useQueryClient();
  const [selectedFuelProductId, setSelectedFuelProductId] = useState<string>("");
  const [selectedTankId, setSelectedTankId] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TankerSaleForm>({
    resolver: zodResolver(tankerSaleSchema),
    defaultValues: {
      tanker_sale_quantity: 0,
      before_dip_stock: 0,
      gross_stock: 0,
      notes: "",
    }
  });

  // Fetch tanks (to mirror screenshot behavior and infer product)
  const { data: tanks } = useQuery({
    queryKey: ["/api/tanks"],
    queryFn: async () => {
      const response = await fetch('/api/tanks', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch tanks');
      return result.rows || [];
    },
  });

  const quantity = watch("tanker_sale_quantity");
  const beforeDipStock = watch("before_dip_stock");
  const calculatedGrossStock = (beforeDipStock || 0) + (quantity || 0);

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

  // Create tanker sale mutation
  const createTankerSale = useMutation({
    mutationFn: async (formData: TankerSaleForm) => {
      const saleData = {
        sale_date: new Date().toISOString().slice(0, 10),
        fuel_product_id: selectedFuelProductId,
        before_dip_stock: formData.before_dip_stock || 0,
        gross_stock: calculatedGrossStock,
        tanker_sale_quantity: formData.tanker_sale_quantity,
        notes: formData.notes || null,
      };

      console.log('Saving tanker sale:', saleData);

      const response = await fetch('/api/tanker-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(saleData)
      });
      const result = await response.json();
      
      if (!result.ok) {
        console.error('Tanker sale error:', result.error);
        throw new Error(result.error || 'Failed to save tanker sale');
      }

      return result.row;
    },
    onSuccess: (savedData) => {
      const fuelProduct = fuelProducts?.find(p => p.id === selectedFuelProductId);
      const fuelName = fuelProduct?.product_name || 'Fuel';
      
      toast({
        title: "✅ Tanker Sale Recorded Successfully",
        description: `${fuelName}: ${quantity}L tanker delivery processed`,
        duration: 5000,
      });
      
      reset();
      setSelectedFuelProductId("");
      setSelectedTankId("");
      invalidateQueries.tankerSale(queryClient);
    },
    onError: (error: Error) => {
      console.error('Tanker sale mutation error:', error);
      toast({
        title: "❌ Failed to Save Tanker Sale",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: TankerSaleForm) => {
    if (!selectedFuelProductId) {
      toast({
        title: "Missing Information",
        description: "Please select a fuel type",
        variant: "destructive",
      });
      return;
    }
    createTankerSale.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tanker Sale (Bulk Fuel)</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-white">Stock Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tank_id">Tank</Label>
                <Select 
                  value={selectedTankId}
                  onValueChange={(id) => {
                    setSelectedTankId(id);
                    const tank = tanks?.find((t: any) => t.id === id);
                    const inferred = (tank as any)?.fuel_product_id;
                    if (inferred) setSelectedFuelProductId(inferred);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tank" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>Tank {t.tank_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Selecting a tank will auto-fill fuel type.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_product_id">Fuel Type *</Label>
                <Select 
                  value={selectedFuelProductId} 
                  onValueChange={setSelectedFuelProductId}
                >
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
                <Label htmlFor="before_dip_stock">Before Dip Stock (L) *</Label>
                <Input
                  id="before_dip_stock"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("before_dip_stock", { valueAsNumber: true })}
                />
                {errors.before_dip_stock && (
                  <p className="text-sm text-destructive">{errors.before_dip_stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gross_stock">Gross Stock (L) - Calculated</Label>
                <Input
                  id="gross_stock"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={calculatedGrossStock.toFixed(2)}
                  readOnly
                  className="bg-gray-100"
                />
                <p className="text-xs text-muted-foreground">
                  Calculated: {beforeDipStock || 0} + {quantity || 0} = {calculatedGrossStock.toFixed(2)} L
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-white">Tanker Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tanker_sale_quantity">Quantity Received (Liters) *</Label>
                <Input
                  id="tanker_sale_quantity"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("tanker_sale_quantity", { valueAsNumber: true })}
                />
                {errors.tanker_sale_quantity && (
                  <p className="text-sm text-destructive">{errors.tanker_sale_quantity.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Minimum 3000L for tanker deliveries</p>
              </div>

              <div className="pt-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Before Dip:</span>
                    <span className="font-semibold">{watch("before_dip_stock") || 0}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Received:</span>
                    <span className="font-semibold text-green-600">{quantity || 0}L</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-semibold">Total Stock:</span>
                    <span className="font-bold text-primary">
                      {((watch("before_dip_stock") || 0) + (quantity || 0)).toFixed(2)}L
                    </span>
                  </div>
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
            <Textarea 
              placeholder="Add delivery notes, special instructions, or remarks..." 
              rows={3}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Recent tanker sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Fuel className="h-4 w-4" /> Recent Tanker Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTankerSales />
          </CardContent>
        </Card>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Truck className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Bulk Sale Notice</p>
              <p className="text-xs text-amber-700 mt-1">
                Ensure tanker inspection is completed and delivery challan is signed before processing
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => reset()}>Cancel</Button>
          <Button type="submit" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white" disabled={createTankerSale.isPending}>
            <Plus className="h-4 w-4" />
            {createTankerSale.isPending ? "Processing..." : "Process Tanker Sale"}
          </Button>
        </div>
      </form>
    </div>
  );
}
