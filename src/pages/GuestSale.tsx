import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Save } from 'lucide-react';

interface VehicleNumber {
  tempId: string;
  value: string;
}

interface FormData {
  date: string;
  customerName: string;
  mobileNumber: string;
  discountAmount: string;
  offerType: string;
  gstTin: string;
  vehicleNumbers: VehicleNumber[];
}

interface GuestEntry {
  _id: string;
  saleDate: string;
  customerName: string;
  mobileNumber: string;
  discount: number;
  offerType: string;
  gstNumber: string;
  vehicleNumbers: string[];
  status: string;
  createdBy?: {
    username: string;
    _id: string;
  };
  createdAt: string;
}

export default function GuestSale() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    mobileNumber: '',
    discountAmount: '',
    offerType: 'percentage',
    gstTin: '',
    vehicleNumbers: [{ tempId: crypto.randomUUID(), value: '' }]
  });

  const [guestEntries, setGuestEntries] = useState<GuestEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGuestEntries();
  }, []);

  const fetchGuestEntries = async () => {
    try {
      const response = await fetch('/api/guest-sales', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result.rows || result;
        setGuestEntries(Array.isArray(data) ? data : []);
      } else {
        setGuestEntries([]);
      }
    } catch (error) {
      console.error('Error fetching guest entries:', error);
      setGuestEntries([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const discount = parseFloat(formData.discountAmount) || 0;
      const payload = {
        saleDate: formData.date,
        customerName: formData.customerName,
        mobileNumber: formData.mobileNumber,
        discount: discount,
        totalAmount: discount,
        offerType: formData.offerType,
        gstNumber: formData.gstTin,
        vehicleNumbers: formData.vehicleNumbers.map(v => v.value).filter(v => v.trim()),
        status: 'active'
      };

      const url = editingId
        ? `/api/guest-sales/${editingId}`
        : '/api/guest-sales';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: editingId ? 'Guest sale updated' : 'Guest sale added',
          description: editingId ? 'Guest sale has been updated successfully.' : 'Guest sale has been added successfully.',
        });
        setFormData({
          date: new Date().toISOString().split('T')[0],
          customerName: '',
          mobileNumber: '',
          discountAmount: '',
          offerType: 'percentage',
          gstTin: '',
          vehicleNumbers: [{ tempId: crypto.randomUUID(), value: '' }]
        });
        setEditingId(null);
        fetchGuestEntries();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to save guest sale',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving guest sale:', error);
      toast({
        title: 'Error',
        description: 'Failed to save guest sale',
        variant: 'destructive',
      });
    }
  };

  const addVehicleField = () => {
    setFormData(prev => ({
      ...prev,
      vehicleNumbers: [...prev.vehicleNumbers, { tempId: crypto.randomUUID(), value: '' }]
    }));
  };

  const removeVehicleField = (tempId: string) => {
    if (formData.vehicleNumbers.length > 1) {
      setFormData(prev => ({
        ...prev,
        vehicleNumbers: prev.vehicleNumbers.filter(v => v.tempId !== tempId)
      }));
    }
  };

  const updateVehicle = (tempId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleNumbers: prev.vehicleNumbers.map(v =>
        v.tempId === tempId ? { ...v, value } : v
      )
    }));
  };

  const handleEdit = (entry: GuestEntry) => {
    setFormData({
      date: entry.saleDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      customerName: entry.customerName || '',
      mobileNumber: entry.mobileNumber || '',
      discountAmount: entry.discount?.toString() || '0',
      offerType: entry.offerType || 'percentage',
      gstTin: entry.gstNumber || '',
      vehicleNumbers: entry.vehicleNumbers?.length > 0
        ? entry.vehicleNumbers.map(v => ({ tempId: crypto.randomUUID(), value: v }))
        : [{ tempId: crypto.randomUUID(), value: '' }]
    });
    setEditingId(entry._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/guest-sales/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Guest sale deleted',
          description: 'Guest sale has been deleted successfully.',
        });
        fetchGuestEntries();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete guest sale',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting guest sale:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete guest sale',
        variant: 'destructive',
      });
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/guest-sales/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Status updated',
          description: `Guest sale ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
        });
        fetchGuestEntries();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredEntries = guestEntries.filter(entry =>
    (entry.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.mobileNumber || '').includes(searchQuery) ||
    entry.vehicleNumbers?.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedEntries = itemsPerPage === 'all'
    ? filteredEntries
    : filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
        <h1 className="text-2xl font-bold">Guest Customer</h1>
      </div>

      <Card className="p-6 bg-gray-50 border-blue-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block mb-2 text-blue-700 font-semibold text-sm">Date <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-700 font-semibold text-sm">Customer Name <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-700 font-semibold text-sm">Mobile Number <span className="text-red-500">*</span></label>
              <Input
                type="tel"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-700 font-semibold text-sm">Discount Amount <span className="text-red-500">*</span></label>
              <Input
                type="number"
                step="0.01"
                placeholder="Discount Amount"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-700 font-semibold text-sm">Offer Type</label>
              <Select value={formData.offerType} onValueChange={(v) => setFormData({ ...formData, offerType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-blue-700 font-semibold text-sm">Gst/TIN No</label>
              <Input
                type="text"
                placeholder="Gst/TIN No"
                value={formData.gstTin}
                onChange={(e) => setFormData({ ...formData, gstTin: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block mb-2 text-blue-700 font-semibold text-sm">Vehicle Numbers</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formData.vehicleNumbers.map((vehicle, index) => (
                <div key={vehicle.tempId} className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="Vehicle Number"
                    value={vehicle.value}
                    onChange={(e) => updateVehicle(vehicle.tempId, e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {index === formData.vehicleNumbers.length - 1 ? (
                      <Button
                        type="button"
                        onClick={addVehicleField}
                        variant="secondary"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 p-0"
                      >
                        <Plus size={16} />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => removeVehicleField(vehicle.tempId)}
                        variant="destructive"
                        className="rounded-full w-8 h-8 p-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button type="submit" className="bg-[#84cc16] hover:bg-[#65a30d] text-white px-12 font-bold h-11">
              {editingId ? "UPDATE" : "SAVE"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-white p-4 border-b flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-semibold">Show:</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(v === 'all' ? 'all' : Number(v))}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Filter guest sales..."
              className="h-8 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-gray-700">S.No</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                <TableHead className="font-bold text-gray-700">Customer Name</TableHead>
                <TableHead className="font-bold text-gray-700">Mobile Number</TableHead>
                <TableHead className="font-bold text-gray-700">Discount</TableHead>
                <TableHead className="font-bold text-gray-700">GST/TIN No</TableHead>
                <TableHead className="font-bold text-gray-700">Vehicles</TableHead>
                <TableHead className="font-bold text-gray-700">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No guest sales found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry, index) => (
                  <TableRow key={entry._id} className="hover:bg-gray-50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleStatusToggle(entry._id, entry.status)}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${entry.status === 'active' ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${entry.status === 'active' ? 'translate-x-8' : 'translate-x-1'
                              }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold ${entry.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                          {entry.status.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(entry._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-blue-900">{entry.customerName}</TableCell>
                    <TableCell>{entry.mobileNumber}</TableCell>
                    <TableCell>{entry.discount} ({entry.offerType})</TableCell>
                    <TableCell>{entry.gstNumber || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.vehicleNumbers && entry.vehicleNumbers.map((v, i) => (
                          <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{v}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(entry.saleDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
