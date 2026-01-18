import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { handleAPIError } from '@/lib/errorHandler';
import { useToast } from '@/hooks/use-toast';

type InspectionRow = {
  id: string;
  inspection_date: string;
  fuel_product_id?: string;
  dip_value?: number;
  total_sale_liters?: number | null;
  notes?: string | null;
};

export default function SalesOfficer() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    inspection_date: new Date().toISOString().slice(0, 10),
    fuel_product_id: "",
    dip_value: "",
    total_sale_liters: "",
    notes: ""
  });

  // Fetch fuel products for dropdown
  const { data: fuelProducts = [] } = useQuery({
    queryKey: ["/api/fuel-products"],
    queryFn: async () => {
      const response = await fetch('/api/fuel-products', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch fuel products');
      return result.rows || [];
    },
  });

  // Fetch inspections data using backend API
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/sales-officer-inspections", fromDate, toDate, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/sales-officer-inspections?${params.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch inspections');
      return result.rows || [];
    },
  });

  const handleSearch = async () => {
    refetch();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formData.fuel_product_id) {
        toast({
          title: "Error",
          description: "Please select a fuel product",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/sales-officer-inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          inspection_date: formData.inspection_date,
          fuel_product_id: formData.fuel_product_id,
          dip_value: formData.dip_value ? parseFloat(formData.dip_value) : null,
          total_sale_liters: formData.total_sale_liters ? parseFloat(formData.total_sale_liters) : null,
          notes: formData.notes || null
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "Success",
          description: "Sales officer inspection saved successfully!",
        });
        
        // Reset form
        setFormData({
          inspection_date: new Date().toISOString().slice(0, 10),
          fuel_product_id: "",
          dip_value: "",
          total_sale_liters: "",
          notes: ""
        });
        setShowForm(false);
        refetch();
      } else {
        const errorInfo = handleAPIError(result, "Sales Officer Inspection");
        toast({ 
          variant: "destructive", 
          title: errorInfo.title, 
          description: errorInfo.description 
        });
      }
    } catch (error: any) {
      const errorInfo = handleAPIError(error, "Sales Officer Inspection");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <h2 className="text-2xl font-semibold">Sales Officer</h2>
              <p className="text-sm text-white/80">Manage sales officer assignments</p>
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
              <Button onClick={() => setShowForm(true)}>Add Officer +</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-2">
                <Label>Inspection Date</Label>
                <Input 
                  type="date" 
                  value={formData.inspection_date} 
                  onChange={(e) => handleInputChange('inspection_date', e.target.value)} 
                />
              </div>
              <div className="md:col-span-3">
                <Label>Fuel Product</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.fuel_product_id} 
                  onChange={(e) => handleInputChange('fuel_product_id', e.target.value)}
                >
                  <option value="">Select Product</option>
                  {fuelProducts.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Dip Value (L)</Label>
                <Input 
                  type="number" 
                  step="0.001"
                  placeholder="0.000" 
                  value={formData.dip_value} 
                  onChange={(e) => handleInputChange('dip_value', e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <Label>Total Sale (L)</Label>
                <Input 
                  type="number" 
                  step="0.001"
                  placeholder="0.000" 
                  value={formData.total_sale_liters} 
                  onChange={(e) => handleInputChange('total_sale_liters', e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Input 
                  placeholder="Notes" 
                  value={formData.notes} 
                  onChange={(e) => handleInputChange('notes', e.target.value)} 
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <div className="flex gap-2">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSave}>Save</Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
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
              <Input className="ml-4" placeholder="Search notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="ml-2" />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              <Button className="ml-2" onClick={handleSearch}>Search</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left">
                  <th>S.no</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Dip (L)</th>
                  <th>Total Sale (L)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">No data available in table</td>
                  </tr>
                ) : rows.map((r, idx) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{new Date(r.inspection_date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.fuel_product_id || '-'}</td>
                    <td className="px-3 py-2">{r.dip_value ?? '-'}</td>
                    <td className="px-3 py-2">{r.total_sale_liters ?? '-'}</td>
                    <td className="px-3 py-2">{r.notes ?? '-'}</td>
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
