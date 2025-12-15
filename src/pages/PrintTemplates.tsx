import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function PrintTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", content: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/print-templates');
      const result = await response.json();
      if (result.ok) {
        setTemplates(result.rows || []);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to fetch templates" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch templates" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (formData.id) {
        response = await fetch(`/api/print-templates/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, content: formData.content })
        });
      } else {
        response = await fetch('/api/print-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, content: formData.content })
        });
      }
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Template saved" });
        setShowForm(false);
        setFormData({ id: "", name: "", content: "" });
        fetchTemplates();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to save template" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save template" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/print-templates/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.ok) {
        toast({ title: "Success", description: "Template deleted" });
        fetchTemplates();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete template" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete template" });
    }
  };

  const handleEdit = (t: any) => {
    setFormData({ id: t.id, name: t.name, content: t.content || "" });
    setShowForm(true);
  };

  const handlePreview = (content: string) => {
    setPreview(content);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Print Templates</h1>
          <p className="text-muted-foreground">Manage invoice & print templates</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" accept=".html,.htm,.txt,image/*,application/pdf" onChange={async (e) => {
            const f = e.currentTarget.files?.[0];
            if (!f) return;
            try {
              // small helper to read file
              const readAsDataURL = (file: File) => new Promise<string>((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(String(fr.result));
                fr.onerror = reject;
                fr.readAsDataURL(file);
              });
              const readAsText = (file: File) => new Promise<string>((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(String(fr.result));
                fr.onerror = reject;
                fr.readAsText(file);
              });

              let content = '';
              if (f.type.startsWith('text') || f.name.endsWith('.html') || f.name.endsWith('.htm')) {
                content = await readAsText(f);
              } else if (f.type.startsWith('image/')) {
                const d = await readAsDataURL(f);
                content = `<div style="display:flex;align-items:center;justify-content:center"><img src="${d}" style="max-width:100%;height:auto"/></div>`;
              } else if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
                const d = await readAsDataURL(f);
                // data:{mime};base64,... -> use embed
                content = `<embed src="${d}" type="application/pdf" width="100%" height="700px" />`;
              } else {
                // fallback to dataURL
                const d = await readAsDataURL(f);
                content = `<div><a href="${d}" download="${f.name}">Download ${f.name}</a></div>`;
              }

              // populate form and show
              setFormData({ id: '', name: f.name.replace(/\.[^.]+$/, ''), content });
              setShowForm(true);
              toast({ title: 'File loaded', description: `Loaded ${f.name}. Edit name or content then Save.` });
            } catch (err: any) {
              toast({ variant: 'destructive', title: 'Upload failed', description: String(err?.message || err) });
            } finally {
              // reset input so same file can be picked again if needed
              e.currentTarget.value = '';
            }
          }} />
          <Button onClick={() => fileInputRef.current?.click()}>Upload Template</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Content (HTML / Text)</Label>
                  <Input value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="relative bg-white border rounded shadow-sm overflow-hidden">
                <div className="h-48 flex items-center justify-center bg-gray-50 p-2">
                  {/* Render HTML content in an iframe-like box to keep layout stable */}
                  <div className="w-full h-full overflow-hidden flex items-center justify-center">
                    <div className="prose max-w-none text-sm p-2" dangerouslySetInnerHTML={{ __html: t.content || '<div class="text-xs text-muted-foreground">No preview</div>' }} />
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{(t.content || '').replace(/<[^>]+>/g, '').slice(0,120)}</div>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(t)}>Edit</Button>
                    <Button size="icon" variant="ghost" onClick={() => handlePreview(t.content || "")}>Preview</Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>Del</Button>
                  </div>
                </div>
                {/* selection checkbox overlay at top-center */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-3">
                  <input type="checkbox" className="w-5 h-5 accent-green-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: preview }} />
            <div className="mt-2 flex justify-center">
              <Button onClick={() => setPreview(null)}>Close Preview</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
