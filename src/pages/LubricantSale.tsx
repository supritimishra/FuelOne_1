import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function LubricantSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");
  const [lubricantItem, setLubricantItem] = useState("");
  const [employee, setEmployee] = useState("");
  const [lubItem, setLubItem] = useState("");
  const [saleRate, setSaleRate] = useState("");
  const [description, setDescription] = useState("");
  const [saleType, setSaleType] = useState<"Cash" | "Credit">("Cash");
  const [quantity, setQuantity] = useState("");
  const [discount, setDiscount] = useState("0");
  const [amount, setAmount] = useState("0.00");
  const [employee2, setEmployee2] = useState("");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
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

  const rows = lubricantSalesData || [];

  const handleConfirm = () => {
    if (!lubItem || !quantity || !saleRate) {
      toast({ title: "Missing fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    toast({ title: "Lubricant sale confirmed successfully" });
    // Reset form
    setLubItem("");
    setSaleRate("");
    setQuantity("");
    setDiscount("0");
    setAmount("0.00");
    setDescription("");
    refetchLubricantSales();
  };

  const handleSearch = () => {
    refetchLubricantSales();
  };

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
  const filteredRows = rows.filter((row: any) => {
    if (!filterText) return true;
    const searchStr = filterText.toLowerCase();
    return (
      (row.product_name && row.product_name.toLowerCase().includes(searchStr)) ||
      (row.employee_name && row.employee_name.toLowerCase().includes(searchStr)) ||
      (row.sale_type && row.sale_type.toLowerCase().includes(searchStr)) ||
      (row.shift && row.shift.toLowerCase().includes(searchStr)) ||
      (row.description && row.description.toLowerCase().includes(searchStr))
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
    console.log("Bulk Delete clicked", selectedIds);
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      selectedIds.forEach(id => deleteMutation.mutate(id));
      setSelectedIds([]);
    }
  };

  const handlePrint = () => {
    console.log("Direct Print clicked");
    window.print();
  };

  const handleExportCSV = () => {
    console.log("Export CSV clicked");
    const headers = ["S.No", "Txn No", "Sale Date", "Shift", "Product", "Sale Type", "Quantity", "Rate", "Amount", "Discount", "Indent No", "Employee", "Description"];
    const csvContent = [
      headers.join(","),
      ...filteredRows.map((row: any, idx: number) => [
        idx + 1,
        `L${768 - idx}`,
        row.sale_date || "",
        row.shift || "",
        row.product_name || "",
        row.sale_type || "",
        row.quantity || "",
        row.rate || "",
        row.amount || "",
        row.discount || "",
        row.indent_no || "",
        row.employee_name || "",
        `"${(row.description || "").replace(/"/g, '""')}"`
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
    console.log("Add to Billing clicked");
    toast({ title: "Coming Soon", description: "This feature is coming soon!" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-red-500 text-white p-2 text-center font-bold">DEBUG MODE: V2 (Check Console)</div>
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

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Sale
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white">
          Lub Sale
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Swipe
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Credit
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Expenses
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Recovery
        </button>
        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800">
          Day Settlement
        </button>
      </div>

      {/* Lubricant Sales Form - Blue Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white text-xl">Lubricant Sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top Row */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center gap-3">
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-yellow-400 text-black font-medium hover:bg-yellow-300"
                onClick={() => document.getElementById('lub_sale_date')?.showPicker()}
              >
                Choose Date
              </button>
              <input
                id="lub_sale_date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="hidden"
              />
              <Input
                type="text"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                placeholder="Sale Date"
                className="bg-white text-black"
              />
            </div>
          </div>

          {/* AUTO FILL Section */}
          <div className="bg-gray-200 p-3 rounded-md">
            <div className="text-black font-medium mb-2">AUTO FILL</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="text"
                  value={lubricantItem}
                  onChange={(e) => setLubricantItem(e.target.value)}
                  placeholder="choose item"
                  className="bg-white text-black"
                />
              </div>
              <div>
                <Input
                  type="text"
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  placeholder="Choose Employee"
                  className="bg-white text-black"
                />
              </div>
            </div>
          </div>

          {/* Sale Details */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">
              <Input
                type="text"
                value={lubItem}
                onChange={(e) => setLubItem(e.target.value)}
                placeholder="Select Product"
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                value={saleRate}
                onChange={(e) => setSaleRate(e.target.value)}
                placeholder="Sale Rate"
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2 flex items-center space-x-4">
              <div className="flex space-x-2">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="saleType"
                    value="Cash"
                    checked={saleType === "Cash"}
                    onChange={(e) => setSaleType(e.target.value as "Cash" | "Credit")}
                    className="mr-2"
                  />
                  Cash
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="saleType"
                    value="Credit"
                    checked={saleType === "Credit"}
                    onChange={(e) => setSaleType(e.target.value as "Cash" | "Credit")}
                    className="mr-2"
                  />
                  Credit
                </label>
              </div>
            </div>
          </div>

          {/* Quantity and Pricing */}
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2 flex items-center space-x-4">
              <div className="flex space-x-2">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="shift"
                    value="S-1"
                    checked={shift === "S-1"}
                    onChange={(e) => setShift(e.target.value as "S-1" | "S-2")}
                    className="mr-2"
                  />
                  S-1
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    name="shift"
                    value="S-2"
                    checked={shift === "S-2"}
                    onChange={(e) => setShift(e.target.value as "S-1" | "S-2")}
                    className="mr-2"
                  />
                  S-2
                </label>
              </div>
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Discount"
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="bg-white text-black"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="text"
                value={employee2}
                onChange={(e) => setEmployee2(e.target.value)}
                placeholder="Choose Employee"
                className="bg-white text-black"
              />
            </div>
          </div>

          {/* GST and Confirm */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white">Fill GST</span>
              <Button size="sm" className="bg-gray-500 hover:bg-gray-400 text-white">📄</Button>
              <Button size="sm" className="bg-gray-500 hover:bg-gray-400 text-white">+</Button>
            </div>
            <Button
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              CONFIRM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search/Filter Section */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-4 gap-4">
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
              <span>Filter Date</span>
              <Input
                placeholder="Filter Date"
                type="date"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To Date</span>
              <Input
                placeholder="Filter Date"
                type="date"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Filter Date</span>
              <Input
                placeholder="Filter Date"
                type="date"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span>Product</span>
              <Select value={searchProduct} onValueChange={setSearchProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servo">SERVO CHHAKADA OIL 20W40 1.2LL</SelectItem>
                  <SelectItem value="servo4t">SERVO 4T XTRA 10W,30 1L</SelectItem>
                  <SelectItem value="servosuper">SERVO SUPER 20,40 MG 1L</SelectItem>
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

      {/* Table Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0}
              >
                Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </Button>
              <button
                className="px-4 py-2 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 text-black"
                onClick={() => {
                  console.log("HTML Direct Print clicked");
                  window.print();
                }}
              >
                Direct Print (HTML)
              </button>
              <Button variant="outline" onClick={handleAddToBilling}>Add to Billing</Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span>Show:</span>
                <Select>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <TableHead>Quantity</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Indent No</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="no-print">Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground">
                    No lubricant sales data available
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r: any, idx: number) => (
                  <TableRow key={r.id || idx}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelection(r.id)}
                      />
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>L{768 - idx}</TableCell>
                    <TableCell>{r.sale_date || new Date().toISOString().slice(0, 10)}</TableCell>
                    <TableCell>{r.shift || shift}</TableCell>
                    <TableCell>{r.product_name || ['SERVO CHHAKADA OIL 20W40 1.2LL', 'SERVO 4T XTRA 10W,30 1L', 'SERVO SUPER 20,40 MG 1L'][idx % 3]}</TableCell>
                    <TableCell>{r.sale_type || saleType}</TableCell>
                    <TableCell>{r.quantity || '1'}</TableCell>
                    <TableCell>{r.rate || ['700', '400', '280'][idx % 3]}</TableCell>
                    <TableCell>{r.amount || (parseInt(r.quantity || '1') * parseFloat(r.rate || ['700', '400', '280'][idx % 3])).toFixed(2)}</TableCell>
                    <TableCell>{r.discount || '0'}</TableCell>
                    <TableCell>{r.indent_no || '0'}</TableCell>
                    <TableCell>{r.employee_name || ['Barun', 'Krishna'][idx % 2]}</TableCell>
                    <TableCell className="no-print">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" title="Edit">✏️</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)} disabled={deleteMutation.isPending} title="Delete">🗑️</Button>
                      </div>
                    </TableCell>
                    <TableCell>{r.description || '-'}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        Created: Super Admin {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing 1 to 40 of 40 entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>←</Button>
              <Button variant="outline" size="sm" className="bg-blue-500 text-white">1</Button>
              <Button variant="outline" size="sm" disabled>→</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}