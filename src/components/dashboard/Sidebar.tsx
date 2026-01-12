import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card p-4 hidden md:block">
      <div className="mb-6">
        <div className="text-lg font-bold">PetroPal</div>
        <div className="text-xs text-muted-foreground">Station Dashboard</div>
      </div>
      <nav className="space-y-2 text-sm">
        <NavLink to="/dashboard" className="block px-3 py-2 rounded hover:bg-muted">Overview</NavLink>
        <NavLink to="/sales" className="block px-3 py-2 rounded hover:bg-muted">Sales</NavLink>
        <NavLink to="/reports" className="block px-3 py-2 rounded hover:bg-muted">Reports</NavLink>
        <NavLink to="/settings" className="block px-3 py-2 rounded hover:bg-muted">Settings</NavLink>
      </nav>
    </aside>
  );
}
