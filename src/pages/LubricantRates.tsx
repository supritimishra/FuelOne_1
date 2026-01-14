import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LubricantRates() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [lubricants, setLubricants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchLubricants();
    }, []);

    const fetchLubricants = async () => {
        try {
            const response = await fetch('/api/lubricants', {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.ok) {
                const sorted = (result.rows || []).sort((a: any, b: any) =>
                    a.lubricant_name.localeCompare(b.lubricant_name)
                );
                setLubricants(sorted);

                // Initialize rates state
                const initialRates: Record<string, number> = {};
                sorted.forEach((item: any) => {
                    initialRates[item.id] = item.sale_rate || 0;
                });
                setRates(initialRates);
            } else {
                toast({ variant: "destructive", title: "Error", description: "Failed to fetch lubricants" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch lubricants" });
        }
    };

    const handleRateChange = (id: string, value: string) => {
        setRates(prev => ({
            ...prev,
            [id]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const updates = Object.entries(rates).map(([id, rate]) => ({
            id,
            sale_rate: rate
        }));

        try {
            const response = await fetch('/api/lubricants/bulk-rate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rates: updates })
            });
            const result = await response.json();

            if (result.ok) {
                toast({ title: "Success", description: "Rates updated successfully" });
                fetchLubricants(); // Refresh to ensure sync
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update rates" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update rates" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                Dashboard &gt; Lubricant Rates
            </div>

            <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-0">
                    <div className="p-4 flex justify-center items-center gap-4 bg-white border-b">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold px-8 shadow-sm flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "SAVING..." : "SUBMIT RATES"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/master/lubricants')}
                            className="border-black text-black hover:bg-gray-100 font-medium px-6"
                        >
                            Go Back
                        </Button>
                    </div>

                    <Table>
                        <TableHeader className="bg-[#0f172a]">
                            <TableRow className="hover:bg-[#0f172a] border-none">
                                <TableHead className="font-bold text-white h-12 w-16 pl-6">S.No</TableHead>
                                <TableHead className="font-bold text-white h-12">Product Name</TableHead>
                                <TableHead className="font-bold text-white h-12 w-48 text-right pr-6">Sale Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lubricants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                                        No lubricants found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lubricants.map((item, index) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50 border-b-gray-100">
                                        <TableCell className="text-gray-600 font-medium pl-6">{index + 1}</TableCell>
                                        <TableCell className="font-medium text-gray-800 uppercase text-xs">{item.lubricant_name}</TableCell>
                                        <TableCell className="text-right pr-4">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={rates[item.id] ?? ''}
                                                onChange={(e) => handleRateChange(item.id, e.target.value)}
                                                className="h-8 w-32 text-right ml-auto border-gray-300 focus:border-blue-500"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
