import { useEffect, useState } from "react";

export type UserRole = "super_admin" | "manager" | "dsm" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(() => {
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem('app_role') : null;
    return (cached as UserRole) || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Fetch user data from backend API which includes roles
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
      
        if (!response.ok) {
        setRole(null);
        setLoading(false);
        return;
      }

        const userData = await response.json();

        if (!userData || !userData.roles || userData.roles.length === 0) {
        setRole(null);
          setLoading(false);
          return;
        }

        // Get the primary role (first role or super_admin if present)
        const roles = userData.roles || [];
        let normalized: UserRole = null;
        
        // Check for super_admin first
        if (roles.some((r: string) => r?.toLowerCase().includes('super'))) {
          normalized = "super_admin";
        } else if (roles.some((r: string) => r?.toLowerCase() === 'admin' || r?.toLowerCase().includes('manager'))) {
          normalized = "manager";
        } else if (roles.some((r: string) => r?.toLowerCase().includes('dsm') || r?.toLowerCase().includes('sales'))) {
          normalized = "dsm";
        } else if (roles.length > 0) {
          // Fallback: use first role and normalize
          const raw = String(roles[0] || "").trim().toLowerCase();
        if (raw.includes("super")) normalized = "super_admin";
        else if (raw === "admin" || raw.includes("manager")) normalized = "manager";
        else if (raw.includes("dsm") || raw.includes("sales")) normalized = "dsm";
        }

        setRole(normalized);
        
        try {
          if (typeof window !== 'undefined') {
            if (normalized) window.localStorage.setItem('app_role', normalized);
            else window.localStorage.removeItem('app_role');
          }
        } catch (e) {
          // swallow storage errors (e.g., in private mode) intentionally
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
   
  }, []);

  return { role, loading, isAdmin: role === "super_admin" || role === "manager", isSuperAdmin: role === "super_admin" };
}
