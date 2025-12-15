import React from "react";

export default function ChartsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-md border bg-card">
      <div className="w-full h-64">
        {children}
      </div>
    </div>
  );
}
