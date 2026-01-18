import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function Feedback() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/feedback');
      const result = await response.json();
      if (result.ok) {
        setItems(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch feedback" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (formData.id) {
        // Update existing feedback using backend API
        const response = await fetch(`/api/feedback/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, message: formData.message })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          toast({ title: "Success", description: "Feedback updated successfully" });
          setShowForm(false);
          setFormData({ id: "", name: "", message: "" });
          fetchFeedback();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
        }
      } else {
        // Create new feedback using backend API
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, message: formData.message })
        });
        
        const result = await response.json();
        
        if (result.ok) {
          toast({ title: "Success", description: "Feedback recorded successfully" });
          setShowForm(false);
          setFormData({ id: "", name: "", message: "" });
          fetchFeedback();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save feedback" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Feedback deleted successfully" });
        fetchFeedback();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete feedback" });
    }
  };

  const handleEdit = (i: any) => {
    setFormData({ id: i.id, name: i.name || "", message: i.message || "" });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-muted-foreground">Customer and staff feedback</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Add Feedback</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Message</Label>
                  <Input value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.name || "-"}</TableCell>
                  <TableCell className="max-w-md truncate">{i.message}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(i)}>Edit</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
