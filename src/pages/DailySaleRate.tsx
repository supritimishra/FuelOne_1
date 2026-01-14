
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2, Edit, Search } from "lucide-react";
import { format, subDays } from "date-fns";

interface FuelProduct {
  id: string;
  product_name: string;
}

interface SaleRate {
  id?: string;
  rate_date: string;
  fuel_product_id: string;
  open_rate: number;
  close_rate: number;
  variation_amount: number;
  product_name?: string;
  created_at?: string;
  created_by_name?: string;
}

export default function DailySaleRate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [businessDate, setBusinessDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // State for form inputs: productId -> { open, close, var }
  const [formRates, setFormRates] = useState<Record<string, { open: string; close: string; var: string }>>({});

  // Search filters
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchProduct, setSearchProduct] = useState("All");

  // Fetch fuel products
  const { data: fuelProducts = [] } = useQuery<FuelProduct[]>({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch("/api/fuel-products");
      const result = await response.json();
      return result.rows || [];
    },
  });

  // Fetch all rates for the table
  const { data: allRates = [] } = useQuery<SaleRate[]>({
    queryKey: ["/api/daily-sale-rates", searchFrom, searchTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFrom) params.append("from", searchFrom);
      if (searchTo) params.append("to", searchTo);
      const response = await fetch(`/api/daily-sale-rates?${params.toString()}`);
      const result = await response.json();
      return result.rows || [];
    },
  });

  // Fetch rates for the selected business date to pre-fill form
  const { data: dateRates } = useQuery<SaleRate[]>({
    queryKey: ["/api/daily-sale-rates", "date", businessDate],
    queryFn: async () => {
      const response = await fetch(`/api/daily-sale-rates?date=${businessDate}`);
      const result = await response.json();
      return result.rows || [];
    },
    enabled: !!businessDate,
  });

  // Update form when dateRates loads
  useEffect(() => {
    if (fuelProducts.length > 0) {
      const newRates: Record<string, { open: string; close: string; var: string }> = {};

      fuelProducts.forEach(p => {
        // Find existing rate for this product on this date
        const existing = dateRates?.find(r => r.fuel_product_id === p.id);
        if (existing) {
          newRates[p.id] = {
            open: existing.open_rate.toString(),
            close: existing.close_rate.toString(),
            var: existing.variation_amount.toString()
          };
        } else {
          newRates[p.id] = { open: "", close: "", var: "" };
        }
      });
      setFormRates(newRates);
    }
  }, [dateRates, fuelProducts, businessDate]);

  // Handle Input Changes
  const handleInputChange = (productId: string, field: 'open' | 'close', value: string) => {
    setFormRates(prev => {
      const current = prev[productId] || { open: "", close: "", var: "" };
      const next = { ...current, [field]: value };

      // Auto calc variation
      const open = parseFloat(next.open);
      const close = parseFloat(next.close);
      if (!isNaN(open) && !isNaN(close)) {
        next.var = (close - open).toFixed(2);
      } else {
        next.var = "";
      }

      return { ...prev, [productId]: next };
    });
  };

  // Copy from previous day
  const handleCopy = async () => {
    const prevDate = format(subDays(new Date(businessDate), 1), "yyyy-MM-dd");
    try {
      const response = await fetch(`/api/daily-sale-rates?date=${prevDate}`);
      const result = await response.json();
      const prevRates: SaleRate[] = result.rows || [];

      if (prevRates.length === 0) {
        toast({
          title: "No Data",
          description: "No data found for the previous day to copy.",
          variant: "destructive"
        });
        return;
      }

      setFormRates(prev => {
        const next = { ...prev };
        prevRates.forEach(r => {
          if (next[r.fuel_product_id]) {
            next[r.fuel_product_id] = {
              ...next[r.fuel_product_id],
              open: r.close_rate.toString(), // Copy Close to Open
              var: next[r.fuel_product_id].close
                ? (parseFloat(next[r.fuel_product_id].close) - r.close_rate).toFixed(2)
                : ""
            };
          }
        });
        return next;
      });

      toast({ title: "Copied", description: "Rates copied from previous day." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to copy rates.", variant: "destructive" });
    }
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (ratesToSave: any[]) => {
      const response = await fetch("/api/daily-sale-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratesToSave),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: "Rates saved successfully!" });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-sale-rates"] });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    },
    onError: (err) => {
      toast({ title: "Error", description: "Failed to save data.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/daily-sale-rates/${id}`, {
        method: "DELETE"
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Deleted", description: "Rate deleted successfully." });
        queryClient.invalidateQueries({ queryKey: ["/api/daily-sale-rates"] });
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete", variant: "destructive" });
      }
    }
  });

  const onSave = () => {
    const ratesToSave = Object.entries(formRates).map(([productId, values]) => {
      if (!values.open && !values.close) return null;
      return {
        rateDate: businessDate,
        fuelProductId: productId,
        openRate: values.open || "0",
        closeRate: values.close || "0",
        variationAmount: values.var || "0"
      };
    }).filter(r => r !== null);

    if (ratesToSave.length === 0) {
      toast({ title: "Warning", description: "No rates entered to save.", variant: "destructive" });
      return;
    }

    saveMutation.mutate(ratesToSave);
  };

  const filteredRows = allRates.filter((row) => {
    if (searchProduct && searchProduct !== "All") {
      return row.product_name === searchProduct;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-semibold">Dashboard</span>
        <span>{'>'}</span>
        <span className="text-blue-600">Add Daily Sale Rate</span>
      </div>

      <Card className="bg-indigo-600 border-none rounded-lg shadow-lg">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded shadow-sm text-sm whitespace-nowrap">
              Choose Date
            </div>
            <div className="flex-1 bg-white rounded flex items-center px-4 py-2">
              <span className="font-medium mr-4">Business Date</span>
              <Input
                type="date"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                className="border-none shadow-none focus-visible:ring-0 w-full"
              />
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8">
              OK
            </Button>
          </div>

          <div>
            <Button
              onClick={handleCopy}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 text-xs h-8"
            >
              <Copy className="h-3 w-3" />
              COPY
            </Button>
          </div>

          <div className="space-y-4">
            {fuelProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-white font-bold text-lg uppercase">
                  {product.product_name}
                </div>
                <div className="col-span-11 grid grid-cols-3 gap-4">
                  <div className="relative">
                    <Input
                      className="bg-white h-12 text-lg px-4"
                      placeholder="Open Sale Rate*"
                      type="number"
                      value={formRates[product.id]?.open || ""}
                      onChange={(e) => handleInputChange(product.id, 'open', e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      className="bg-white h-12 text-lg px-4"
                      placeholder="Close Rate*"
                      type="number"
                      value={formRates[product.id]?.close || ""}
                      onChange={(e) => handleInputChange(product.id, 'close', e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      className="bg-white h-12 text-lg px-4"
                      placeholder="Vari. Amt*"
                      readOnly
                      value={formRates[product.id]?.var || ""}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={onSave}
              className="bg-lime-500 hover:bg-lime-600 text-black font-bold px-12 py-6 text-lg rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <span className="mr-2">💾</span> SAVE
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-6 justify-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Search From</span>
            <Input
              type="date"
              className="w-40"
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
            />
            <span className="font-semibold text-gray-700">To</span>
            <Input
              type="date"
              className="w-40"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Product</span>
            <Select value={searchProduct} onValueChange={setSearchProduct}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Choose Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Products</SelectItem>
                {fuelProducts.map(p => (
                  <SelectItem key={p.id} value={p.product_name}>{p.product_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/daily-sale-rates"] })}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex justify-between items-center border-b">
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="font-bold">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select defaultValue="All">
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <Input placeholder="Type to filter..." className="h-8 w-40" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-10"><Input type="checkbox" className="w-4 h-4" /></TableHead>
                  <TableHead className="w-16 font-bold text-gray-700">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700">Date</TableHead>
                  <TableHead className="font-bold text-gray-700">Sale Rate</TableHead>
                  <TableHead className="font-bold text-gray-700">Closing Rate</TableHead>
                  <TableHead className="font-bold text-gray-700">Product</TableHead>
                  <TableHead className="font-bold text-gray-700">Variation Amt</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell><Input type="checkbox" className="w-4 h-4" /></TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{format(new Date(row.rate_date), "dd-MMM-yyyy")}</TableCell>
                    <TableCell className="font-medium">{row.open_rate}</TableCell>
                    <TableCell className="font-medium">{row.close_rate}</TableCell>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell className="text-green-600 font-bold">
                      {row.variation_amount}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (row.id && confirm("Are you sure you want to delete this rate?")) {
                              deleteMutation.mutate(row.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      Created: {row.created_by_name || "Super Admin"} {row.created_at ? format(new Date(row.created_at), "dd-MM-yyyy hh:mm a") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
