import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Save, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Eye,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface ExpiryItem {
  id: string;
  item_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  created_at: string;
  s_no: number;
}

export default function ExpiryItemsEnhanced() {
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();
  
  // Data state
  const [rows, setRows] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<'toExpire' | 'allItems'>('toExpire');

  // Fetch expiry items list
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/expiry-items', {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      
      if (result.ok) {
        setRows(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch expiry items" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch expiry items" });
    } finally {
      setLoading(false);
    }
  }, [toast, getAuthHeaders]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter items based on active view
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let filtered = rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        [row.item_name, row.status]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));

      return matchesSearch;
    });

    // Apply view filter based on activeView
    if (activeView === 'toExpire') {
      // Filter items that are expiring soon (within 30 days)
      filtered = filtered.filter((row) => {
        const daysUntilExpiry = calculateDaysUntilExpiry(row.expiry_date);
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      });
    }

    return filtered;
  }, [rows, searchTerm, activeView]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'near expiry':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'returned':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'disposed':
        return <Trash2 className="h-4 w-4 text-gray-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'expired':
        return 'text-orange-600 bg-orange-100';
      case 'near expiry':
        return 'text-orange-600 bg-orange-100';
      case 'returned':
        return 'text-blue-600 bg-blue-100';
      case 'disposed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 px-6 py-4 shadow-sm">
        <nav className="flex items-center justify-between" aria-label="Breadcrumb">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Dashboard</span>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">Expiry Items</span>
          </div>
        </nav>
        <div className="mt-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Expiry Items Management</h1>
          <p className="text-muted-foreground text-lg">Track and manage item expiry dates</p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="px-6 py-4 bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 shadow-sm">
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={() => setActiveView('toExpire')}
            className={activeView === 'toExpire' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-black border border-gray-300 hover:bg-gray-50'}
          >
            To be Expired
          </Button>
          <Button 
            onClick={() => setActiveView('allItems')}
            className={activeView === 'allItems' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-black border border-gray-300 hover:bg-gray-50'}
          >
            Expiry Items
          </Button>
        </div>
      </div>

      {/* Search / Filters */}
      <div className="px-6 py-4 bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-500" />
            <Input 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-10 rounded-lg border-2 border-blue-200 focus:border-orange-500" 
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" className="bg-orange-500 text-white hover:bg-orange-600">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-50 to-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-blue-800">S.No</TableHead>
                    <TableHead className="font-semibold text-blue-800">Category</TableHead>
                    <TableHead className="font-semibold text-blue-800">Item Name</TableHead>
                    <TableHead className="font-semibold text-blue-800">Unique Number</TableHead>
                    <TableHead className="font-semibold text-blue-800">Expiry Date</TableHead>
                    <TableHead className="font-semibold text-blue-800">Days Before Alert</TableHead>
                    <TableHead className="font-semibold text-blue-800">Note</TableHead>
                    <TableHead className="font-semibold text-blue-800">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading expiry items...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {activeView === 'toExpire' 
                          ? 'No items expiring soon' 
                          : 'No expiry items found'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, index) => {
                      const daysUntilExpiry = calculateDaysUntilExpiry(row.expiry_date);
                      const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
                      
                      return (
                        <TableRow key={row.id} className="hover:bg-blue-50/50 transition-colors">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              General
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{row.item_name}</TableCell>
                          <TableCell className="text-muted-foreground">{row.s_no}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(row.expiry_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isExpiringSoon ? (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <span className={`font-medium ${
                                daysUntilExpiry <= 7 ? 'text-red-600' :
                                daysUntilExpiry <= 30 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">-</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gradient-to-r from-blue-50 to-slate-50">
              <div className="text-sm text-muted-foreground">
                Showing {filteredRows.length > 0 ? 1 : 0} to {filteredRows.length} of {filteredRows.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  ←
                </Button>
                <Button variant="outline" size="sm" className="bg-orange-500 text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}