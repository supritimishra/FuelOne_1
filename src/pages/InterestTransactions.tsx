import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Search, Filter, RefreshCw, HelpCircle, Trash2, Edit } from 'lucide-react';

interface InterestTransaction {
  id: string;
  transactionDate: string;
  transactionType: string;
  partyName: string;
  loanAmount: number;
  interestAmount: number;
  principalPaid: number;
  notes: string;
  createdAt: string;
  createdBy?: string;
}

export default function InterestTransactions() {
  const { toast } = useToast();
  const [rows, setRows] = useState<InterestTransaction[]>([]);
  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 10),
    transactionType: '',
    partyName: '',
    loanAmount: 0,
    interestAmount: 0,
    principalPaid: 0,
    notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    party: '',
    type: '',
    amount_min: '',
    amount_max: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Clean up selection logic as bulk ops were not fully implemented in snippet
  // const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchList();
    // Load auto-saved data from localStorage
    const savedForm = localStorage.getItem('interest-transactions-form');
    if (savedForm && !editingId) {
      try {
        const parsedForm = JSON.parse(savedForm);
        setForm(parsedForm);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Failed to parse saved form:', error);
      }
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges && !editingId) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('interest-transactions-form', JSON.stringify(form));
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        toast({
          title: "Auto-saved",
          description: "Form data has been auto-saved",
        });
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [form, autoSaveEnabled, hasUnsavedChanges, editingId, toast]);

  // Handle form changes
  const handleFormChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + S: Save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        save();
      }

      // Ctrl/Cmd + N: New transaction
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        resetForm();
      }

      // Ctrl/Cmd + F: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + R: Refresh list
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        fetchList();
      }

      // Escape: Cancel editing
      if (event.key === 'Escape') {
        if (editingId) {
          resetForm();
        }
      }

      // F5: Refresh list (alternative)
      if (event.key === 'F5') {
        event.preventDefault();
        fetchList();
      }

      // Ctrl/Cmd + Shift + A: Toggle auto-save
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setAutoSaveEnabled(prev => !prev);
        toast({
          title: "Auto-save",
          description: `Auto-save ${!autoSaveEnabled ? 'enabled' : 'disabled'}`,
        });
      }

      // ?: Toggle keyboard shortcuts help
      if (event.key === '?') {
        event.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId, autoSaveEnabled, toast]);

  async function fetchList() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchForm.from) params.append('from', searchForm.from);
      if (searchForm.to) params.append('to', searchForm.to);
      if (searchForm.party) params.append('party', searchForm.party);
      if (searchForm.type) params.append('type', searchForm.type);
      if (searchForm.amount_min) params.append('amount_min', searchForm.amount_min);
      if (searchForm.amount_max) params.append('amount_max', searchForm.amount_max);

      // Using correct endpoint matching backend
      const res = await fetch(`/api/interest-transactions?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRows(data.rows || []);
        toast({
          title: "Success",
          description: `Loaded ${data.rows?.length || 0} transactions`,
        });
      } else {
        console.error('API returned error:', data);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Failed to fetch interest transactions', e);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const validateForm = () => {
    if (!form.partyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter party name",
        variant: "destructive",
      });
      return false;
    }
    if (!form.transactionType) {
      toast({
        title: "Validation Error",
        description: "Please select transaction type",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  async function save() {
    if (!validateForm()) return;

    try {
      setSaving(true);
      let res;
      if (editingId) {
        res = await fetch('/api/interest-transactions/' + editingId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch('/api/interest-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      }
      const data = await res.json();
      if (res.ok && data.success) {
        resetForm();
        fetchList();
        toast({
          title: "Success",
          description: editingId ? 'Transaction updated successfully!' : 'Transaction created successfully!',
        });
      } else {
        console.error('Save failed', data);
        toast({
          title: "Error",
          description: data.error || 'Failed to save transaction. Please try again.',
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Save error', e);
      toast({
        title: "Error",
        description: 'Error saving transaction. Please try again.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const resetForm = () => {
    setForm({
      transactionDate: new Date().toISOString().slice(0, 10),
      transactionType: '',
      partyName: '',
      loanAmount: 0,
      interestAmount: 0,
      principalPaid: 0,
      notes: ''
    });
    setEditingId(null);
    setHasUnsavedChanges(false);
    localStorage.removeItem('interest-transactions-form');
  };

  function handleSearch() {
    fetchList();
  }

  function clearSearch() {
    setSearchForm({
      from: '',
      to: '',
      party: '',
      type: '',
      amount_min: '',
      amount_max: ''
    });
    // Trigger reset without state dependency lag
    const emptyParams = new URLSearchParams();
    fetch(`/api/interest-transactions?${emptyParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setRows(data.rows || []);
      })
      .catch(console.error);
  }

  function editRow(r: InterestTransaction) {
    setEditingId(r.id);
    setForm({
      transactionDate: r.transactionDate || '',
      transactionType: r.transactionType || '',
      partyName: r.partyName || '',
      loanAmount: Number(r.loanAmount) || 0,
      interestAmount: Number(r.interestAmount) || 0,
      principalPaid: Number(r.principalPaid) || 0,
      notes: r.notes || ''
    });
    setHasUnsavedChanges(false);
  }

  async function delRow(id: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      setLoading(true);
      const res = await fetch('/api/interest-transactions/' + id, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchList();
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete transaction",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Delete error', e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Error deleting transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">Interest Transactions</CardTitle>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`bg-white/10 hover:bg-white/20 text-white border-white/20 ${autoSaveEnabled ? 'bg-green-500/20' : ''}`}
              >
                <Save className="h-4 w-4 mr-1" />
                Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Shortcuts
              </Button>
              {lastSaved && (
                <span className="text-xs text-white/80">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
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
                    <span className="text-gray-700">Save transaction:</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">New transaction:</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+N</kbd>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cancel editing:</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Escape</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Refresh (alt):</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F5</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {/* First Row - Date and Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="transactionDate" className="text-sm font-medium">Transaction Date *</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) => handleFormChange('transactionDate', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionType" className="text-sm font-medium">Transaction Type *</Label>
                <Select value={form.transactionType} onValueChange={(value) => handleFormChange('transactionType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Loan Given">Loan Given (Credit)</SelectItem>
                    <SelectItem value="Loan Taken">Loan Taken (Debit)</SelectItem>
                    <SelectItem value="Interest Received">Interest Received</SelectItem>
                    <SelectItem value="Interest Paid">Interest Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row - Party and Loan Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="partyName" className="text-sm font-medium">Party Name *</Label>
                <Input
                  id="partyName"
                  value={form.partyName}
                  onChange={(e) => handleFormChange('partyName', e.target.value)}
                  placeholder="Enter party name"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanAmount" className="text-sm font-medium">Loan Amount (₹)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  step="0.01"
                  value={form.loanAmount || ''}
                  onChange={(e) => handleFormChange('loanAmount', Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Third Row - Interest and Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="interestAmount" className="text-sm font-medium">Interest Amount (₹)</Label>
                <Input
                  id="interestAmount"
                  type="number"
                  step="0.01"
                  value={form.interestAmount || ''}
                  onChange={(e) => handleFormChange('interestAmount', Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="principalPaid" className="text-sm font-medium">Principal Paid (₹)</Label>
                <Input
                  id="principalPaid"
                  type="number"
                  step="0.01"
                  value={form.principalPaid || ''}
                  onChange={(e) => handleFormChange('principalPaid', Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Fourth Row - Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Enter additional notes or comments"
                className="w-full"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-2 w-full sm:w-auto"
                onClick={save}
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Update Transaction' : 'Save Transaction'}
                  </>
                )}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving || loading}
                  className="px-6 sm:px-8 py-2 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}
              {hasUnsavedChanges && (
                <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md border border-orange-200 justify-center sm:justify-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Unsaved changes
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Search & Filter</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Advanced
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchList}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="search_from" className="text-sm font-medium">From Date</Label>
                <Input
                  id="search_from"
                  type="date"
                  value={searchForm.from}
                  onChange={(e) => setSearchForm({ ...searchForm, from: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search_to" className="text-sm font-medium">To Date</Label>
                <Input
                  id="search_to"
                  type="date"
                  value={searchForm.to}
                  onChange={(e) => setSearchForm({ ...searchForm, to: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search_party" className="text-sm font-medium">Party Name</Label>
                <Input
                  id="search_party"
                  value={searchForm.party}
                  onChange={(e) => setSearchForm({ ...searchForm, party: e.target.value })}
                  placeholder="Enter party name"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  disabled={loading}
                >
                  <Search className="h-4 w-4 mr-1" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Advanced Search */}
            {showAdvancedSearch && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search_type" className="text-sm font-medium">Transaction Type</Label>
                    <Select value={searchForm.type} onValueChange={(value) => setSearchForm({ ...searchForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Types">All Types</SelectItem>
                        <SelectItem value="Loan Given">Loan Given</SelectItem>
                        <SelectItem value="Loan Taken">Loan Taken</SelectItem>
                        <SelectItem value="Interest Received">Interest Received</SelectItem>
                        <SelectItem value="Interest Paid">Interest Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount_min" className="text-sm font-medium">Min Amount (₹)</Label>
                    <Input
                      id="amount_min"
                      type="number"
                      value={searchForm.amount_min}
                      onChange={(e) => setSearchForm({ ...searchForm, amount_min: e.target.value })}
                      placeholder="Min Amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount_max" className="text-sm font-medium">Max Amount (₹)</Label>
                    <Input
                      id="amount_max"
                      type="number"
                      value={searchForm.amount_max}
                      onChange={(e) => setSearchForm({ ...searchForm, amount_max: e.target.value })}
                      placeholder="Max Amount"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
            <div className="text-sm text-gray-500">
              Total {rows.length} records
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3 border-b">Date</th>
                    <th className="px-4 py-3 border-b">Type</th>
                    <th className="px-4 py-3 border-b">Party</th>
                    <th className="px-4 py-3 border-b text-right">Loan Amt</th>
                    <th className="px-4 py-3 border-b text-right">Interest</th>
                    <th className="px-4 py-3 border-b text-right">Principal Pd</th>
                    <th className="px-4 py-3 border-b">Notes</th>
                    <th className="px-4 py-3 border-b text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 border-b last:border-0">
                        <td className="px-4 py-3">{new Date(row.transactionDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${(row.transactionType || '').includes('Received') ? 'bg-green-100 text-green-800' :
                              (row.transactionType || '').includes('Paid') ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {row.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{row.partyName}</td>
                        <td className="px-4 py-3 text-right">{row.loanAmount ? `₹${Number(row.loanAmount).toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3 text-right">{row.interestAmount ? `₹${Number(row.interestAmount).toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3 text-right">{row.principalPaid ? `₹${Number(row.principalPaid).toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[150px]">{row.notes}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => editRow(row)} className="h-8 w-8 text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => delRow(row.id)} className="h-8 w-8 text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
