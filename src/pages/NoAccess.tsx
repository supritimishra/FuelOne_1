import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function NoAccess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Restricted</CardTitle>
          <CardDescription className="mt-2">
            Your account doesn't have access to any features at this time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">No Permissions Assigned</p>
                <p>
                  Your administrator needs to assign feature permissions to your account in Developer Mode.
                </p>
                {user?.email && (
                  <p className="mt-2 text-xs text-yellow-700">
                    Account: <strong>{user.email}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Try to navigate to a safe route
                window.location.href = "/login";
              }}
              className="w-full"
            >
              Logout
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Contact your system administrator to request access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

