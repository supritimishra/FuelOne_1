import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TankerSaleEnhanced() {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    invoice_no: "",
    vehicle_no: "",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
        <nav className="text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <span className="text-gray-300">Dashboard</span>
            </li>
            <li className="flex items-center">
              <span className="mx-2 text-gray-400">&gt;</span>
              <span className="text-white font-medium">Add Tanker Details</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="p-6">
        {/* Simple Form */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Invoice No</label>
                <input
                  type="text"
                  value={form.invoice_no}
                  onChange={(e) => setForm({...form, invoice_no: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vehicle No</label>
                <input
                  type="text"
                  value={form.vehicle_no}
                  onChange={(e) => setForm({...form, vehicle_no: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2">
              SAVE
            </Button>
          </CardContent>
        </Card>

        {/* Simple Table */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tanker Sales</h3>
            <div className="text-center text-gray-500 py-8">
              No data available in table
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
