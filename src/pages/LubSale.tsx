import { useEffect, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invalidateQueries } from "@/lib/cacheInvalidation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function LubSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [employee, setEmployee] = useState("");
  const [lubItem, setLubItem] = useState("");
  const [saleRate, setSaleRate] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saleType, setSaleType] = useState<"Cash" | "Credit">("Cash");
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string, employee_name: string }>>([]);
  const [lubricants, setLubricants] = useState<Array<{ id: string, product_name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");

  // Fetch lubricant sales data
  const { data: lubricantSalesData, refetch: refetchLubricantSales } = useQuery({
    queryKey: ["/api/lubricant-sales"],
    queryFn: async () => {
      const response = await fetch('/api/lubricant-sales');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch lubricant sales');
      return result.rows || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/lub-sales/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lubricant sale deleted successfully" });
      refetchLubricantSales();
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete" });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lubricant sale?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter logic
  const filteredRows = (lubricantSalesData || []).filter((row: any) => {
    if (!filterText) return true;
    const searchStr = filterText.toLowerCase();
    return (
      (row.product && row.product.toLowerCase().includes(searchStr)) ||
      (row.sale_type && row.sale_type.toLowerCase().includes(searchStr)) ||
      (row.shift && row.shift.toLowerCase().includes(searchStr)) ||
      (row.id && row.id.toLowerCase().includes(searchStr))
    );
  });

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r: any) => r.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      selectedIds.forEach(id => deleteMutation.mutate(id));
    }
  };

  const handlePrint = () => {
    console.log("Direct Print clicked (LubSale)");
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["S.No", "Txn No", "Sale Date", "Shift", "Product", "Sale Type"];
    const csvContent = [
      headers.join(","),
      ...filteredRows.map((row: any, idx: number) => [
        idx + 1,
        row.id?.slice(0, 4) || "",
        row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-',
        row.shift || "",
        `"${(row.product || "").replace(/"/g, '""')}"`,
        row.sale_type || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "lubricant_sales.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddToBilling = () => {
    toast({ title: "Coming Soon", description: "This feature is coming soon!" });
  };



  useEffect(() => {
    (async () => {
      await loadRows();
      await loadEmployees();
      await loadLubricants();
    })();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();

      if (!result.ok) {
        console.error('Error loading employees:', result.error);
        return;
      }

      const data = result.rows || [];
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadLubricants = async () => {
    try {
      const response = await fetch('/api/lubricants');
      const result = await response.json();

      if (!result.ok) {
        console.error('Error loading lubricants:', result.error);
        // Set some default options if no data found
        setLubricants([
          { id: 'default1', product_name: 'Engine Oil 5W-30' },
          { id: 'default2', product_name: 'Gear Oil SAE 90' },
          { id: 'default3', product_name: 'Brake Fluid DOT 4' }
        ]);
        return;
      }

      // Normalize the data to ensure we have product_name
      const data = result.rows || [];
      const normalizedData = data.map((item: any) => ({
        id: item.id,
        product_name: item.lubricant_name || item.product_name || item.name || 'Unknown Product'
      }));

      setLubricants(normalizedData);
    } catch (error) {
      console.error('Error loading lubricants:', error);
      // Set default options on error
      setLubricants([
        { id: 'default1', product_name: 'Engine Oil 5W-30' },
        { id: 'default2', product_name: 'Gear Oil SAE 90' },
        { id: 'default3', product_name: 'Brake Fluid DOT 4' }
      ]);
    }
  };

  const loadRows = async () => {
    try {
      const response = await fetch('/api/lub-sales');
      const result = await response.json();
      if (result.ok) {
        setRows((result.rows || []).slice(0, 25));
      }
    } catch (error) {
      console.error('Error loading lub sales:', error);
    }
  };

  const onConfirm = async () => {
    if (!lubItem || !employee || !saleDate) {
      toast({ title: "Missing fields", description: "Select product, employee and date", variant: "destructive" });
      return;
    }

    // Validate UUID format for employee (should be proper UUID, not 'emp1' or similar)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(employee)) {
      toast({
        title: "Invalid employee",
        description: "Please select a valid employee from the dropdown",
        variant: "destructive"
      });
      return;
    }

    const saleData = {
      sale_date: saleDate,
      shift,
      employee_id: employee,
      product: lubItem,
      sale_rate: saleRate ? Number(saleRate) : null,
      quantity: quantity ? Number(quantity) : null,
      discount: discount ? Number(discount) : 0,
      amount: amount ? Number(amount) : null,
      description,
      sale_type: saleType,
      created_by: null,
    };

    console.log('Saving lub sale with data:', saleData);

    try {
      const response = await fetch('/api/lubricant-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      const result = await response.json();

      if (!result.ok) {
        console.error('Save error:', result.error);
        toast({
          title: "Save failed",
          description: `Error: ${result.error}`,
          variant: "destructive"
        });
      } else {
        console.log('Lub sale saved successfully');
        toast({ title: "Saved", description: "Lubricant sale recorded successfully" });
        setSaleRate("");
        setQuantity("");
        setDiscount("0");
        setAmount("");
        setDescription("");
        // Don't reset lubItem and employee - keep them for convenience
        invalidateQueries.lubricantSale(queryClient);
        refetchLubricantSales();
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save lubricant sale",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .p-6 > .rounded-lg.border.bg-card.text-card-foreground.shadow-sm:last-child,
          .p-6 > .rounded-lg.border.bg-card.text-card-foreground.shadow-sm:last-child * {
            visibility: visible;
          }
          .p-6 > .rounded-lg.border.bg-card.text-card-foreground.shadow-sm:last-child {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Lubricants Sale</span></div>

      {/* Blue panel */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Lubricant Sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <span className="text-white font-medium">Choose Date</span>
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-gray-100"
                onClick={() => document.getElementById('lub_date')?.showPicker()}
              >
                {saleDate || 'Sale Date'}
              </button>
              <input
                id="lub_date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="hidden"
              />
            </div>
            <div className="h-10 col-span-3 px-3 flex items-center rounded-md bg-white text-black">Sale Date</div>
            <div className="col-span-4">
              <div className="flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift === 'S-1'} onChange={() => setShift('S-1')} /> S-1</label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift === 'S-2'} onChange={() => setShift('S-2')} /> S-2</label>
              </div>
            </div>
            <div className="col-span-3"><Input className="bg-white text-black" placeholder="" /></div>
          </div>

          {/* Auto-fill box */}
          <div className="rounded-lg border border-white/40 bg-white/10 p-4">
            <div className="text-sm opacity-90 mb-3">AUTO-FILL</div>
            <div className="grid grid-cols-2 gap-4">
              <Select value={lubItem} onValueChange={setLubItem}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="choose Item" /></SelectTrigger>
                <SelectContent>
                  {lubricants.map((lub) => (
                    <SelectItem key={lub.id} value={lub.id}>{lub.product_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry row */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3">
              <Select value={lubItem} onValueChange={setLubItem}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Select Product" /></SelectTrigger>
                <SelectContent>
                  {lubricants.map((lub) => (
                    <SelectItem key={lub.id} value={lub.id}>{lub.product_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input className="bg-white text-black col-span-2" placeholder="Sale Rat" value={saleRate} onChange={(e) => setSaleRate(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            <Input className="bg-white text-black col-span-2" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="col-span-1" />
            <div className="col-span-3">
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.employee_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description / Sale Type / Fill GST */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <Input className="bg-white text-black col-span-4" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="col-span-3 flex items-center gap-4">
              <span>Sale Type</span>
              <label className="flex items-center gap-2"><input type="radio" name="stype" checked={saleType === 'Cash'} onChange={() => setSaleType('Cash')} /> Cash</label>
              <label className="flex items-center gap-2"><input type="radio" name="stype" checked={saleType === 'Credit'} onChange={() => setSaleType('Credit')} /> Credit</label>
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <span>Fill GST</span>
              <Button size="sm" variant="secondary" className="text-black">Edit</Button>
              <Button size="sm" variant="secondary" className="text-black">+</Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={onConfirm} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">CONFIRM</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-6 gap-4">
            <div className="flex items-center gap-2"><span>Search From</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="flex items-center gap-2"><span>To Date</span><Input type="date" className="w-44" placeholder="Filter Date" /></div>
            <div className="flex items-center gap-2"><span>Product</span><Select><SelectTrigger className="w-56"><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent><SelectItem value="item1">Item 1</SelectItem></SelectContent></Select></div>
            <div className="flex items-center gap-2 col-span-2" />
            <div className="flex items-center gap-2"><Button className="bg-orange-500 hover:bg-orange-600">Search</Button></div>
          </div>
        </CardContent>
      </Card>

      {/* Actions + Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0}
              >
                Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </Button>
              <Button variant="outline" onClick={handlePrint}>Direct Print</Button>
              <Button variant="outline" onClick={handleAddToBilling}>Add to Billing</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-green-500 text-green-600" onClick={handleExportCSV}>CSV</Button>
              <Button variant="outline" size="sm" className="border-red-500 text-red-600" onClick={handlePrint}>PDF</Button>
              <div className="flex items-center gap-2 ml-4">
                <span>Filter:</span>
                <Input
                  placeholder="Type to filter..."
                  className="w-56"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead>S.No</TableHead>
                <TableHead>Txn No</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Sale Type</TableHead>
                <TableHead className="no-print">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No lubricant sales data available. Add some sales to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r: any, idx: number) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelection(r.id)}
                      />
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{r.id?.slice(0, 4)}</TableCell>
                    <TableCell>{r.sale_date ? new Date(r.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</TableCell>
                    <TableCell>{r.shift || '-'}</TableCell>
                    <TableCell>{r.product || '-'}</TableCell>
                    <TableCell>{r.sale_type || '-'}</TableCell>
                    <TableCell className="no-print">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} title="Delete">🗑️</Button>
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
