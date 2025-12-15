import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";

export default function AppConfig() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    config_key: "",
    config_value: "",
    config_type: "string",
    description: "",
    is_active: true
  });

  const { data: configs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/app-config"],
    queryFn: async () => {
      const response = await fetch('/api/app-config');
      const result = await response.json();
      if (result.ok) return result.rows || [];
      throw new Error(result.error || 'Failed to fetch configs');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to create config');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-config"] });
      toast({ title: "Config created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create config", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await fetch(`/api/app-config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to update config');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-config"] });
      toast({ title: "Config updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update config", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/app-config/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to delete config');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-config"] });
      toast({ title: "Config deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete config", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      config_key: "",
      config_value: "",
      config_type: "string",
      description: "",
      is_active: true
    });
    setEditingConfig(null);
  };

  const handleSubmit = () => {
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      config_key: config.config_key || "",
      config_value: config.config_value || "",
      config_type: config.config_type || "string",
      description: config.description || "",
      is_active: config.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          App Configuration
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-add-config">
              <Plus className="h-4 w-4 mr-2" />
              Add Config
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingConfig ? "Edit" : "Add"} Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Config Key</label>
                <Input
                  value={formData.config_key}
                  onChange={(e) => setFormData({ ...formData, config_key: e.target.value })}
                  placeholder="e.g., MAX_LOGIN_ATTEMPTS"
                  data-testid="input-config-key"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Config Value</label>
                <Input
                  value={formData.config_value}
                  onChange={(e) => setFormData({ ...formData, config_value: e.target.value })}
                  placeholder="Value"
                  data-testid="input-config-value"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.config_type} onValueChange={(value) => setFormData({ ...formData, config_type: value })}>
                  <SelectTrigger data-testid="select-config-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  data-testid="input-config-description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  data-testid="checkbox-config-active"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-config">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-config">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config.id} data-testid={`row-config-${config.id}`}>
                      <TableCell className="font-mono" data-testid={`text-config-key-${config.id}`}>{config.config_key}</TableCell>
                      <TableCell data-testid={`text-config-value-${config.id}`}>{config.config_value}</TableCell>
                      <TableCell data-testid={`text-config-type-${config.id}`}>{config.config_type}</TableCell>
                      <TableCell data-testid={`text-config-description-${config.id}`}>{config.description}</TableCell>
                      <TableCell data-testid={`text-config-status-${config.id}`}>
                        <span className={`px-2 py-1 rounded text-xs ${config.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(config)}
                            data-testid={`button-edit-${config.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(config.id)}
                            data-testid={`button-delete-${config.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
