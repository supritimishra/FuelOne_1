import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Search, Trash2, Printer, MessageSquare, Copy, FileText, Download, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { validateFormData } from "@/lib/validation";
import { handleAPIError } from "@/lib/errorHandler";

export default function CreditSaleUI() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [org, setOrg] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState<string>("");
  const [creditAmt, setCreditAmt] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [advance, setAdvance] = useState<string>("0");
  const [qty, setQty] = useState<string>("");
  const [indentNo, setIndentNo] = useState<string>("");
  const [misc, setMisc] = useState<string>("0");
  const [billNo, setBillNo] = useState("");
  const [employee, setEmployee] = useState("");
  const [effect, setEffect] = useState("No");
  const [desc, setDesc] = useState("");
  const [meterRead, setMeterRead] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [searchFromDate, setSearchFromDate] = useState<string>("");
  const [searchToDate, setSearchToDate] = useState<string>("");
  const [searchOrganization, setSearchOrganization] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRows(new Set(creditSalesRows.map((row: any) => row.id)));
    else setSelectedRows(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast({ title: "Warning", description: "No items selected", variant: "destructive" });
      return;
    }
    if (!confirm(`Delete ${selectedRows.size} items?`)) return;
    try {
      await Promise.all(Array.from(selectedRows).map(id =>
        fetch(`/api/credit-sales/${id}`, { method: 'DELETE' })
      ));
      toast({ title: "Success", description: "Items deleted" });
      setSelectedRows(new Set());
      refetchCreditSales();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (creditSalesRows.length === 0) {
      toast({ title: "Warning", description: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["S.No", "Txn No", "Date", "Shift", "Org/Cust", "Vehicle No", "Product", "Employee", "Quantity", "Price", "Total", "Discount", "Indent No", "Bill No", "Advance", "Mileage", "Description"];
    const csvContent = [
      headers.join(","),
      ...creditSalesRows.map((row: any, i: number) => [
        i + 1,
        row.transaction_number || row.id?.slice(-8) || '-',
        row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-GB') : '-',
        row.shift,
        `"${row.organization_name || ''}"`,
        row.vehicle_number || '',
        row.product_name || '',
        row.employee_name || '',
        row.quantity || 0,
        row.price_per_unit || 0,
        row.total_amount || 0,
        row.discount || 0,
        row.indent_no || '',
        row.bill_no || '',
        row.advance || 0,
        row.mileage || '',
        `"${row.description || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `credit_sales_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleCopy = () => {
    const text = creditSalesRows.map((r: any) => Object.values(r).join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Table data copied to clipboard" });
  };

  // Fetch credit customers
  const { data: customers } = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const response = await fetch('/api/credit-customers');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch customers');
      return result.rows || [];
    },
  });

  // Fetch fuel products
  const { data: fuelProducts } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
  });

  // Fetch credit sales data
  const { data: creditSalesData, refetch: refetchCreditSales } = useQuery({
    queryKey: ["/api/credit-sales"],
    queryFn: async () => {
      const response = await fetch('/api/credit-sales');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch credit sales');
      return result.rows || [];
    },
  });

  const creditSalesRows = creditSalesData || [];

  // Create credit sale mutation
  const createCreditSale = useMutation({
    mutationFn: async () => {
      // Validate required fields and UUIDs
      const validation = validateFormData({
        credit_customer_id: org,
        fuel_product_id: product,
        employee_id: employee,
        sale_date: date,
        quantity: qty,
        price_per_unit: price,
        total_amount: creditAmt
      }, {
        required: ['credit_customer_id', 'fuel_product_id', 'sale_date', 'quantity', 'price_per_unit', 'total_amount'],
        uuid: ['credit_customer_id', 'fuel_product_id'],
        numeric: ['quantity', 'price_per_unit', 'total_amount']
      });

      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const saleData = {
        credit_customer_id: org,
        fuel_product_id: product,
        employee_id: employee || null,
        sale_date: date,
        shift,
        vehicle_number: vehicleNo || null,
        quantity: qty ? parseFloat(qty) : 0,
        price_per_unit: price ? parseFloat(price) : 0,
        total_amount: creditAmt ? parseFloat(creditAmt) : 0,
        discount: discount ? parseFloat(discount) : 0,
        indent_no: indentNo || null,
        misc_charges: misc ? parseFloat(misc) : 0,
        bill_no: billNo || null,
        description: desc || null,
        meter_reading: meterRead || null,
        mileage: mileage ? parseFloat(mileage) : 0,
        advance: advance ? parseFloat(advance) : 0,
        effect_asset: effect || null,
        created_by: null,
      };

      const response = await fetch('/api/credit-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to save credit sale');
      }
    },
    onSuccess: () => {
      toast({
        title: "Credit Sale Recorded",
        description: `Credit sale processed successfully`,
      });
      // Clear form
      setOrg("");
      setVehicleNo("");
      setProduct("");
      setPrice("");
      setCreditAmt("");
      setQty("");
      setBillNo("");
      setEmployee("");
      setDesc("");
      setMeterRead("");
      setMileage("");
      refetchCreditSales();
    },
    onError: (error: Error) => {
      console.error('Credit sale mutation error:', error);
      const errorInfo = handleAPIError(error, "Credit Sale");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    },
  });

  const onConfirm = () => {
    if (editingId) {
      updateCreditSale.mutate();
    } else {
      createCreditSale.mutate();
    }
  };

  const updateCreditSale = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const payload = {
        credit_customer_id: org,
        fuel_product_id: product,
        employee_id: employee || null,
        sale_date: date,
        shift,
        vehicle_number: vehicleNo || null,
        quantity: qty ? parseFloat(qty) : 0,
        price_per_unit: price ? parseFloat(price) : 0,
        total_amount: creditAmt ? parseFloat(creditAmt) : 0,
        discount: discount ? parseFloat(discount) : 0,
        indent_no: indentNo || null,
        misc_charges: misc ? parseFloat(misc) : 0,
        bill_no: billNo || null,
        description: desc || null,
        meter_reading: meterRead || null,
        mileage: mileage ? parseFloat(mileage) : 0,
        advance: advance ? parseFloat(advance) : 0,
        effect_asset: effect || null,
      };
      const res = await fetch(`/api/credit-sales/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed to update credit sale');
    },
    onSuccess: () => {
      toast({ title: 'Updated', description: 'Credit sale updated successfully' });
      setEditingId(null);
      refetchCreditSales();
    },
    onError: (error: Error) => {
      const errorInfo = handleAPIError(error, 'Credit Sale Update');
      toast({ title: errorInfo.title, description: errorInfo.description, variant: 'destructive' });
    }
  });

  const deleteCreditSale = async (id: string) => {
    if (!confirm('Delete this credit sale?')) return;
    const res = await fetch(`/api/credit-sales/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!result.ok) {
      toast({ title: 'Delete failed', description: result.error || 'Unable to delete', variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Credit sale removed' });
    refetchCreditSales();
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setDate(row.sale_date ? String(row.sale_date) : new Date().toISOString().slice(0, 10));
    setShift((row.shift as any) || 'S-1');
    setOrg(row.credit_customer_id || '');
    setVehicleNo(row.vehicle_number || '');
    setProduct(row.fuel_product_id || '');
    setQty(row.quantity ? String(row.quantity) : '');
    setPrice(row.price_per_unit ? String(row.price_per_unit) : '');
    setCreditAmt(row.total_amount ? String(row.total_amount) : '');
    setDiscount(row.discount ? String(row.discount) : '0');
    setIndentNo(row.indent_no || '');
    setMisc(row.misc_charges ? String(row.misc_charges) : '0');
    setBillNo(row.bill_no || '');
    setEmployee(row.employee_id || '');
    setDesc(row.description || '');
    setAdvance(row.advance ? String(row.advance) : '0');
    setMeterRead(row.meter_reading || '');
    setMileage(row.mileage ? String(row.mileage) : '');
    setEffect(row.effect_asset || 'No');
  };

  return (
    <div className="p-6 space-y-6 print:p-0 print:bg-white">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="flex items-center gap-2 text-sm no-print"><span className="font-semibold">Dashboard</span><span>/</span><span>Credit</span><span>/</span><span>Add Credit</span></div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white no-print">
        <CardHeader className="space-y-4">
          <CardTitle className="text-white">Credit Sale</CardTitle>
          {/* Top metric boxes */}
          {/* ADVANCE pill like screenshot */}
          <div>
            <span className="inline-block bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded">ADVANCE</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="text-white text-sm">Total Amount Value</div>
              <Input className="bg-white text-black" value={creditAmt} readOnly />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Total Discount</div>
              <Input className="bg-white text-black" placeholder="0.00" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">MS</div>
              <Input className="bg-white text-black" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">HSD</div>
              <Input className="bg-white text-black" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">XP</div>
              <Input className="bg-white text-black" placeholder="0.00" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Date + shift row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-medium">Choose Date</span>
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => document.getElementById('credit_date')?.showPicker()}
              >
                {date || 'Date'}
              </button>
              <input
                id="credit_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="radio"
                  name="shift"
                  value="S-1"
                  checked={shift === "S-1"}
                  onChange={() => setShift("S-1")}
                  className="text-blue-600"
                />
                S-1
              </label>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="radio"
                  name="shift"
                  value="S-2"
                  checked={shift === "S-2"}
                  onChange={() => setShift("S-2")}
                  className="text-blue-600"
                />
                S-2
              </label>
            </div>
          </div>

          {/* AUTO-FILL boxed section */}
          <div className="border-2 border-blue-300 rounded p-4">
            <div className="text-white font-semibold mb-2">AUTO-FILL</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-white text-sm">Choose Organization</div>
                <Select value={org} onValueChange={setOrg}>
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Choose Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.organization_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-white text-sm">Choose Product</div>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Choose Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelProducts?.map((fuelProduct) => (
                      <SelectItem key={fuelProduct.id} value={fuelProduct.id}>
                        {fuelProduct.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-white text-sm">Choose Employee</div>
                <Select value={employee} onValueChange={setEmployee}>
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Choose Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.employee_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main row: exact order required */}
          <div className="grid grid-cols-9 gap-4">
            <div className="space-y-2">
              <div className="text-white text-sm">Choose Organization</div>
              <Select value={org} onValueChange={setOrg}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Organization" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.organization_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Vehicle No</div>
              <Input className="bg-white text-black" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Choose Product</div>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Product" />
                </SelectTrigger>
                <SelectContent>
                  {fuelProducts?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Price</div>
              <Input className="bg-white text-black" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Credit Amt</div>
              <Input className="bg-white text-black" value={creditAmt} onChange={(e) => setCreditAmt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Discount</div>
              <Input className="bg-white text-black" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Qty (Lts)</div>
              <Input className="bg-white text-black" type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Indent No</div>
              <Input className="bg-white text-black" value={indentNo} onChange={(e) => setIndentNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Misc. Charges</div>
              <Input className="bg-white text-black" type="number" step="0.01" value={misc} onChange={(e) => setMisc(e.target.value)} />
            </div>
          </div>

          {/* Upload Image */}
          <div className="space-y-2">
            <div className="text-white text-sm">Upload Image</div>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" className="bg-white text-black hover:bg-gray-100">
                <Upload className="h-4 w-4 mr-2" />
                Browse... No file selected.
              </Button>
              <span className="text-white text-sm">Allowed (JPEG, JPG, TIF, GIF, PNG) MaxSize:2MB</span>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="text-white text-sm">Bill No.</div>
              <Input className="bg-white text-black" placeholder="Bill No." value={billNo} onChange={(e) => setBillNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Employee</div>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Description</div>
              <Input className="bg-white text-black" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Advance</div>
              <Input className="bg-white text-black" type="number" step="0.01" placeholder="0.00" value={advance} onChange={(e) => setAdvance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Effect Asset</div>
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meter Reading and Mileage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-white text-sm">Meter Read</div>
              <Input className="bg-white text-black" placeholder="Meter Reading" value={meterRead} onChange={(e) => setMeterRead(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-white text-sm">Mileage</div>
              <div className="flex gap-2">
                <Input className="bg-white text-black" placeholder="Mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} />
                <Button type="button" variant="outline" className="bg-white text-black hover:bg-gray-100">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center">
            <Button onClick={onConfirm} className="bg-green-500 hover:bg-green-600 text-white px-8 py-2" disabled={createCreditSale.isPending}>
              {createCreditSale.isPending ? "Processing..." : "CONFIRM"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card className="bg-white print-area">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4 no-print">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Search From</span>
              <Input
                type="date"
                value={searchFromDate}
                onChange={(e) => setSearchFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">To</span>
              <Input
                type="date"
                value={searchToDate}
                onChange={(e) => setSearchToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Organization</span>
              <Select value={searchOrganization} onValueChange={setSearchOrganization}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.organization_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table and Actions */}
      <Card className="bg-white print-area">
        <CardContent className="pt-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-4 no-print">
            <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedRows.size > 0 && `(${selectedRows.size})`}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Direct Print
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Info", description: "Feature coming soon" })}>
              <FileText className="h-4 w-4 mr-2" />
              Add to Billing
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Info", description: "Feature coming soon" })}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="bg-green-500 text-white hover:bg-green-600" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600" onClick={handlePrint}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-medium">Filter:</span>
              <Input
                placeholder="Type to filter..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-48"
              />
            </div>
          </div>

          {/* Data Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="no-print">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={creditSalesRows.length > 0 && selectedRows.size === creditSalesRows.length}
                  />
                </TableHead>
                <TableHead>S.No</TableHead>
                <TableHead>Txn No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Org/Cust.</TableHead>
                <TableHead>Vehicle No</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost (₹)</TableHead>
                <TableHead>Discount (₹)</TableHead>
                <TableHead>Indent No</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Advance</TableHead>
                <TableHead>Picture</TableHead>
                <TableHead>Effect Asset</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="no-print">Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditSalesRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={22} className="text-center text-gray-500">
                    No credit sales data available. Process some credit sales to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                creditSalesRows.map((row, index) => (
                  <TableRow key={row.id || index}>
                    <TableCell className="no-print">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.id?.slice(-8) || '-'}</TableCell>
                    <TableCell>{row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-GB') : '-'}</TableCell>
                    <TableCell>{row.shift || '-'}</TableCell>
                    <TableCell>{row.organization_name || '-'}</TableCell>
                    <TableCell>{row.vehicle_number || '-'}</TableCell>
                    <TableCell>{row.product_name || '-'}</TableCell>
                    <TableCell>{row.employee_name || '-'}</TableCell>
                    <TableCell>{row.quantity ?? '-'}</TableCell>
                    <TableCell>{row.price_per_unit ?? '-'}</TableCell>
                    <TableCell>{row.total_amount ?? '-'}</TableCell>
                    <TableCell>{row.discount ?? '-'}</TableCell>
                    <TableCell>{row.indent_no || '-'}</TableCell>
                    <TableCell>{row.bill_no || '-'}</TableCell>
                    <TableCell>{row.advance ?? '-'}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{row.effect_asset ?? '-'}</TableCell>
                    <TableCell>{row.mileage ?? '-'}</TableCell>
                    <TableCell>{row.description || '-'}</TableCell>
                    <TableCell className="no-print">
                      <div className="flex items-center gap-4 justify-center">
                        <a href={`#edit-${row.id}`} onClick={(e) => { e.preventDefault(); startEdit(row); }} className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
                          <img src="https://ramkrishna.ymtsindia.in/assets/images/edit.png" alt="Edit" width={36} height={36} />
                        </a>
                        <a href={`#delete-${row.id}`} onClick={(e) => { e.preventDefault(); deleteCreditSale(row.id); }} className="p-2 rounded hover:bg-gray-100 w-10 h-10 flex items-center justify-center">
                          <img src="https://ramkrishna.ymtsindia.in/assets/images/delete.png" alt="Delete" width={36} height={36} />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{row.created_at ? `Created: ${new Date(row.created_at).toLocaleString()}` : '-'}</TableCell>
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
