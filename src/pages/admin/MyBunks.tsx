import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function MyBunks() {
  const { toast } = useToast();
  const [bunks, setBunks] = useState<any[]>([]);
  const [bunkName, setBunkName] = useState("");
  const [bunkId, setBunkId] = useState("");

  const handleSave = () => {
    if (!bunkName.trim() || !bunkId.trim()) {
      toast({ variant: "destructive", title: "Please fill both fields" });
      return;
    }
    const newBunk = { id: Date.now(), bunk_name: bunkName, bunk_id: bunkId, created_at: new Date().toISOString() };
    setBunks([...bunks, newBunk]);
    setBunkName("");
    setBunkId("");
    toast({ title: "Bunk added successfully" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Bunks</h1>

      <Card>
        <CardHeader><CardTitle>Create Bunks</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input placeholder="Add bunk name" value={bunkName} onChange={(e) => setBunkName(e.target.value)} />
            </div>
            <div className="flex-1">
              <Input placeholder="Add bunk id" value={bunkId} onChange={(e) => setBunkId(e.target.value)} />
            </div>
            <Button onClick={handleSave}>SAVE</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SI No</TableHead>
                  <TableHead>Bunk Name</TableHead>
                  <TableHead>Bunk Id</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User Log Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bunks.map((b: any, idx: number) => (
                  <TableRow key={b.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{b.bunk_name}</TableCell>
                    <TableCell>{b.bunk_id}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">Edit</Button>
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ))}
                {bunks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No data available in table</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
