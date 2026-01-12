import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadCsv, toCsv } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function LiquidPurchase() {
  const { toast } = useToast();
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [invoiceNo, setInvoiceNo] = useState("");
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterText, setFilterText] = useState("");

  // Modal state for viewing invoice details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch vendors using Express API
  const { data: vendors, isLoading: loadingVendors } = useQuery({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const response = await fetch('/api/vendors');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch vendors');
      return result.rows || [];
    },
  });

  // Fetch liquid purchases using Express API
  const { data: rows, isLoading: loadingPurchases, refetch: refetchPurchases } = useQuery({
    queryKey: ["/api/liquid-purchases", filterFrom, filterTo, filterText],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterFrom) params.append('from', filterFrom);
      if (filterTo) params.append('to', filterTo);
      if (filterText) params.append('search', filterText);

      const response = await fetch(`/api/liquid-purchases?${params.toString()}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch liquid purchases');
      return result.rows || [];
    },
  });

  // Open modal and fetch line items
  const openInvoiceDetails = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
    setLoadingItems(true);

    try {
      const response = await fetch(`/api/liquid-purchases/${invoice.id}/items`);
      const result = await response.json();
      if (result.ok) {
        setInvoiceItems(result.rows || []);
      } else {
        setInvoiceItems([]);
        toast({ title: "No items found for this invoice", variant: "destructive" });
      }
    } catch (e: any) {
      console.error('Failed to fetch invoice items', e);
      setInvoiceItems([]);
      toast({ title: "Failed to fetch invoice details", variant: "destructive" });
    } finally {
      setLoadingItems(false);
    }
  };


  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    if (imageFile.size > 2 * 1024 * 1024) { toast({ title: "Max 2MB", variant: "destructive" }); return null; }
    const ext = imageFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "gif"].includes(ext)) { toast({ title: "Invalid image type", variant: "destructive" }); return null; }

    // For now, return null as image upload is not implemented in Express API
    // TODO: Implement image upload endpoint in Express API
    toast({ title: "Image upload not implemented", variant: "destructive" });
    return null;
  };

  const save = async () => {
    if (!invoiceNo || !vendorId) { toast({ title: "Invoice No and Vendor required", variant: "destructive" }); return; }
    try {
      setIsSaving(true);
      const imgUrl = await uploadImage();

      const url = editingId ? `/api/liquid-purchases/${editingId}` : '/api/liquid-purchases';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: purchaseDate,
          invoice_date: invoiceDate,
          invoice_no: invoiceNo,
          description,
          vendor_id: vendorId,
          image_url: imgUrl,
        })
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to save liquid purchase');

      toast({ title: "Saved" });
      setInvoiceNo("");
      setDescription("");
      setImageFile(null);
      setEditingId(null);
      refetchPurchases();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span> <span>/</span> <span>Liquid Invoice Details</span>
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Choose Date + Invoice Date */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input id="liq_date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="absolute inset-0 opacity-0 pointer-events-none" />
              <button type="button" className="h-10 w-40 rounded-md bg-orange-500 text-white font-medium px-3" onClick={() => {
                const el = document.getElementById('liq_date') as HTMLInputElement | null;
                if (el) { // @ts-ignore
                  if (typeof el.showPicker === 'function') { // @ts-ignore
                    el.showPicker();
                  } else { el.click(); }
                }
              }}>Choose Date</button>
            </div>
            <div className="h-10 min-w-[12rem] px-3 flex items-center rounded-md bg-white text-black">Invoice Date</div>
            <Input type="date" className="bg-white text-black w-48" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>

          {/* Row 2: Invoice No, Upload Image, Description, Vendor */}
          <div className="grid grid-cols-4 gap-4">
            <Input className="bg-white text-black" placeholder="Invoice No *" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            <div className="space-y-1">
              <div>Upload Image</div>
              <Input type="file" accept="image/png,image/jpeg,image/jpg,image/gif" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="bg-white text-black" />
              <div className="text-xs opacity-80">Allowed (JPEG,JPG,GIF,PNG) Maxsize: 2MB</div>
            </div>
            <Input className="bg-white text-black" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="bg-white text-black"><SelectValue placeholder="Vendor *" /></SelectTrigger>
              <SelectContent>
                {loadingVendors ? (
                  <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                ) : vendors && vendors.length > 0 ? (
                  vendors.map(v => (<SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>))
                ) : (
                  <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button onClick={save} disabled={isSaving} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8">
              {isSaving ? 'SAVING...' : (editingId ? 'UPDATE' : 'SAVE')}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => {
                setEditingId(null);
                setInvoiceNo("");
                setDescription("");
                setVendorId("");
              }} className="ml-2 rounded-full">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2"><span>From Date</span><Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetchPurchases(); }} /></div>
            <div className="flex items-center gap-2"><span>To Date</span><Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetchPurchases(); }} /></div>
            <div className="flex items-center gap-2"><span>Filter Date</span><Input placeholder="Filter Date" onKeyDown={(e) => { if (e.key === 'Enter') refetchPurchases(); }} /></div>
            <div className="flex items-center gap-2"><Input placeholder="Type to filter..." value={filterText} onChange={(e) => setFilterText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetchPurchases(); }} /><Button onClick={() => refetchPurchases()} className="bg-orange-500 hover:bg-orange-600">Search</Button></div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><span>Show:</span><select className="h-9 rounded-md border px-2 text-sm"><option>All</option></select></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="border-green-500 text-green-600" onClick={() => {
              if (!rows || rows.length === 0) {
                toast({ title: "No data to export", variant: "destructive" });
                return;
              }
              const rowsCsv = rows.map((r: any, idx: number) => ({
                SlNo: idx + 1,
                Date: r.date,
                InvoiceNo: r.invoice_no,
                VendorId: r.vendor_id,
                Description: r.description || '',
                ImageUrl: r.image_url || '',
              }));
              downloadCsv('liquid-purchases.csv', toCsv(rowsCsv));
            }}>CSV</Button><Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button><div className="flex items-center gap-2 ml-4"><span>Filter:</span><Input placeholder="Type to filter..." className="w-56" /></div></div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPurchases ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : !rows || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">No liquid purchases found</TableCell>
                </TableRow>
              ) : rows.map((r: any, idx: number) => (
                <TableRow key={r.id || idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.invoice_no}</TableCell>
                  <TableCell>{r.image_url ? 'Yes' : '-'}</TableCell>
                  <TableCell>{r.vendor_name || '-'}</TableCell>
                  <TableCell>{r.description || '-'}</TableCell>
                  <TableCell>₹{Number(r.total_amount || r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInvoiceDetails(r)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => {
                        setPurchaseDate(r.date);
                        setInvoiceDate(r.invoice_date || r.date);
                        setInvoiceNo(r.invoice_no);
                        setDescription(r.description || "");
                        setVendorId(r.vendor_id);
                        // amount is not editable directly in this form as it's calculated from items, 
                        // but we can allow editing header details.
                        // If the user wants to edit items, that's a separate flow, but for now let's allow header edit.
                        setEditingId(r.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={async () => {
                        if (!confirm('Delete this purchase invoice?')) return;
                        try {
                          const response = await fetch(`/api/liquid-purchases/${r.id}`, { method: 'DELETE', credentials: 'include' });
                          const result = await response.json();
                          if (result.ok) {
                            toast({ title: "Success", description: "Purchase deleted" });
                            refetchPurchases();
                          } else {
                            throw new Error(result.error || 'Failed to delete');
                          }
                        } catch (error: any) {
                          toast({ variant: "destructive", title: "Error", description: error.message || 'Failed to delete' });
                        }
                      }}>Delete</Button>
                    </div>
                  </TableCell>
                  <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Invoice Product Details</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 mt-4">
              {/* Invoice Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <div className="text-sm text-gray-600">Invoice Number</div>
                  <div className="font-semibold">{selectedInvoice.invoice_no}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date</div>
                  <div className="font-semibold">{selectedInvoice.date}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Amount</div>
                  <div className="font-semibold">{selectedInvoice.amount || '-'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Filter:</span>
                  <Input placeholder="Type to filter..." className="w-56 h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show:</span>
                  <select className="h-9 rounded-md border px-2 text-sm"><option>All</option></select>
                  <Button variant="outline" size="sm" className="border-green-500 text-green-600">CSV</Button>
                  <Button variant="outline" size="sm" className="border-red-500 text-red-600">PDF</Button>
                </div>
              </div>

              {/* Line Items Table */}
              {loadingItems ? (
                <div className="text-center py-8">Loading items...</div>
              ) : invoiceItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No items found for this invoice</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Purchase Rate</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>VAT</TableHead>
                        <TableHead>Other Taxs</TableHead>
                        <TableHead>TCS</TableHead>
                        <TableHead>Item Total</TableHead>
                        <TableHead>Inv.Density</TableHead>
                        <TableHead>Measured Density</TableHead>
                        <TableHead>Vari Density</TableHead>
                        <TableHead>Other</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item: any, idx: number) => (
                        <TableRow key={item.id || idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.purchase_rate ? parseFloat(item.purchase_rate).toFixed(2) : '-'}</TableCell>
                          <TableCell>{item.quantity ? parseFloat(item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
                          <TableCell>{item.cost ? parseFloat(item.cost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
                          <TableCell>{item.vat ? parseFloat(item.vat).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>{item.other_taxes ? parseFloat(item.other_taxes).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>{item.tcs ? parseFloat(item.tcs).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>
                            {item.item_total ? (
                              <div>
                                <div className="font-semibold">{parseFloat(item.item_total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                {item.cess || item.add_vat ? (
                                  <div className="text-xs text-gray-500">
                                    {item.cess && `Cess: ${parseFloat(item.cess).toFixed(2)}`}
                                    {item.cess && item.add_vat && ' | '}
                                    {item.add_vat && `Add.Vat: ${parseFloat(item.add_vat).toFixed(2)}`}
                                  </div>
                                ) : (
                                  <div className="text-xs">Cess: 0.00 | Add.Vat: 0.00</div>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{item.inv_density ? parseFloat(item.inv_density).toFixed(2) : '-'}</TableCell>
                          <TableCell>{item.measured_density ? parseFloat(item.measured_density).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</TableCell>
                          <TableCell>{item.vari_density ? parseFloat(item.vari_density).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>
                            {item.other ? (
                              <div>
                                <div className="font-semibold">{parseFloat(item.other).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                {item.lfr || item.dc ? (
                                  <div className="text-xs">
                                    {item.lfr && `LFR: ${parseFloat(item.lfr).toFixed(2)}`}
                                    {item.lfr && item.dc && ' | '}
                                    {item.dc && `DC: ${parseFloat(item.dc).toFixed(2)}`}
                                  </div>
                                ) : (
                                  <div className="text-xs">LFR: 0.00 | DC: 0.00</div>
                                )}
                                <a href="#" className="text-xs text-blue-600 hover:underline">Label</a>
                              </div>
                            ) : (
                              <div>
                                <div>0.00</div>
                                <div className="text-xs">LFR: 0.00 | DC: 0.00</div>
                                <a href="#" className="text-xs text-blue-600 hover:underline">Label</a>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
