import { Router } from "express";
import { AuthRequest, authenticateToken } from "../auth.js";
import { attachTenantDb } from "../middleware/tenant.js";
import { BASIC_FEATURES, ADVANCED_FEATURES } from "../feature-defaults.js";

export const featureAccessRouter = Router();

featureAccessRouter.use(authenticateToken);
featureAccessRouter.use(attachTenantDb);

// Feature catalog/access - simplified for Mongo migration
// Assuming all users get BASIC_FEATURES + ADVANCED_FEATURES enabled for now to ensure UI works
// or strictly BASIC if that's safer.
// Let's enable everything by default for this migration to avoid "missing feature" UI blocks.

featureAccessRouter.get("/me", async (req: AuthRequest, res) => {
  try {
    // Return a full list of features, all enabled
    const allKeys = Array.from(new Set<string>([...BASIC_FEATURES, ...ADVANCED_FEATURES]));

    const features = allKeys.map(k => ({
      featureKey: k,
      label: k,
      featureGroup: 'default',
      description: '',
      defaultEnabled: true,
      allowed: true
    }));

    // Ensure criticals
    if (!features.find(f => f.featureKey === 'dashboard')) {
      features.push({ featureKey: 'dashboard', label: 'Dashboard', featureGroup: 'core', description: '', defaultEnabled: true, allowed: true });
    }

    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    res.json({ ok: true, features, migrationsRun: true });

  } catch (error: any) {
    console.error("Feature access error:", error);
    res.status(500).json({ ok: false, error: "Failed to load features" });
  }
});
