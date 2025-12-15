import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DutyPay() {
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState({ month: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ pay_month: '', total_salary: 0, total_employees: 0, notes: '' });

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    try {
      const qs = new URLSearchParams();
      if (filters.month) qs.set('month', filters.month);
      const res = await fetch('/api/duty-pay' + (qs.toString() ? ('?' + qs.toString()) : ''), {
        credentials: 'include'
      });
      const d = await res.json();
      if (d.ok) setRows(d.rows || []);
    } catch (e) { console.error('Failed to fetch duty pay', e); }
  }

  async function save() {
    try {
      // Convert YYYY-MM format to full date YYYY-MM-DD (first day of month)
      const payMonthDate = form.pay_month ? `${form.pay_month}-01` : new Date().toISOString().slice(0, 10);
      
      const payload = {
        ...form,
        pay_month: payMonthDate
      };
      
      let res;
      if (editingId) {
        res = await fetch('/api/duty-pay/' + editingId, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          credentials: 'include',
          body: JSON.stringify(payload) 
        });
      } else {
        res = await fetch('/api/duty-pay', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          credentials: 'include',
          body: JSON.stringify(payload) 
        });
      }
      const d = await res.json();
      if (d.ok) {
        setForm({ pay_month: '', total_salary: 0, total_employees: 0, notes: '' });
        setEditingId(null);
        setShowForm(false);
        fetchList();
        alert('Duty pay saved successfully!');
      } else {
        console.error('Save failed', d);
        alert('Save failed: ' + (d.error || 'Unknown error'));
      }
    } catch (e) { 
      console.error('Save error', e); 
      alert('Save error: ' + e.message);
    }
  }

  function editRow(r: any) {
    setEditingId(r.id);
    // Convert YYYY-MM-DD to YYYY-MM for month input
    const monthValue = r.pay_month ? (r.pay_month || '').slice(0, 7) : '';
    setForm({ pay_month: monthValue, total_salary: Number(r.total_salary || 0), total_employees: Number(r.total_employees || 0), notes: r.notes || '' });
    setShowForm(true);
  }

  async function delRow(id: string) {
    if (!confirm('Delete this duty pay entry?')) return;
    try {
      const res = await fetch('/api/duty-pay/' + id, { 
        method: 'DELETE',
        credentials: 'include'
      });
      const d = await res.json();
      if (d.ok) fetchList();
    } catch (e) { console.error('Delete failed', e); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <h2 className="text-2xl font-semibold">Duty Pay</h2>
              <p className="text-sm text-white/80">Manage monthly duty/payroll entries</p>
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
              <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ pay_month: '', total_salary: 0, total_employees: 0, notes: '' }); }}>Add Salary +</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <Label>Month</Label>
                <Input type="month" value={form.pay_month} onChange={(e) => setForm({ ...form, pay_month: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Label>Total Salary</Label>
                <Input type="number" value={String(form.total_salary)} onChange={(e) => setForm({ ...form, total_salary: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-3">
                <Label>Total Employees</Label>
                <Input type="number" value={String(form.total_employees)} onChange={(e) => setForm({ ...form, total_employees: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-12">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="md:col-span-12 flex justify-center mt-4">
                <div className="flex gap-2">
                  <Button className="bg-green-600 text-white" onClick={save}>{editingId ? 'Update' : 'Save'}</Button>
                  <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Label>Show:</Label>
              <select className="border rounded p-1 text-sm">
                <option>All</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border text-sm">Copy</button>
              <button className="px-3 py-1 rounded border text-sm">CSV</button>
              <button className="px-3 py-1 rounded border text-sm">PDF</button>
              <button className="px-3 py-1 rounded border text-sm">Print</button>
              <input className="border rounded p-1 text-sm ml-4" placeholder="Filter: Type to filter..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
            <div className="md:col-span-4">
              <Label>Filter Month</Label>
              <Input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button className="bg-orange-500 text-white" onClick={fetchList}>Search</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left">
                  <th>S.no</th>
                  <th>Year</th>
                  <th>Month</th>
                  <th>Total Salary</th>
                  <th>Total Employee</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted-foreground py-8">No data available in table</td>
                  </tr>
                ) : rows.map((r, i) => {
                  const ym = (r.pay_month || '').slice(0,10);
                  const year = ym ? new Date(ym).getFullYear() : '';
                  const month = ym ? new Date(ym).toLocaleString('default', { month: 'short' }) : '';
                  return (
                    <tr key={r.id}>
                      <td>{i+1}</td>
                      <td>{year}</td>
                      <td>{month}</td>
                      <td>{r.total_salary}</td>
                      <td>{r.total_employees}</td>
                      <td>{r.notes}</td>
                      <td className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => editRow(r)}>Edit</Button>
                        <Button size="icon" variant="ghost" onClick={() => delRow(r.id)}>Delete</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
