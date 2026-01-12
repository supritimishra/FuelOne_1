import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureKey } from "@/lib/features";
import NoAccess from "@/pages/NoAccess";

interface FeatureGateProps {
  featureKey: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ featureKey, children, fallback }: FeatureGateProps) {
  const { hasFeature, isLoading, isError, features } = useFeatureAccess();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // Set timeout to stop loading after 1.5 seconds (reduced from 3s)
  React.useEffect(() => {
    if (isLoading && features.length === 0) {
      const timer = setTimeout(() => setLoadingTimeout(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Reset timeout if loading completes
      setLoadingTimeout(false);
    }
  }, [isLoading, features.length]);

  // If there's an error, fail-open immediately (don't wait)
  if (isError) {
    console.warn(`[FeatureGate] Feature access error, allowing access to ${featureKey} (fail-open)`);
    return <>{children}</>;
  }

  // Show loading only very briefly to prevent blank pages
  if (isLoading && features.length === 0 && !loadingTimeout) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // If we have features loaded, check access
  if (!isLoading && features.length > 0) {
    // Check if user has any enabled features
    const enabledFeatures = features.filter(f => f.allowed);
    
    // If user has NO enabled features at all, show NoAccess page (prevents redirect loop)
    if (enabledFeatures.length === 0) {
      console.log(`[FeatureGate] User has no enabled features (${features.length} total) - showing NoAccess page`);
      return <NoAccess />;
    }
    
    // Check if user has access to THIS specific feature
    const hasAccess = hasFeature(featureKey);
    
    if (!hasAccess) {
      // Feature is explicitly disabled - block access
      console.log(`[FeatureGate] Blocking access to ${featureKey} - feature is disabled`);
      return fallback ?? <Navigate to="/no-access" replace />;
    }
  }

  // Allow access if: features empty (fail-open), or feature is enabled
  // This handles the case where migrations haven't run or API returns empty array
  return <>{children}</>;
}

