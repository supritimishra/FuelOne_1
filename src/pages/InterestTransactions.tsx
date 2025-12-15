import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Save, Search, Filter, Download, RefreshCw, Plus, Edit, Trash2, HelpCircle } from 'lucide-react';

interface InterestTransaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  party_name: string;
  loan_amount: number;
  interest_amount: number;
  principal_paid: number;
  notes: string;
  created_at: string;
  created_by?: string;
}

export default function InterestTransactions() {
  const { toast } = useToast();
  const [rows, setRows] = useState<InterestTransaction[]>([]);
  const [form, setForm] = useState({ 
    transaction_date: new Date().toISOString().slice(0, 10), 
    transaction_type: '', 
    party_name: '', 
    loan_amount: 0, 
    interest_amount: 0, 
    principal_paid: 0, 
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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkOperationMode, setBulkOperationMode] = useState(false);

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
      
      const res = await fetch(`/api/interest-transactions?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
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
    if (!form.party_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter party name",
        variant: "destructive",
      });
      return false;
    }
    if (!form.transaction_type) {
      toast({
        title: "Validation Error",
        description: "Please select transaction type",
        variant: "destructive",
      });
      return false;
    }
    if (form.transaction_type === 'Loan Given' && (!form.loan_amount || form.loan_amount <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter valid loan amount",
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
      if (data.ok) {
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
          description: 'Failed to save transaction. Please try again.',
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
      transaction_date: new Date().toISOString().slice(0, 10), 
      transaction_type: '', 
      party_name: '', 
      loan_amount: 0, 
      interest_amount: 0, 
      principal_paid: 0, 
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
    fetchList();
  }

  function editRow(r: InterestTransaction) {
    setEditingId(r.id);
    setForm({ 
      transaction_date: r.transaction_date || '', 
      transaction_type: r.transaction_type || '', 
      party_name: r.party_name || '', 
      loan_amount: r.loan_amount || 0, 
      interest_amount: r.interest_amount || 0, 
      principal_paid: r.principal_paid || 0, 
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
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
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

  // Bulk operations
  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllRows = () => {
    setSelectedRows(new Set(rows.map(row => row.id)));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const bulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select transactions to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRows.size} transactions?`)) return;

    try {
      setLoading(true);
      const deletePromises = Array.from(selectedRows).map(async id => {
        const res = await fetch('/api/interest-transactions/' + id, { 
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        return { ok: data.ok, error: data.error };
      });
      
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);
      
      if (failed.length === 0) {
        fetchList();
        clearSelection();
        toast({
          title: "Success",
          description: `Deleted ${successful} transactions successfully`,
        });
      } else {
        fetchList();
        clearSelection();
        toast({
          title: "Partial Success",
          description: `Deleted ${successful} of ${selectedRows.size} transactions. ${failed.length} failed: ${failed.map(f => f.error || 'Unknown error').join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Bulk delete error', e);
      toast({
        title: "Error",
        description: "Error deleting transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkExport = () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select transactions to export",
        variant: "destructive",
      });
      return;
    }

    const selectedTransactions = rows.filter(row => selectedRows.has(row.id));
    const csvContent = [
      ['Date', 'Type', 'Party', 'Loan Amount', 'Interest Amount', 'Principal Paid', 'Notes'],
      ...selectedTransactions.map(row => [
        row.transaction_date,
        row.transaction_type,
        row.party_name,
        row.loan_amount,
        row.interest_amount,
        row.principal_paid,
        row.notes
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interest-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${selectedRows.size} transactions`,
    });
  };

  const calculateTotals = () => {
    const totalLoanAmount = rows.reduce((sum, row) => sum + parseFloat(row.loan_amount?.toString() || '0'), 0);
    const totalInterest = rows.reduce((sum, row) => sum + parseFloat(row.interest_amount?.toString() || '0'), 0);
    const totalPrincipalPaid = rows.reduce((sum, row) => sum + parseFloat(row.principal_paid?.toString() || '0'), 0);
    const totalTransactions = rows.length;
    
    return { totalLoanAmount, totalInterest, totalPrincipalPaid, totalTransactions };
  };

  const totals = calculateTotals();

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
                  <div className="flex justify-between">
                    <span className="text-gray-700">Focus search:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Refresh list:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+R</kbd>
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
                  <div className="flex justify-between">
                    <span className="text-gray-700">Toggle auto-save:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Shift+A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Show/hide shortcuts:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">?</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {/* First Row - Date and Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-sm font-medium">Transaction Date *</Label>
                <Input 
                  id="transaction_date"
                  type="date" 
                  value={form.transaction_date} 
                  onChange={(e) => handleFormChange('transaction_date', e.target.value)} 
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_type" className="text-sm font-medium">Transaction Type *</Label>
                <Select value={form.transaction_type} onValueChange={(value) => handleFormChange('transaction_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Loan Given">Loan Given</SelectItem>
                    <SelectItem value="Loan Taken">Loan Taken</SelectItem>
                    <SelectItem value="Interest Received">Interest Received</SelectItem>
                    <SelectItem value="Interest Paid">Interest Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row - Party and Loan Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="party_name" className="text-sm font-medium">Party Name *</Label>
                <Input 
                  id="party_name"
                  value={form.party_name} 
                  onChange={(e) => handleFormChange('party_name', e.target.value)} 
                  placeholder="Enter party name"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_amount" className="text-sm font-medium">Loan Amount (₹)</Label>
                <Input 
                  id="loan_amount"
                  type="number" 
                  step="0.01"
                  value={form.loan_amount || ''} 
                  onChange={(e) => handleFormChange('loan_amount', Number(e.target.value) || 0)} 
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Third Row - Interest and Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="interest_amount" className="text-sm font-medium">Interest Amount (₹)</Label>
                <Input 
                  id="interest_amount"
                  type="number" 
                  step="0.01"
                  value={form.interest_amount || ''} 
                  onChange={(e) => handleFormChange('interest_amount', Number(e.target.value) || 0)} 
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="principal_paid" className="text-sm font-medium">Principal Paid (₹)</Label>
                <Input 
                  id="principal_paid"
                  type="number" 
                  step="0.01"
                  value={form.principal_paid || ''} 
                  onChange={(e) => handleFormChange('principal_paid', Number(e.target.value) || 0)} 
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
                        <SelectItem value="">All Types</SelectItem>
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
                      placeholder="0"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount_max" className="text-sm font-medium">Max Amount (₹)</Label>
                    <Input 
                      id="amount_max"
                      type="number"
                      value={searchForm.amount_max} 
                      onChange={(e) => setSearchForm({ ...searchForm, amount_max: e.target.value })} 
                      placeholder="No limit"
                      className="w-full"
                    />
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
                        setSearchForm({ ...searchForm, from: today, to: today });
                        handleSearch();
                      }}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setSearchForm({ 
                          ...searchForm, 
                          from: weekAgo.toISOString().slice(0, 10), 
                          to: today.toISOString().slice(0, 10) 
                        });
                        handleSearch();
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
                        setSearchForm({ 
                          ...searchForm, 
                          from: monthAgo.toISOString().slice(0, 10), 
                          to: today.toISOString().slice(0, 10) 
                        });
                        handleSearch();
                      }}
                    >
                      Last 30 Days
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchForm({ ...searchForm, type: 'Loan Given' });
                        handleSearch();
                      }}
                    >
                      Loans Given
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchForm({ ...searchForm, type: 'Interest Received' });
                        handleSearch();
                      }}
                    >
                      Interest Received
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchForm({ 
                          ...searchForm, 
                          amount_min: '10000', 
                          amount_max: '' 
                        });
                        handleSearch();
                      }}
                    >
                      High Value (&gt;₹10K)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Loan Amount</h3>
              <p className="text-2xl font-bold text-blue-800">
                ₹{totals.totalLoanAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-600 mb-2">Total Interest</h3>
              <p className="text-2xl font-bold text-green-800">
                ₹{totals.totalInterest.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-600 mb-2">Total Principal Paid</h3>
              <p className="text-2xl font-bold text-purple-800">
                ₹{totals.totalPrincipalPaid.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transactions</h3>
              <p className="text-2xl font-bold text-gray-800">
                {totals.totalTransactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBulkOperationMode(!bulkOperationMode)}
                className={bulkOperationMode ? "bg-blue-100 border-blue-300" : ""}
              >
                <Filter className="h-4 w-4 mr-1" />
                {bulkOperationMode ? 'Exit Bulk' : 'Bulk Operations'}
              </Button>
              {bulkOperationMode && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectAllRows}
                    disabled={rows.length === 0}
                    className="w-full sm:w-auto"
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedRows.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Clear ({selectedRows.size})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={bulkExport}
                    disabled={selectedRows.size === 0}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export Selected
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={bulkDelete}
                    disabled={selectedRows.size === 0}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-1" />
                Export All
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                New Transaction
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {bulkOperationMode && (
                    <th className="text-center p-3 font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === rows.length && rows.length > 0}
                        onChange={(e) => e.target.checked ? selectAllRows() : clearSelection()}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="text-left p-3 font-medium text-gray-700">S.No</th>
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Party</th>
                  <th className="text-right p-3 font-medium text-gray-700">Loan Amount</th>
                  <th className="text-right p-3 font-medium text-gray-700">Interest</th>
                  <th className="text-right p-3 font-medium text-gray-700">Principal Paid</th>
                  <th className="text-left p-3 font-medium text-gray-700">Notes</th>
                  <th className="text-center p-3 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={bulkOperationMode ? 10 : 9} className="text-center p-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-gray-500">Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={bulkOperationMode ? 10 : 9} className="text-center p-8 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : rows.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                    {bulkOperationMode && (
                      <td className="text-center p-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(r.id)}
                          onChange={() => toggleRowSelection(r.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="p-3 text-gray-600">{i + 1}</td>
                    <td className="p-3 text-gray-900">
                      {new Date(r.transaction_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        r.transaction_type === 'Loan Taken' ? 'bg-red-100 text-red-800' :
                        r.transaction_type === 'Loan Given' ? 'bg-green-100 text-green-800' :
                        r.transaction_type === 'Interest Paid' ? 'bg-blue-100 text-blue-800' :
                        r.transaction_type === 'Interest Received' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {r.transaction_type || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{r.party_name}</td>
                    <td className="p-3 text-right font-mono text-gray-900">
                      ₹{parseFloat(r.loan_amount?.toString() || '0').toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-900">
                      ₹{parseFloat(r.interest_amount?.toString() || '0').toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-900">
                      ₹{parseFloat(r.principal_paid?.toString() || '0').toLocaleString()}
                    </td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => editRow(r)}
                          disabled={loading || saving}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => delRow(r.id)}
                          disabled={loading || saving}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
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
