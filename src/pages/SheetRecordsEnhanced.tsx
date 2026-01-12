import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReportDateRange } from '@/hooks/useDateRange';
import { 
  Search, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SheetRecord {
  id: string;
  s_no: number;
  date: string;
  shift: string;
  employee: string;
  entry_source: string;
  modules: string;
  action: string;
  user_log_details: string;
}

export default function SheetRecords() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();
  
  // Use standardized date range hook with 2 years default to cover all available data
  const { fromDate: searchFrom, toDate: searchTo, setFromDate: setSearchFrom, setToDate: setSearchTo, isValidRange, resetToDefault } = useReportDateRange('LAST_2_YEARS');
  
  // State management
  const [rows, setRows] = useState<SheetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState('All');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Fetch data
  const fetchList = useCallback(async () => {
    setLoading(true);
    
    // Validate date range
    if (!isValidRange) {
      toast({
        title: "Invalid Date Range",
        description: "Please select a valid date range",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (searchFrom) params.append('from', searchFrom);
      if (searchTo) params.append('to', searchTo);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/sheet-records?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('API error response:', errorText);
        setRows([]);
        setTotalEntries(0);
        return;
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      // Handle both direct array and wrapped response formats
      let parsedRows: SheetRecord[] = [];
      if (Array.isArray(data)) {
        parsedRows = data;
      } else if (data && data.ok && Array.isArray(data.rows)) {
        parsedRows = data.rows;
      }
      
      console.log('Parsed rows:', parsedRows.length, 'records');
      setRows(parsedRows);
      setTotalEntries(parsedRows.length);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setRows([]);
      setTotalEntries(0);
      toast({
        title: "Error",
        description: `Failed to load sheet records: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchFrom, searchTo, searchTerm, toast, getAuthHeaders, isValidRange]);

  // Initial load
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Search handler
  const handleSearch = () => {
    setCurrentPage(1);
    fetchList();
  };

  // Clear filters
  const clearFilters = () => {
    resetToDefault();
    setSearchTerm('');
    setCurrentPage(1);
    fetchList();
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select records to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete ${selectedRows.size} selected records?`)) return;

    try {
      const deletePromises = Array.from(selectedRows).map(id =>
        fetch(`/api/sheet-records/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setSelectedRows(new Set());
      toast({
        title: "Success",
        description: `${selectedRows.size} records deleted successfully`,
      });
      fetchList();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete records",
        variant: "destructive",
      });
    }
  };

  // Toggle row selection
  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  // Select all rows
  const selectAllRows = () => {
    setSelectedRows(new Set(rows.map(row => row.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Pagination
  const entriesPerPage = showEntries === 'All' ? rows.length : parseInt(showEntries);
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const paginatedRows = rows.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 px-6 py-4 shadow-sm">
        <nav className="text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <span className="text-gray-500">Dashboard</span>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-gray-400">&gt;</span>
              <span className="text-gray-900 font-medium">Sheet Records</span>
            </li>
          </ol>
        </nav>
        <div className="mt-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">Sheet Records</h1>
          <p className="text-muted-foreground text-lg">Search and manage sheet records</p>
        </div>
      </div>

      <div className="p-6">
        {/* Search Section */}
        <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="searchFrom" className="text-sm font-medium text-gray-700">Search From</Label>
                <Input
                  id="searchFrom"
                  type="date"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  placeholder="Filter Date"
                  className="w-40 h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="searchTo" className="text-sm font-medium text-gray-700">To</Label>
                <Input
                  id="searchTo"
                  type="date"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  placeholder="Filter Date"
                  className="w-40 h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="h-10 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md transition-all duration-200"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                onClick={clearFilters} 
                variant="outline"
                className="h-10 px-6 border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-700 font-medium rounded-lg transition-all duration-200"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Controls */}
        <Card className="mb-4 shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedRows.size === 0}
                  className="h-10 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedRows.size})
                </Button>
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Show</Label>
                  <Select value={showEntries} onValueChange={setShowEntries}>
                    <SelectTrigger className="w-32 h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500">
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
                <Label className="text-sm font-medium text-gray-700">Search:</Label>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search records..."
                  className="w-64 h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSearch}
                  className="h-10 px-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-medium rounded-lg transition-all duration-200"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === rows.length && rows.length > 0}
                        onChange={() => selectedRows.size === rows.length ? clearSelection() : selectAllRows()}
                        className="rounded border-gray-300 w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        S.No.
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Date
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Shift
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Employee
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Entry Source
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Modules
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        Action
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        User Log Details
                        <div className="flex flex-col">
                          <ChevronUp className="h-3 w-3 text-white opacity-70" />
                          <ChevronDown className="h-3 w-3 text-white opacity-70" />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-lg mb-2">📊</div>
                          <p className="text-sm text-gray-500">No sheet records found for the selected date range.</p>
                          <p className="text-xs mt-2 text-blue-600">Available data dates: 2024-01-14 to 2025-10-13</p>
                          <p className="text-xs mt-1 text-gray-400">Try selecting a broader date range or check if there are any sheet records in the database.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className={`border-b hover:shadow-md transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                      } hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{startIndex + index + 1}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{row.date}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.shift === 'Morning' ? 'bg-orange-100 text-orange-800' :
                            row.shift === 'Afternoon' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {row.shift}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{row.employee}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.entry_source}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.modules}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.action}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{row.user_log_details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700 font-medium">
            Showing <span className="text-blue-600 font-semibold">{startIndex + 1}</span> to <span className="text-blue-600 font-semibold">{endIndex}</span> of <span className="text-blue-600 font-semibold">{totalEntries}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-10 w-10 font-medium rounded-lg transition-all duration-200 ${
                      currentPage === pageNum 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" 
                        : "border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-10 px-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
