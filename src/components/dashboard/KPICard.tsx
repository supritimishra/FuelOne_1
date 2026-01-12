import React from "react";

export default function KPICard({ title, value, icon }: { title: string; value: React.ReactNode; icon?: React.ComponentType<any> }) {
  const Icon = icon;
  return (
    <div className="p-4 rounded-md border bg-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        {Icon && <Icon className="h-6 w-6 text-primary" />}
      </div>
    </div>
  );
}
