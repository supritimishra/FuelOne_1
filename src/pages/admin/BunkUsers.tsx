import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";

type RoleType = "super_admin" | "manager" | "dsm" | "employee";

const ROLES: { value: RoleType; label: string }[] = [
  { value: "super_admin", label: "SUPER ADMIN" },
  { value: "manager", label: "MANAGER" },
  { value: "dsm", label: "DSM" },
  { value: "employee", label: "EMPLOYEE" },
];

export default function BunkUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<RoleType>("manager");

  // Fetch user roles data using backend API
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/user-roles"],
    queryFn: async () => {
      const response = await fetch('/api/user-roles', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch user roles');
      return result.rows || [];
    },
  });

  // Add user role mutation
  const addUserRoleMutation = useMutation({
    mutationFn: async (data: { user_id: string; role: RoleType }) => {
      const response = await fetch('/api/user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to add user role');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role added successfully" });
      setUserId("");
      setRole("manager");
      queryClient.invalidateQueries({ queryKey: ["/api/user-roles"] });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "User Role");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    },
  });

  const addMapping = async () => {
    if (!userId.trim()) {
      toast({ variant: "destructive", title: "User ID is required" });
      return;
    }
    
    const uid = userId.trim();
    addUserRoleMutation.mutate({ user_id: uid, role });
  };

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async (data: { user_id: string; role: RoleType }) => {
      const response = await fetch(`/api/user-roles/${data.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: data.role }),
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update user role');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user-roles"] });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "User Role");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    },
  });

  // Delete user role mutation
  const deleteUserRoleMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const response = await fetch(`/api/user-roles/${user_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete user role');
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user-roles"] });
    },
    onError: (error: any) => {
      const errorInfo = handleAPIError(error, "User Role");
      toast({ 
        variant: "destructive", 
        title: errorInfo.title, 
        description: errorInfo.description 
      });
    },
  });

  const updateRole = async (uid: string, newRole: RoleType) => {
    updateUserRoleMutation.mutate({ user_id: uid, role: newRole });
  };

  const removeMapping = async (uid: string) => {
    deleteUserRoleMutation.mutate(uid);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bunk Users</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Add / Update User Role</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Supabase User ID</label>
              <Input value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="paste auth user id" />
            </div>
            <div className="w-[220px]">
              <label className="text-sm text-muted-foreground">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as RoleType)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addMapping}>Save</Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Tip: You can copy a user's ID from your auth management or log it from the client after login.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assigned Roles</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r:any) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                      <TableCell>
                        <Select value={r.role} onValueChange={(val)=>updateRole(r.user_id, val as RoleType)}>
                          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => removeMapping(r.user_id)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No users</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
