import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  DollarSign,
  Droplet,
  AlertTriangle,
  Users,
  Package,
  BarChart3,
  PieChart,
  Search,
  Printer,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  // Fetch today's sales data
  const { data: todaySales, isLoading: loadingSales, isError: salesError } = useQuery({
    queryKey: ["dashboard-today-sales", selectedDate],
    queryFn: async () => {
      try {
        console.log('Fetching today sales for date:', selectedDate);
        
        // Use Promise.allSettled to ensure both requests are attempted even if one fails
        // Add 5 second timeout to prevent infinite loading
        const [guestResult, creditResult] = await Promise.allSettled([
          fetchWithTimeout(
            `/api/guest-sales?from=${selectedDate}&to=${selectedDate}`,
            {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            },
            5000
          ),
          fetchWithTimeout(
            `/api/credit-sales?from=${selectedDate}&to=${selectedDate}`,
            {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
            },
            5000
          )
        ]);
        
        let guestRows: any[] = [];
        let creditRows: any[] = [];
        
        // Handle guest sales response
        if (guestResult.status === 'fulfilled') {
          const guestResponse = guestResult.value;
          if (guestResponse.ok) {
            const guestJson = await guestResponse.json();
            guestRows = guestJson?.ok ? (guestJson.rows || []) : [];
            console.log('Guest sales response:', guestJson);
          } else {
            console.warn('Guest sales API returned non-ok status:', guestResponse.status);
          }
        } else {
          console.warn('Guest sales API request failed:', guestResult.reason);
        }
        
        // Handle credit sales response
        if (creditResult.status === 'fulfilled') {
          const creditResponse = creditResult.value;
          if (creditResponse.ok) {
        const creditJson = await creditResponse.json();
            creditRows = creditJson?.ok ? (creditJson.rows || []) : [];
        console.log('Credit sales response:', creditJson);
          } else {
            console.warn('Credit sales API returned non-ok status:', creditResponse.status);
          }
        } else {
          console.warn('Credit sales API request failed:', creditResult.reason);
        }

        const fuelSale = guestRows.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);
        const creditSale = creditRows.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);
        
        const result = {
          fuelSale,
          creditSale,
          discountOffered: 0
        };
        
        console.log('Today sales calculated:', result);
        return result;
      } catch (error) {
        console.error('Error fetching today sales:', error);
        // Always return valid data to prevent dashboard from breaking
        return { fuelSale: 0, creditSale: 0, discountOffered: 0 };
      }
    },
    retry: 1,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    onError: (error) => {
      console.warn('Today sales query failed, using defaults:', error);
    },
    // Don't block dashboard rendering if this query fails
    suspense: false,
  });

  // Fetch lubricant sales data
  const { data: lubricantSales } = useQuery({
    queryKey: ["dashboard-lubricant-sales", selectedDate],
    queryFn: async () => {
      try {
        const response = await fetchWithTimeout(
          `/api/lubricant-sales?from=${selectedDate}&to=${selectedDate}`,
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          15000
        );
        const result = await response.json();
        const sales = result?.ok ? (result.rows || []) : [];
        return sales.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);
      } catch (error) {
        console.error('Error fetching lubricant sales:', error);
        return 0;
      }
    },
    retry: 1,
    refetchInterval: 30000
  });

  // Fetch swipe transactions data
  const { data: swipeData } = useQuery({
    queryKey: ["dashboard-swipes", selectedDate],
    queryFn: async () => {
      try {
        const response = await fetchWithTimeout(
          `/api/swipe-transactions?from=${selectedDate}&to=${selectedDate}`,
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          5000
        );
        
        if (!response.ok) {
          console.warn(`Swipe transactions API returned ${response.status}, using empty data`);
          return 0;
        }
        
        const result = await response.json();
        const swipes = result?.ok ? (result.rows || []) : [];
        
        // Use 'amount' field instead of 'swipe_amount'
        return swipes.reduce((sum: number, s: any) => sum + Number(s.amount || s.swipe_amount || 0), 0);
      } catch (error) {
        console.error('Error fetching swipe data:', error);
        return 0; // Return 0 on error to prevent dashboard from breaking
      }
    },
    retry: 1,
    refetchInterval: 30000,
    // Don't fail the entire dashboard if this query fails
    onError: (error) => {
      console.warn('Swipe transactions query failed, continuing with 0:', error);
    }
  });

  // Fetch recovery data
  const { data: recoveryData } = useQuery({
    queryKey: ["dashboard-recoveries", selectedDate],
    queryFn: async () => {
      try {
        const response = await fetchWithTimeout(
          `/api/recoveries?from=${selectedDate}&to=${selectedDate}`,
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          15000
        );
        if (!response.ok) {
          console.warn(`Recoveries API returned ${response.status}, using default value`);
          return 0;
        }
        const result = await response.json();
        const recoveries = result?.ok ? (result.rows || []) : [];
        return recoveries.reduce((sum: number, r: any) => sum + Number(r.received_amount || 0), 0);
      } catch (error: any) {
        // Silently handle network errors and timeouts - they're expected in some scenarios
        const errorMsg = error?.message || String(error || '');
        if (errorMsg.includes('timeout') || errorMsg.includes('NetworkError') || errorMsg.includes('AbortError')) {
          // Expected errors - don't log to console to reduce noise
          return 0;
        }
        console.warn('Error fetching recovery data:', errorMsg);
        return 0;
      }
    },
    retry: 1,
    refetchInterval: 30000,
    // Don't fail the entire dashboard if this query fails
    onError: (error) => {
      // Silently handle - we already return 0 in the catch block
    }
  });

  // Fetch expenses data
  const { data: expensesData } = useQuery({
    queryKey: ["dashboard-expenses", selectedDate],
    queryFn: async () => {
      try {
        const response = await fetchWithTimeout(
          `/api/expenses?from=${selectedDate}&to=${selectedDate}`,
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          5000
        );
        const result = await response.json();
        const expenses = result?.ok ? (result.rows || []) : [];
        return expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        return 0;
      }
    },
    retry: 1,
    refetchInterval: 30000
  });

  // Fetch day sale flow data
  const { data: daySaleFlow } = useQuery({
    queryKey: ["dashboard-day-sale-flow", selectedDate, lubricantSales, swipeData],
    queryFn: async () => {
      try {
        const guestResponse = await fetchWithTimeout(
          `/api/guest-sales?from=${selectedDate}&to=${selectedDate}`,
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          5000
        );
        
        const guestJson = guestResponse.ok ? await guestResponse.json() : { ok: true, rows: [] };
        const guestRows = guestJson?.ok ? (guestJson.rows || []) : [];

        // Calculate cash from guest sales (CASH mode)
        let cashFromGuest = guestRows.filter((s: any) => s.payment_mode === 'CASH' || s.payment_mode === 'Cash')
          .reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);
        
        // Add lubricant cash sales to cash total
        const lubCashSales = lubricantSales || 0;
        const cash = cashFromGuest + lubCashSales;
        
        // Credit sales from guest sales
        const credit = guestRows.filter((s: any) => s.payment_mode === 'CREDIT' || s.payment_mode === 'Credit')
          .reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);
        
        // Bank payments (CARD/UPI from guest sales + swipe transactions)
        const bankFromGuest = guestRows.filter((s: any) => s.payment_mode === 'CARD' || s.payment_mode === 'Card' || s.payment_mode === 'UPI')
          .reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0);
        const bank = bankFromGuest + (swipeData || 0);
        
        const vendor = 0; // TODO: Add vendor payment API when available
        
        return {
          cash,
          credit,
          bank,
          vendor,
          saleDisc: 0,
          total: cash + credit + bank + vendor
        };
      } catch (error) {
        console.error('Error fetching day sale flow:', error);
        return { cash: 0, credit: 0, bank: 0, vendor: 0, saleDisc: 0, total: 0 };
      }
    },
    enabled: lubricantSales !== undefined && swipeData !== undefined,
    refetchInterval: 30000
  });

  // Fetch day opening cash data
  const { data: dayOpeningCash } = useQuery({
    queryKey: ["dashboard-day-opening-cash"],
    queryFn: async () => {
      try {
        const response = await fetchWithTimeout(
          '/api/fuel-products',
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          5000
        );
        
        const result = await response.json();
        const products = result?.ok ? (result.rows || []) : [];
        
        // Return empty array since data was cleared
        return [];
      } catch (error) {
        console.error('Error fetching opening cash:', error);
        return [];
      }
    },
  });

  // Fetch monthly sales data
  const { data: monthlySales } = useQuery({
    queryKey: ["dashboard-monthly-sales"],
    queryFn: async () => {
      try {
        // Get last 12 months of sales
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11);
        
        const response = await fetchWithTimeout(
          `/api/guest-sales?from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}`,
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          5000
        );
        const result = await response.json();
        const sales = result?.ok ? (result.rows || []) : [];
        
        // Group by month and calculate totals
        const monthlyData: { [key: string]: number } = {};
        sales.forEach((sale: any) => {
          const date = new Date(sale.sale_date);
          const month = date.toLocaleString('default', { month: 'short' });
          if (!monthlyData[month]) monthlyData[month] = 0;
          monthlyData[month] += Number(sale.total_amount || 0);
        });
        
        // Return ordered by month
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.map(month => ({ month, amount: monthlyData[month] || 0 }));
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
        return [];
      }
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch credit customers outstanding
  const { data: creditCustomers, isLoading: loadingCustomers, isError: customersError } = useQuery({
    queryKey: ["dashboard-credit-customers"],
    queryFn: async () => {
      try {
        console.log('Fetching credit customers...');
        
        const response = await fetchWithTimeout(
          '/api/credit-customers',
          {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
          },
          5000
        );
        
        if (!response.ok) {
          console.error('Credit customers API error:', response.status, response.statusText);
          throw new Error(`Credit customers API failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Credit customers response:', result);
        
        const customers = result?.ok ? (result.rows || []) : [];
        
        const activeCustomers = customers.filter((c: any) => c.is_active).slice(0, 10);
        console.log('Active credit customers:', activeCustomers);
        
        return activeCustomers;
      } catch (error) {
        console.error('Error fetching credit customers:', error);
        return [];
      }
    },
    retry: 1,
    refetchInterval: 30000,
    onError: (error) => console.error('Credit customers query failed:', error)
  });

  // Calculate credit outstanding total
  const creditOutstanding = creditCustomers?.reduce((sum: number, c: any) => 
    sum + Number(c.current_balance || 0), 0) || 0;

  // Fetch customer last payments
  const { data: customerPayments } = useQuery({
    queryKey: ["dashboard-customer-payments"],
    queryFn: async () => {
      // Return empty array since data was cleared
      return [];
    },
  });

  // Fetch tank stock data
  const { data: tankStock } = useQuery({
    queryKey: ["dashboard-tank-stock"],
    queryFn: async () => {
      // Return empty array since data was cleared
      return [];
    },
  });

  // Fetch credit parties data
  const { data: creditParties } = useQuery({
    queryKey: ["dashboard-credit-parties"],
    queryFn: async () => {
      // Return empty array since data was cleared
      return [];
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ predicate: (query) => 
              query.queryKey[0]?.toString().startsWith('dashboard-') 
            })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Top Section - Day Sale and Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day Sale Card */}
        <Card>
          <CardHeader>
            <CardTitle>Day Sale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingSales ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : salesError ? (
              <div className="text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Failed to load sales data
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Fuel Sale:</span>
                  <span className="font-semibold">₹{todaySales?.fuelSale?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lub Sale:</span>
                  <span className="font-semibold">₹{(lubricantSales || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Offered:</span>
                  <span className="font-semibold">₹{todaySales?.discountOffered?.toLocaleString() || 0}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{((todaySales?.fuelSale || 0) + (lubricantSales || 0) + (todaySales?.creditSale || 0)).toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Day Opening Cash Card */}
        <Card>
          <CardHeader>
            <CardTitle>Day Opening Cash (Inhand)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-600">
                <span>Product</span>
                <span>Qty</span>
                <span>Amount</span>
              </div>
              {dayOpeningCash?.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                  <span>{item.product}</span>
                  <span>{item.qty}</span>
                  <span>₹{item.amount.toLocaleString()}</span>
            </div>
              ))}
          </div>
        </CardContent>
      </Card>

        {/* Day Sale Flow Card */}
        <Card>
          <CardHeader>
            <CardTitle>Day Sale Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Cash:</span>
              <span className="font-semibold">₹{daySaleFlow?.cash?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Credit:</span>
              <span className="font-semibold">₹{daySaleFlow?.credit?.toLocaleString() || 0}</span>
                          </div>
            <div className="flex justify-between">
              <span>Bank:</span>
              <span className="font-semibold">₹{daySaleFlow?.bank?.toLocaleString() || 0}</span>
                        </div>
            <div className="flex justify-between">
              <span>Vendor:</span>
              <span className="font-semibold">₹{daySaleFlow?.vendor?.toLocaleString() || 0}</span>
                      </div>
            <div className="flex justify-between">
              <span>Sale Disc.:</span>
              <span className="font-semibold">₹{daySaleFlow?.saleDisc?.toLocaleString() || 0}</span>
                    </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{daySaleFlow?.total?.toLocaleString() || 0}</span>
                  </div>
                </CardContent>
              </Card>
          </div>

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day Sale Flow Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Day Sale Flow</CardTitle>
            </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie 
                  data={[
                    { name: "Cash", value: daySaleFlow?.cash || 0 },
                    { name: "Credit", value: daySaleFlow?.credit || 0 },
                    { name: "Bank", value: daySaleFlow?.bank || 0 },
                    { name: "Vendor", value: daySaleFlow?.vendor || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                    dataKey="value" 
                >
                  {[0, 1, 2, 3].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        {/* Day Bank Flow Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Day Bank Flow</CardTitle>
            </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie 
                  data={[{ name: "PNB CURRENT", value: daySaleFlow?.bank || 0 }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                    dataKey="value" 
                >
                  <Cell fill="#0088FE" />
                </Pie>
                <Tooltip />
                <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sale Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sale</CardTitle>
            </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        {/* Day Summary Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Day Summary</CardTitle>
            </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={[
                  { name: "Sale Amount", value: (todaySales?.fuelSale || 0) + (lubricantSales || 0) + (todaySales?.creditSale || 0) },
                  { name: "Swipes", value: swipeData || 0 },
                  { name: "Cash Recovery", value: recoveryData || 0 },
                  { name: "Credits", value: todaySales?.creditSale || 0 },
                  { name: "Cash Inflow", value: 0 },
                  { name: "Expenses", value: expensesData || 0 }
                ]}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Customer Outstanding */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Customer Outstanding</CardTitle>
            <div className="text-right">
              <span className="text-2xl font-bold">₹{creditOutstanding.toLocaleString()}</span>
      </div>
            </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600">
                <span>Name</span>
                <span>Mobile No</span>
                <span>Limit</span>
                <span>Due</span>
                      </div>
              {creditCustomers?.map((customer: any, index: number) => (
                <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    {customer.customer_name || customer.name}
                  </span>
                  <span>{customer.mobile_number || customer.mobile}</span>
                  <span>{customer.credit_limit || 0}</span>
                  <span>₹{(customer.current_balance || 0).toLocaleString()}/-</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>

        {/* Customer Last Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Last Payment</CardTitle>
            <div className="text-right">
              <span className="text-2xl font-bold">₹{creditOutstanding.toLocaleString()}</span>
        </div>
            </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-600">
                <span>Name</span>
                <span>Last Paid</span>
                <span>Due</span>
              </div>
              {customerPayments?.map((customer: any, index: number) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    {customer.name}
                      </span>
                  <span>{customer.lastPaid}</span>
                  <span>₹{customer.due.toLocaleString()}/-</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
      </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tank Wise Current Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Tank Wise - Current Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tankStock}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="t1XP" stroke="#8884d8" name="T1 XP" />
                <Line type="monotone" dataKey="t2HSD" stroke="#82ca9d" name="T2 HSD" />
                <Line type="monotone" dataKey="t3MS" stroke="#ffc658" name="T3 MS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* All Credit Parties */}
        <Card>
          <CardHeader>
            <CardTitle>All Credit Parties</CardTitle>
        </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={creditParties}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
              <Legend />
                <Bar dataKey="creditAmount" stackId="a" fill="#0088FE" name="Credit Amount" />
                <Bar dataKey="recovery" stackId="a" fill="#00C49F" name="Recovery" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
        </div>
    </div>
  );
}