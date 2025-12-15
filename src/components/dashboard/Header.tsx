import React from "react";
import { Button } from "@/components/ui/button";

export default function Header({ title }: { title?: string }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{title || 'Dashboard'}</h1>
        <span className="text-sm text-muted-foreground">Overview & Reports</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="date" className="h-9 rounded-md border bg-background px-2 text-sm" />
        <Button variant="ghost">Refresh</Button>
        <Button>Export</Button>
      </div>
    </div>
  );
}
