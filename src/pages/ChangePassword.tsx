import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ChangePassword() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [nextPwd, setNextPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!nextPwd || nextPwd.length < 8) {
      toast({ variant: "destructive", title: "Password too short", description: "Minimum 8 characters required" });
      return;
    }
    if (nextPwd !== confirm) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      // Reauthenticate by signing in with current password (email retrieved from session)
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) throw new Error("No active session");

      // Optional: verify current password by signInWithPassword (will create a new session)
      const { error: verifyErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (verifyErr) throw new Error("Current password is incorrect");

      // Update password
      const { error: updErr } = await supabase.auth.updateUser({ password: nextPwd });
      if (updErr) throw updErr;

      toast({ title: "Password updated", description: "Please login again with your new password" });

      // Sign out to force re-login
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to update password", description: e?.message || "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Change Password</h1>
      <Card>
        <CardHeader>
          <CardTitle>Update your password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Current Password</label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Enter current password" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">New Password</label>
            <Input type="password" value={nextPwd} onChange={(e) => setNextPwd(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Confirm New Password</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" />
          </div>
          <div className="pt-2">
            <Button onClick={onSubmit} disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
