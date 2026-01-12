import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv, toCsv } from "@/lib/utils";

type LubsPurchaseRow = {
  id: string;
  date: string;
  invoice_no: string;
  vendor_id: string | null;
  description: string | null;
  image_url: string | null;
  amount: number | null;
  created_at: string;
};

export default function LubsPurchase() {
  const { toast } = useToast();

  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [invoiceNo, setInvoiceNo] = useState("");
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterText, setFilterText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<LubsPurchaseRow | null>(null);

  const { data: vendors = [], isLoading: loadingVendors } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const response = await fetch("/api/vendors", { credentials: "include" });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to fetch vendors");
      return result.rows || [];
    },
  });

  const {
    data: rows = [],
    isLoading: loadingPurchases,
    refetch: refetchPurchases,
  } = useQuery<LubsPurchaseRow[]>({
    queryKey: ["/api/lubs-purchases", filterFrom, filterTo, filterText],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);
      if (filterText) params.append("search", filterText);

      const response = await fetch(`/api/lubs-purchases?${params.toString()}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to fetch lub purchases");
      return result.rows || [];
    },
  });

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    if (imageFile.size > 2 * 1024 * 1024) {
      toast({ title: "Max 2MB", variant: "destructive" });
      return null;
    }
    const ext = imageFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "gif"].includes(ext)) {
      toast({ title: "Invalid image type", variant: "destructive" });
      return null;
    }

    // No real upload endpoint yet – just warn and skip
    toast({ title: "Image upload not implemented", variant: "destructive" });
    return null;
  };

  const save = async () => {
    if (!invoiceNo || !vendorId) {
      toast({ title: "Invoice No and Vendor required", variant: "destructive" });
      return;
    }
    try {
      setIsSaving(true);
      const imgUrl = await uploadImage();

      const response = await fetch("/api/lubs-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: purchaseDate,
          invoice_date: invoiceDate,
          invoice_no: invoiceNo,
          description,
          vendor_id: vendorId,
          image_url: imgUrl,
          amount: amount ? Number(amount) : null,
        }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Failed to save lub purchase");

      toast({ title: "Saved" });
      setInvoiceNo("");
      setDescription("");
      setAmount("");
      setImageFile(null);
      refetchPurchases();
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openInvoiceDetails = (purchase: LubsPurchaseRow) => {
    setSelectedPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleExportCsv = () => {
    if (!rows || rows.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const rowsCsv = rows.map((r, idx) => ({
      SlNo: idx + 1,
      Date: r.date,
      InvoiceNo: r.invoice_no,
      VendorId: r.vendor_id,
      Description: r.description || "",
      ImageUrl: r.image_url || "",
      Amount: r.amount ?? "",
    }));
    downloadCsv("lubs-purchases.csv", toCsv(rowsCsv));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Dashboard</span>
        <span>/</span>
        <span>Lubricants Invoice Details</span>
      </div>

      {/* Invoice header form */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                id="lubs_date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none"
              />
              <button
                type="button"
                className="h-10 w-40 rounded-md bg-orange-500 text-white font-medium px-3"
                onClick={() => {
                  const el = document.getElementById("lubs_date") as HTMLInputElement | null;
                  if (el) {
                    // @ts-ignore
                    if (typeof el.showPicker === "function") {
                      // @ts-ignore
                      el.showPicker();
                    } else {
                      el.click();
                    }
                  }
                }}
              >
                Choose Date
              </button>
            </div>
            <div className="h-10 min-w-[12rem] px-3 flex items-center rounded-md bg-white text-black">
              Invoice Date
            </div>
            <Input
              type="date"
              className="bg-white text-black w-48"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Input
              className="bg-white text-black"
              placeholder="Invoice No *"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
            <div className="space-y-1">
              <div>Upload Image</div>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="bg-white text-black"
              />
              <div className="text-xs opacity-80">
                Allowed (JPEG,JPG,GIF,PNG) Maxsize: 2MB
              </div>
            </div>
            <Input
              className="bg-white text-black"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Select Vendor" />
              </SelectTrigger>
              <SelectContent>
                {loadingVendors ? (
                  <SelectItem value="loading" disabled>
                    Loading vendors...
                  </SelectItem>
                ) : vendors && vendors.length > 0 ? (
                  vendors.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vendor_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-vendors" disabled>
                    No vendors available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Input
              className="bg-white text-black"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={save}
              disabled={isSaving}
              className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              {isSaving ? "SAVING..." : "SAVE"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter card */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span>From Date</span>
              <Input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refetchPurchases();
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To Date</span>
              <Input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refetchPurchases();
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Filter Date</span>
              <Input
                placeholder="Filter Date"
                onKeyDown={(e) => {
                  if (e.key === "Enter") refetchPurchases();
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type to filter..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") refetchPurchases();
                }}
              />
              <Button
                onClick={() => refetchPurchases()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <select className="h-9 rounded-md border px-2 text-sm">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600"
                onClick={handleExportCsv}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-600"
              >
                PDF
              </Button>
              <div className="flex items-center gap-2 ml-4">
                <span>Filter:</span>
                <Input placeholder="Type to filter..." className="w-56" />
              </div>
            </div>
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
                <TableHead>Items View</TableHead>
                <TableHead>User Log Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPurchases ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !rows || rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No lub purchases found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const vName =
                    vendors?.find((v: any) => v.id === r.vendor_id)?.vendor_name || "-";
                  return (
                    <TableRow key={r.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.invoice_no}</TableCell>
                      <TableCell>{r.image_url ? "Yes" : "-"}</TableCell>
                      <TableCell>{vName}</TableCell>
                      <TableCell>{r.description || "-"}</TableCell>
                      <TableCell>
                        {r.amount
                          ? `₹${Number(r.amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInvoiceDetails(r)}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing 1 to {rows.length} of {rows.length} entries
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-100">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple details dialog (placeholder, similar to old design) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Invoice No: </span>
                {selectedPurchase.invoice_no}
              </div>
              <div>
                <span className="font-semibold">Date: </span>
                {selectedPurchase.date}
              </div>
              <div>
                <span className="font-semibold">Description: </span>
                {selectedPurchase.description || "-"}
              </div>
              <div>
                <span className="font-semibold">Amount: </span>
                {selectedPurchase.amount
                  ? `₹${Number(selectedPurchase.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}