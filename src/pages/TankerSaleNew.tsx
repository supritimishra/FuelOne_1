import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Fuel, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TankerSaleData {
  id: string;
  s_no: number;
  dump_date: string;
  tank: string;
  before_dip: number;
  before_stock: number;
  receipt: number;
  gross_stock: number;
  tanker_sale: number;
  variation: number;
  view: string;
  balance: number;
  details: string;
}

export default function TankerSale() {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    date: '',
    endDateTime: '',
    invoiceNo: '',
    vehicleNo: '',
    mobileNo: '',
    tank: '',
    beforeDip: '',
    beforeStock: '',
    receipt: '',
    grossStock: '',
    totalSale: ''
  });

  // Table state
  const [rows, setRows] = useState<TankerSaleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('TANK-1');
  const [showEntries, setShowEntries] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Fetch data
  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tanker-sales', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRows(Array.isArray(data) ? data : []);
        setTotalEntries(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load tanker sales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchList();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save form data
  const handleSave = async () => {
    try {
      const response = await fetch('/api/tanker-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tanker sale saved successfully",
        });
        // Reset form
        setFormData({
          date: '',
          endDateTime: '',
          invoiceNo: '',
          vehicleNo: '',
          mobileNo: '',
          tank: '',
          beforeDip: '',
          beforeStock: '',
          receipt: '',
          grossStock: '',
          totalSale: ''
        });
        fetchList();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save tanker sale",
        variant: "destructive",
      });
    }
  };

  // Pagination
  const entriesPerPage = showEntries === 'All' ? rows.length : parseInt(showEntries);
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const paginatedRows = rows.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4">
        <nav className="text-sm text-white" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <span className="text-blue-200">Dashboard</span>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-blue-300">&gt;</span>
              <span className="text-white font-medium">Add Tanker Details</span>
            </li>
          </ol>
        </nav>
        
        <div className="mt-2">
          <button className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
            Tanker Details
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Form Section */}
        <Card className="mb-6 bg-blue-900 border-blue-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-5 gap-4 mb-4">
              {/* First Row */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-blue-50 border-blue-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">End Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.endDateTime}
                  onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Invoice No</Label>
                <Input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
                  className="bg-blue-50 border-blue-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Vehicle No</Label>
                <Input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) => handleInputChange('vehicleNo', e.target.value)}
                  className="bg-blue-50 border-blue-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Mobile No</Label>
                <Input
                  type="text"
                  value={formData.mobileNo}
                  onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                  className="bg-blue-50 border-blue-200 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
              {/* Second Row */}
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Tank</Label>
                <Select value={formData.tank} onValueChange={(value) => handleInputChange('tank', value)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="- Select Tank-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TANK-1">TANK-1</SelectItem>
                    <SelectItem value="TANK-2">TANK-2</SelectItem>
                    <SelectItem value="TANK-3">TANK-3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Before Dip</Label>
                <Input
                  type="number"
                  value={formData.beforeDip}
                  onChange={(e) => handleInputChange('beforeDip', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Before Stock</Label>
                <Input
                  type="number"
                  value={formData.beforeStock}
                  onChange={(e) => handleInputChange('beforeStock', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Receipt</Label>
                <Input
                  type="number"
                  value={formData.receipt}
                  onChange={(e) => handleInputChange('receipt', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <Label className="text-white text-sm font-medium mb-2 block">Gross Stock</Label>
                <Input
                  type="number"
                  value={formData.grossStock}
                  onChange={(e) => handleInputChange('grossStock', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Fuel className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-white text-sm font-medium mb-2 block">Total Sale (Lts.)</Label>
                    <Input
                      type="number"
                      value={formData.totalSale}
                      onChange={(e) => handleInputChange('totalSale', e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-3 text-lg font-medium rounded-lg"
              >
                SAVE
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table Section */}
        <Card>
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="flex border-b">
              {['TANK-1', 'TANK-2', 'TANK-3'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium ${
                    activeTab === tab
                      ? 'bg-blue-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Table Controls */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Show</span>
                    <Select value={showEntries} onValueChange={setShowEntries}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All entries</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Search:</Label>
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search records..."
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        S.No
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Dump Date
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Tank
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Before Dip
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Before Stock
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Receipt
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Gross Stock
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Tanker Sale
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Variation
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        View
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Balance
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Details
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.dump_date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.tank}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.before_dip}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.before_stock}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.receipt}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.gross_stock}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.tanker_sale}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.variation}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.view}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.balance}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  className={currentPage === 1 ? "bg-blue-600 text-white" : ""}
                >
                  1
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
