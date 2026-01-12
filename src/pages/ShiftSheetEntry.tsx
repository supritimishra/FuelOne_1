import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Types for our local state - mirroring the expected backend data structure
interface DailyRate {
  fuelProductId: string;
  productName: string;
  openRate: string;
  closeRate: string;
}

export default function ShiftSheetEntry() {
  const [date, setDate] = useState<Date>(new Date());
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [rates, setRates] = useState<DailyRate[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data on mount and when date/shift changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
        // 1. Fetch Fuel Products
        const productsRes = await fetch(`${apiBase}/api/fuel-products`);
        const productsData = await productsRes.json();

        if (!productsData?.ok) throw new Error(productsData?.error || 'Failed to fetch fuel products');
        const allProducts: { id: string, productName: string }[] = productsData?.data || [];

        // Ensure exactly three fuels: HSD, MS, XP (always show all three)
        const allowedProducts = ['HSD', 'MS', 'XP'];
        const products = allowedProducts.map(code => {
          const found = allProducts.find((p: any) => p?.shortName === code || p?.short_name === code);
          // If product doesn't exist in DB, create a placeholder
          return found || { id: `placeholder-${code}`, shortName: code, productName: code };
        });

        // 2. Fetch Existing Rates for Date AND Shift
        const dateStr = format(date, 'yyyy-MM-dd');
        const ratesRes = await fetch(`${apiBase}/api/daily-rates?date=${dateStr}&shift=${shift}`);
        const ratesData = await ratesRes.json();
        const existingRates: any[] = ratesData?.ok ? (ratesData?.data || []) : [];

        // 3. Merge
        const mergedRates = products.map((p: any) => {
          // In DailySaleRate model/routes, we store shortName in 'fuelProduct' field
          const found = existingRates.find((r: any) => r?.fuelProduct === (p?.shortName || p?.short_name));
          return {
            fuelProductId: p?.id || "",
            productName: p?.productName || p?.product_name || p?.shortName || p?.short_name || "Unknown",
            openRate: found?.openRate || "",
            closeRate: found?.closeRate || ""
          };
        });

        setRates(mergedRates);
      } catch (err) {
        console.error("Failed to load data", err);
        // Fallback or toast error here
      }
    };

    fetchData();
  }, [date, shift]);

  const handleRateChange = (index: number, field: 'openRate' | 'closeRate', value: string) => {
    const newRates = [...rates];
    newRates[index] = { ...newRates[index], [field]: value };
    setRates(newRates);
  };

  const handleSave = async () => {
    if (!shift) {
      alert("Please select a shift.");
      return;
    }
    setIsSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Filter out placeholder products (products that don't exist in DB)
      const validRates = rates.filter(r => !r?.fuelProductId?.startsWith('placeholder-'));
      const placeholderProducts = rates.filter(r => r?.fuelProductId?.startsWith('placeholder-'));

      if (placeholderProducts.length > 0) {
        const missingProducts = placeholderProducts.map(r => r?.productName).join(', ');
        alert(`Warning: ${missingProducts} product(s) not found in database. Please create these products first. Only existing products will be saved.`);
      }

      if (validRates.length === 0) {
        alert("No valid products to save. Please ensure HSD, MS, and XP products exist in the database.");
        setIsSaving(false);
        return;
      }

      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/daily-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          shift,
          rates: validRates.map(r => ({
            fuelProductId: r?.fuelProductId,
            openRate: r?.openRate,
            closeRate: r?.closeRate
          }))
        })
      });
      const result = await res.json();
      if (!result?.ok) throw new Error(result?.error || 'Failed to save rates');

      // Success feedback
      alert("Rates saved successfully!");
    } catch (err: any) {
      console.error("Save failed", err);
      alert("Failed to save: " + (err?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="font-semibold text-primary">Dashboard</span>
        <span>/</span>
        <span>Daily Rate Entry</span>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg">
        <CardHeader className="bg-muted/50 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">Daily Fuel Rates</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enter opening and closing rates per shift.
              </p>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-4">
                {/* Date Selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Shift Selector */}
                <div className="flex items-center bg-muted rounded-md p-1 border">
                  <button
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-sm transition-all",
                      shift === "S-1"
                        ? "bg-white text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-white/50"
                    )}
                    onClick={() => setShift("S-1")}
                  >
                    Shift 1
                  </button>
                  <button
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-sm transition-all",
                      shift === "S-2"
                        ? "bg-white text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-white/50"
                    )}
                    onClick={() => setShift("S-2")}
                  >
                    Shift 2
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-right mr-1">
                Editing: <strong>{shift === "S-1" ? "Shift 1" : "Shift 2"}</strong> on {format(date, "dd MMM yyyy")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="-mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[30%]">Fuel Product</TableHead>
                    <TableHead>Opening Rate (₹)</TableHead>
                    <TableHead>Closing Rate (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate, index) => (
                    <TableRow key={rate.fuelProductId}>
                      <TableCell className="font-medium">
                        {rate.productName}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={rate.openRate}
                          onChange={(e) => handleRateChange(index, 'openRate', e.target.value)}
                          className="max-w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={rate.closeRate}
                          onChange={(e) => handleRateChange(index, 'closeRate', e.target.value)}
                          className="max-w-[150px]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {rates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        Loading fuel products...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full md:w-auto min-w-[150px]"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Rates
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Entries Display */}
      <Card className="mt-8 border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Save className="h-5 w-5" />
            Saved Entries for {format(date, "dd MMM yyyy")} ({shift})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[30%]">Fuel Product</TableHead>
                <TableHead>Opening Rate (₹)</TableHead>
                <TableHead>Closing Rate (₹)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.filter(r => r.openRate || r.closeRate).length > 0 ? (
                rates.filter(r => r.openRate || r.closeRate).map((rate) => (
                  <TableRow key={'saved-' + rate.fuelProductId}>
                    <TableCell className="font-medium text-primary">
                      {rate.productName}
                    </TableCell>
                    <TableCell>
                      {rate.openRate || "-"}
                    </TableCell>
                    <TableCell>
                      {rate.closeRate || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Saved
                      </span>
                    </TableCell>
                  </TableRow>
                ))) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground italic">
                    No rates entered for this shift yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visual Guide / Help for User */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground pt-4">
        <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-500 mb-1">Make sure of the Shift</h4>
          <p>You are entering rates for <strong>{shift}</strong>. Ensure this is correct.</p>
        </div>
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
          <h4 className="font-semibold text-blue-800 dark:text-blue-500 mb-1">Decimal Precision</h4>
          <p>Rates can be entered with up to 2 decimal places (e.g. 90.45).</p>
        </div>
        <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
          <h4 className="font-semibold text-green-800 dark:text-green-500 mb-1">Save Required</h4>
          <p>Click "Save Rates" to persist changes for this shift.</p>
        </div>
      </div>
    </div>
  );
}
