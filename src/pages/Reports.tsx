import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useReportDateRange } from "@/hooks/useDateRange";

const REPORTS = [
  'All Credit Customers',
  'Receivables/Payables',
  'Revenue',
  'Net Profit',
  'Attendance',
  "Busi. Credit/Debit Flow",
  "Bowser Transaction's",
  'Customer Account Statement',
  'Daily Rate History',
  'Daily Stock/Sale Register',
  'Daily Business Summary',
  'Discounts Offered',
  'Expenditure',
  'Working Capital',
  // Revenue & profit summaries
  // Receivables/Payables provides a short balance summary
  'Taxation',
  'Guest Customer Sales',
  'Lubricants Stock',
  'Purchase',
  'Employee Status',
  'Employee Transactions',
  'Sales',
  'Stock Variation',
  'Swipe',
  'Vendor Transactions',
  'FeedBack',
  'Interest Transactions',
];

type Field = { key: string; label: string; type?: string };
type Section = { title?: string; fields: Field[] };
type SectionLike = Section | Field; // allow flat field arrays for simple reports

const reportFields: Record<string, SectionLike[]> = {
  "All Credit Customers": [
    {
      title: 'Credit Parties Summary', fields: [
        { key: 'from', label: 'From Date', type: 'date' },
        { key: 'to', label: 'To Date', type: 'date' },
        { key: 'detailed', label: 'Detailed View', type: 'checkbox' },
        { key: 'creditDue', label: 'Credit Due View', type: 'checkbox' },
      ]
    },
    {
      title: 'Day Wise Credit', fields: [
        { key: 'saleDate', label: 'Sale Date', type: 'date' },
        { key: 'byGroup', label: 'By Group', type: 'checkbox' },
        { key: 'shiftWise', label: 'Shift Wise', type: 'checkbox' },
      ]
    },
    {
      title: 'Month wise Recovery', fields: [
        { key: 'm_from', label: 'From Date', type: 'date' },
        { key: 'm_to', label: 'To Date', type: 'date' },
        { key: 'mode', label: 'Mode' },
        { key: 'm_shift', label: 'Shift Wise', type: 'checkbox' },
      ]
    },
    {
      title: 'Indent wise Credit bill', fields: [
        { key: 'i_from', label: 'From Date', type: 'date' },
        { key: 'i_to', label: 'To Date', type: 'date' },
        { key: 'organization', label: 'Organization' },
        { key: 'vehicle', label: 'Vehicle' },
      ]
    },
    {
      title: 'Balance', fields: [
        { key: 'balance', label: 'Customer Balance Report', type: 'label' },
      ]
    },
    {
      title: 'Credit Limit Crossed Report', fields: [
        { key: 'cl_label', label: 'Customer Balance Report', type: 'label' },
        { key: 'cl_from', label: 'From Date', type: 'date' },
        { key: 'cl_to', label: 'To Date', type: 'date' },
      ]
    },
    {
      title: 'Vehicle wise Summary', fields: [
        { key: 'v_from', label: 'From Date', type: 'date' },
        { key: 'v_to', label: 'To Date', type: 'date' },
      ]
    },
  ],
  // No separate Credit Parties Summary item in the menu per screenshot
  "Attendance": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'employee', label: 'Employee Name' },
    { key: 'shift', label: 'Shift Wise' },
  ],
  "Busi. Credit/Debit Flow": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'type', label: 'Type' },
    { key: 'party', label: 'Party' },
  ],
  "Bowser Transaction's": [
    {
      title: 'Bowser Transactions', fields: [
        { key: 'from', label: 'From Date', type: 'date' },
        { key: 'to', label: 'To Date', type: 'date' },
        { key: 'shift', label: 'Shift Wise' },
        { key: 'bowser', label: 'Bowser List' },
      ]
    },
    {
      title: 'Bowser Day Transaction', fields: [
        { key: 'selectDate', label: 'Select Date', type: 'date' },
        { key: 'shift', label: 'Shift Wise' },
      ]
    },
  ],
  "Customer Account Statement": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'organization', label: 'Organization' },
    { key: 'liquids', label: 'Liquids', type: 'checkbox' },
    { key: 'recovery', label: 'Recovery', type: 'checkbox' },
    { key: 'lubricants', label: 'Lubricants', type: 'checkbox' },
  ],
  "Daily Rate History": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'product', label: 'Product' },
  ],
  "Daily Stock/Sale Register": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
  ],
  "Daily Business Summary": [
    { key: 'selectDate', label: 'Select Date', type: 'date' },
    { key: 'shift', label: 'Shift Wise' },
  ],
  "Working Capital": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
  ],
  "Discounts Offered": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
  ],
  "Expenditure": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'shift', label: 'Shift Wise' },
    { key: 'flow', label: 'Flow' },
    { key: 'expenseType', label: 'Expense Type' },
  ],
  "Taxation": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'taxType', label: 'Tax Type' },
  ],
  "Guest Customer Sales": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'shift', label: 'Shift Wise' },
    { key: 'mobile', label: 'Mobile Number' },
  ],
  "Lubricants Stock": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'product', label: 'Product' },
  ],
  "Purchase": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'vendor_type', label: 'Vendor Type' },
    { key: 'type', label: 'Type' },
  ],
  "Employee Status": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'employee', label: 'Employee' },
  ],
  "Employee Transactions": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'employee', label: 'Employee' },
  ],
  "Sales": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'product', label: 'Product' },
  ],
  "Stock Variation": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
  ],
  "Swipe": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'shift', label: 'Shift Wise' },
    { key: 'swipeMode', label: 'Swipe Mode' },
  ],
  "Vendor Transactions": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'vendor_type', label: 'Vendor Type' },
    { key: 'vendor', label: 'Vendor' },
  ],
  "FeedBack": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
  ],
  "Interest Transactions": [
    { key: 'from', label: 'From Date', type: 'date' },
    { key: 'to', label: 'To Date', type: 'date' },
    { key: 'party', label: 'Party' },
    { key: 'loan', label: 'Loan' },
  ],
};

export default function Reports() {
  // Use standardized date range hook with 12 months default
  const { fromDate, toDate, setFromDate, setToDate, isValidRange } = useReportDateRange('LAST_12_MONTHS');

  const [selected, setSelected] = useState<string | null>(REPORTS[0]);
  const sections = useMemo(() => {
    const raw = reportFields[selected as string];
    if (!raw || raw.length === 0) return [{ title: undefined, fields: [{ key: 'from', label: 'From Date', type: 'date' }, { key: 'to', label: 'To Date', type: 'date' }] }];
    // If first element has 'fields', treat as Section[]; else wrap as a single Section
    const first: any = raw[0] as any;
    if (first && typeof first === 'object' && 'fields' in first) {
      return raw as Section[];
    }
    return [{ title: undefined, fields: raw as Field[] }];
  }, [selected]);
  const [values, setValues] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const [reportRows, setReportRows] = useState<any[] | null>(null);
  const [reportColumns, setReportColumns] = useState<string[] | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bowsers, setBowsers] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const vendorTypes = ['All', 'Liquid', 'Lubricant', 'Other'];
  const businessTypes = ['Bank', 'Capital', 'Cash', 'Creditor', 'Owner', 'Tanker'];
  const swipeModes = ['Cash', 'Bank', 'Petrol', 'Swipe'];
  const taxOptions = [
    'GST Purchases',
    'GST Sales',
    'TCS',
    'TDS',
    'VAT',
    'LFR',
  ];

  const setVal = (k: string, v: any) => setValues(prev => ({ ...prev, [k]: v }));

  // Clear report when switching sections or filters
  useEffect(() => {
    setReportRows(null);
    setReportColumns(null);
  }, [selected, values]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/credit-customers');
        const result = await response.json();
        if (result.ok) {
          setOrganizations(result.rows || []);
        }
      } catch (e) { /* ignore */ }
      try {
        const response = await fetch('/api/vendors');
        const result = await response.json();
        if (result.ok) {
          setVendors(result.rows || []);
        }
      } catch (e) { /* ignore */ }
      try {
        const response = await fetch('/api/employees');
        const result = await response.json();
        if (result.ok) {
          setEmployees(result.rows || []);
        }
      } catch (e) { /* ignore */ }
      try {
        const response = await fetch('/api/fuel-products');
        const result = await response.json();
        if (result.ok) {
          setProducts(result.rows || []);
        }
      } catch (e) { /* ignore */ }
      try {
        // Tanks used as bowser list in several pages
        const response = await fetch('/api/tanks');
        const result = await response.json();
        if (result.ok) {
          setBowsers(result.rows || []);
        }
      } catch (e) { /* ignore */ }
      try {
        const response = await fetch('/api/expense-types');
        const result = await response.json();
        if (result.ok) {
          setExpenseTypes(result.rows || []);
        }
      } catch (e) { /* ignore */ }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Reports</span></div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-orange-600 tracking-widest">REPORTS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <div className="border rounded-md divide-y overflow-auto max-h-[60vh]">
                {REPORTS.map((label) => (
                  <button key={label} onClick={() => setSelected(label)} className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${selected === label ? 'bg-muted/60 font-medium' : ''}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-9">
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold text-lg mb-4">{selected}</h3>
                <div className="space-y-6">
                  {sections.map((sec, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-white/50">
                      {sec.title && <h4 className="font-medium text-sm mb-3">{sec.title}</h4>}
                      <div className="space-y-3">
                        {/* Render date pairs on a single row when two consecutive date fields exist */}
                        {(() => {
                          const elems: any[] = [];
                          for (let i = 0; i < sec.fields.length; i++) {
                            const f = sec.fields[i];
                            if (f.type === 'label') {
                              elems.push(
                                <div key={f.key} className="py-3 text-sm text-muted-foreground border rounded px-2">{f.label}</div>
                              );
                              continue;
                            }
                            // If current and next are both dates, render side-by-side
                            const next = sec.fields[i + 1];
                            if (f.type === 'date' && next && next.type === 'date') {
                              elems.push(
                                <div key={f.key + "_pair"} className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-muted-foreground">{f.label}</label>
                                    <Input type="date" value={values[f.key] || ''} onChange={(e: any) => setVal(f.key, e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="text-sm text-muted-foreground">{next.label}</label>
                                    <Input type="date" value={values[next.key] || ''} onChange={(e: any) => setVal(next.key, e.target.value)} />
                                  </div>
                                </div>
                              );
                              i++; // skip next
                              continue;
                            }
                            // default single-column render
                            elems.push(
                              <div key={f.key} className="space-y-1">
                                <label className="text-sm text-muted-foreground">{f.label}</label>
                                {f.type === 'checkbox' ? (
                                  <div className="flex items-center gap-2"><input type="checkbox" checked={!!values[f.key]} onChange={(e: any) => setVal(f.key, e.target.checked)} /></div>
                                ) : (
                                  // Use DB-driven selects for known keys
                                  (f.key === 'organization') ? (
                                    <Select value={values['organization'] || 'All'} onValueChange={(v) => setVal('organization', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Organization" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="All">All Organizations</SelectItem>
                                        {organizations.map((o: any) => (<SelectItem key={o.id} value={String(o.id)}>{o.organization_name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'vendor') ? (
                                    <Select value={values['vendor'] || 'All'} onValueChange={(v) => { setVal('vendor', v); setVal('party', v); }}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Vendor" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="All">All Vendors</SelectItem>
                                        {vendors.map((v: any) => (<SelectItem key={v.id} value={String(v.id)}>{v.vendor_name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'employee') ? (
                                    <Select value={values['employee'] || 'All'} onValueChange={(v) => setVal('employee', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Employee" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="All">All Employees</SelectItem>
                                        {employees.map((e: any) => (<SelectItem key={e.id} value={String(e.id)}>{e.employee_name || e.name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'product') ? (
                                    <Select value={values['product'] || 'All'} onValueChange={(v) => setVal('product', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Product" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="All">All Products</SelectItem>
                                        {products.map((p: any) => (<SelectItem key={p.id} value={String(p.id)}>{p.product_name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'bowser') ? (
                                    <Select value={values['bowser'] || ''} onValueChange={(v) => setVal('bowser', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Bowser" /></SelectTrigger>
                                      <SelectContent>
                                        {bowsers.map((b: any) => (<SelectItem key={b.id} value={String(b.id)}>{b.tank_number}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'mode') ? (
                                    <Select value={values['mode'] || ''} onValueChange={(v) => setVal('mode', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Mode" /></SelectTrigger>
                                      <SelectContent>
                                        {swipeModes.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'type') ? (
                                    <Select value={values['type'] || ''} onValueChange={(v) => setVal('type', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Type" /></SelectTrigger>
                                      <SelectContent>
                                        {businessTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'swipeMode') ? (
                                    <Select value={values['swipeMode'] || ''} onValueChange={(v) => setVal('swipeMode', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Swipe Mode" /></SelectTrigger>
                                      <SelectContent>
                                        {swipeModes.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'flow') ? (
                                    <Select value={values['flow'] || ''} onValueChange={(v) => setVal('flow', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Flow" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="In">In</SelectItem>
                                        <SelectItem value="Out">Out</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'expenseType') ? (
                                    <Select value={values['expenseType'] || ''} onValueChange={(v) => setVal('expenseType', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Expense Type" /></SelectTrigger>
                                      <SelectContent>
                                        {expenseTypes.map((e: any) => (<SelectItem key={e.id} value={String(e.id)}>{e.expense_type_name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'taxType') ? (
                                    <Select value={values['taxType'] || taxOptions[0]} onValueChange={(v) => setVal('taxType', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Choose Tax Type" /></SelectTrigger>
                                      <SelectContent>
                                        {taxOptions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (f.key === 'vendor_type') ? (
                                    <Select value={values['vendor_type'] || 'All'} onValueChange={(v) => setVal('vendor_type', v)}>
                                      <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Vendor Type" /></SelectTrigger>
                                      <SelectContent>
                                        {vendorTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input value={values[f.key] || ''} onChange={(e: any) => setVal(f.key, e.target.value)} />
                                  )
                                )}
                              </div>
                            );
                          }
                          return elems;
                        })()}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button onClick={async () => {
                          try {
                            const sectionParams: Record<string, any> = {};
                            sec.fields.forEach(f => { sectionParams[f.key] = values[f.key]; });
                            // If this is the Credit Parties Summary section, fetch the actual report data
                            if (selected === 'All Credit Customers' && sec.title && sec.title.toLowerCase().includes('credit')) {
                              // build query with optional from/to
                              const q: string[] = [];
                              if (values['from']) q.push(`from=${encodeURIComponent(values['from'])}`);
                              if (values['to']) q.push(`to=${encodeURIComponent(values['to'])}`);
                              const url = '/api/reports/all-credit-customers' + (q.length ? `?${q.join('&')}` : '');
                              const r = await fetch(url);
                              const j = await r.json();
                              if (j.ok) {
                                setReportRows(j.rows || []);
                                setReportColumns(['organization_name', 'phone_number', 'mobile_number', 'credit_limit', 'current_balance']);
                                toast({ title: 'Report loaded' });
                              } else {
                                toast({ variant: 'destructive', title: 'Failed', description: j.error || 'Unknown' });
                              }
                            } else {
                              // Real-time endpoints for some reports
                              const lowerTitle = (sec.title || '').toLowerCase();
                              const qs: string[] = [];
                              if (values['from']) qs.push(`from=${encodeURIComponent(values['from'])}`);
                              if (values['to']) qs.push(`to=${encodeURIComponent(values['to'])}`);
                              // swipe mode
                              if (selected === 'Swipe' && values['swipeMode'] && values['swipeMode'] !== 'All') qs.push(`mode=${encodeURIComponent(values['swipeMode'])}`);
                              // employee filters
                              if ((selected === 'Attendance' || selected === 'Employee Transactions') && values['employee'] && values['employee'] !== 'All') {
                                const v = values['employee'];
                                if (/^\d+$/.test(String(v))) qs.push(`employee_id=${encodeURIComponent(String(v))}`);
                                else qs.push(`employee=${encodeURIComponent(String(v))}`);
                              }
                              // vendor filters
                              if (selected === 'Vendor Transactions') {
                                if (values['type'] && values['type'] !== 'All') qs.push(`type=${encodeURIComponent(values['type'])}`);
                                if (values['vendor_type'] && values['vendor_type'] !== 'All') qs.push(`vendor_type=${encodeURIComponent(values['vendor_type'])}`);
                                if (values['party'] && values['party'] !== 'All') qs.push(`party=${encodeURIComponent(values['party'])}`);
                              }
                              if (selected === 'Busi. Credit/Debit Flow') {
                                if (values['type'] && values['type'] !== 'All') qs.push(`type=${encodeURIComponent(values['type'])}`);
                                // allow business types mapping
                                if (values['party'] && values['party'] !== 'All') qs.push(`party=${encodeURIComponent(values['party'])}`);
                              }

                              let liveEndpoint: string | null = null;
                              if (selected === 'Swipe') liveEndpoint = '/api/reports/swipe';
                              if (selected === 'Vendor Transactions') liveEndpoint = '/api/reports/vendor-transactions';
                              if (selected === 'Attendance') liveEndpoint = '/api/reports/attendance';
                              if (selected === 'Busi. Credit/Debit Flow') liveEndpoint = '/api/reports/business-transactions';
                              if (selected === 'Sales') {
                                // Pass product id or name
                                if (values['product'] && values['product'] !== 'All') {
                                  const v = values['product'];
                                  if (/^\d+$/.test(String(v))) qs.push(`product_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`product=${encodeURIComponent(String(v))}`);
                                }
                                liveEndpoint = '/api/reports/sales';
                              }
                              if (selected === 'Customer Account Statement') {
                                if (values['organization'] && values['organization'] !== 'All') {
                                  const v = values['organization'];
                                  if (/^\d+$/.test(String(v))) qs.push(`organization_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`organization=${encodeURIComponent(String(v))}`);
                                }
                                if (values['employee'] && values['employee'] !== 'All') {
                                  const v = values['employee'];
                                  if (/^\d+$/.test(String(v))) qs.push(`employee_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`employee=${encodeURIComponent(String(v))}`);
                                }
                                if (values['liquids']) qs.push('liquids=true');
                                if (values['lubricants']) qs.push('lubricants=true');
                                if (values['recovery']) qs.push('recovery=true');
                                if (values['all']) qs.push('all=true');
                                liveEndpoint = '/api/reports/customer-account-statement';
                              }
                              if (selected === "Bowser Transaction's") {
                                if ((sec.title || '').toLowerCase().includes('bowser day')) {
                                  if (values['selectDate']) qs.push(`date=${encodeURIComponent(values['selectDate'])}`);
                                  liveEndpoint = '/api/reports/bowser-day';
                                } else {
                                  if (values['bowser']) {
                                    const v = values['bowser'];
                                    if (/^\d+$/.test(String(v))) qs.push(`bowser_id=${encodeURIComponent(String(v))}`);
                                    else qs.push(`bowser=${encodeURIComponent(String(v))}`);
                                  }
                                  liveEndpoint = '/api/reports/bowser-transactions';
                                }
                              }
                              if (selected === 'Daily Business Summary') {
                                if (values['selectDate']) qs.push(`date=${encodeURIComponent(values['selectDate'])}`);
                                liveEndpoint = '/api/reports/daily-business-summary';
                              }
                              if (selected === 'Purchase') {
                                if (values['type']) qs.push(`type=${encodeURIComponent(values['type'])}`);
                                if (values['vendor_type']) qs.push(`vendor_type=${encodeURIComponent(values['vendor_type'])}`);
                                liveEndpoint = '/api/reports/product-purchases';
                              }
                              if (selected === 'Taxation') {
                                const t = (values['taxType'] || 'GST Purchases').toLowerCase();
                                if (t.includes('gst') && t.includes('purchase')) liveEndpoint = '/api/reports/gst-purchases';
                                else if (t.includes('gst') && t.includes('sale')) liveEndpoint = '/api/reports/gst-sales';
                                else if (t.includes('tcs')) liveEndpoint = '/api/reports/tcs';
                                else if (t.includes('tds')) liveEndpoint = '/api/reports/tds';
                                else if (t.includes('vat')) liveEndpoint = '/api/reports/vat';
                                else if (t.includes('lfr')) liveEndpoint = '/api/reports/lfr';
                                else liveEndpoint = '/api/reports/gst-purchases';
                              }
                              if (selected === 'Daily Rate History') {
                                if (values['product'] && values['product'] !== 'All') {
                                  const v = values['product'];
                                  if (/^\d+$/.test(String(v))) qs.push(`product_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`product=${encodeURIComponent(String(v))}`);
                                }
                                liveEndpoint = '/api/reports/product-rate';
                              }
                              if (selected === 'DSR' || selected === 'DSR Format Report') {
                                if (values['product']) {
                                  const v = values['product'];
                                  if (/^\d+$/.test(String(v))) qs.push(`product_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`product=${encodeURIComponent(String(v))}`);
                                }
                              }
                              if (selected === 'DSR') {
                                if (values['reportType']) qs.push(`reportType=${encodeURIComponent(values['reportType'])}`);
                                if (values['product']) {
                                  const v = values['product'];
                                  if (/^\d+$/.test(String(v))) qs.push(`product_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`product=${encodeURIComponent(String(v))}`);
                                }
                                liveEndpoint = '/api/reports/dsr';
                              }
                              if (selected === 'DSR Format Report') {
                                if (values['product']) {
                                  const v = values['product'];
                                  if (/^\d+$/.test(String(v))) qs.push(`product_id=${encodeURIComponent(String(v))}`);
                                  else qs.push(`product=${encodeURIComponent(String(v))}`);
                                }
                                liveEndpoint = '/api/reports/dsr-format';
                              }
                              if (selected === 'Day Wise Stock Value') {
                                if (values['type']) qs.push(`type=${encodeURIComponent(values['type'])}`);
                                liveEndpoint = '/api/reports/day-stock-value';
                              }
                              if (selected === 'Expenditure') {
                                if (values['flow'] && values['flow'] !== 'All') qs.push(`flow=${encodeURIComponent(values['flow'])}`);
                                if (values['expenseType'] && values['expenseType'] !== 'All') qs.push(`expenseType=${encodeURIComponent(values['expenseType'])}`);
                                liveEndpoint = '/api/reports/expenditure';
                              }
                              if (selected === 'Working Capital') {
                                // pass from/to already included
                                liveEndpoint = '/api/reports/working-capital';
                              }
                              // New summary endpoints
                              if (selected === 'Receivables/Payables') {
                                liveEndpoint = '/api/reports/receivables-payables';
                              }
                              if (selected === 'Revenue') {
                                liveEndpoint = '/api/reports/revenue';
                              }
                              if (selected === 'Net Profit') {
                                liveEndpoint = '/api/reports/net-profit';
                              }
                              if (selected === 'Employee Transactions') {
                                liveEndpoint = '/api/reports/employee-transactions';
                              }
                              if (selected === 'Guest Customer Sales') {
                                if (values['mobile']) qs.push(`mobile=${encodeURIComponent(values['mobile'])}`);
                                liveEndpoint = '/api/reports/guest-customer';
                              }
                              if (selected === 'Stock Variation') {
                                liveEndpoint = '/api/reports/stock-variation';
                              }

                              if (liveEndpoint) {
                                const url = liveEndpoint + (qs.length ? `?${qs.join('&')}` : '');
                                const r = await fetch(url);
                                const j = await r.json();
                                if (j.ok) {
                                  setReportRows(j.rows || []);
                                  // set column order based on report
                                  if (selected === 'Swipe') setReportColumns(['transaction_date', 'swipe_type', 'swipe_mode', 'amount', 'batch_number', 'employee_name']);
                                  else if (selected === 'Vendor Transactions') setReportColumns(['transaction_date', 'vendor_name', 'vendor_type', 'transaction_type', 'amount', 'payment_mode', 'description']);
                                  else if (selected === 'Attendance') setReportColumns(['attendance_date', 'employee_name', 'status', 'shift_name']);
                                  else if (selected === 'Busi. Credit/Debit Flow') setReportColumns(['transaction_date', 'transaction_type', 'party_name', 'amount', 'description']);
                                  else if (selected === 'Sales') setReportColumns(['date', 'type', 'item', 'quantity', 'rate', 'amount']);
                                  else if (selected === 'Customer Account Statement') setReportColumns(['date', 'organization_name', 'entry_type', 'product', 'amount', 'payment_mode']);
                                  else if (selected === 'Purchase') setReportColumns(['invoice_date', 'invoice_number', 'vendor_name', 'vendor_type', 'invoice_type', 'amount', 'gst_amount', 'total_amount', 'payment_status']);
                                  else if (selected === 'Daily Rate History') setReportColumns(['rate_date', 'product_name', 'open_rate', 'close_rate', 'variation_amount']);
                                  else if (selected === 'DSR') setReportColumns(['date', 'product_name', 'total_qty', 'total_amount']);
                                  else if (selected === 'DSR Format Report') setReportColumns(['date', 'product_name', 'opening_reading', 'closing_reading', 'quantity', 'rate', 'amount']);
                                  else if (selected === 'Day Wise Stock Value') setReportColumns(['date', 'total_value']);
                                  else if (selected === 'Expenditure') setReportColumns(['expense_date', 'expense_type_name', 'flow_type', 'payment_mode', 'amount', 'employee_name']);
                                  else if (selected === 'Guest Customer Sales') setReportColumns(['sale_date', 'mobile_number', 'vehicle_number', 'product_name', 'quantity', 'price_per_unit', 'total_amount', 'payment_mode']);
                                  else if (selected === 'Stock Variation') setReportColumns(['date', 'product_name', 'opening_reading', 'closing_reading', 'quantity', 'variation']);
                                  else if (selected === 'Receivables/Payables') setReportColumns(['total_receivables', 'total_payables']);
                                  else if (selected === 'Revenue') setReportColumns(['from', 'to', 'meter_sales', 'guest_sales', 'lub_sales', 'revenue']);
                                  else if (selected === 'Net Profit') setReportColumns(['from', 'to', 'meter_sales', 'guest_sales', 'lub_sales', 'revenue', 'total_expenses', 'cogs', 'net_profit']);
                                  else if (selected === "Bowser Transaction's") setReportColumns(['sale_date', 'product_name', 'before_dip_stock', 'gross_stock', 'tanker_sale_quantity', 'notes']);
                                  else if (selected === 'Taxation') {
                                    const t = (values['taxType'] || 'GST Purchases').toLowerCase();
                                    if (t.includes('gst') && t.includes('purchase')) setReportColumns(['invoice_date', 'vendor_name', 'invoice_number', 'amount', 'gst_amount', 'total_amount']);
                                    else if (t.includes('gst') && t.includes('sale')) setReportColumns(['product_name', 'total_sales', 'vat_amount']);
                                    else if (t.includes('tcs')) setReportColumns(['invoice_date', 'vendor_name', 'invoice_number', 'amount', 'gst_amount', 'tcs_amount', 'total_amount']);
                                    else if (t.includes('tds')) setReportColumns(['transaction_date', 'vendor_name', 'transaction_type', 'amount', 'tds_amount', 'payment_mode']);
                                    else if (t.includes('vat')) setReportColumns(['product_name', 'total_sales', 'vat_amount']);
                                    else if (t.includes('lfr')) setReportColumns([]);
                                  }
                                  else if (selected === 'Daily Business Summary') setReportColumns(['date', 'opening_balance', 'meter_sale', 'lubricant_sale', 'total_sale', 'credit_amount', 'expenses', 'shortage', 'closing_balance', 'notes']);
                                  toast({ title: 'Report loaded' });
                                } else {
                                  toast({ variant: 'destructive', title: 'Failed', description: j.error || 'Unknown' });
                                }
                              } else {
                                const res = await fetch('/api/reports/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ report: selected, section: sec.title, params: sectionParams }) });
                                const j = await res.json();
                                if (j.ok) {
                                  toast({ title: 'Report queued' });
                                } else {
                                  toast({ variant: 'destructive', title: 'Failed', description: j.error || 'Unknown' });
                                }
                              }
                            }
                          } catch (e: any) {
                            toast({ variant: 'destructive', title: 'Failed', description: e.message || String(e) });
                          }
                        }} className="bg-emerald-400">SUBMIT</Button>
                      </div>
                    </div>
                  ))}
                </div>
                {reportRows && (
                  <div className="mt-6 border rounded p-4">
                    <h4 className="font-semibold mb-3">Report Results</h4>
                    <div className="overflow-auto max-h-64">
                      <table className="w-full text-sm table-auto">
                        <thead>
                          <tr className="text-left">
                            {(reportColumns || Object.keys(reportRows[0] || {})).map((c) => (
                              <th key={c} className="pr-4">{c.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportRows.map((row, idx) => {
                            const cols = (reportColumns || Object.keys(row));
                            return (
                              <tr key={row.id || idx} className="border-t">
                                {cols.map((c) => (
                                  <td key={c} className="pr-4 py-2">{String(row[c] ?? '')}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
