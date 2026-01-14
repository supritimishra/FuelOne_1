import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

// Types
interface LubricantProduct {
  id: string;
  lubricant_name: string;
  sale_rate: number;
  gst_percentage?: number;
}

interface Employee {
  id: string;
  employee_name: string;
}

export default function LubSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Global State
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<string>("S-1");

  // Form State
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [saleRate, setSaleRate] = useState<string>("0");
  const [quantity, setQuantity] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [amount, setAmount] = useState<string>("0");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [saleType, setSaleType] = useState<string>("Cash");

  // GST Modal State
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstDetails, setGstDetails] = useState({
    tinGstNo: "",
    name: "",
    billNo: ""
  });

  // Filter State
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchProduct, setSearchProduct] = useState("All");
  const [filterText, setFilterText] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Data Queries
  const { data: lubricants = [] } = useQuery<LubricantProduct[]>({
    queryKey: ["/api/lubricants"],
    queryFn: async () => {
      const res = await fetch("/api/lubricants");
      if (!res.ok) return [];
      const json = await res.json();
      return json.rows || [];
    }
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) return [];
      const json = await res.json();
      return json.rows || [];
    }
  });

  const { data: sales = [], refetch } = useQuery({
    queryKey: ["/api/lubricant-sales", searchFrom, searchTo, searchProduct],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFrom) params.append("from_date", searchFrom);
      if (searchTo) params.append("to_date", searchTo);
      if (searchProduct && searchProduct !== "All") params.append("product", searchProduct);

      const res = await fetch(`/api/lubricant-sales?${params.toString()}`);
      const json = await res.json();
      return json.rows || [];
    }
  });

  // Derived State
  useEffect(() => {
    // Auto-calculate Amount
    const qty = parseFloat(quantity) || 0;
    const rate = parseFloat(saleRate) || 0;
    const disc = parseFloat(discount) || 0;
    const total = (qty * rate) - disc;
    setAmount(total > 0 ? total.toFixed(2) : "0");
  }, [quantity, saleRate, discount]);

  // Handlers
  const handleProductSelect = (val: string) => {
    setSelectedProduct(val);
    const prod = lubricants.find(p => p.lubricant_name === val);
    if (prod) {
      setSaleRate(prod.sale_rate?.toString() || "0");
    }
  };

  const handleConfirm = async () => {
    if (!selectedProduct || !quantity || !selectedEmployee) {
      toast({ title: "Validation Error", description: "Product, Quantity and Employee are required", variant: "destructive" });
      return;
    }

    try {
      // Find GST from Product
      const prod = lubricants.find(p => p.lubricant_name === selectedProduct);
      const gstVal = prod?.gst_percentage || 0;

      const payload = {
        saleDate: saleDate,
        shift: shift,
        product: selectedProduct,
        saleRate: saleRate?.toString() || "0",
        quantity: quantity?.toString() || "0",
        discount: discount?.toString() || "0",
        amount: amount?.toString() || "0",
        employeeId: selectedEmployee,
        description: description || "",
        saleType: saleType,
        gst: gstVal?.toString() || "0",
        customerName: gstDetails.name || null,
        tinGstNo: gstDetails.tinGstNo || null,
        billNo: gstDetails.billNo || null
      };

      console.log("Submitting payload:", payload);

      const res = await fetch("/api/lubricant-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success) {
        toast({ title: "Success", description: "Sale saved successfully" });
        refetch();
        setQuantity("");
        setDiscount("0");
        setAmount("0");
        setDescription("");
        setGstDetails({ tinGstNo: "", name: "", billNo: "" });
      } else {
        console.error("Save Error:", json.error);
        throw new Error(json.error || "Failed to save");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await fetch(`/api/lubricant-sales/${id}`, { method: 'DELETE' });
      refetch();
      toast({ title: "Deleted", description: "Entry deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} items?`)) return;

    // Ideally sequential or bulk API. Using loop for now for simplicity based on existing routes
    for (const id of selectedIds) {
      await fetch(`/api/lubricant-sales/${id}`, { method: 'DELETE' });
    }
    setSelectedIds([]);
    refetch();
    toast({ title: "Batch Delete", description: "Items deleted" });
  };

  const filteredSales = sales.filter((s: any) => {
    if (!filterText) return true;
    const lower = filterText.toLowerCase();
    return s.product?.toLowerCase().includes(lower) ||
      s.employeeName?.toLowerCase().includes(lower) ||
      s.shift?.toLowerCase().includes(lower);
  });

  return (
    <div className="p-4 space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <span className="font-semibold text-gray-700">Dashboard</span>
        <span>/</span>
        <span>Lubricants Sale</span>
      </div>

      {/* Main Form Card */}
      <div className="bg-blue-600 rounded-lg p-6 text-white shadow-lg space-y-6">
        <div className="text-2xl font-bold">Lubricant Sales</div>

        {/* Top Row: Date & Shift */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white rounded overflow-hidden h-10 w-auto">
            <div className="bg-blue-800 text-white px-4 h-full flex items-center font-bold text-sm">Choose Date</div>
            <Input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="border-none text-black h-full rounded-none focus-visible:ring-0 w-40"
            />
            <div className="border-l border-gray-300 h-full flex items-center px-4 text-black bg-gray-50 text-sm font-medium w-32">
              {saleDate || "Sale Date"}
            </div>
          </div>

          <div className="flex bg-blue-700/50 rounded p-1 gap-4 px-4 border border-blue-400">
            {['S-1', 'S-2'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${shift === s ? 'bg-white' : ''}`}>
                  {shift === s && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <span className="font-bold">{s}</span>
                <input type="radio" className="hidden" checked={shift === s} onChange={() => setShift(s)} />
              </label>
            ))}
          </div>
        </div>

        {/* Auto Fill Box */}
        <div className="bg-blue-700/40 border border-blue-400/30 rounded-lg p-4 relative mt-4">
          <div className="absolute -top-3 left-4 text-xs font-bold text-blue-100 bg-blue-600 px-2">AUTO-FILL</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <Select value={selectedProduct} onValueChange={handleProductSelect}>
              <SelectTrigger className="bg-white text-gray-900 border-none h-10">
                <SelectValue placeholder="choose Item" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {lubricants.map((l) => (
                  <SelectItem key={l.id} value={l.lubricant_name}>{l.lubricant_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="bg-white text-gray-900 border-none h-10">
                <SelectValue placeholder="Choose Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <Select value={selectedProduct} onValueChange={handleProductSelect}>
              <SelectTrigger className="bg-white text-gray-900 border-none h-10 font-semibold">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {lubricants.map((l) => (
                  <SelectItem key={l.id} value={l.lubricant_name}>{l.lubricant_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input
              placeholder="Sale Rate"
              value={saleRate}
              onChange={e => setSaleRate(e.target.value)}
              className="bg-white text-black h-10"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              placeholder="Quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="bg-white text-black h-10"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              placeholder="Discount"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="bg-white text-black h-10"
            />
          </div>
          <div className="md:col-span-3">
            <Input
              placeholder="Amount"
              value={amount}
              readOnly
              className="bg-white text-black font-bold h-10"
            />
          </div>
        </div>

        {/* Second Row of Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-3">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="bg-white text-gray-900 border-none h-10">
                <SelectValue placeholder="Choose Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-white text-black h-10"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold whitespace-nowrap">Sale Type</span>
            <RadioGroup defaultValue="Cash" value={saleType} onValueChange={setSaleType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cash" id="r-cash" className="border-white text-white" />
                <Label htmlFor="r-cash" className="cursor-pointer font-bold">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Credit" id="r-credit" className="border-white text-white" />
                <Label htmlFor="r-credit" className="cursor-pointer font-bold">Credit</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Fill GST</span>
            <Button size="sm" className="bg-white text-black hover:bg-gray-100 h-8 px-3 font-bold" onClick={() => setShowGstModal(true)}>Edit</Button>
            <Button size="sm" className="bg-white text-black hover:bg-gray-100 h-8 w-8 p-0 font-bold" onClick={() => setShowGstModal(true)}>+</Button>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleConfirm}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-12 h-11 rounded-full text-md shadow-lg"
          >
            CONFIRM
          </Button>
        </div>
      </div>

      {/* Search Bar Section */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500">Search From</span>
            <Input type="date" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} className="h-9 w-36 bg-gray-50" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-500">To Date</span>
            <Input type="date" value={searchTo} onChange={e => setSearchTo(e.target.value)} className="h-9 w-36 bg-gray-50" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs font-bold text-gray-500">Product</span>
            <Select value={searchProduct} onValueChange={setSearchProduct}>
              <SelectTrigger className="h-9 bg-gray-50">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Products</SelectItem>
                {lubricants.map((l) => (
                  <SelectItem key={l.id} value={l.lubricant_name}>{l.lubricant_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end">
            <Button onClick={() => refetch()} className="bg-orange-500 hover:bg-orange-600 h-9 px-8 font-bold text-white mt-5">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button variant="destructive" className="h-9 bg-red-400 hover:bg-red-500 border-none text-white px-6" onClick={handleBulkDelete}>Delete</Button>
          <Button variant="outline" className="h-9 text-gray-600 border-gray-300 font-bold bg-white">Direct Print</Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 border-green-500 text-green-600 font-bold px-3">CSV</Button>
            <Button variant="outline" className="h-8 border-red-500 text-red-600 font-bold px-3">PDF</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600">Filter:</span>
            <Input
              placeholder="Type to filter..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="h-9 w-48 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-hidden border">
        <Table>
          <TableHeader className="bg-white border-b">
            <TableRow className="h-10 hover:bg-transparent">
              <TableHead className="w-10 text-center"><Checkbox /></TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">S.No</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Txn No</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Sale Date</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Shift</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Product</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Sale Type</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">Quantity</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-right">Rate</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-right">Amount</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">Discount</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">Indent No</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Employee</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">Action</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow><TableCell colSpan={15} className="text-center py-10 text-gray-400">No lubricant sales data available. Add some sales to see them here.</TableCell></TableRow>
            ) : (
              filteredSales.map((row: any, i: number) => (
                <TableRow key={row.id} className="hover:bg-blue-50/30 border-b border-gray-100 h-10">
                  <TableCell className="text-center py-2">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds([...selectedIds, row.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== row.id));
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center text-xs py-2">{i + 1}</TableCell>
                  <TableCell className="text-xs font-mono py-2 text-gray-600">L{1000 + i}</TableCell>
                  <TableCell className="text-xs py-2 text-gray-700">
                    {(row.sale_date && !isNaN(new Date(row.sale_date).getTime()))
                      ? format(new Date(row.sale_date), 'dd-MMM-yyyy')
                      : (row.sale_date || "-")}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-gray-700">{row.shift}</TableCell>
                  <TableCell className="text-xs font-medium py-2 text-gray-800">{row.product}</TableCell>
                  <TableCell className="text-xs py-2 text-gray-700">{row.sale_type}</TableCell>
                  <TableCell className="text-xs text-center py-2 text-gray-700">{row.quantity}</TableCell>
                  <TableCell className="text-xs text-right py-2 text-gray-700">{row.sale_rate}</TableCell>
                  <TableCell className="text-xs text-right font-bold py-2 text-gray-800">{row.amount}</TableCell>
                  <TableCell className="text-xs text-center py-2 text-gray-700">{row.discount}</TableCell>
                  <TableCell className="text-xs text-center py-2 text-gray-700">0</TableCell>
                  <TableCell className="text-xs py-2 text-gray-700">{row.employeeName}</TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-gray-100" onClick={() => setShowGstModal(true)}>
                        <Edit className="w-3 h-3 text-gray-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-gray-100" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-2 text-gray-500 truncate max-w-[150px]">{row.description}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex justify-between items-center p-3 border-t">
          <span className="text-xs text-gray-500">Showing {filteredSales.length} of {filteredSales.length} entries</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 w-8 p-0" disabled>&lt;</Button>
            <Button variant="outline" size="sm" className="h-7 w-8 p-0 bg-gray-100 font-bold border-gray-300">1</Button>
            <Button variant="outline" size="sm" className="h-7 w-8 p-0" disabled>&gt;</Button>
          </div>
        </div>
      </div>

      {/* GST Modal */}
      <Dialog open={showGstModal} onOpenChange={setShowGstModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Fill GST Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gstNo" className="text-right font-bold">GST No</Label>
              <Input id="gstNo" value={gstDetails.tinGstNo} onChange={e => setGstDetails({ ...gstDetails, tinGstNo: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cName" className="text-right font-bold">Name</Label>
              <Input id="cName" value={gstDetails.name} onChange={e => setGstDetails({ ...gstDetails, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bNo" className="text-right font-bold">Bill No</Label>
              <Input id="bNo" value={gstDetails.billNo} onChange={e => setGstDetails({ ...gstDetails, billNo: e.target.value })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGstModal(false)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
