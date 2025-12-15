import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { FeatureKey, isFeatureKey } from "@/lib/features";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";

export type FeatureAccessEntry = {
  featureKey: FeatureKey;
  allowed: boolean;
  defaultEnabled: boolean;
};

type FetchResult = {
  features: FeatureAccessEntry[];
  migrationsRun: boolean | null; // null = unknown, false = not run, true = run
};

async function fetchFeatureAccess(): Promise<FetchResult> {
  try {
    // Use timeout to prevent infinite loading (5 second timeout)
    const response = await fetchWithTimeout(
      "/api/features/me",
      { credentials: "include" },
      5000
    );
    
    // Handle network errors and timeouts gracefully
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.warn("[FeatureAccess] API returned non-ok status:", response.status, errorText);
      // Don't throw - return empty array so fail-open logic works
      return { features: [], migrationsRun: null }; // Unknown - fail-open
    }

    let data: FeatureAccessResponse;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.warn("[FeatureAccess] Failed to parse JSON response:", jsonError);
      return { features: [], migrationsRun: null };
    }

    if (!data?.ok) {
      console.warn("Feature access endpoint returned error:", data?.error || "Unknown error");
      // Return empty array instead of throwing - fail-open behavior
      return { features: [], migrationsRun: null };
    }

    const rows = Array.isArray(data?.features) ? data.features : [];
    const migrationsRun = data?.migrationsRun ?? null; // null if not provided (backward compatible)

    // If migrations haven't been run (migrationsRun: false), return empty array to trigger fail-open
    if (migrationsRun === false) {
      console.warn("[FeatureAccess] Migrations not run (migrationsRun=false) - returning empty to trigger fail-open");
      return { features: [], migrationsRun: false };
    }

    if (rows.length === 0 && migrationsRun === true) {
      console.warn("[FeatureAccess] Migrations run but features array is empty - ALL features are disabled for this user");
      // Return empty array - hasFeature() should check migrationsRun and deny access
      return { features: [], migrationsRun: true };
    }

    const mapped = rows
      .map((row: any) => {
        const key = typeof row?.featureKey === "string" ? row.featureKey.toLowerCase() : null;
        if (!key || !isFeatureKey(key)) {
          console.warn(`[FeatureAccess] Invalid feature key:`, row?.featureKey);
          return null;
        }

        // CRITICAL: Use the `allowed` field directly - don't fallback to defaultEnabled
        // The backend already handles the fallback logic
        // IMPORTANT: If 'allowed' property exists (even if false), use it. Don't fallback.
        let allowed: boolean;
        if (row.hasOwnProperty('allowed')) {
          // Explicitly check for false - if allowed is explicitly false, respect it
          allowed = Boolean(row.allowed);
          
          // CRITICAL DEBUG: Log for dashboard to verify we're reading false correctly
          if (key === 'dashboard') {
            console.log(`[FeatureAccess] 🔍 Dashboard parsing: row.allowed=${row.allowed} (type: ${typeof row.allowed}), hasOwnProperty=${row.hasOwnProperty('allowed')}, Boolean(row.allowed)=${Boolean(row.allowed)}, final allowed=${allowed}`);
          }
        } else {
          // Only fallback to defaultEnabled if 'allowed' property doesn't exist
          allowed = Boolean(row.defaultEnabled ?? true);
          if (key === 'dashboard') {
            console.log(`[FeatureAccess] 🔍 Dashboard: NO 'allowed' property, using defaultEnabled=${row.defaultEnabled}, final=${allowed}`);
          }
        }
        
        // Debug log for all features to see what we're getting
        if (key === 'dashboard' || key === 'fuel_products' || key === 'lubricants' || key === 'generated_invoices' || key === 'credit_limit_reports') {
          console.log(`[FeatureAccess] ${key}: row.allowed=${row.allowed}, row.hasOwnProperty('allowed')=${row.hasOwnProperty('allowed')}, defaultEnabled=${row.defaultEnabled}, final=${allowed}`);
        }

        return {
          featureKey: key,
          allowed,
          defaultEnabled: Boolean(row?.defaultEnabled ?? true),
        } as FeatureAccessEntry;
      })
      .filter((entry): entry is FeatureAccessEntry => entry !== null);

            console.log(`[FeatureAccess] ========== FETCHED FEATURE ACCESS ==========`);
            console.log(`[FeatureAccess] Loaded ${mapped.length} features (migrationsRun: ${migrationsRun})`);
            if (mapped.length > 0) {
              const enabledCount = mapped.filter(f => f.allowed).length;
              const disabledCount = mapped.length - enabledCount;
              console.log(`[FeatureAccess] Summary: ${enabledCount} enabled, ${disabledCount} disabled`);
              
              // CRITICAL: Log if all features are disabled
              if (enabledCount === 0) {
                console.error(`[FeatureAccess] ⚠️⚠️⚠️ CRITICAL: ALL FEATURES ARE DISABLED! ⚠️⚠️⚠️`);
                console.error(`[FeatureAccess] This means the API returned all features with allowed=false`);
                console.error(`[FeatureAccess] Raw API rows count: ${rows.length}`);
                console.error(`[FeatureAccess] Checking raw API response for dashboard...`);
                const dashboardRaw = rows.find((r: any) => r.featureKey?.toLowerCase() === 'dashboard');
                if (dashboardRaw) {
                  console.error(`[FeatureAccess] Dashboard in raw response:`, { featureKey: dashboardRaw.featureKey, allowed: dashboardRaw.allowed, allowedType: typeof dashboardRaw.allowed, hasAllowed: dashboardRaw.hasOwnProperty('allowed') });
                }
              }
              
              // Check dashboard specifically
              const dashboardEntry = mapped.find(f => f.featureKey === 'dashboard');
              if (dashboardEntry) {
                console.log(`[FeatureAccess] 🔍 Dashboard status: allowed=${dashboardEntry.allowed}, defaultEnabled=${dashboardEntry.defaultEnabled}`);
              } else {
                console.warn(`[FeatureAccess] ⚠️ Dashboard NOT FOUND in mapped features!`);
              }
              
              // Log first 10 features for debugging
              const firstFew = mapped.slice(0, 10);
              console.log(`[FeatureAccess] First 10 features:`, firstFew.map(f => ({ key: f.featureKey, allowed: f.allowed })));
            } else {
              console.warn(`[FeatureAccess] WARNING: Mapped features array is empty! This could mean migrations not run or all features disabled.`);
            }
            console.log(`[FeatureAccess] Raw API response (first 5 rows):`, rows.slice(0, 5).map((r: any) => ({ featureKey: r.featureKey, allowed: r.allowed, hasAllowed: r.hasOwnProperty('allowed') })));
            console.log(`[FeatureAccess] Full raw API response count: ${rows.length} rows`);
            console.log(`[FeatureAccess] ==========================================`);
           return { features: mapped, migrationsRun: migrationsRun ?? true }; // If null, assume true (migrations run)
         } catch (error: any) {
           // Handle timeout and network errors gracefully
           const errorMsg = String(error?.message || error || 'Unknown error');
           if (errorMsg.includes('timeout') || errorMsg.includes('AbortError') || errorMsg.includes('Failed to fetch')) {
             console.warn("[FeatureAccess] Request timeout or network error - using fail-open (allowing all features):", errorMsg);
             // Return empty array to trigger fail-open behavior instead of throwing
             return { features: [], migrationsRun: null }; // Unknown - fail-open
           }
           console.error("Failed to fetch feature access:", error);
           // For other errors, return empty array (fail-open) instead of throwing
           return { features: [], migrationsRun: null };
         }
       }

export function useFeatureAccess() {
  const query = useQuery({
    queryKey: ["feature-access", "v1"],
    queryFn: fetchFeatureAccess,
    staleTime: 0, // Never consider data fresh - always refetch to catch Developer Mode changes immediately
    refetchOnWindowFocus: true, // Refetch when window gains focus to catch Developer Mode changes
    retry: false,
    retryOnMount: true, // Re-enable to get fresh data on mount (user might have just logged in or switched)
    // Fail fast - don't block UI for too long
    gcTime: 30 * 1000, // Keep in cache for only 30 seconds (reduced from 2 minutes)
    refetchOnReconnect: true, // Re-enable to catch changes after network reconnect
    // Refetch on mount to ensure fresh data
    refetchOnMount: true,
    // Don't throw errors - handle them gracefully
    throwOnError: false,
  });

  // Extract features and migrationsRun from query data
  const featuresData = query.data;
  const features = featuresData?.features ?? [];
  const migrationsRun = featuresData?.migrationsRun ?? null;

  const featureMap = useMemo(() => {
    if (!features || features.length === 0) return new Map<FeatureKey, FeatureAccessEntry>();
    return new Map(features.map((entry) => [entry.featureKey, entry] as const));
  }, [features]);

  const hasFeature = useCallback(
    (featureKey: FeatureKey) => {
      // If still loading, allow temporarily to prevent blank screens
      if (query.isLoading) {
        return true;
      }
      
      // If there's an error AND no data loaded, fail-open (system not configured)
      // But if we have data loaded, even if there was an error, respect permissions
      if (query.isError && (!features || features.length === 0)) {
        console.warn(`[FeatureAccess] Error loading features (no data), allowing access to ${featureKey} (fail-open)`);
        return true;
      }
      
      // If feature catalog is empty, check if migrations were run
      // If migrations NOT run (migrationsRun: false) = fail-open (backward compatible)
      // If migrations WERE run but array is empty (migrationsRun: true) = ALL features disabled = deny access
      if (!query.isError && (!features || features.length === 0)) {
        if (migrationsRun === false) {
          // Migrations not run - fail-open (show all features)
          console.warn(`[FeatureAccess] Migrations not run - allowing access to ${featureKey} (fail-open)`);
          return true;
        }
        if (migrationsRun === true) {
          // Migrations run but no features = ALL features disabled - deny access
          console.warn(`[FeatureAccess] Migrations run but empty features - ALL features disabled, denying access to ${featureKey}`);
          return false;
        }
        // migrationsRun is null (unknown) - fail-open for backward compatibility
        console.warn(`[FeatureAccess] Empty catalog, migrationsRun unknown - allowing access to ${featureKey} (fail-open)`);
        return true;
      }
      
      // If we have a feature catalog loaded (even after an error), check the specific feature
      // This is the critical path - if admin disabled features, this should return false
      const entry = featureMap.get(featureKey);
      if (!entry) {
        // Feature not in catalog = feature doesn't exist = deny access
        console.warn(`[FeatureAccess] Feature ${featureKey} not found in catalog, denying access`);
        return false;
      }
      
      // Feature exists in catalog - STRICTLY respect the allowed flag
      // If allowed is false (admin disabled it), return false
      const hasAccess = Boolean(entry.allowed);
      if (!hasAccess) {
        console.log(`[FeatureAccess] Feature ${featureKey} is DISABLED (allowed=false) - denying access`);
      } else {
        console.log(`[FeatureAccess] Feature ${featureKey} is ENABLED (allowed=true) - allowing access`);
      }
      return hasAccess;
    },
    [featureMap, query.isError, query.isLoading, features, migrationsRun]
  );

  return {
    features,
    hasFeature,
    isLoading: query.isLoading,
    isError: query.isError,
    migrationsRun, // Expose migrationsRun flag
    refetch: query.refetch,
  };
}

