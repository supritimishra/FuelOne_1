import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export default function SheetRecords() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ date: '', sheet_name: '', open_reading: 0, close_reading: 0, notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    try {
      const res = await fetch('/api/sheet-records');
      const d = await res.json();
      if (d.ok) setRows(d.rows || []);
    } catch (e) { console.error('Failed to fetch sheet records', e); }
  }

  async function save() {
    try {
      let res;
      if (editingId) {
        res = await fetch('/api/sheet-records/' + editingId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        res = await fetch('/api/sheet-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      const d = await res.json();
      if (d.ok) {
        setForm({ date: '', sheet_name: '', open_reading: 0, close_reading: 0, notes: '' });
        setEditingId(null);
        fetchList();
      } else console.error('Save failed', d);
    } catch (e) { console.error('Save error', e); }
  }

  function editRow(r: any) {
    setEditingId(r.id);
    setForm({ date: r.date || '', sheet_name: r.sheet_name || '', open_reading: r.open_reading || 0, close_reading: r.close_reading || 0, notes: r.notes || '' });
  }

  async function delRow(id: string) {
    if (!confirm('Delete this sheet record?')) return;
    try {
      const res = await fetch('/api/sheet-records/' + id, { method: 'DELETE' });
      const d = await res.json();
      if (d.ok) fetchList();
    } catch (e) { console.error('Delete failed', e); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <Label className="text-white">Date</Label>
              <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Date" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-white">Sheet Name</Label>
              <Input value={form.sheet_name} onChange={(e) => setForm({ ...form, sheet_name: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label className="text-white">Open Reading</Label>
              <Input type="number" value={String(form.open_reading)} onChange={(e) => setForm({ ...form, open_reading: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-3">
              <Label className="text-white">Close Reading</Label>
              <Input type="number" value={String(form.close_reading)} onChange={(e) => setForm({ ...form, close_reading: Number(e.target.value) })} />
            </div>

            <div className="md:col-span-12">
              <Label className="text-white">Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
            </div>

            <div className="md:col-span-12 flex justify-center mt-4">
              <div className="flex gap-2">
                <Button className="bg-white text-black" onClick={save}>{editingId ? 'Update' : 'Save'}</Button>
                {editingId && <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ date: '', sheet_name: '', open_reading: 0, close_reading: 0, notes: '' }); }}>Cancel</Button>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sheet Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left">
                  <th>#</th>
                  <th>Date</th>
                  <th>Sheet</th>
                  <th>Open</th>
                  <th>Close</th>
                  <th>Diff</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted-foreground py-8">No data available in table</td>
                  </tr>
                ) : rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i+1}</td>
                    <td>{r.date}</td>
                    <td>{r.sheet_name}</td>
                    <td>{r.open_reading}</td>
                    <td>{r.close_reading}</td>
                    <td>{(Number(r.close_reading) - Number(r.open_reading))}</td>
                    <td>{r.notes}</td>
                    <td className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => editRow(r)}>Edit</Button>
                      <Button size="icon" variant="ghost" onClick={() => delRow(r.id)}>Delete</Button>
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
