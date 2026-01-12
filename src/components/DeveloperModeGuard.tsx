import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "./DashboardLayout";
import DeveloperMode from "@/pages/admin/DeveloperMode";

/**
 * DeveloperModeGuard - Single component that handles all auth and access checks
 * while always rendering DashboardLayout and DeveloperMode to ensure hooks are called consistently
 */
export function DeveloperModeGuard() {
  // CRITICAL: ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // This includes hooks from DashboardLayout and DeveloperMode which will be rendered below
  const { user, loading } = useAuth();

  // Check if user is dev (only when user exists)
  const isDevUser = user && (user.email === 'dev@developer.local' || user.username === 'dev');

  // CRITICAL: Always render DashboardLayout and DeveloperMode
  // These components have hooks that MUST be called on every render
  // We ALWAYS render them, even during redirects, to maintain consistent hook count
  // React Router's Navigate will handle the redirect, but hooks are still called
  return (
    <>
      {/* Always render these components to ensure hooks are called consistently */}
      <DashboardLayout>
        <DeveloperMode />
      </DashboardLayout>
      
      {/* Navigate component - React Router will handle redirect after render */}
      {!loading && !user && <Navigate to="/auth" replace />}
      {!loading && user && !isDevUser && <Navigate to="/" replace />}
      
      {/* Show loading overlay if still loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Show redirect overlay if unauthorized (will be replaced by Navigate) */}
      {!loading && (!user || !isDevUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-white">Redirecting...</div>
        </div>
      )}
    </>
  );
}

