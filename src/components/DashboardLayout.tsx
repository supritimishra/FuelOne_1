import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Bell, User, LogOut, Building2, Shield, Home, Key, Database, Flag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isAdmin, isSuperAdmin } = useUserRole();
  const { user, organizationName } = useAuth();

  // Check if user is the developer account (completely isolated from tenants)
  const isDevUser = user && (user.email === 'dev@developer.local' || user.username === 'dev');

  // For dev user, show "Developer Mode" instead of tenant organization name
  // Developer Mode is above all tenants and organizations
  const displayHeader = isDevUser ? '🔧 Developer Mode' : (organizationName || 'Loading...');

  // Debug logging
  console.log('🏢 [DASHBOARD] Current auth state:', {
    userEmail: user?.email,
    organizationName: organizationName,
    tenantId: user?.tenant?.id,
    isDevUser: isDevUser
  });

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }

      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Force redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, force redirect
      window.location.href = "/login";
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-white text-gray-900">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {displayHeader}
              </h1>
              {!isDevUser && user?.email && (
                <span className="text-sm text-gray-600">
                  ({user.email})
                </span>
              )}
              {isDevUser && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  System Administrator
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">{(role || "ADMIN").toString().replace("_", " ").toUpperCase()}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isSuperAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/organization-settings")}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Organization Details
                    </DropdownMenuItem>
                  )}
                  {(isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem onClick={() => navigate("/role-permissions")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Role Permission
                    </DropdownMenuItem>
                  )}
                  {(isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem onClick={() => navigate("/my-bunks")}>
                      <Home className="mr-2 h-4 w-4" />
                      My Bunks
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/change-password")}>
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/backup-data")}>
                    <Database className="mr-2 h-4 w-4" />
                    Backup Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/feedback")}>
                    <Flag className="mr-2 h-4 w-4" />
                    Report Us
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/bunk-users")}>
                    <Users className="mr-2 h-4 w-4" />
                    Bunk Users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
