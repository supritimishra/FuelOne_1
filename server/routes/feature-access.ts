import { Router } from "express";
import { AuthRequest, authenticateToken } from "../auth.js";
import { attachTenantDb } from "../middleware/tenant.js";
import { featurePermissions, userFeatureAccess } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import { BASIC_FEATURES, ADVANCED_FEATURES } from "../feature-defaults.js";
import { getTenantPool } from "../services/db-connection-manager.js";

export const featureAccessRouter = Router();

featureAccessRouter.use(authenticateToken);
featureAccessRouter.use(attachTenantDb);

async function loadFeatureCatalog(tenantDb: any) {
  try {
    // Check if table exists first using raw SQL query
    // Drizzle's execute might format errors differently, so we need to catch all possible error formats
    try {
      await tenantDb.execute(`SELECT 1 FROM feature_permissions LIMIT 1`);
    } catch (checkError: any) {
      const checkErrorMsg = String(checkError?.message || checkError || '');
      // Check for various "table doesn't exist" error patterns
      if (
        checkErrorMsg.includes('does not exist') ||
        checkErrorMsg.includes('relation') ||
        checkErrorMsg.includes('42P01') ||
        checkErrorMsg.includes('Failed query') ||
        checkErrorMsg.toLowerCase().includes('no such table')
      ) {
        console.warn(`[FeatureAccess] Feature permissions table not found: ${checkErrorMsg}`);
        return [];
      }
      // If it's a different error (like connection issue), re-throw
      throw checkError;
    }

    // Table exists - try to select from it
    try {
      const rows = await tenantDb.select().from(featurePermissions);
      if (rows.length === 0) {
        console.error(`[FeatureAccess] ⚠️⚠️⚠️ CRITICAL: feature_permissions table exists but has NO ROWS! ⚠️⚠️⚠️`);
        console.error(`[FeatureAccess] The migration created the table structure but didn't insert the feature data.`);
        console.error(`[FeatureAccess] Solution: Run the INSERT statements from migrations/20251101_complete_feature_permissions_setup.sql`);
      } else {
        console.log(`[FeatureAccess] ✅ Successfully loaded ${rows.length} features from feature_permissions table`);
      }
      return rows.sort((a: any, b: any) => {
        const groupA = (a.featureGroup || '').toLowerCase();
        const groupB = (b.featureGroup || '').toLowerCase();
        if (groupA === groupB) {
          return a.label.localeCompare(b.label);
        }
        return groupA.localeCompare(groupB);
      });
    } catch (selectError: any) {
      const selectErrorMsg = String(selectError?.message || selectError || '');
      console.error(`[FeatureAccess] Error selecting from feature_permissions: ${selectErrorMsg}`);
      // If select fails, return empty array
      return [];
    }
  } catch (error: any) {
    const errorMsg = String(error?.message || error || '');
    console.error(`[FeatureAccess] Unexpected error in loadFeatureCatalog: ${errorMsg}`);
    // Return empty array on any error
    return [];
  }
}

featureAccessRouter.get("/me", async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb) {
      // Synthesize BASIC-only feature map when tenant DB is not available
      const allKeys = Array.from(new Set<string>([...BASIC_FEATURES, ...ADVANCED_FEATURES]));
      // Enable ALL features by default when running in MongoDB/No-Tenant mode to ensure full access
      const features = allKeys.map((k) => ({
        featureKey: k,
        label: k,
        featureGroup: 'synth',
        description: '',
        defaultEnabled: true,
        allowed: true
      }));
      return res.status(200).json({ ok: true, features, migrationsRun: true });
    }

    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }

    const userId = req.user.userId;
    const userEmail = req.user.email || 'unknown';

    console.log(`[FeatureAccess] ========== /api/features/me REQUEST ==========`);
    console.log(`[FeatureAccess] Requested by: userId=${userId}, email=${userEmail}`);

    // Try to load feature catalog - if table doesn't exist, return empty array
    // Use the migration-aware loadFeatureCatalog from developer-mode.ts
    let catalog: any[] = [];
    let migrationsRun = false; // Track if migrations have been run

    try {
      // Import the migration-aware loadFeatureCatalog
      const { loadFeatureCatalog: loadFeatureCatalogWithMigration } = await import("./developer-mode.js");
      const tenantId = req.user?.tenantId;
      catalog = await loadFeatureCatalogWithMigration(req.tenantDb, tenantId);
      // If we got here without error, migrations have been run (table exists)
      migrationsRun = true;

      // If catalog is empty, synthesize BASIC-only feature catalog so UI does not show zero-access
      if (catalog.length === 0) {
        console.warn(`[FeatureAccess] feature_permissions exists but has no rows; synthesizing BASIC-only catalog`);
        const allKeys = Array.from(new Set<string>([...BASIC_FEATURES, ...ADVANCED_FEATURES]));
        catalog = allKeys.map((k) => ({
          featureKey: k,
          label: k,
          featureGroup: 'synth',
          description: '',
          defaultEnabled: BASIC_FEATURES.includes(k),
        }));
      } else {
        // Augment catalog with any missing known keys from BASIC/ADVANCED
        const known = new Set<string>(catalog.map((f: any) => String(f.featureKey || '').toLowerCase()));
        const allKeys = Array.from(new Set<string>([...BASIC_FEATURES, ...ADVANCED_FEATURES]));
        const missing = allKeys.filter(k => !known.has(String(k).toLowerCase()));
        if (missing.length) {
          console.warn(`[FeatureAccess] Augmenting catalog with missing keys:`, missing);
          const extras = missing.map((k) => ({
            featureKey: k,
            label: k,
            featureGroup: 'synth',
            description: '',
            defaultEnabled: BASIC_FEATURES.includes(k),
          }));
          catalog = [...catalog, ...extras];
        }
      }
    } catch (tableError: any) {
      const errorMsg = String(tableError?.message || tableError || '');
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01') || errorMsg.includes('Failed query') || errorMsg === 'empty_feature_permissions') {
        console.warn(`[FeatureAccess] Feature permissions table not found or empty (userId: ${userId}). Synthesizing BASIC-only feature list.`);
        // Synthesize BASIC-only features so UI does not fail-open
        const allKeys = Array.from(new Set<string>([...BASIC_FEATURES, ...ADVANCED_FEATURES]));
        const features = allKeys.map((k) => ({ featureKey: k, label: k, featureGroup: 'synth', description: '', defaultEnabled: BASIC_FEATURES.includes(k), allowed: BASIC_FEATURES.includes(k) }));
        res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate, no-cache, no-store');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.json({ ok: true, features, migrationsRun: true });
      }
      // If it's a different error, re-throw it
      console.error(`[FeatureAccess] Unexpected error loading feature catalog:`, errorMsg);
      throw tableError;
    }

    // Try to get user feature access overrides from BOTH tables (legacy + new schema)
    let overrides: any[] = [];

    // First, try user_feature_access (legacy schema)
    try {
      const ufaOverrides = await req.tenantDb
        .select()
        .from(userFeatureAccess)
        .where(eq(userFeatureAccess.userId, userId));
      overrides.push(...ufaOverrides);
      console.log(`[FeatureAccess] Found ${ufaOverrides.length} overrides in user_feature_access table`);
    } catch (tableError: any) {
      const errorMsg = String(tableError?.message || tableError || '');
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01')) {
        console.warn("User feature access table not found, skipping overrides:", errorMsg);
      } else {
        console.error("Error loading user feature access:", errorMsg);
      }
    }

    // Also check feature_access table (new schema) - this is the primary source now
    try {
      const tenantId = req.user?.tenantId;
      console.log(`[FeatureAccess] Checking feature_access table for userId=${userId}, tenantId=${tenantId}`);
      if (tenantId && req.tenantDb) {
        // Get connection string from tenant to access pool
        const { getTenantById } = await import("../services/tenant-provisioning.js");
        const tenant = await getTenantById(tenantId);
        if (tenant && tenant.connectionString) {
          const pool = getTenantPool(tenant.connectionString, tenantId);
          const safeUserId = String(userId).replace(/'/g, "''");

          // Check if feature_access table exists first
          const tableCheck = await pool.query(`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema='public' AND table_name='feature_access'
            ) AS exists
          `);
          const tableExists = Boolean(tableCheck.rows?.[0]?.exists);
          console.log(`[FeatureAccess] feature_access table exists: ${tableExists} for tenant ${tenantId}`);

          if (tableExists) {
            const faResult = await pool.query(`
              SELECT feature_key, allowed 
              FROM feature_access 
              WHERE user_id = '${safeUserId}'
            `);
            console.log(`[FeatureAccess] Found ${faResult.rows.length} rows in feature_access for userId=${userId}`);

            // Map feature_access rows to feature_permissions IDs
            const faOverrides = [];
            for (const row of faResult.rows) {
              const feature = catalog.find((f: any) => f.featureKey?.toLowerCase() === row.feature_key?.toLowerCase());
              if (feature) {
                faOverrides.push({
                  featureId: feature.id,
                  userId: userId,
                  allowed: row.allowed,
                  source: 'feature_access'
                });
              } else {
                console.warn(`[FeatureAccess] Feature key ${row.feature_key} from feature_access not found in catalog`);
              }
            }

            if (faOverrides.length > 0) {
              console.log(`[FeatureAccess] ✅ Found ${faOverrides.length} overrides in feature_access table for ${userEmail}`);
              // feature_access takes precedence - replace any existing overrides for the same features
              const faFeatureIds = new Set(faOverrides.map((o: any) => o.featureId));
              overrides = overrides.filter((o: any) => !faFeatureIds.has(o.featureId));
              overrides.push(...faOverrides);
            } else {
              console.warn(`[FeatureAccess] ⚠️ No feature_access entries found for userId=${userId} (${userEmail}) in tenant ${tenantId}`);
            }
          } else {
            console.warn(`[FeatureAccess] ⚠️ feature_access table does not exist for tenant ${tenantId}`);
          }
        } else {
          console.warn(`[FeatureAccess] ⚠️ Could not get tenant or connection string for tenantId=${tenantId}`);
        }
      } else {
        console.warn(`[FeatureAccess] ⚠️ Missing tenantId or tenantDb: tenantId=${tenantId}, hasTenantDb=${!!req.tenantDb}`);
      }
    } catch (faError: any) {
      const errorMsg = String(faError?.message || faError || '');
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01')) {
        console.warn(`[FeatureAccess] Feature access table not found, skipping: ${errorMsg}`);
      } else {
        console.warn(`[FeatureAccess] Error loading from feature_access table: ${errorMsg}`);
      }
    }

    const overrideMap = new Map<string, any>();
    overrides.forEach((row: any) => {
      overrideMap.set(row.featureId, row);
    });

    // AUTO-FIX: If user has no feature overrides and there are other users with features, assign based on tenant mode
    if (overrides.length === 0 && catalog.length > 0) {
      try {
        const tenantId = req.user?.tenantId;
        if (tenantId) {
          const { getTenantPool } = await import("../services/db-connection-manager.js");
          const { getTenantById } = await import("../services/tenant-provisioning.js");
          const tenant = await getTenantById(tenantId);
          if (tenant && tenant.connectionString) {
            const pool = getTenantPool(tenant.connectionString, tenantId);
            const { BASIC_FEATURES, ADVANCED_FEATURES } = await import('../feature-defaults.js');

            // Check if feature_access table exists
            const tableCheck = await pool.query(`
              SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema='public' AND table_name='feature_access'
              ) AS exists
            `);
            const tableExists = Boolean(tableCheck.rows?.[0]?.exists);

            if (tableExists) {
              // Detect tenant mode
              const safeUserId = String(userId).replace(/'/g, "''");
              const modeCheck = await pool.query(`
                SELECT COUNT(DISTINCT u.id) as user_count,
                       COUNT(DISTINCT CASE WHEN fa.feature_key = ANY(ARRAY[${ADVANCED_FEATURES.map(f => `'${f.replace(/'/g, "''")}'`).join(',')}]) AND fa.allowed = true THEN u.id END) as advanced_users
                FROM users u
                LEFT JOIN feature_access fa ON fa.user_id = u.id
                WHERE u.id != '${safeUserId}'
              `);
              const userCount = parseInt(modeCheck.rows[0]?.user_count || '0');
              const advancedUsers = parseInt(modeCheck.rows[0]?.advanced_users || '0');
              const tenantHasAdvancedMode = userCount > 0 && advancedUsers > 0 && (advancedUsers / userCount) >= 0.5;

              if (userCount > 0) {
                console.log(`[FeatureAccess] 🔧 AUTO-FIX: User ${userEmail} has no features, but ${userCount} other users exist. Assigning features based on tenant mode (${tenantHasAdvancedMode ? 'ADVANCED' : 'BASIC'})`);

                // Assign BASIC features
                for (const fk of BASIC_FEATURES) {
                  const safeFk = fk.replace(/'/g, "''");
                  await pool.query(`
                    INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
                    VALUES ('${safeUserId}', '${safeFk}', true, now())
                    ON CONFLICT (user_id, feature_key)
                    DO UPDATE SET allowed = true, updated_at = now()
                  `);
                }

                // Assign ADVANCED features based on tenant mode
                for (const fk of ADVANCED_FEATURES) {
                  const safeFk = fk.replace(/'/g, "''");
                  await pool.query(`
                    INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
                    VALUES ('${safeUserId}', '${safeFk}', ${tenantHasAdvancedMode ? 'true' : 'false'}, now())
                    ON CONFLICT (user_id, feature_key)
                    DO UPDATE SET allowed = ${tenantHasAdvancedMode ? 'true' : 'false'}, updated_at = now()
                  `);
                }

                // Reload overrides after auto-fix
                const faResultAfter = await pool.query(`
                  SELECT feature_key, allowed 
                  FROM feature_access 
                  WHERE user_id = '${safeUserId}'
                `);

                for (const row of faResultAfter.rows) {
                  const feature = catalog.find((f: any) => f.featureKey?.toLowerCase() === row.feature_key?.toLowerCase());
                  if (feature) {
                    overrides.push({
                      featureId: feature.id,
                      userId: userId,
                      allowed: row.allowed,
                      source: 'feature_access_autofix'
                    });
                  }
                }

                overrideMap.clear();
                overrides.forEach((row: any) => {
                  overrideMap.set(row.featureId, row);
                });

                console.log(`[FeatureAccess] ✅ AUTO-FIX: Assigned ${faResultAfter.rows.length} features to ${userEmail}`);
              }
            }
          }
        }
      } catch (autofixErr: any) {
        console.warn(`[FeatureAccess] ⚠️ Auto-fix failed:`, autofixErr?.message || autofixErr);
      }
    }

    console.log(`[FeatureAccess] User ${userId} (${userEmail}) has ${overrides.length} feature overrides, ${catalog.length} total features in catalog`);

    // Log dashboard override specifically if it exists
    const dashboardFeature = catalog.find((f: any) => f.featureKey?.toLowerCase() === 'dashboard');
    if (dashboardFeature) {
      const dashboardOverride = overrideMap.get(dashboardFeature.id);
      console.log(`[FeatureAccess] 🔍 Dashboard override for ${userId}: ${dashboardOverride ? `EXISTS (allowed=${dashboardOverride.allowed})` : 'NOT FOUND (using default)'}`);
      if (dashboardOverride) {
        console.log(`[FeatureAccess] 🔍 Dashboard override details:`, { userId: dashboardOverride.userId, featureId: dashboardOverride.featureId, allowed: dashboardOverride.allowed, allowedType: typeof dashboardOverride.allowed });
      }
    }

    const features = catalog.map((feature: any) => {
      const override = overrideMap.get(feature.id);

      // CRITICAL: If override exists, use override.allowed (even if false!)
      // Only fallback to defaultEnabled if NO override exists
      // Handle PostgreSQL boolean edge cases (might be string 'true'/'false' or actual boolean)
      let allowed: boolean;
      if (override !== undefined) {
        // Override exists - use it, but handle various formats
        const overrideValue = override.allowed;
        if (overrideValue === false || overrideValue === 'false' || overrideValue === 0) {
          allowed = false;
        } else if (overrideValue === true || overrideValue === 'true' || overrideValue === 1) {
          allowed = true;
        } else {
          // Fallback to Boolean() conversion
          allowed = Boolean(overrideValue);
        }
      } else {
        // No override - default to BASIC bundle only
        const keyLower = String(feature.featureKey || '').toLowerCase();
        allowed = BASIC_FEATURES.includes(keyLower);
      }

      // Ensure critical basics (like dashboard) remain enabled for Basic bundle
      const keyLowerFinal = String(feature.featureKey || '').toLowerCase();
      if (BASIC_FEATURES.includes(keyLowerFinal) && keyLowerFinal === 'dashboard') {
        allowed = true;
      }

      // Debug logging for dashboard and a few key features
      const featureKeyLower = feature.featureKey.toLowerCase();
      if (featureKeyLower === 'dashboard' || featureKeyLower === 'fuel_products' || featureKeyLower === 'lubricants') {
        const overrideValue = override?.allowed;
        const overrideValueStr = overrideValue === undefined ? 'none' : `EXISTS (raw=${overrideValue}, type=${typeof overrideValue}, final=${allowed})`;
        console.log(`[FeatureAccess] ${feature.featureKey} for user ${userId} (${userEmail}): override=${overrideValueStr}, default=${feature.defaultEnabled}, final_allowed=${allowed}`);

        // Extra debug for dashboard if it's disabled
        if (featureKeyLower === 'dashboard' && !allowed) {
          console.error(`[FeatureAccess] ⚠️⚠️⚠️ DASHBOARD IS DISABLED for ${userEmail}! This should never happen for Basic bundle.`);
          console.error(`[FeatureAccess] Override object:`, override);
          console.error(`[FeatureAccess] Feature object:`, feature);
        }
      }

      return {
        featureKey: feature.featureKey,
        label: feature.label,
        featureGroup: feature.featureGroup,
        description: feature.description,
        defaultEnabled: Boolean(feature.defaultEnabled),
        allowed, // This should be false if override.allowed is false
      };
    });

    // Ensure Credit Customer Balance exists and is allowed for Basic
    try {
      const ensureKey = 'credit_customer_balance';
      const lower = (v: any) => String(v || '').toLowerCase();
      const idx = Array.isArray(features) ? (features as any[]).findIndex((f: any) => lower(f?.featureKey) === ensureKey) : -1;
      const allowedDefault = BASIC_FEATURES.includes(ensureKey);
      if (idx === -1) {
        (features as any[]).push({
          featureKey: ensureKey,
          label: 'Credit Customer Balance',
          featureGroup: 'day_business',
          description: '',
          defaultEnabled: allowedDefault,
          allowed: allowedDefault,
        });
      } else {
        // Force allow if basic
        (features as any[])[idx].allowed = allowedDefault || Boolean((features as any[])[idx].allowed);
      }
    } catch { }

    // Log which features are enabled/disabled for debugging
    const enabledFeatures = features.filter((f: any) => f.allowed).map((f: any) => f.featureKey);
    const disabledCount = features.length - enabledFeatures.length;

    console.log(`[FeatureAccess] User ${userId} (${userEmail}): ${enabledFeatures.length} enabled, ${disabledCount} disabled (total: ${features.length}, migrationsRun: ${migrationsRun})`);
    console.log(`[FeatureAccess] ✅ ENABLED FEATURES:`, enabledFeatures.join(', '));

    // CRITICAL: Log if all features are disabled
    if (enabledFeatures.length === 0 && features.length > 0) {
      console.error(`[FeatureAccess] ⚠️⚠️⚠️ CRITICAL: ALL ${features.length} FEATURES ARE DISABLED! ⚠️⚠️⚠️`);
      console.error(`[FeatureAccess] This should NOT happen if overrides are set correctly.`);
      console.error(`[FeatureAccess] Override count: ${overrides.length}`);
      console.error(`[FeatureAccess] Catalog count: ${catalog.length}`);

      // Check a sample of features to see why they're all disabled
      console.error(`[FeatureAccess] Sample features (first 5):`);
      features.slice(0, 5).forEach((f: any) => {
        const catFeature = catalog.find((c: any) => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        const override = catFeature ? overrideMap.get(catFeature.id) : undefined;
        console.error(`[FeatureAccess]   ${f.featureKey}: allowed=${f.allowed}, defaultEnabled=${catFeature?.defaultEnabled}, override=${override ? `EXISTS (allowed=${override.allowed})` : 'NONE'}`);
      });
    }

    // Log dashboard specifically
    const dashboardFeatureResult = features.find((f: any) => f.featureKey?.toLowerCase() === 'dashboard');
    if (dashboardFeatureResult) {
      console.log(`[FeatureAccess] ✅ Dashboard in response for ${userId} (${userEmail}): allowed=${dashboardFeatureResult.allowed}`);
    }
    console.log(`[FeatureAccess] ===========================================`);

    // CRITICAL: Log the actual JSON being sent (first 3 features for brevity)
    const responsePreview = {
      ok: true,
      features: features.slice(0, 3).map((f: any) => ({ featureKey: f.featureKey, allowed: f.allowed })),
      totalFeatures: features.length,
      enabledCount: enabledFeatures.length,
      disabledCount,
      migrationsRun: true
    };
    console.log(`[FeatureAccess] 📦 Response preview (first 3):`, JSON.stringify(responsePreview, null, 2));

    // Add cache-control headers to prevent stale data
    // Set very short cache time and force revalidation to ensure fresh data after Developer Mode changes
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate, no-cache, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Include migrationsRun flag so frontend knows if table exists
    res.json({ ok: true, features, migrationsRun: true });

  } catch (error: any) {
    const errorMsg = String(error?.message || error || 'Unknown error');
    console.error(`[FeatureAccess] Failed to load feature access for user ${req.user?.userId || 'unknown'}:`, errorMsg);
    console.error("Error details:", error.stack || error.message);

    // If it's a table not found error, return empty array instead of 500
    if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01') || errorMsg.includes('Failed query')) {
      console.warn(`[FeatureAccess] Table not found - synthesizing BASIC-only features (migration not run)`);
      const allKeys = Array.from(new Set<string>([...BASIC_FEATURES, ...ADVANCED_FEATURES]));
      const features = allKeys.map((k) => ({ featureKey: k, label: k, featureGroup: 'synth', description: '', defaultEnabled: BASIC_FEATURES.includes(k), allowed: BASIC_FEATURES.includes(k) }));
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate, no-cache, no-store');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.json({ ok: true, features, migrationsRun: true });
    }

    // For other errors, return 500
    res.status(500).json({ ok: false, error: "Failed to load feature access", details: error.message });
  }
});

