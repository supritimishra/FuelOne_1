import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const denominationSchema = z.object({
  denomination: z.string().min(1, "Denomination is required"),
});

type DenominationForm = z.infer<typeof denominationSchema>;

// Mock data for initial state
const INITIAL_DENOMINATIONS = [
  { id: '1', value: '2000', status: 'ACTIVATED', created_at: new Date().toISOString() },
  { id: '2', value: '500', status: 'ACTIVATED', created_at: new Date().toISOString() },
  { id: '3', value: '200', status: 'ACTIVATED', created_at: new Date().toISOString() },
  { id: '4', value: '100', status: 'ACTIVATED', created_at: new Date().toISOString() },
  { id: '5', value: '50', status: 'ACTIVATED', created_at: new Date().toISOString() },
  { id: '6', value: '20', status: 'ACTIVATED', created_at: new Date().toISOString() },
  { id: '7', value: '10', status: 'ACTIVATED', created_at: new Date().toISOString() },
];

export default function Denominations() {
  const [denominations, setDenominations] = useState(INITIAL_DENOMINATIONS);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<DenominationForm>({
    resolver: zodResolver(denominationSchema),
    defaultValues: {
      denomination: "",
    },
  });

  const onSubmit = (data: DenominationForm) => {
    const newDenomination = {
      id: Math.random().toString(36).substr(2, 9),
      value: data.denomination,
      status: 'ACTIVATED',
      created_at: new Date().toISOString(),
    };
    setDenominations([newDenomination, ...denominations]);
    toast({ title: "Denomination added successfully" });
    form.reset();
  };

  const handleDelete = () => {
    if (deleteId) {
      setDenominations(denominations.filter(d => d.id !== deleteId));
      toast({ title: "Denomination deleted successfully" });
      setDeleteId(null);
    }
  };

  const filteredDenominations = denominations.filter((item) =>
    item.value.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-blue-600 text-white py-3">
          <CardTitle className="text-lg font-medium">Add Denomination</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-blue-50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <FormField
                  control={form.control}
                  name="denomination"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className="text-blue-900 font-semibold">Denomination <span className="text-red-500">*</span></FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} className="bg-white border-blue-200 focus:border-blue-500" placeholder="Enter Denomination" />
                        </FormControl>
                        <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex justify-between items-center bg-white border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <select className="border rounded p-1 text-sm bg-white">
                <option>All</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50">CSV</Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">PDF</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filter:</span>
                <Input
                  placeholder="Type to filter..."
                  className="h-8 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">S.No</TableHead>
                  <TableHead className="font-bold text-gray-700">Denomination</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                  <TableHead className="font-bold text-gray-700">User Log Details</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDenominations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDenominations.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.value}</TableCell>
                      <TableCell className="text-center">
                        <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded font-bold">
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        Created: Super Admin {new Date(item.created_at).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing 1 to {filteredDenominations.length} of {filteredDenominations.length} entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>&larr;</Button>
              <Button variant="outline" size="sm" className="bg-gray-100">1</Button>
              <Button variant="outline" size="sm" disabled>&rarr;</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Denomination?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the denomination.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
