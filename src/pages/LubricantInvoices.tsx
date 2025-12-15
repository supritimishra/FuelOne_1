import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";

// Types
type Vendor = {
  id: string;
  name: string;
};

type InvoiceItem = {
  id: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
};

type Invoice = {
  id: string;
  date: string;
  invoiceNo: string;
  gst: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  discount: number;
  cashDiscount: number;
  amount: number;
  vendor: string;
  description: string;
  createdBy: string;
  createdAt: string;
  items: InvoiceItem[];
};

export default function LubricantInvoices() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [activeTab, setActiveTab] = useState<"invoice" | "item">("invoice");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [searchFrom, setSearchFrom] = useState<Date | undefined>(undefined);
  const [searchTo, setSearchTo] = useState<Date | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const vendors: Vendor[] = [
    { id: "1", name: "WIDE LUBRICANT" },
    { id: "2", name: "GULF LUBRICANTS" },
    { id: "3", name: "CASTROL" },
  ];

  // Mock data for invoices
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "1",
      date: format(new Date('2025-11-17'), 'dd-MMM-yyyy'),
      invoiceNo: "WL-12345678",
      gst: { cgst: 0.00, sgst: 9.00, igst: 0.00 },
      discount: 0.00,
      cashDiscount: 0.00,
      amount: 1200.00,
      vendor: "WIDE LUBRICANT",
      description: "Lubricant purchase",
      createdBy: "Super Admin",
      createdAt: new Date('2025-11-17').toISOString(),
      items: [
        {
          id: "1",
          productName: "Engine Oil 20W40",
          quantity: 2,
          rate: 600,
          amount: 1200,
          gstRate: 9,
          gstAmount: 108,
          totalAmount: 1308
        }
      ]
    },
    {
      id: "2",
      date: format(new Date('2025-11-03'), 'dd-MMM-yyyy'),
      invoiceNo: "GL-98765432",
      gst: { cgst: 4.50, sgst: 4.50, igst: 0.00 },
      discount: 100.00,
      cashDiscount: 50.00,
      amount: 32750.00,
      vendor: "GULF LUBRICANTS",
      description: "Bulk order",
      createdBy: "Admin",
      createdAt: new Date('2025-11-03').toISOString(),
      items: [
        {
          id: "2",
          productName: "Gear Oil 90",
          quantity: 50,
          rate: 650,
          amount: 32500,
          gstRate: 9,
          gstAmount: 2925,
          totalAmount: 35425
        }
      ]
    },
    {
      id: "3",
      date: format(new Date('2025-11-02'), 'dd-MMM-yyyy'),
      invoiceNo: "CS-11223344",
      gst: { cgst: 0.00, sgst: 0.00, igst: 9.00 },
      discount: 0.00,
      cashDiscount: 0.00,
      amount: 1500.00,
      vendor: "CASTROL",
      description: "Regular supply",
      createdBy: "Manager",
      createdAt: new Date('2025-11-02').toISOString(),
      items: [
        {
          id: "3",
          productName: "Brake Fluid",
          quantity: 10,
          rate: 150,
          amount: 1500,
          gstRate: 9,
          gstAmount: 135,
          totalAmount: 1635
        }
      ]
    }
  ]);

  // Filtered invoices based on search criteria
  const filteredInvoices = invoices.filter(invoice => {
    if (!searchFrom && !searchTo) return true;
    
    const invoiceDate = parse(invoice.date, 'dd-MMM-yyyy', new Date());
    
    if (searchFrom && invoiceDate < searchFrom) return false;
    if (searchTo) {
      const nextDay = new Date(searchTo);
      nextDay.setDate(nextDay.getDate() + 1);
      if (invoiceDate >= nextDay) return false;
    }
    
    return true;
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 2MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle invoice submission
  const handleSaveInvoice = async () => {
    if (!invoiceNo || !selectedVendor) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real app, you would upload the file and get a URL
      const fileUrl = selectedFile ? await uploadFile(selectedFile) : '';
      
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        date: format(invoiceDate, 'dd-MMM-yyyy'),
        invoiceNo,
        gst: { cgst: 0, sgst: 9, igst: 0 }, // Calculate based on your business logic
        discount: 0,
        cashDiscount: 0,
        amount: 0, // Calculate based on items
        vendor: vendors.find(v => v.id === selectedVendor)?.name || '',
        description,
        createdBy: "Current User", // Replace with actual user
        createdAt: new Date().toISOString(),
        items: []
      };

      // In a real app, you would call your API here
      // await api.createInvoice(newInvoice);
      
      setInvoices(prev => [newInvoice, ...prev]);
      
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      // Reset form
      setInvoiceNo('');
      setDescription('');
      setSelectedVendor('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file upload (mock implementation)
  const uploadFile = async (file: File): Promise<string> => {
    // In a real app, you would upload the file to your server
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/uploads/${file.name}`);
      }, 1000);
    });
  };

  // Handle invoice selection
  const handleViewItems = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab("item");
  };

  // Handle invoice deletion
  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const headers = [
      'S.No', 'Date', 'Invoice No', 'CGST', 'SGST', 'IGST', 
      'Discount', 'Cash Discount', 'Amount', 'Vendor', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map((inv, index) => (
        [
          index + 1,
          `"${inv.date}"`,
          `"${inv.invoiceNo}"`,
          inv.gst.cgst,
          inv.gst.sgst,
          inv.gst.igst,
          inv.discount,
          inv.cashDiscount,
          inv.amount,
          `"${inv.vendor}"`,
          `"${inv.description}"`
        ].join(',')
      ))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lubricant-invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle export to PDF (mock implementation)
  const handleExportPDF = () => {
    toast({
      title: "Export to PDF",
      description: "This would generate a PDF in a real implementation.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Lubricants Invoice Details</span>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "invoice" ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'}`}
          onClick={() => setActiveTab("invoice")}
        >
          Invoice
        </button>
        <button 
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "item" ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'}`}
          onClick={() => setActiveTab("item")}
        >
          Invoice Items
        </button>
      </div>

      {activeTab === "invoice" ? (
        <>
          {/* Invoice Form */}
          <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardHeader className="bg-blue-600 text-white py-3">
              <CardTitle className="text-lg font-medium">Invoice</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-blue-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !invoiceDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceDate ? format(invoiceDate, 'dd-MMM-yyyy') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={invoiceDate}
                          onSelect={(date) => date && setInvoiceDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Invoice No <span className="text-red-500">*</span></Label>
                  <Input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="Invoice No"
                    className="bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Upload Image</Label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex items-center gap-2 p-2 border rounded bg-white cursor-pointer hover:bg-gray-50">
                        <span className="text-sm text-gray-500 truncate">
                          {selectedFile ? selectedFile.name : "Choose File..."}
                        </span>
                        <Button type="button" size="sm" variant="outline" className="ml-auto">
                          Browse...
                        </Button>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Allowed file types: jpg, jpeg, png, pdf | Max size: 2MB</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-900 font-semibold">Select Vendor <span className="text-red-500">*</span></Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleSaveInvoice}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  SAVE
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search/Filter Section */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input 
                    type="date" 
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input 
                    type="date" 
                    value={searchTo}
                </div>
                <div className="flex items-end">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSearch}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Search
                    </Button>
                    {(searchFrom || searchTo) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchFrom(undefined);
                          setSearchTo(undefined);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 flex justify-between items-center bg-white border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Show:</span>
                  <select className="border rounded p-1 text-sm bg-white">
                    <option>All</option>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                      onClick={handleExportCSV}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                      onClick={handleExportPDF}
                    >
                      PDF
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Filter:</span>
                    <Input
                      placeholder="Type to filter..."
                      className="h-8 w-48"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12">S.No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Cash Discount</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Items View</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User Log Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice, index) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>{invoice.invoiceNo}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>CGST: {invoice.gst.cgst.toFixed(2)}</div>
                              <div>SGST: {invoice.gst.sgst.toFixed(2)}</div>
                              <div>IGST: {invoice.gst.igst.toFixed(2)}</div>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.discount.toFixed(2)}</TableCell>
                          <TableCell>{invoice.cashDiscount.toFixed(2)}</TableCell>
                          <TableCell>{invoice.amount.toFixed(2)}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{invoice.vendor}</TableCell>
                          <TableCell>{invoice.description}</TableCell>
                          <td className="px-4 py-2 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleViewItems(invoice)}
                            >
                              View Items
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.793.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            Created: {invoice.createdBy} {format(new Date(invoice.createdAt), 'dd-MM-yyyy hh:mm a')}
                          </td>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                          {invoices.length === 0 ? 'No invoices found' : 'No invoices match your search criteria'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing 1 to {filteredInvoices.length} of {invoices.length} entries
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-100">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                Invoice Items - {selectedInvoice?.invoiceNo}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedInvoice?.date} • {selectedInvoice?.vendor}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("invoice")}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Back to Invoices
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.print()}
                className="border-gray-300"
              >
                Print
              </Button>
            </div>
          </div>
          
          {selectedInvoice ? (
            <div className="space-y-6">
              {/* Invoice Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Invoice Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Invoice No:</span> {selectedInvoice.invoiceNo}</p>
                    <p><span className="text-gray-500">Date:</span> {selectedInvoice.date}</p>
                    <p><span className="text-gray-500">Vendor:</span> {selectedInvoice.vendor}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Tax Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">CGST (9%):</span> ₹{selectedInvoice.gst.cgst.toFixed(2)}</p>
                    <p><span className="text-gray-500">SGST (9%):</span> ₹{selectedInvoice.gst.sgst.toFixed(2)}</p>
                    <p><span className="text-gray-500">IGST (18%):</span> ₹{selectedInvoice.gst.igst.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Amount Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Subtotal:</span> ₹{(selectedInvoice.amount / 1.18).toFixed(2)}</p>
                    <p><span className="text-gray-500">GST (18%):</span> ₹{(selectedInvoice.amount * 0.18).toFixed(2)}</p>
                    <p className="font-medium"><span className="text-gray-500">Total:</span> ₹{selectedInvoice.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              {/* Items Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">GST %</TableHead>
                      <TableHead className="text-right">GST Amount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.gstRate}%</TableCell>
                          <TableCell className="text-right">₹{item.gstAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No items found in this invoice
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {selectedInvoice.items.length > 0 && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={4} className="text-right font-medium">Subtotal</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(selectedInvoice.amount / 1.18).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {selectedInvoice.gst.cgst > 0 && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={4} className="text-right">CGST (9%)</TableCell>
                        <TableCell className="text-right">
                          ₹{selectedInvoice.gst.cgst.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {selectedInvoice.gst.sgst > 0 && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={4} className="text-right">SGST (9%)</TableCell>
                        <TableCell className="text-right">
                          ₹{selectedInvoice.gst.sgst.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {selectedInvoice.gst.igst > 0 && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={4} className="text-right">IGST (18%)</TableCell>
                        <TableCell className="text-right">
                          ₹{selectedInvoice.gst.igst.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    <TableRow className="bg-gray-100 font-semibold">
                      <TableCell colSpan={4} className="text-right">Total Amount</TableCell>
                      <TableCell className="text-right">
                        ₹{selectedInvoice.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Additional Information */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Additional Information</h3>
                <p className="text-sm text-gray-600">
                  {selectedInvoice.description || 'No additional information provided.'}
                </p>
                <p className="mt-4 text-xs text-gray-500">
                  Created by {selectedInvoice.createdBy} on {format(new Date(selectedInvoice.createdAt), 'dd MMM yyyy hh:mm a')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No invoice selected</p>
              <p className="text-sm mt-2">Please select an invoice to view its details</p>
              <Button 
                onClick={() => setActiveTab("invoice")}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Back to Invoices
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
