import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [formData, setFormData] = useState({
    company_name: "",
    bank_name: "",
    bank_address: "",
    contact_number: "",
    email: "",
    tin_gst_number: "",
    logo_url: "",
    sms_api_key: "",
    subscription_start_date: "",
    subscription_end_date: "",
  });

  useEffect(() => {
    fetchOrganizationDetails();
  }, []);

  const fetchOrganizationDetails = async () => {
    try {
      const response = await fetch('/api/organization-details', {
        credentials: 'include'
      });
      const result = await response.json();

      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch organization details: " + result.error,
        });
        return;
      }

      const data = result.rows || [];
      if (data && data.length > 0) {
        const d: any = data[0]; // Get the first (most recent) record
        setOrgId(d.id);
        setFormData({
          company_name: d.organization_name || d.company_name || "",
          bank_name: d.bank_name || "",
          bank_address: d.address || d.bank_address || "", // Map address to bank_address for the form
          contact_number: d.phone_number || d.contact_number || "",
          email: d.email || "",
          tin_gst_number: d.gst_number || d.tin_gst_number || "",
          logo_url: d.logo_url || "",
          sms_api_key: d.sms_api_key || "",
          subscription_start_date: d.subscription_start_date || "",
          subscription_end_date: d.subscription_end_date || "",
        });
      } else {
        // No organization record found, create a default one
        console.log('No organization record found, creating default...');
        const createResponse = await fetch('/api/organization-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            organization_name: "",
            phone_number: "",
            email: "",
            address: "",
            bank_name: "",
            gst_number: "",
          })
        });
        const createResult = await createResponse.json();

        if (!createResult.ok) {
          console.error('Create error:', createResult.error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create organization record: " + createResult.error,
          });
          return;
        }

        const newData = createResult.row;
        if (newData) {
          setOrgId(newData.id);
          setFormData({
            company_name: newData.organization_name || "",
            bank_name: newData.bank_name || "",
            bank_address: newData.address || "",
            contact_number: newData.phone_number || "",
            email: newData.email || "",
            tin_gst_number: newData.gst_number || "",
            logo_url: newData.logo_url || "",
            sms_api_key: newData.sms_api_key || "",
            subscription_start_date: newData.subscription_start_date || "",
            subscription_end_date: newData.subscription_end_date || "",
          });
        }
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch organization details: " + error.message,
      });
    }
  };

  const handleSave = async () => {
    let currentOrgId = orgId;
    if (!currentOrgId) {
      // Try to fetch organization details again before showing error
      console.log('Organization ID not found, attempting to fetch again...');
      // We need to call the API directly here to get the ID immediately
      try {
        const response = await fetch('/api/organization-details');
        const result = await response.json();
        if (result.ok && result.rows && result.rows.length > 0) {
          currentOrgId = result.rows[0].id;
          setOrgId(currentOrgId);
        }
      } catch (e) {
        console.error("Error fetching org details in save:", e);
      }

      if (!currentOrgId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Organization ID not found. Please refresh the page and try again.",
        });
        return;
      }
    }

    setLoading(true);

    // Map the form data to match the actual database columns
    const updateData = {
      organization_name: formData.company_name,
      phone_number: formData.contact_number,
      email: formData.email,
      gst_number: formData.tin_gst_number,
      bank_name: formData.bank_name,
      address: formData.bank_address, // Map bank_address to address column
      logo_url: formData.logo_url,
    };

    console.log('Saving organization data:', updateData, 'for ID:', currentOrgId);

    try {
      const response = await fetch(`/api/organization-details/${currentOrgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      const result = await response.json();

      if (!result.ok) {
        console.error('Save error:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to save: ${result.error}`,
        });
      } else {
        console.log('Organization settings saved successfully');
        toast({
          title: "Success",
          description: "Organization details updated successfully.",
        });
        // Refresh the data to show the updated values
        await fetchOrganizationDetails();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save: ${error.message}`,
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization details and configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>TIN/GST Number</Label>
              <Input
                value={formData.tin_gst_number}
                onChange={(e) => setFormData({ ...formData, tin_gst_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Address</Label>
              <Input
                value={formData.bank_address}
                onChange={(e) => setFormData({ ...formData, bank_address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription Start Date</Label>
              <Input
                type="date"
                value={formData.subscription_start_date}
                onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription End Date</Label>
              <Input
                type="date"
                value={formData.subscription_end_date}
                onChange={(e) => setFormData({ ...formData, subscription_end_date: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
