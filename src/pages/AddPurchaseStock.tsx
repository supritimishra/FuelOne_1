import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AddPurchaseStock() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // URL Params
    const paramTankId = searchParams.get("tankId") || "";
    const paramDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const [date, setDate] = useState<string>(paramDate);
    const [tankId, setTankId] = useState<string>(paramTankId);
    const [productName, setProductName] = useState<string>("");

    // Form Fields
    const [quantity, setQuantity] = useState<string>(""); // Receipt

    const [beforeDip, setBeforeDip] = useState<string>("");
    const [beforeStock, setBeforeStock] = useState<string>("");
    const [afterDip, setAfterDip] = useState<string>("");
    const [afterStock, setAfterStock] = useState<string>("");

    const [invoiceNo, setInvoiceNo] = useState<string>("");
    const [meterSale, setMeterSale] = useState<string>("");

    const [stockDifference, setStockDifference] = useState<string>("");
    const [stockDumped, setStockDumped] = useState<string>("");

    const [temp, setTemp] = useState<string>("");
    const [hydro, setHydro] = useState<string>("");
    const [density, setDensity] = useState<string>("");

    const [loading, setLoading] = useState(false);

    // Fetch Tanks
    const { data: tanks = [] } = useQuery({
        queryKey: ["/api/tanks-list"],
        queryFn: async () => {
            const response = await fetch('/api/tanks-list');
            const result = await response.json();
            if (!result.ok) throw new Error(result.error || 'Failed to fetch tanks');
            return result.rows || [];
        },
    });

    // Fetch existing data for this tank/date
    const { data: existingData } = useQuery({
        queryKey: ["/api/reports/opening-stock", date],
        queryFn: async () => {
            if (!date) return [];
            const res = await fetch(`/api/reports/opening-stock?from=${date}&to=${date}`);
            const json = await res.json();
            if (!json.ok) return [];
            return json.rows || [];
        },
        enabled: !!date
    });

    useEffect(() => {
        if (tankId && tanks.length > 0) {
            const tank = tanks.find((t: any) => t.id === tankId);
            if (tank) {
                setProductName(tank.product_name || tank.fuel_products?.product_name || "");
            }
        }
    }, [tankId, tanks]);

    // Pre-fill form if data exists
    useEffect(() => {
        if (existingData && existingData.length > 0 && tankId) {
            const row = existingData.find((r: any) => r.tank_id === tankId);
            if (row) {
                setQuantity(row.stock_received?.toString() || "");
                setInvoiceNo(row.invoice_no || "");
                setBeforeDip(row.before_dip?.toString() || "");
                setBeforeStock(row.before_stock?.toString() || "");
                setAfterDip(row.after_dip?.toString() || "");
                setAfterStock(row.after_stock?.toString() || "");
                setStockDumped(row.stock_dumped?.toString() || "");
                setStockDifference(row.stock_difference?.toString() || "");
                setTemp(row.temp?.toString() || "");
                setHydro(row.hydrometer?.toString() || "");
                setDensity(row.density?.toString() || "");
                setMeterSale(row.meter_sale?.toString() || "");
            }
        }
    }, [existingData, tankId]);

    const handleSave = async () => {
        if (!tankId || !date) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Date and Tank are required." });
            return;
        }

        try {
            setLoading(true);
            const payload = {
                date,
                tank_id: tankId,
                product_name: productName,
                quantity: quantity ? parseFloat(quantity) : 0,
                before_dip: beforeDip ? parseFloat(beforeDip) : null,
                before_stock: beforeStock ? parseFloat(beforeStock) : null,
                after_dip: afterDip ? parseFloat(afterDip) : null,
                after_stock: afterStock ? parseFloat(afterStock) : null,
                invoice_no: invoiceNo,
                meter_sale: meterSale ? parseFloat(meterSale) : null,
                stock_difference: stockDifference ? parseFloat(stockDifference) : null,
                stock_dumped: stockDumped ? parseFloat(stockDumped) : null,
                temp: temp ? parseFloat(temp) : null,
                hydro: hydro ? parseFloat(hydro) : null,
                density: density ? parseFloat(density) : null,
            };

            const res = await fetch('/api/stock-dump', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!result.ok) throw new Error(result.error);

            toast({ title: "Success", description: "Stock Dump Saved Successfully" });
            navigate('/opening-stock'); // Go back to report
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" onClick={() => navigate('/opening-stock')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h1 className="text-2xl font-bold">Add Purchase Stock</h1>
            </div>

            <Card className="bg-blue-600 text-white">
                <CardContent className="pt-6 space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3 space-y-1">
                            <Label className="text-white">Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white text-black" />
                        </div>
                        <div className="col-span-3 space-y-1">
                            <Label className="text-white">Tank</Label>
                            <Select value={tankId} onValueChange={setTankId}>
                                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select Tank" /></SelectTrigger>
                                <SelectContent>
                                    {tanks.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.tank_number} - {t.product_name || "Unknown"}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 space-y-1">
                            <Label className="text-white">Product</Label>
                            <Input value={productName} readOnly className="bg-white text-black bg-opacity-90" />
                        </div>
                        <div className="col-span-3 space-y-1">
                            <Label className="text-white">Quantity (Lt)</Label>
                            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-white text-black" placeholder="Receipt Qty" />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Before DIP</Label>
                            <Input value={beforeDip} onChange={(e) => setBeforeDip(e.target.value)} className="bg-white text-black" placeholder="Before DIP" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Before Stock (Lt)</Label>
                            <Input value={beforeStock} onChange={(e) => setBeforeStock(e.target.value)} className="bg-white text-black" placeholder="Before Stock" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">After DIP</Label>
                            <Input value={afterDip} onChange={(e) => setAfterDip(e.target.value)} className="bg-white text-black" placeholder="After DIP" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">After Stock (Lt)</Label>
                            <Input value={afterStock} onChange={(e) => setAfterStock(e.target.value)} className="bg-white text-black" placeholder="After Stock" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Invoice</Label>
                            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="bg-white text-black" placeholder="Invoice No" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Meter Sale (Lt)</Label>
                            <Input value={meterSale} onChange={(e) => setMeterSale(e.target.value)} className="bg-white text-black" placeholder="0" />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3 space-y-1">
                            <Label className="text-white">Stock Difference</Label>
                            <Input value={stockDifference} onChange={(e) => setStockDifference(e.target.value)} className="bg-white text-black" placeholder="Difference" />
                        </div>
                        <div className="col-span-3 space-y-1">
                            <Label className="text-white">Stock Dumped</Label>
                            <Input value={stockDumped} onChange={(e) => setStockDumped(e.target.value)} className="bg-white text-black" placeholder="Dumped Qty" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Temp</Label>
                            <Input value={temp} onChange={(e) => setTemp(e.target.value)} className="bg-white text-black" placeholder="Temp" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Hydrometer.Read</Label>
                            <Input value={hydro} onChange={(e) => setHydro(e.target.value)} className="bg-white text-black" placeholder="Hydro" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-white">Density</Label>
                            <Input value={density} onChange={(e) => setDensity(e.target.value)} className="bg-white text-black" placeholder="Density" />
                        </div>
                    </div>

                    <div className="flex justify-center pt-4">
                        <Button onClick={handleSave} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white min-w-[200px] gap-2">
                            <Save className="w-4 h-4" /> {loading ? "SAVING..." : "SAVE"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table Section (Placeholder for recent dumps or related list, kept empty to match screenshot) */}
            <Card>
                <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No recent data available in table
                </CardContent>
            </Card>
        </div>
    );
}
