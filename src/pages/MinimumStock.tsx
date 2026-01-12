import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

interface StockThreshold {
  product: string;
  category: string;
  currentStock: number;
  minThreshold: string;
  maxThreshold: string;
  unit: string;
  reorderPoint: string;
}

export default function MinimumStock() {
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<StockThreshold[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch lubricants data using backend API
  const { data: lubricants = [], isLoading } = useQuery({
    queryKey: ["/api/lubricants"],
    queryFn: async () => {
      const response = await fetch('/api/lubricants');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch lubricants');
      return result.rows || [];
    },
  });

  useEffect(() => {
    if (lubricants.length > 0) {
      const mappedThresholds: StockThreshold[] = lubricants.map((lub: any) => ({
        product: lub.lubricant_name || lub.name || lub.product_name || lub.product_code || 'Unknown',
        category: lub.category || 'Lubricant',
        currentStock: parseFloat(lub.current_stock || 0),
        minThreshold: lub.minimum_stock || '0',
        maxThreshold: lub.maximum_stock || '0',
        unit: lub.unit || 'L',
        reorderPoint: lub.reorder_point || '0',
      }));
      setThresholds(mappedThresholds);
    }
  }, [lubricants]);

  const handleThresholdChange = (index: number, field: keyof StockThreshold, value: string) => {
    const updated = [...thresholds];
    updated[index] = { ...updated[index], [field]: value };
    setThresholds(updated);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update minimum stock levels using backend API
      for (const threshold of thresholds) {
        const minQty = threshold.minThreshold ? Number(threshold.minThreshold) : null;
        
        try {
          const response = await fetch('/api/lubricants', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_name: threshold.product,
              minimum_stock: minQty,
            }),
          });
          
          const result = await response.json();
          if (!result.ok) {
            console.warn('Update failed for', threshold.product, result.error);
          }
        } catch (error) {
          console.warn('Update failed for', threshold.product, error);
        }
      }

      toast({ title: "Stock Thresholds Updated", description: "Minimum stock levels saved" });
    } catch (error: any) {
      const errorInfo = handleAPIError(error, "Minimum Stock");
      toast({ 
        title: errorInfo.title, 
        description: errorInfo.description, 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLowStock = (currentStock: number, minThreshold: string) => {
    return currentStock < parseFloat(minThreshold);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minimum Stock Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure stock thresholds and reorder points
          </p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Low Stock Alert</p>
              <p className="text-sm text-amber-700 mt-1">
                {thresholds.filter(t => isLowStock(t.currentStock, t.minThreshold)).length} item(s) 
                are currently below minimum threshold
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Threshold Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Max Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {thresholds.map((item, index) => (
                <TableRow key={index} className={isLowStock(item.currentStock, item.minThreshold) ? "bg-amber-50" : ""}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      isLowStock(item.currentStock, item.minThreshold) ? "text-amber-600" : "text-green-600"
                    }`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.minThreshold}
                      onChange={(e) => handleThresholdChange(index, "minThreshold", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.reorderPoint}
                      onChange={(e) => handleThresholdChange(index, "reorderPoint", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.maxThreshold}
                      onChange={(e) => handleThresholdChange(index, "maxThreshold", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    {isLowStock(item.currentStock, item.minThreshold) ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 w-fit">
                        Normal
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive alerts when stock falls below threshold</p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Auto Reorder</p>
              <p className="text-sm text-muted-foreground">Automatically create purchase orders at reorder point</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
