import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Fuel } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email');

  // Auto-detect login method based on input
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Auto-detect if it's an email or username
    if (value.includes('@')) {
      setLoginMethod('email');
    } else if (value.length > 0) {
      setLoginMethod('username');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any existing session data before login
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';

      // Call logout endpoint to clear server-side session
      try {
        await fetch(`${apiBase}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        // Silently fail logout
      }

      // Clear client-side data
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      localStorage.clear();
      sessionStorage.clear();

      // Try backend API login first
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user?.fullName || email}!`,
        });

        // Wait for browser to store cookie before fetching user data
        await new Promise(resolve => setTimeout(resolve, 200));

        // Refresh user data to update auth context
        await refreshUser();

        // Navigate to dashboard
        navigate("/");
        return;
      }

      // Show error for failed login
      const errorData = await response.json();
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorData.error || "Invalid email or password",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    setLoading(true);

    try {
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, username, password, fullName, organizationName }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Account created!",
          description: "You can now log in with your credentials.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: data.error || "Failed to create account.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const apiBase = (import.meta as any)?.env?.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/auth/reset-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Check your email",
          description: data.message || `A password reset link has been sent to ${resetEmail}. Click the link in the email to reset your password.`,
        });
        setResetDialogOpen(false);
        setResetEmail("");
      } else {
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: data.error || "Unable to send reset email. Please check your email address.",
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again.",
      });
    }

    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/brand-logo.png" alt="Petrol Pump Logo" className="h-14 w-auto" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <CardTitle className="text-2xl">Petrol Pump Management</CardTitle>
          <CardDescription>Multi-Tenant Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Login Method Toggle */}
                <div className="flex space-x-2 mb-4">
                  <Button
                    type="button"
                    variant={loginMethod === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginMethod('email')}
                    className="flex-1"
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === 'username' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginMethod('username')}
                    className="flex-1"
                  >
                    Username
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-email">
                    {loginMethod === 'email' ? 'Email' : 'Username'}
                  </Label>
                  <Input
                    id="login-email"
                    data-testid="input-login-email"
                    type={loginMethod === 'email' ? 'email' : 'text'}
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="input-login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
                  {loading ? "Loading..." : "Login"}
                </Button>
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="w-full" type="button" data-testid="button-forgot-password">
                      Forgot Password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          data-testid="input-reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={resetLoading} data-testid="button-send-reset">
                        {resetLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    data-testid="input-signup-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-organization">Organization Name</Label>
                  <Input
                    id="signup-organization"
                    data-testid="input-signup-organization"
                    type="text"
                    placeholder="Enter your organization name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    data-testid="input-signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    data-testid="input-signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    data-testid="input-signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-signup">
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
