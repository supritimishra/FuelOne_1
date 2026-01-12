import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";
import { Link } from "react-router-dom";

export default function RolePermissions() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ role_name: "", description: "" });

  // Fetch roles data using backend API
  const { data: roles = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/user-roles"],
    queryFn: async () => {
      const response = await fetch('/api/user-roles', {
        credentials: 'include'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch user roles');
      
      // Process the data to get unique roles with descriptions
      const uniqueRoles = Array.from(new Set((result.rows || []).map((r: any) => r.role))).map((role: any) => {
        let description = "";
        if (role === "super_admin") description = "FULL ACCESS OF THE ENTIRE SYSTEM";
        else if (role === "manager") description = "MANAGER ADMIN";
        else if (role === "dsm") description = "SALE PERSON";
        return { role_name: role, description };
      });
      
      return uniqueRoles;
    },
  });

  const handleSave = async () => {
    // In a real system, you'd insert a new role type or update permissions
    toast({ title: "Role configuration", description: "Role changes are managed at database level" });
    setShowForm(false);
    setFormData({ role_name: "", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Role Permissions</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/developer-mode" className="flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Open Developer Mode
            </Link>
          </Button>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Role</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Role Name" value={formData.role_name} onChange={(e) => setFormData({ ...formData, role_name: e.target.value })} />
              <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>User Roles</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium uppercase">{r.role_name}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="default">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No roles defined</TableCell>
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
