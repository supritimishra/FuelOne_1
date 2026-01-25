import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { handleAPIError } from "@/lib/errorHandler";
import { Calendar, Save, Plus } from "lucide-react";
import { format } from "date-fns";

interface NozzleReading {
  nozzle_id: string;
  nozzle_number: string;
  opening_reading: string;
  closing_reading: string;
  quantity: number;
}

export default function ShiftEntry() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const [shiftDate, setShiftDate] = useState<string>(today);
  const [shiftId, setShiftId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [nozzleReadings, setNozzleReadings] = useState<NozzleReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch master data using backend API
  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/duty-shifts"],
    queryFn: async () => {
      const response = await fetch('/api/duty-shifts');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch duty shifts');
      return result.rows || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch employees');
      return result.rows || [];
    },
  });

  const { data: nozzles = [] } = useQuery({
    queryKey: ["/api/nozzles-list"],
    queryFn: async () => {
      const response = await fetch('/api/nozzles-list');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch nozzles');
      return result.rows || [];
    },
  });

  const addNozzleReading = () => {
    const newReading: NozzleReading = {
      nozzle_id: "",
      nozzle_number: "",
      opening_reading: "",
      closing_reading: "",
      quantity: 0,
    };
    setNozzleReadings([...nozzleReadings, newReading]);
  };

  const updateNozzleReading = (index: number, field: keyof NozzleReading, value: string | number) => {
    const updated = [...nozzleReadings];
    updated[index] = { ...updated[index], [field]: value };

    // Calculate quantity if both readings are provided
    if (field === "opening_reading" || field === "closing_reading") {
      const opening = parseFloat(updated[index].opening_reading) || 0;
      const closing = parseFloat(updated[index].closing_reading) || 0;
      updated[index].quantity = Math.max(0, closing - opening);
    }

    setNozzleReadings(updated);
  };

  const removeNozzleReading = (index: number) => {
    setNozzleReadings(nozzleReadings.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      if (!shiftId || !employeeId) {
        toast({
          title: "Validation Error",
          description: "Please select shift and employee",
          variant: "destructive",
        });
        return;
      }

      if (nozzleReadings.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one nozzle reading",
          variant: "destructive",
        });
        return;
      }

      // Prepare sale entries data
      const saleEntries = nozzleReadings.map(reading => ({
        sale_date: shiftDate,
        shift_id: shiftId,
        employee_id: employeeId,
        nozzle_id: reading.nozzle_id,
        opening_reading: reading.opening_reading,
        closing_reading: reading.closing_reading,
        quantity: reading.quantity,
      }));

      // Submit to backend API
      const response = await fetch('/api/sale-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleEntries),
      });

      const result = await response.json();

      if (!result.ok) {
        const errorInfo = handleAPIError(result.error, "Shift Entry");
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Shift entry saved successfully",
        });
        setNozzleReadings([]);
      }
    } catch (e: any) {
      const errorInfo = handleAPIError(e, "Shift Entry");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shift Entry</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift-date">Shift Date</Label>
              <Input
                id="shift-date"
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select value={shiftId} onValueChange={setShiftId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shift_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Nozzle Readings
            <Button onClick={addNozzleReading} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Reading
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nozzleReadings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No nozzle readings added yet. Click "Add Reading" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nozzle</TableHead>
                  <TableHead>Opening Reading</TableHead>
                  <TableHead>Closing Reading</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nozzleReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={reading.nozzle_id}
                        onValueChange={(value) => {
                          const nozzle = nozzles.find(n => n.id === value);
                          updateNozzleReading(index, "nozzle_id", value);
                          updateNozzleReading(index, "nozzle_number", nozzle?.nozzle_number || "");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select nozzle" />
                        </SelectTrigger>
                        <SelectContent>
                          {nozzles.map((nozzle) => (
                            <SelectItem key={nozzle.id} value={nozzle.id}>
                              {nozzle.nozzle_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={reading.opening_reading}
                        onChange={(e) => updateNozzleReading(index, "opening_reading", e.target.value)}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={reading.closing_reading}
                        onChange={(e) => updateNozzleReading(index, "closing_reading", e.target.value)}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{reading.quantity.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeNozzleReading(index)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Shift Entry"}
        </Button>
      </div>
    </div>
  );
}
