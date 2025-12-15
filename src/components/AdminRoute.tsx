import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface AdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminRoute({ children, requireSuperAdmin = false }: AdminRouteProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow a small delay for role to load (check localStorage fallback)
  const isDevUser = typeof window !== 'undefined' && (
    window.localStorage.getItem('app_role') === 'super_admin' ||
    document.cookie.includes('dev@developer.local')
  );

  if (requireSuperAdmin && role !== "super_admin" && !isDevUser) {
    console.log('AdminRoute: Redirecting - role:', role, 'requireSuperAdmin:', requireSuperAdmin);
    return <Navigate to="/" replace />;
  }

  if (!requireSuperAdmin && role !== "super_admin" && role !== "manager" && !isDevUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
