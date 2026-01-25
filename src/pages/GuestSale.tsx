import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5002/api/guest-sales', {
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem('token');
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
        ? `http://localhost:5002/api/guest-sales/${editingId}`
        : 'http://localhost:5002/api/guest-sales';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      date: entry.saleDate.split('T')[0],
      customerName: entry.customerName,
      mobileNumber: entry.mobileNumber,
      discountAmount: entry.discount.toString(),
      offerType: entry.offerType,
      gstTin: entry.gstNumber,
      vehicleNumbers: entry.vehicleNumbers.length > 0
        ? entry.vehicleNumbers.map(v => ({ tempId: crypto.randomUUID(), value: v }))
        : [{ tempId: crypto.randomUUID(), value: '' }]
    });
    setEditingId(entry._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this guest sale?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5002/api/guest-sales/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`http://localhost:5002/api/guest-sales/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    entry.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.mobileNumber.includes(searchQuery) ||
    entry.vehicleNumbers.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = itemsPerPage === 'all'
    ? filteredEntries
    : filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 text-white px-6 py-4">
        <h1 className="text-2xl font-bold">Guest Customer</h1>
      </div>

      <Card className="p-6 bg-gray-50 m-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-blue-700 font-semibold">Date <span className="text-red-500">*</span></label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block mb-2 text-blue-700 font-semibold">Customer Name <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-700 font-semibold">Mobile Number <span className="text-red-500">*</span></label>
              <Input
                type="tel"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-700 font-semibold">Discount Amount <span className="text-red-500">*</span></label>
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
              <label className="block mb-2 text-blue-700 font-semibold">Offer Type</label>
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

            <div>
              <label className="block mb-2 text-blue-700 font-semibold">Gst/TIN No</label>
              <Input
                type="text"
                placeholder="Gst/TIN No"
                value={formData.gstTin}
                onChange={(e) => setFormData({ ...formData, gstTin: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block mb-2 text-blue-700 font-semibold">Vehicle Numbers</label>
            {formData.vehicleNumbers.map((vehicle, index) => (
              <div key={vehicle.tempId} className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="Vehicle Number"
                  value={vehicle.value}
                  onChange={(e) => updateVehicle(vehicle.tempId, e.target.value)}
                  className="flex-1"
                />
                {index === formData.vehicleNumbers.length - 1 ? (
                  <Button
                    type="button"
                    onClick={addVehicleField}
                    className="bg-blue-500 hover:bg-blue-600 rounded-full w-10 h-10 p-0"
                  >
                    <Plus size={20} />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => removeVehicleField(vehicle.tempId)}
                    className="bg-red-500 hover:bg-red-600 rounded-full w-10 h-10 p-0"
                  >
                    <Plus size={20} className="rotate-45" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-12 py-3">
              💾 SAVE
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-white m-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => {
              setItemsPerPage(v === 'all' ? 'all' : parseInt(v));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Filter:</span>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sl No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Offer Amount</TableHead>
              <TableHead>Offer Type</TableHead>
              <TableHead>Gst/TIN No</TableHead>
              <TableHead>Vehicle Number</TableHead>
              <TableHead>User Log Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.map((entry, idx) => (
              <TableRow key={entry._id}>
                <TableCell>{itemsPerPage === 'all' ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                <TableCell>{new Date(entry.saleDate).toLocaleDateString()}</TableCell>
                <TableCell>{entry.customerName}</TableCell>
                <TableCell>{entry.mobileNumber}</TableCell>
                <TableCell>{entry.discount}</TableCell>
                <TableCell>{entry.offerType}</TableCell>
                <TableCell>{entry.gstNumber}</TableCell>
                <TableCell>{entry.vehicleNumbers.join(', ')}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  <div>Created: {entry.createdBy?.username || 'System'}</div>
                  {entry.createdAt && (
                    <div className="text-[10px] text-gray-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusToggle(entry._id, entry.status)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        entry.status === 'active' ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          entry.status === 'active' ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        entry.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {entry.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(entry)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(entry._id)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center mt-4">
          <div>
            Showing {paginatedEntries.length === 0 ? 0 : (currentPage - 1) * (itemsPerPage === 'all' ? filteredEntries.length : itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * (itemsPerPage === 'all' ? filteredEntries.length : itemsPerPage), filteredEntries.length)} of {filteredEntries.length} entries
          </div>
          
          {itemsPerPage !== 'all' && totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                >
                  {page}
                </Button>
              ))}
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
