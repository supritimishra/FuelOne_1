import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Download } from "lucide-react";

export default function CreditSale() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [ms, setMs] = useState<string>("0.00");
  const [hsd, setHsd] = useState<string>("0.00");
  const [xp, setXp] = useState<string>("0.00");
  const [advance, setAdvance] = useState<string>("0.00");
  const [autoFillOrganization, setAutoFillOrganization] = useState<string>("");
  const [autoFillProduct, setAutoFillProduct] = useState<string>("");
  const [autoFillEmployee, setAutoFillEmployee] = useState<string>("");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [product, setProduct] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [creditAmt, setCreditAmt] = useState<string>("0.00");
  const [discount, setDiscount] = useState<string>("0.00");
  const [qty, setQty] = useState<string>("");
  const [indentNo, setIndentNo] = useState<string>("");
  const [miscCharges, setMiscCharges] = useState<string>("0.00");
  const [billNo, setBillNo] = useState<string>("");
  const [employee, setEmployee] = useState<string>("");
  const [effect, setEffect] = useState<string>("");
  const [no, setNo] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [meterRead, setMeterRead] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");

  // Search and filter states
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [searchOrganization, setSearchOrganization] = useState<string>("");
  const [filterText, setFilterText] = useState<string>("");

  // Fetch data
  const { data: customers } = useQuery({
    queryKey: ["/api/credit-customers"],
    queryFn: async () => {
      const response = await fetch('/api/credit-customers', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch customers');
      return result.rows || [];
    },
  });

  const { data: fuelProducts } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
  });

  const { data: creditSalesData, refetch } = useQuery({
    queryKey: ["/api/credit-sales"],
    queryFn: async () => {
      const response = await fetch('/api/credit-sales', { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch credit sales');
      return result.rows || [];
    },
  });

  const creditSalesRows = creditSalesData || [];

  // Calculate credit amount
  useEffect(() => {
    const calculated = (parseFloat(qty) || 0) * (parseFloat(price) || 0);
    setCreditAmt(calculated.toFixed(2));
  }, [qty, price]);

  const createCreditSale = useMutation({
    mutationFn: async () => {
      const saleData = {
        credit_customer_id: autoFillOrganization,
        fuel_product_id: autoFillProduct,
        vehicle_number: vehicleNo,
        quantity: parseFloat(qty) || 0,
        price_per_unit: parseFloat(price) || 0,
        discount: parseFloat(discount) || 0,
        indent_no: indentNo,
        misc_charges: parseFloat(miscCharges) || 0,
        bill_no: billNo,
        employee_id: employee,
        description: description,
        meter_reading: meterRead,
        mileage: parseFloat(mileage) || 0,
        sale_date: date,
        shift: shift,
      };

      const response = await fetch('/api/credit-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(saleData)
      });
      const result = await response.json();

      if (!result.ok) throw new Error(result.error || 'Failed to save credit sale');
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credit sale saved successfully",
      });
      // Reset form
      setVehicleNo("");
      setProduct("");
      setPrice("");
      setQty("");
      setDiscount("0.00");
      setIndentNo("");
      setMiscCharges("0.00");
      setBillNo("");
      setEmployee("");
      setEffect("");
      setNo("");
      setDescription("");
      setMeterRead("");
      setMileage("");
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCreditSale = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/credit-sales/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to delete credit sale');
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Credit sale deleted successfully" });
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this credit sale?")) {
      deleteCreditSale.mutate(id);
    }
  };

  const handleConfirm = () => {
    if (!autoFillOrganization || !autoFillProduct || !qty || !price) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    createCreditSale.mutate();
  };

  const handleAddRow = () => {
    // Logic to add row to a rows array
    // This would typically add to a state array
  };

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(creditSalesRows.map((row: any) => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast({ title: "Warning", description: "No items selected", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} items?`)) return;

    try {
      await Promise.all(Array.from(selectedRows).map(id =>
        fetch(`/api/credit-sales/${id}`, { method: 'DELETE', credentials: 'include' })
      ));
      toast({ title: "Success", description: "Selected items deleted successfully" });
      setSelectedRows(new Set());
      refetch();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete some items", variant: "destructive" });
    }
  };

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
    link.download = `credit_sales_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 bg-blue-50 print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Title */}
      <div className="flex items-center gap-2 text-sm no-print">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Credit Sale</span>
      </div>

      {/* Main Card */}
      <Card className="bg-blue-500 border-none no-print">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Credit Sale</CardTitle>
        </CardHeader>
        <CardContent className="bg-blue-500 text-white pt-6">
          {/* ADVANCE pill label */}
          <div className="mb-2">
            <span className="inline-block bg-orange-600 text-white font-bold px-3 py-1 rounded">ADVANCE</span>
          </div>

          {/* Row 1: Advance value, MS, HSD, XP */}
          <div className="grid grid-cols-9 gap-4 mb-4">
            <Input
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
              className="bg-white text-black"
              readOnly
            />
            {/* MS */}
            <div className="col-span-2">
              <Label className="text-white">MS</Label>
              <Input
                value={ms}
                onChange={(e) => setMs(e.target.value)}
                className="bg-white text-black"
                readOnly
              />
            </div>
            {/* HSD */}
            <div className="col-span-2">
              <Label className="text-white">HSD</Label>
              <Input
                value={hsd}
                onChange={(e) => setHsd(e.target.value)}
                className="bg-white text-black"
                readOnly
              />
            </div>
            {/* XP */}
            <div className="col-span-2">
              <Label className="text-white">XP</Label>
              <Input
                value={xp}
                onChange={(e) => setXp(e.target.value)}
                className="bg-white text-black"
                readOnly
              />
            </div>
          </div>

          {/* Row 2: Choose Date and Shift */}
          <div className="grid grid-cols-12 gap-4 items-center mb-4">
            <div className="bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-center col-span-2">
              Choose Date
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48 h-10 bg-white text-black col-span-3"
            />
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shift"
                  checked={shift === 'S-1'}
                  onChange={() => setShift('S-1')}
                  className="w-4 h-4"
                />
                <span>S-1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shift"
                  checked={shift === 'S-2'}
                  onChange={() => setShift('S-2')}
                  className="w-4 h-4"
                />
                <span>S-2</span>
              </label>
            </div>
          </div>

          {/* Main Form: Row 1 (Organization → Misc. Charges) */}
          <div className="grid grid-cols-9 gap-4 mb-4">
            <div>
              <Label className="text-white">Choose Organization</Label>
              <Select value={autoFillOrganization} onValueChange={setAutoFillOrganization}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Organization" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.organization_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Vehicle No</Label>
              <Input
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-white">Choose Product</Label>
              <Select value={autoFillProduct} onValueChange={setAutoFillProduct}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Product" />
                </SelectTrigger>
                <SelectContent>
                  {fuelProducts?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-white">Credit Amt</Label>
              <Input value={creditAmt} readOnly className="bg-white text-black" />
            </div>
            <div>
              <Label className="text-white">Discount</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-white">Qty (Lts)</Label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-white">Indent No</Label>
              <Input value={indentNo} onChange={(e) => setIndentNo(e.target.value)} className="bg-white text-black" />
            </div>
            <div>
              <Label className="text-white">Misc.Charges</Label>
              <Input
                type="number"
                value={miscCharges}
                onChange={(e) => setMiscCharges(e.target.value)}
                className="bg-white text-black"
              />
            </div>
          </div>

          {/* Main Form: Row 2 (Bill No → Mileage) */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            <div>
              <Label className="text-white">Bill no.</Label>
              <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} className="bg-white text-black" />
            </div>
            <div>
              <Label className="text-white">Upload Image</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="bg-white text-black hover:bg-gray-100">Browse...</Button>
                <span className="text-white text-xs">Allowed (JPEG, JPG, TIF, GIF, PNG) MaxSize:2MB</span>
              </div>
            </div>
            <div>
              <Label className="text-white">Employee</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="Choose Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Effect</Label>
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger className="bg-white text-black">
                  <SelectValue placeholder="choose Effect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white text-black" />
            </div>
            <div>
              <Label className="text-white">Meter Read</Label>
              <Input value={meterRead} onChange={(e) => setMeterRead(e.target.value)} className="bg-white text-black" />
            </div>
            <div>
              <Label className="text-white">Mileage</Label>
              <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="bg-white text-black" />
            </div>
          </div>

          {/* CONFIRM Button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleConfirm}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full"
              disabled={createCreditSale.isPending}
            >
              {createCreditSale.isPending ? "Processing..." : "CONFIRM"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card className="print-area">
        <CardHeader className="no-print">
          <CardTitle>Credit Sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 no-print">
            <div className="flex items-center gap-2">
              <span className="text-sm">Search From</span>
              <Input
                type="date"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-40"
              />
              <span className="text-sm">To</span>
              <Input
                type="date"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-40"
              />
              <Select value={searchOrganization} onValueChange={setSearchOrganization}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.organization_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Search className="h-4 w-4 mr-2" />
                Q Search
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between no-print">
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedRows.size > 0 && `(${selectedRows.size})`}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline">Copy</Button>
              <Button variant="outline" className="bg-green-100" onClick={handleExportCSV}>CSV</Button>
              <Button variant="outline" className="bg-red-100" onClick={handlePrint}>PDF</Button>
              <Button variant="outline" onClick={handlePrint}>Print</Button>
            </div>
          </div>

          {/* Filter Input */}
          <div className="flex items-center gap-2 no-print">
            <span className="text-sm">Filter:</span>
            <Input
              placeholder="Type to filter..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-56"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 no-print">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={creditSalesRows.length > 0 && selectedRows.size === creditSalesRows.length}
                    />
                  </th>
                  <th className="text-left p-2">S.No</th>
                  <th className="text-left p-2">Txn No</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Shift</th>
                  <th className="text-left p-2">Org/Cust.</th>
                  <th className="text-left p-2">Vehicle No</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Employee</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Cost (₹)</th>
                  <th className="text-left p-2">Discount (₹)</th>
                  <th className="text-left p-2">Indent No</th>
                  <th className="text-left p-2">Bill No</th>
                  <th className="text-left p-2">Advance</th>
                  <th className="text-left p-2">Picture</th>
                  <th className="text-left p-2">Effect Asset</th>
                  <th className="text-left p-2">Mileage</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2 no-print">Action</th>
                  <th className="text-left p-2">User Log Details</th>
                </tr>
              </thead>
              <tbody>
                {creditSalesRows.length === 0 ? (
                  <tr>
                    <td colSpan={22} className="text-center p-4 text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  creditSalesRows.map((row: any, idx: number) => (
                    <tr key={row.id} className="border-b">
                      <td className="p-2 no-print">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </td>
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{row.transaction_number || row.id?.slice(-8) || '-'}</td>
                      <td className="p-2">{row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</td>
                      <td className="p-2">{row.shift || 'S-1'}</td>
                      <td className="p-2">{row.organization_name || '-'}</td>
                      <td className="p-2">{row.vehicle_number || '0'}</td>
                      <td className="p-2">{row.product_name || '-'}</td>
                      <td className="p-2">{row.employee_name || '-'}</td>
                      <td className="p-2">{Number(row.quantity || 0).toFixed(2)}</td>
                      <td className="p-2">{Number(row.price_per_unit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2">₹{Number(row.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2">₹{Number(row.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2">{row.indent_no || '0'}</td>
                      <td className="p-2">{row.bill_no || '0'}</td>
                      <td className="p-2">{row.advance || '0'}</td>
                      <td className="p-2">-</td>
                      <td className="p-2">-</td>
                      <td className="p-2">{row.mileage || '-'}</td>
                      <td className="p-2">{row.description || '-'}</td>
                      <td className="p-2 no-print">
                        <Button size="sm" variant="ghost">Edit</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </Button>
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        Created: Super Admin {row.created_at ? new Date(row.created_at).toLocaleString('en-GB') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
