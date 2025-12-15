import React from "react";
import { DashboardLayout } from "./DashboardLayout";
import DeveloperMode from "@/pages/admin/DeveloperMode";

/**
 * DeveloperModeWrapper ensures all hooks are called consistently
 * by wrapping DeveloperMode in DashboardLayout before route guards check auth.
 * This prevents "Rendered more hooks" errors.
 */
export function DeveloperModeWrapper() {
  // All hooks must be called unconditionally - no early returns
  // The route guards (ProtectedRoute, DeveloperModeRoute) will handle auth checks
  // This component just ensures the component tree is stable
  return (
    <DashboardLayout>
      <DeveloperMode />
    </DashboardLayout>
  );
}

