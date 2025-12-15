import React from "react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-2">This screen is scaffolded and ready for implementation.</p>
    </div>
  );
}
