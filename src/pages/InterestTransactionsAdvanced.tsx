import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, Currency, Fullscreen, Bell, User, Settings, Search, Filter, Download, Printer, Eye, HelpCircle } from 'lucide-react';

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
  yearly_interest_rate?: number;
  loan_balance?: number;
  interest_payable?: number;
}

interface CreditCustomer {
  id: string;
  organization_name: string;
  credit_limit: number;
  current_balance: number;
  contact_person?: string;
  phone?: string;
  email?: string;
}

interface Loan {
  id: string;
  loan_amount: number;
  interest_rate: number;
  principal_balance: number;
  interest_payable: number;
  loan_date: string;
  maturity_date?: string;
  status: 'Active' | 'Closed' | 'Overdue';
}

interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
}

export default function InterestTransactionsAdvanced() {
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
  const [searchForm, setSearchForm] = useState({ 
    from: '', 
    to: '', 
    party: '', 
    type: '',
    amount_min: '',
    amount_max: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string>('');
  
  // Advanced features state
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('0');
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkOperationMode, setBulkOperationMode] = useState(false);
  
  const calculatorRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    fetchList(); 
    loadCreditCustomers();
    loadCurrencyRates();
    loadNotifications();
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
      
      // Ctrl/Cmd + C: Toggle calculator
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        setShowCalculator(prev => !prev);
      }
      
      // Ctrl/Cmd + Shift + C: Toggle currency converter
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        setShowCurrencyConverter(prev => !prev);
      }
      
      // F11: Toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      
      // ?: Toggle keyboard shortcuts help
      if (event.key === '?') {
        event.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingId]);

  const loadCreditCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from('credit_customers')
        .select('id, organization_name, credit_limit, current_balance, contact_person, phone, email')
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

  const loadCurrencyRates = async () => {
    // Mock currency rates - in real implementation, fetch from API
    const mockRates: CurrencyRate[] = [
      { from: 'INR', to: 'USD', rate: 0.012 },
      { from: 'INR', to: 'EUR', rate: 0.011 },
      { from: 'INR', to: 'GBP', rate: 0.0095 },
      { from: 'USD', to: 'INR', rate: 83.33 },
      { from: 'EUR', to: 'INR', rate: 90.91 },
      { from: 'GBP', to: 'INR', rate: 105.26 }
    ];
    setCurrencyRates(mockRates);
  };

  const loadNotifications = async () => {
    // Mock notifications - in real implementation, fetch from API
    const mockNotifications = [
      { id: 1, message: 'Loan payment overdue for ABC Corp', type: 'warning', date: new Date() },
      { id: 2, message: 'Interest rate updated for XYZ Ltd', type: 'info', date: new Date() }
    ];
    setNotifications(mockNotifications);
  };

  const fetchList = async () => {
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
      // Mock loan data - in real implementation, fetch from API
      const mockLoans: Loan[] = [
        {
          id: 'loan-1',
          loan_amount: 100000,
          interest_rate: 12,
          principal_balance: 75000,
          interest_payable: 5000,
          loan_date: '2024-01-15',
          maturity_date: '2025-01-15',
          status: 'Active'
        },
        {
          id: 'loan-2', 
          loan_amount: 50000,
          interest_rate: 15,
          principal_balance: 30000,
          interest_payable: 2000,
          loan_date: '2024-02-20',
          maturity_date: '2025-02-20',
          status: 'Active'
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
    setSearchForm({ 
      from: '', 
      to: '', 
      party: '', 
      type: '',
      amount_min: '',
      amount_max: ''
    });
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
      yearly_interest_rate: r.yearly_interest_rate || 0,
      loan_balance: r.loan_balance || 0,
      interest_payable: r.interest_payable || 0
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
      const deletePromises = Array.from(selectedRows).map(id => 
        fetch('/api/interest-transactions/' + id, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(res => res.ok);
      
      if (allSuccessful) {
        fetchList();
        clearSelection();
        toast({
          title: "Success",
          description: `Deleted ${selectedRows.size} transactions successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: "Some transactions could not be deleted",
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
      ['Date', 'Type', 'Party', 'Loan Amount', 'Interest Amount', 'Principal Paid', 'Notes', 'Yearly Rate', 'Loan Balance', 'Interest Payable'],
      ...selectedTransactions.map(row => [
        row.transaction_date,
        row.transaction_type,
        row.party_name,
        row.loan_amount,
        row.interest_amount,
        row.principal_paid,
        row.notes,
        row.yearly_interest_rate || '',
        row.loan_balance || '',
        row.interest_payable || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interest-transactions-advanced-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('0');
    } else if (value === '=') {
      try {
        const result = evaluateExpression(calculatorValue);
        setCalculatorValue((typeof result === 'number' && isFinite(result)) ? result.toString() : 'Error');
      } catch (err) {
        console.error('Calculator eval error', err);
        setCalculatorValue('Error');
      }
    } else {
      setCalculatorValue(prev => prev === '0' ? value : prev + value);
    }
  };

  // Toggle sign helper and safe evaluator
  function evaluateExpression(expr: string): number {
    if (!expr || typeof expr !== 'string') return 0;
    // Normalize operator symbols
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');

    // Tokenize: numbers (with optional %) and operators/parentheses
    const tokens: string[] = [];
    for (let i = 0; i < normalized.length;) {
      const ch = normalized[i];
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '(' || ch === ')') {
        // Handle unary minus: if '-' and at start or after '(', or after another operator
        if (ch === '-') {
          const prev = tokens.length ? tokens[tokens.length - 1] : null;
          if (!prev || ['+', '-', '*', '/', '('].includes(prev)) {
            // unary minus: treat as a 0 - ... by inserting a 0 before
            tokens.push('0');
          }
        }
        tokens.push(ch);
        i++;
        continue;
      }

      // Number parsing (digits, optional decimal)
      if (/[0-9.]/.test(ch)) {
        let j = i + 1;
        while (j < normalized.length && /[0-9.]/.test(normalized[j])) j++;
        let numStr = normalized.slice(i, j);
        // Check for trailing percent symbol
        if (normalized[j] === '%') {
          numStr = String(parseFloat(numStr) / 100);
          j++;
        }
        tokens.push(numStr);
        i = j;
        continue;
      }

      // If we find a percent directly after a non-number (defensive), skip
      if (ch === '%') {
        // ignore lone percent
        i++;
        continue;
      }

      // Unknown character: skip it
      i++;
    }

    // Shunting-yard algorithm to RPN
    const outputQueue: string[] = [];
    const opStack: string[] = [];

    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const token of tokens) {
      if (/^-?\d+(\.\d+)?$/.test(token)) {
        outputQueue.push(token);
      } else if (['+', '-', '*', '/'].includes(token)) {
        while (opStack.length) {
          const peek = opStack[opStack.length - 1];
          if (peek === '(') break;
          const p1 = precedence[token];
          const p2 = precedence[peek] || 0;
          if (p2 >= p1) {
            outputQueue.push(opStack.pop()!);
          } else break;
        }
        opStack.push(token);
      } else if (token === '(') {
        opStack.push(token);
      } else if (token === ')') {
        while (opStack.length && opStack[opStack.length - 1] !== '(') {
          outputQueue.push(opStack.pop()!);
        }
        opStack.pop();
      }
    }
    while (opStack.length) outputQueue.push(opStack.pop()!);

    // Evaluate RPN
    const evalStack: number[] = [];
    for (const t of outputQueue) {
      if (/^-?\d+(\.\d+)?$/.test(t)) {
        evalStack.push(Number(t));
      } else if (['+', '-', '*', '/'].includes(t)) {
        const b = evalStack.pop();
        const a = evalStack.pop();
        if (a === undefined || b === undefined) throw new Error('Invalid expression');
        let res = 0;
        if (t === '+') res = a + b;
        else if (t === '-') res = a - b;
        else if (t === '*') res = a * b;
        else if (t === '/') res = a / b;
        evalStack.push(res);
      } else {
        throw new Error('Unsupported token in expression: ' + t);
      }
    }

    if (evalStack.length !== 1) throw new Error('Invalid expression evaluation');
    return evalStack[0];
  }

  const applyCalculatorValue = (field: 'loan_amount' | 'interest_amount' | 'principal_paid') => {
    const value = parseFloat(calculatorValue);
    if (!isNaN(value)) {
      setForm(prev => ({ ...prev, [field]: value }));
      setShowCalculator(false);
      setCalculatorValue('0');
    }
  };

  const convertCurrency = (amount: number, from: string, to: string) => {
    const rate = currencyRates.find(r => r.from === from && r.to === to);
    return rate ? amount * rate.rate : amount;
  };

  const exportData = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Mock export functionality
      toast({
        title: "Export Started",
        description: `Exporting data in ${format.toUpperCase()} format...`,
      });
      
      // In real implementation, call export API
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: `Data exported successfully in ${format.toUpperCase()} format`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const totals = calculateTotals();

  return (
    <div ref={fullscreenRef} className="space-y-6">
      {/* Advanced Header with Tools */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">Interest Transactions - Advanced</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(!showCalculator)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Calculator
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Currency className="h-4 w-4 mr-1" />
                Currency
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Fullscreen className="h-4 w-4 mr-1" />
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Notifications
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
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
                    <span className="text-gray-700">Toggle calculator:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Toggle currency:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Shift+C</kbd>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Toggle fullscreen:</span>
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F11</kbd>
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
            {/* Calculator Popup */}
            {showCalculator && (
              <div ref={calculatorRef} className="fixed top-20 right-4 bg-white border rounded-lg shadow-lg p-4 z-50 w-64">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Calculator</h3>
                  <Button size="sm" variant="outline" onClick={() => setShowCalculator(false)}>×</Button>
                </div>
                <div className="bg-gray-100 p-2 rounded mb-3 text-right font-mono">
                  {calculatorValue}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['C', '±', '%', '÷'].map(op => (
                    <Button key={op} size="sm" variant="outline" onClick={() => handleCalculatorInput(op)}>
                      {op}
                    </Button>
                  ))}
                  {['7', '8', '9', '×'].map(op => (
                    <Button key={op} size="sm" variant="outline" onClick={() => handleCalculatorInput(op)}>
                      {op}
                    </Button>
                  ))}
                  {['4', '5', '6', '-'].map(op => (
                    <Button key={op} size="sm" variant="outline" onClick={() => handleCalculatorInput(op)}>
                      {op}
                    </Button>
                  ))}
                  {['1', '2', '3', '+'].map(op => (
                    <Button key={op} size="sm" variant="outline" onClick={() => handleCalculatorInput(op)}>
                      {op}
                    </Button>
                  ))}
                  {['0', '.', '=', '='].map(op => (
                    <Button key={op} size="sm" variant="outline" onClick={() => handleCalculatorInput(op)} className={op === '=' ? 'col-span-2' : ''}>
                      {op}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => applyCalculatorValue('loan_amount')} className="flex-1">
                    Apply to Loan
                  </Button>
                  <Button size="sm" onClick={() => applyCalculatorValue('interest_amount')} className="flex-1">
                    Apply to Interest
                  </Button>
                  <Button size="sm" onClick={() => applyCalculatorValue('principal_paid')} className="flex-1">
                    Apply to Principal
                  </Button>
                </div>
              </div>
            )}

            {/* Currency Converter Popup */}
            {showCurrencyConverter && (
              <div className="fixed top-20 right-4 bg-white border rounded-lg shadow-lg p-4 z-50 w-80">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Currency Converter</h3>
                  <Button size="sm" variant="outline" onClick={() => setShowCurrencyConverter(false)}>×</Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Amount</Label>
                    <Input placeholder="Enter amount" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>From</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-center font-semibold">
                    Converted Amount: ₹0.00
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                        Loan #{loan.id.slice(-8)} - Amount: ₹{loan.loan_amount?.toLocaleString()} - Status: {loan.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2" 
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

      {/* Advanced Search & Filter */}
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
                onClick={() => exportData(exportFormat)}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel' | 'csv') => setExportFormat(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Search */}
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

            {/* Advanced Search */}
            {showAdvancedSearch && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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
            )}
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
            <div className="flex gap-2">
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
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectAllRows}
                    disabled={rows.length === 0}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedRows.size === 0}
                  >
                    Clear ({selectedRows.size})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={bulkExport}
                    disabled={selectedRows.size === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export Selected
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={bulkDelete}
                    disabled={selectedRows.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View Details
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
