import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Cog } from "lucide-react";

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    setting_name: "",
    setting_value: "",
    setting_category: "",
    description: "",
    is_editable: true
  });

  const { data: settings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/system-settings"],
    queryFn: async () => {
      const response = await fetch('/api/system-settings');
      const result = await response.json();
      if (result.ok) return result.rows || [];
      throw new Error(result.error || 'Failed to fetch settings');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to create setting');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({ title: "Setting created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create setting", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await fetch(`/api/system-settings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to update setting');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({ title: "Setting updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update setting", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/system-settings/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to delete setting');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({ title: "Setting deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete setting", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      setting_name: "",
      setting_value: "",
      setting_category: "",
      description: "",
      is_editable: true
    });
    setEditingSetting(null);
  };

  const handleSubmit = () => {
    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (setting: any) => {
    setEditingSetting(setting);
    setFormData({
      setting_name: setting.setting_name || "",
      setting_value: setting.setting_value || "",
      setting_category: setting.setting_category || "",
      description: setting.description || "",
      is_editable: setting.is_editable ?? true
    });
    setIsDialogOpen(true);
  };

  const groupedSettings = settings.reduce((acc: any, setting: any) => {
    const category = setting.setting_category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Cog className="h-8 w-8" />
          System Settings
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-add-setting">
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSetting ? "Edit" : "Add"} System Setting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Setting Name</label>
                <Input
                  value={formData.setting_name}
                  onChange={(e) => setFormData({ ...formData, setting_name: e.target.value })}
                  placeholder="e.g., DEFAULT_TAX_RATE"
                  data-testid="input-setting-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Setting Value</label>
                <Input
                  value={formData.setting_value}
                  onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
                  placeholder="Value"
                  data-testid="input-setting-value"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.setting_category}
                  onChange={(e) => setFormData({ ...formData, setting_category: e.target.value })}
                  placeholder="e.g., Tax, Display, Security"
                  data-testid="input-setting-category"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  data-testid="input-setting-description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_editable}
                  onChange={(e) => setFormData({ ...formData, is_editable: e.target.checked })}
                  data-testid="checkbox-setting-editable"
                />
                <label className="text-sm font-medium">Editable</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-setting">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-setting">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No settings configured
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedSettings).map(([category, categorySettings]: [string, any]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Editable</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorySettings.map((setting: any) => (
                    <TableRow key={setting.id} data-testid={`row-setting-${setting.id}`}>
                      <TableCell className="font-mono" data-testid={`text-setting-name-${setting.id}`}>{setting.setting_name}</TableCell>
                      <TableCell data-testid={`text-setting-value-${setting.id}`}>{setting.setting_value}</TableCell>
                      <TableCell data-testid={`text-setting-description-${setting.id}`}>{setting.description}</TableCell>
                      <TableCell data-testid={`text-setting-editable-${setting.id}`}>
                        {setting.is_editable ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(setting)}
                            disabled={!setting.is_editable}
                            data-testid={`button-edit-${setting.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(setting.id)}
                            disabled={!setting.is_editable}
                            data-testid={`button-delete-${setting.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
