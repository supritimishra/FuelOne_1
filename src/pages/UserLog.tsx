import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search } from "lucide-react";
import { format } from "date-fns";

export default function UserLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/user-log", { search: searchTerm, from: fromDate, to: toDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      
      const response = await fetch(`/api/user-log?${params.toString()}`);
      const result = await response.json();
      if (result.ok) return result.rows || [];
      throw new Error(result.error || 'Failed to fetch logs');
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          User Activity Log
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="input-from-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="input-to-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search action, module, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-log"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" data-testid="button-search-log">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell data-testid={`text-log-time-${log.id}`}>
                        {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-log-user-${log.id}`}>
                        {log.user_name || log.user_email || 'System'}
                      </TableCell>
                      <TableCell data-testid={`text-log-action-${log.id}`}>
                        <span className="font-medium">{log.action}</span>
                      </TableCell>
                      <TableCell data-testid={`text-log-module-${log.id}`}>
                        {log.module || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" data-testid={`text-log-details-${log.id}`}>
                        {log.details || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-log-ip-${log.id}`}>
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
