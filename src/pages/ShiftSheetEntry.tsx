import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ShiftSheetEntry() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [shift, setShift] = useState<"S-1" | "S-2">("S-1");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm"><span className="font-semibold">Dashboard</span><span>/</span><span>Shift Sheet Entry</span></div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Shift Sheet Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="relative col-span-3">
              <input id="sse_date_btn" type="date" value={date} onChange={(e)=> setDate(e.target.value)} className="absolute inset-0 opacity-0 pointer-events-none" />
              <button type="button" className="h-10 w-full rounded-md bg-orange-500 text-white font-medium px-3" onClick={()=>{ const el=document.getElementById('sse_date_btn') as HTMLInputElement|null; if(el){ // @ts-ignore
                if(typeof el.showPicker==='function'){ // @ts-ignore
                  el.showPicker(); } else { el.click(); } } }}>Choose Date</button>
            </div>
            <div className="col-span-6">
              <Input readOnly value={`Show: ${shift}`} className="bg-white text-black" />
            </div>
            <div className="col-span-1">
              <Button type="button" className="bg-cyan-400 hover:bg-cyan-500 text-black">Show</Button>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-6 rounded-md border border-white/50 px-4 py-2">
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift==='S-1'} onChange={()=> setShift('S-1')} /> S-1</label>
                <label className="flex items-center gap-2"><input type="radio" name="shift" checked={shift==='S-2'} onChange={()=> setShift('S-2')} /> S-2</label>
              </div>
            </div>
          </div>

          <div className="h-24 rounded-md border border-white/40 bg-white/10" />
        </CardContent>
      </Card>
    </div>
  );
}
