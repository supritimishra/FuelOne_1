import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function DeleteSale() {
  const { toast } = useToast();
  
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<{date: string, shift: string} | null>(null);
  
  // Fetch aggregated sale entries
  const { data: saleEntriesData, refetch: refetchSaleEntries } = useQuery({
    queryKey: ["/api/sale-entries/aggregated", searchFrom, searchTo, filterProduct],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFrom) params.append('from', searchFrom);
      if (searchTo) params.append('to', searchTo);
      if (filterProduct) params.append('product', filterProduct);
      
      const response = await fetch(`/api/sale-entries/aggregated?${params.toString()}`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch sale entries');
      return result.rows || [];
    }
  });

  const rows = saleEntriesData || [];

  const handleSearch = () => {
    refetchSaleEntries();
  };

  const openDeleteDialog = (date: string, shift: string) => {
    setSelectedRow({ date, shift });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    
    try {
      const response = await fetch(`/api/sale-entries/delete-by-date-shift`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: selectedRow.date,
          shift: selectedRow.shift
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Sale entries deleted successfully" });
        setDeleteDialogOpen(false);
        setSelectedRow(null);
        refetchSaleEntries();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete sale entries", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Sale</span>
        <span>/</span>
        <span>Delete Sale</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Sale Delete Sale</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">From Date</span>
              <Input 
                type="date" 
                value={searchFrom} 
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-40"
              />
              <span className="text-sm">To Date</span>
              <Input 
                type="date" 
                value={searchTo} 
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Filter:</span>
              <Input 
                placeholder="Type to filter..." 
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-56"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Show:</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>MS</TableHead>
                <TableHead>HSD</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No data available. Add some sale entries to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</TableCell>
                    <TableCell>{row.shift || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {row.ms_quantity ? `Qty - ${Number(row.ms_quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      {row.ms_quantity && row.ms_amount && <br />}
                      {row.ms_amount ? `Amt - ${Number(row.ms_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.hsd_quantity ? `Qty - ${Number(row.hsd_quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      {row.hsd_quantity && row.hsd_amount && <br />}
                      {row.hsd_amount ? `Amt - ${Number(row.hsd_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.xp_quantity ? `Qty - ${Number(row.xp_quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                      {row.xp_quantity && row.xp_amount && <br />}
                      {row.xp_amount ? `Amt - ${Number(row.xp_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </TableCell>
                    <TableCell>
                      {row.created_at ? 
                        new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
                        new Date(row.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(row.date, row.shift)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Are you sure you want to delete all sale entries for <strong>{selectedRow?.date && new Date(selectedRow.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> - <strong>{selectedRow?.shift}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
