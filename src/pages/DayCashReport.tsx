import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, DollarSign, HelpCircle, Filter } from 'lucide-react';

interface DayCashMovement {
  date: string;
  total_in: number;
  total_out: number;
  net_cash: number;
  notes: string;
}

export default function DayCashReport() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DayCashMovement[]>([]);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + F: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const fromInput = document.querySelector('input[placeholder*="From"]') as HTMLInputElement;
        if (fromInput) {
          fromInput.focus();
        }
      }
      
      // Ctrl/Cmd + R: Refresh report
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        fetchList();
      }
      
      // F5: Refresh report (alternative)
      if (event.key === 'F5') {
        event.preventDefault();
        fetchList();
      }
      
      // ?: Toggle keyboard shortcuts help
      if (event.key === '?') {
        event.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update fetchList to use current filters state
  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      
      const res = await fetch('/api/day-cash-report?' + qs.toString());
      const d = await res.json();
      
      if (d.ok) {
        setRows(d.rows || []);
        toast({
          title: "Success",
          description: `Loaded ${d.rows?.length || 0} cash movements`,
        });
      } else {
        console.error('API returned error:', d);
        toast({
          title: "Error",
          description: d.error || "Failed to fetch day cash report",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Failed to fetch day cash report', e);
      toast({
        title: "Error",
        description: "Failed to fetch day cash report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const handleSearch = useCallback(() => {
    fetchList();
  }, [fetchList]);

  const clearFilters = () => {
    setFilters({ from: '', to: '' });
    // Don't call fetchList immediately, let the useEffect handle it
  };

  // Add useEffect to trigger fetchList when filters change
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const exportToCSV = () => {
    if (rows.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Date', 'Total In', 'Total Out', 'Net Cash', 'Notes'],
      ...rows.map(row => [
        row.date,
        row.total_in,
        row.total_out,
        row.net_cash,
        row.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `day-cash-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${rows.length} records`,
    });
  };

  const calculateTotals = () => {
    const totalIn = rows.reduce((sum, row) => sum + parseFloat(row.total_in?.toString() || '0'), 0);
    const totalOut = rows.reduce((sum, row) => sum + parseFloat(row.total_out?.toString() || '0'), 0);
    const netCash = totalIn - totalOut;
    return { totalIn, totalOut, netCash };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">Day Cash Report</CardTitle>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Shortcuts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Keyboard Shortcuts Help */}
          {showKeyboardHelp && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Focus search:</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Refresh report:</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+R</kbd>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Refresh (alt):</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F5</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Show/hide shortcuts:</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">?</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Filters */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="from_date" className="text-sm font-medium">From Date</Label>
                <Input 
                  id="from_date"
                  type="date" 
                  value={filters.from} 
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })} 
                  placeholder="From date"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_date" className="text-sm font-medium">To Date</Label>
                <Input 
                  id="to_date"
                  type="date" 
                  value={filters.to} 
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })} 
                  placeholder="To date"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSearch} 
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-1" />
                      Search
                    </>
                  )}
                </Button>
                <Button 
                  onClick={clearFilters} 
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={exportToCSV} 
                  variant="outline"
                  className="w-full"
                  disabled={rows.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setFilters({ from: today, to: today });
                  }}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    setFilters({ 
                      from: weekAgo.toISOString().slice(0, 10), 
                      to: today.toISOString().slice(0, 10) 
                    });
                  }}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    setFilters({ 
                      from: monthAgo.toISOString().slice(0, 10), 
                      to: today.toISOString().slice(0, 10) 
                    });
                  }}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Inflows</p>
                <p className="text-2xl font-bold text-blue-800">₹{totals.totalIn.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Outflows</p>
                <p className="text-2xl font-bold text-orange-800">₹{totals.totalOut.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${totals.netCash >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  ₹{totals.netCash.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
              </div>
              <Filter className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cash Movement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-right p-3 font-medium text-gray-700">Total In</th>
                  <th className="text-right p-3 font-medium text-gray-700">Total Out</th>
                  <th className="text-right p-3 font-medium text-gray-700">Net Cash</th>
                  <th className="text-left p-3 font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-gray-500">Loading cash movements...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500">
                      No cash movements found for the selected period
                    </td>
                  </tr>
                ) : rows.map((r, index) => (
                  <tr key={r.date} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-900">
                      {new Date(r.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-800">
                      ₹{parseFloat(r.total_in?.toString() || '0').toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-orange-800">
                      ₹{parseFloat(r.total_out?.toString() || '0').toLocaleString()}
                    </td>
                    <td className={`p-3 text-right font-mono font-semibold ${
                      parseFloat(r.net_cash?.toString() || '0') >= 0 ? 'text-blue-800' : 'text-orange-800'
                    }`}>
                      ₹{parseFloat(r.net_cash?.toString() || '0').toLocaleString()}
                    </td>
                    <td className="p-3 text-gray-600">
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
