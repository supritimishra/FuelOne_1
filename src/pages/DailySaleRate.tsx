import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { validateFormData } from "@/lib/validation";
import { handleAPIError } from "@/lib/errorHandler";

export default function DailySaleRate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [businessDate, setBusinessDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [copyFrom, setCopyFrom] = useState<string>("");

  // Product-specific rates
  const [selectedHsdProduct, setSelectedHsdProduct] = useState<string>("");
  const [hsdOpen, setHsdOpen] = useState("");
  const [hsdClose, setHsdClose] = useState("");
  const [hsdVar, setHsdVar] = useState("");

  const [selectedMsProduct, setSelectedMsProduct] = useState<string>("");
  const [msOpen, setMsOpen] = useState("");
  const [msClose, setMsClose] = useState("");
  const [msVar, setMsVar] = useState("");

  const [selectedXpProduct, setSelectedXpProduct] = useState<string>("");
  const [xpOpen, setXpOpen] = useState("");
  const [xpClose, setXpClose] = useState("");
  const [xpVar, setXpVar] = useState("");

  // Search filters
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  // Auto-calculate variation amounts
  useEffect(() => {
    const open = parseFloat(hsdOpen);
    const close = parseFloat(hsdClose);
    if (!isNaN(open) && !isNaN(close)) {
      setHsdVar((close - open).toFixed(2));
    }
  }, [hsdOpen, hsdClose]);

  useEffect(() => {
    const open = parseFloat(msOpen);
    const close = parseFloat(msClose);
    if (!isNaN(open) && !isNaN(close)) {
      setMsVar((close - open).toFixed(2));
    }
  }, [msOpen, msClose]);

  useEffect(() => {
    const open = parseFloat(xpOpen);
    const close = parseFloat(xpClose);
    if (!isNaN(open) && !isNaN(close)) {
      setXpVar((close - open).toFixed(2));
    }
  }, [xpOpen, xpClose]);

  // Fetch fuel products for dropdowns
  const { data: fuelProducts = [] } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  // Fetch daily sale rates data
  const { data: saleRatesData, refetch: refetchSaleRates } = useQuery({
    queryKey: ["/api/daily-sale-rates"],
    queryFn: async () => {
      const response = await fetch('/api/daily-sale-rates');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch daily sale rates');
      return result.rows || [];
    },
  });

  const rows = saleRatesData || [];

  // Handle form submission
  const handleSave = async () => {
    try {
      const saleRates = [];

      if (hsdOpen && hsdClose && hsdVar && selectedHsdProduct) {
        const validation = validateFormData({
          fuel_product_id: selectedHsdProduct,
          open_rate: hsdOpen,
          close_rate: hsdClose,
          variation_amount: hsdVar
        }, {
          required: ['fuel_product_id'],
          uuid: ['fuel_product_id'],
          numeric: ['open_rate', 'close_rate', 'variation_amount']
        });

        if (!validation.valid) {
          toast({
            title: "Validation Error",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        saleRates.push({
          rate_date: businessDate,
          fuel_product_id: selectedHsdProduct,
          open_rate: parseFloat(hsdOpen),
          close_rate: parseFloat(hsdClose),
          variation_amount: parseFloat(hsdVar)
        });
      }

      if (msOpen && msClose && msVar && selectedMsProduct) {
        const validation = validateFormData({
          fuel_product_id: selectedMsProduct,
          open_rate: msOpen,
          close_rate: msClose,
          variation_amount: msVar
        }, {
          required: ['fuel_product_id'],
          uuid: ['fuel_product_id'],
          numeric: ['open_rate', 'close_rate', 'variation_amount']
        });

        if (!validation.valid) {
          toast({
            title: "Validation Error",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        saleRates.push({
          rate_date: businessDate,
          fuel_product_id: selectedMsProduct,
          open_rate: parseFloat(msOpen),
          close_rate: parseFloat(msClose),
          variation_amount: parseFloat(msVar)
        });
      }

      if (xpOpen && xpClose && xpVar && selectedXpProduct) {
        const validation = validateFormData({
          fuel_product_id: selectedXpProduct,
          open_rate: xpOpen,
          close_rate: xpClose,
          variation_amount: xpVar
        }, {
          required: ['fuel_product_id'],
          uuid: ['fuel_product_id'],
          numeric: ['open_rate', 'close_rate', 'variation_amount']
        });

        if (!validation.valid) {
          toast({
            title: "Validation Error",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }

        saleRates.push({
          rate_date: businessDate,
          fuel_product_id: selectedXpProduct,
          open_rate: parseFloat(xpOpen),
          close_rate: parseFloat(xpClose),
          variation_amount: parseFloat(xpVar)
        });
      }

      if (saleRates.length === 0) {
        toast({
          title: "Error",
          description: "Please fill in at least one product's rates and select the product",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/daily-sale-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleRates),
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: "Success",
          description: "Daily sale rates saved successfully!",
        });

        // Clear form
        setHsdOpen("");
        setHsdClose("");
        setHsdVar("");
        setMsOpen("");
        setMsClose("");
        setMsVar("");
        setXpOpen("");
        setXpClose("");
        setXpVar("");
        setSelectedHsdProduct("");
        setSelectedMsProduct("");
        setSelectedXpProduct("");

        // Refresh data
        refetchSaleRates();
      } else {
        throw new Error(result.error || 'Failed to save daily sale rates');
      }
    } catch (error) {
      console.error('Error saving daily sale rates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save daily sale rates",
        variant: "destructive",
      });
    }
  };

  // Handle search
  const handleSearch = () => {
    refetchSaleRates();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Add Daily Sale Rate</span></div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">&nbsp;</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Top row: Choose Date -> Business Date -> OK */}
          <div className="grid grid-cols-4 gap-3 items-center">
            <div className="col-span-1 text-white font-medium">Business Date</div>
            <div className="col-span-1 flex items-center gap-3">
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => document.getElementById('dsr_business')?.showPicker()}
              >
                {businessDate || 'Select Date'}
              </button>
              <input
                id="dsr_business"
                type="date"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                className="hidden"
              />
            </div>
            <div className="col-span-1">
              <Input type="date" className="bg-white text-black" value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} />
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">OK</Button>
          </div>

          {/* COPY label */}
          <div className="text-left">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">COPY</Button>
          </div>

          {/* HSD row */}
          <div className="grid grid-cols-7 gap-3 items-center">
            <div className="col-span-1 font-semibold">HSD</div>
            <div className="col-span-1">
              <Select value={selectedHsdProduct} onValueChange={setSelectedHsdProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Select Product" />
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
            <Input className="bg-white text-black col-span-2" placeholder="Open Sale Rate*" value={hsdOpen} onChange={(e) => setHsdOpen(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="Close Rate*" value={hsdClose} onChange={(e) => setHsdClose(e.target.value)} />
            <Input className="bg-white text-black col-span-1" placeholder="Vari. Amt*" value={hsdVar} onChange={(e) => setHsdVar(e.target.value)} />
          </div>

          {/* MS row */}
          <div className="grid grid-cols-7 gap-3 items-center">
            <div className="col-span-1 font-semibold">MS</div>
            <div className="col-span-1">
              <Select value={selectedMsProduct} onValueChange={setSelectedMsProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Select Product" />
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
            <Input className="bg-white text-black col-span-2" placeholder="Open Sale Rate*" value={msOpen} onChange={(e) => setMsOpen(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="Close Rate*" value={msClose} onChange={(e) => setMsClose(e.target.value)} />
            <Input className="bg-white text-black col-span-1" placeholder="Vari. Amt*" value={msVar} onChange={(e) => setMsVar(e.target.value)} />
          </div>

          {/* XP row */}
          <div className="grid grid-cols-7 gap-3 items-center">
            <div className="col-span-1 font-semibold">XP</div>
            <div className="col-span-1">
              <Select value={selectedXpProduct} onValueChange={setSelectedXpProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Select Product" />
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
            <Input className="bg-white text-black col-span-2" placeholder="Open Sale Rate*" value={xpOpen} onChange={(e) => setXpOpen(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="Close Rate*" value={xpClose} onChange={(e) => setXpClose(e.target.value)} />
            <Input className="bg-white text-black col-span-1" placeholder="Vari. Amt*" value={xpVar} onChange={(e) => setXpVar(e.target.value)} />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSave}
              className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              SAVE
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <span>Search From</span>
              <Input
                placeholder="Filter Date"
                type="date"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To</span>
              <Input
                placeholder="Filter Date"
                type="date"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Product</span>
              <Select value={searchProduct} onValueChange={setSearchProduct}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Choose Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HSD">HSD</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="XP">XP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSearch}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div />
            <div className="flex items-center gap-2"><Button variant="outline" size="sm">Copy</Button><Button variant="outline" size="sm" className="border-blue-500 text-blue-600">CSV</Button><Button variant="outline" size="sm" className="border-orange-500 text-orange-600">PDF</Button><Button variant="outline" size="sm">Print</Button><div className="flex items-center gap-2 ml-4"><span>Filter:</span><Input placeholder="Type to filter..." className="w-56" /></div></div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Sale Rate</TableHead>
                <TableHead>Closing Rate</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Variation Amt</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No data available. Add some daily sale rates to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.rate_date || '-'}</TableCell>
                    <TableCell>{row.open_rate || '-'}</TableCell>
                    <TableCell>{row.close_rate || '-'}</TableCell>
                    <TableCell>{row.product_name || '-'}</TableCell>
                    <TableCell>{row.variation_amount || '-'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingRate(row);
                        // Populate form fields with row data
                        setBusinessDate(row.rate_date || businessDate);
                        if (row.product_name === 'HSD') {
                          setHsdOpen(row.open_rate || '');
                          setHsdClose(row.close_rate || '');
                          setHsdVar(row.variation_amount || '');
                        } else if (row.product_name === 'MS') {
                          setMsOpen(row.open_rate || '');
                          setMsClose(row.close_rate || '');
                          setMsVar(row.variation_amount || '');
                        } else if (row.product_name === 'XP') {
                          setXpOpen(row.open_rate || '');
                          setXpClose(row.close_rate || '');
                          setXpVar(row.variation_amount || '');
                        }
                        toast({ title: "Edit Mode", description: `Editing rate for ${row.product_name}` });
                      }}>
                        Edit
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => {
                        setViewingRate(row);
                        toast({
                          title: "Rate Details",
                          description: `${row.product_name} - Date: ${row.rate_date}, Open: ${row.open_rate}, Close: ${row.close_rate}`
                        });
                      }}>
                        View
                      </Button>
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
