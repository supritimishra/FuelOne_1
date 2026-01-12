import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DeveloperModeRouteProps {
  children: React.ReactNode;
}

/**
 * DeveloperModeRoute - Only allows access to the specific dev account
 * Username: dev, Email: dev@developer.local
 */
export function DeveloperModeRoute({ children }: DeveloperModeRouteProps) {
  const { user, loading } = useAuth();

  // CRITICAL FIX: Always render children to ensure hooks are called consistently
  // We show loading/error overlays on top, but children (DashboardLayout) always render
  // This prevents "Rendered more hooks" errors from hook count mismatches
  
  // Check if user is dev (only when user exists)
  const isDevUser = user && (user.email === 'dev@developer.local' || user.username === 'dev');

  // Show loading overlay if still loading, but STILL render children underneath
  if (loading) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </>
    );
  }

  // If no user (shouldn't happen due to ProtectedRoute, but defensive check)
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow access for the specific dev user account
  if (!isDevUser) {
    return <Navigate to="/" replace />;
  }

  // Render children - hooks are always called consistently
  return <>{children}</>;
}

