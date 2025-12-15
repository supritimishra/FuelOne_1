import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface CreditCustomer {
  id: string;
  organization_name: string;
  credit_limit: number;
  current_balance: number;
}

interface Loan {
  id: string;
  loan_amount: number;
  interest_rate: number;
  principal_balance: number;
  interest_payable: number;
}

export default function InterestTransactionsEnhanced() {
  const { toast } = useToast();
  const [rows, setRows] = useState<InterestTransaction[]>([]);
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);
  const [form, setForm] = useState({ 
    transaction_date: new Date().toISOString().slice(0, 10), 
    transaction_type: '', 
    party_name: '', 
    loan_amount: 0, 
    interest_amount: 0, 
    principal_paid: 0, 
    notes: '',
    yearly_interest_rate: 0,
    loan_balance: 0,
    interest_payable: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchForm, setSearchForm] = useState({ from: '', to: '', party: '' });
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string>('');

  useEffect(() => { 
    fetchList(); 
    loadCreditCustomers();
  }, []);

  const loadCreditCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from('credit_customers')
        .select('id, organization_name, credit_limit, current_balance')
        .eq('is_active', true)
        .order('organization_name');
      
      if (error) throw error;
      setCreditCustomers(data || []);
    } catch (error) {
      console.error('Failed to load credit customers:', error);
      toast({
        title: "Error",
        description: "Failed to load credit customers",
        variant: "destructive",
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchForm.from) params.append('from', searchForm.from);
      if (searchForm.to) params.append('to', searchForm.to);
      if (searchForm.party) params.append('party', searchForm.party);
      
      const res = await fetch(`/api/interest-transactions?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setRows(data.rows || []);
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
  };

  const getAvailableLoans = async (customerId: string) => {
    try {
      // Simulate API call to get loans for a customer
      // In a real implementation, this would call your backend API
      const mockLoans: Loan[] = [
        {
          id: 'loan-1',
          loan_amount: 100000,
          interest_rate: 12,
          principal_balance: 75000,
          interest_payable: 5000
        },
        {
          id: 'loan-2', 
          loan_amount: 50000,
          interest_rate: 15,
          principal_balance: 30000,
          interest_payable: 2000
        }
      ];
      setAvailableLoans(mockLoans);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  };

  const getLoanDetails = async (loanId: string) => {
    try {
      const loan = availableLoans.find(l => l.id === loanId);
      if (loan) {
        setForm(prev => ({
          ...prev,
          loan_balance: loan.principal_balance,
          interest_payable: loan.interest_payable,
          yearly_interest_rate: loan.interest_rate
        }));
      }
    } catch (error) {
      console.error('Failed to fetch loan details:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    if (customerId) {
      getAvailableLoans(customerId);
      const customer = creditCustomers.find(c => c.id === customerId);
      if (customer) {
        setForm(prev => ({ ...prev, party_name: customer.organization_name }));
      }
    } else {
      setAvailableLoans([]);
      setSelectedLoan('');
    }
  };

  const handleLoanChange = (loanId: string) => {
    setSelectedLoan(loanId);
    if (loanId) {
      getLoanDetails(loanId);
    }
  };

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
    if (form.transaction_type === 'Interest Received' && form.interest_amount > form.interest_payable) {
      toast({
        title: "Validation Error",
        description: "Interest paid cannot exceed interest payable",
        variant: "destructive",
      });
      return false;
    }
    if (form.transaction_type === 'Interest Received' && form.principal_paid > form.loan_balance) {
      toast({
        title: "Validation Error",
        description: "Principal paid cannot exceed loan balance",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      transaction_date: new Date().toISOString().slice(0, 10), 
      transaction_type: '', 
      party_name: '', 
      loan_amount: 0, 
      interest_amount: 0, 
      principal_paid: 0, 
      notes: '',
      yearly_interest_rate: 0,
      loan_balance: 0,
      interest_payable: 0
    });
    setEditingId(null);
    setSelectedCustomer('');
    setSelectedLoan('');
    setAvailableLoans([]);
  };

  const handleSearch = () => {
    fetchList();
  };

  const clearSearch = () => {
    setSearchForm({ from: '', to: '', party: '' });
    fetchList();
  };

  const editRow = (r: InterestTransaction) => {
    setEditingId(r.id);
    setForm({
      transaction_date: r.transaction_date,
      transaction_type: r.transaction_type,
      party_name: r.party_name,
      loan_amount: r.loan_amount,
      interest_amount: r.interest_amount,
      principal_paid: r.principal_paid,
      notes: r.notes,
      yearly_interest_rate: 0,
      loan_balance: 0,
      interest_payable: 0
    });
  };

  const delRow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/interest-transactions/' + id, { method: 'DELETE' });
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
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Delete error', e);
      toast({
        title: "Error",
        description: "Error deleting transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-xl font-bold">Interest Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Transaction Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-sm font-medium">Transaction Date *</Label>
                <Input 
                  id="transaction_date"
                  type="date" 
                  value={form.transaction_date} 
                  onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} 
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_type" className="text-sm font-medium">Transaction Type *</Label>
                <Select value={form.transaction_type} onValueChange={(value) => setForm({ ...form, transaction_type: value })}>
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

            {/* Party Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_select" className="text-sm font-medium">Select Customer</Label>
                <Select value={selectedCustomer} onValueChange={handleCustomerChange} disabled={loadingCustomers}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.organization_name} (Limit: ₹{customer.credit_limit.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="party_name" className="text-sm font-medium">Party Name *</Label>
                <Input 
                  id="party_name"
                  value={form.party_name} 
                  onChange={(e) => setForm({ ...form, party_name: e.target.value })} 
                  placeholder="Enter party name"
                  className="w-full"
                />
              </div>
            </div>

            {/* Loan Selection (for Interest Received transactions) */}
            {form.transaction_type === 'Interest Received' && selectedCustomer && (
              <div className="space-y-2">
                <Label htmlFor="loan_select" className="text-sm font-medium">Select Loan</Label>
                <Select value={selectedLoan} onValueChange={handleLoanChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Loan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLoans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        Loan #{loan.id.slice(-8)} - Amount: ₹{loan.loan_amount?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {form.transaction_type === 'Loan Given' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="loan_amount" className="text-sm font-medium">Loan Amount (₹) *</Label>
                    <Input 
                      id="loan_amount"
                      type="number" 
                      step="0.01"
                      value={form.loan_amount || ''} 
                      onChange={(e) => setForm({ ...form, loan_amount: Number(e.target.value) || 0 })} 
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearly_interest_rate" className="text-sm font-medium">Yearly Interest Rate (%) *</Label>
                    <Input 
                      id="yearly_interest_rate"
                      type="number" 
                      step="0.01"
                      value={form.yearly_interest_rate || ''} 
                      onChange={(e) => setForm({ ...form, yearly_interest_rate: Number(e.target.value) || 0 })} 
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                </>
              )}
              
              {form.transaction_type === 'Interest Received' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="loan_balance" className="text-sm font-medium">Balance Payable</Label>
                    <Input 
                      id="loan_balance"
                      type="number" 
                      step="0.01"
                      value={form.loan_balance || ''} 
                      readOnly
                      className="w-full bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_payable" className="text-sm font-medium">Interest Payable</Label>
                    <Input 
                      id="interest_payable"
                      type="number" 
                      step="0.01"
                      value={form.interest_payable || ''} 
                      readOnly
                      className="w-full bg-gray-50"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Payment Fields (for Interest Received transactions) */}
            {form.transaction_type === 'Interest Received' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="interest_amount" className="text-sm font-medium">Interest Paid (₹) *</Label>
                  <Input 
                    id="interest_amount"
                    type="number" 
                    step="0.01"
                    value={form.interest_amount || ''} 
                    onChange={(e) => setForm({ ...form, interest_amount: Number(e.target.value) || 0 })} 
                    placeholder="0.00"
                    className="w-full"
                    max={form.interest_payable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal_paid" className="text-sm font-medium">Principal Paid (₹) *</Label>
                  <Input 
                    id="principal_paid"
                    type="number" 
                    step="0.01"
                    value={form.principal_paid || ''} 
                    onChange={(e) => setForm({ ...form, principal_paid: Number(e.target.value) || 0 })} 
                    placeholder="0.00"
                    className="w-full"
                    max={form.loan_balance}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Description</Label>
              <Textarea 
                id="notes"
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                placeholder="Enter additional notes or comments"
                className="w-full"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2" 
                onClick={save}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingId ? 'Update Transaction' : 'Save Transaction')}
              </Button>
              {editingId && (
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={loading}
                  className="px-8 py-2"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Loan Amount</h3>
              <p className="text-2xl font-bold text-blue-800">
                ₹{totals.totalLoanAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Interest</h3>
              <p className="text-2xl font-bold text-blue-800">
                ₹{totals.totalInterest.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Principal Paid</h3>
              <p className="text-2xl font-bold text-blue-800">
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
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
                    <td colSpan={9} className="text-center p-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : rows.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-600">{i + 1}</td>
                    <td className="p-3 text-gray-900">
                      {new Date(r.transaction_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        r.transaction_type === 'Loan Taken' ? 'bg-orange-100 text-orange-800' :
                        r.transaction_type === 'Loan Given' ? 'bg-blue-100 text-blue-800' :
                        r.transaction_type === 'Interest Paid' ? 'bg-blue-100 text-blue-800' :
                        r.transaction_type === 'Interest Received' ? 'bg-blue-100 text-blue-800' :
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
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => delRow(r.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
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
