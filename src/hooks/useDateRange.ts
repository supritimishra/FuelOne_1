import { useState, useMemo } from "react";
import { format, subYears, subMonths, subDays } from "date-fns";

export interface DateRangeOptions {
  defaultRangeMonths?: number;
  defaultRangeYears?: number;
  defaultRangeDays?: number;
  maxRangeMonths?: number;
  minRangeDays?: number;
  allowFutureDates?: boolean;
}

export interface DateRangeReturn {
  fromDate: string;
  toDate: string;
  today: string;
  defaultFromDate: string;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  resetToDefault: () => void;
  isValidRange: boolean;
  rangeInDays: number;
  rangeInMonths: number;
  rangeInYears: number;
}

/**
 * Custom hook for managing date ranges with sensible defaults
 * 
 * @param options Configuration options for the date range
 * @returns Date range state and utilities
 * 
 * @example
 * ```typescript
 * // Default 12 months range
 * const { fromDate, toDate, setFromDate, setToDate } = useDateRange();
 * 
 * // Custom 6 months range
 * const { fromDate, toDate } = useDateRange({ defaultRangeMonths: 6 });
 * 
 * // Custom 1 year range
 * const { fromDate, toDate } = useDateRange({ defaultRangeYears: 1 });
 * ```
 */
export function useDateRange(options: DateRangeOptions = {}): DateRangeReturn {
  const {
    defaultRangeMonths = 12,
    defaultRangeYears = 0,
    defaultRangeDays = 0,
    maxRangeMonths = 24,
    minRangeDays = 1,
    allowFutureDates = false
  } = options;

  // Calculate today's date
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  
  // Calculate default from date based on the specified range
  const defaultFromDate = useMemo(() => {
    const date = new Date();
    
    if (defaultRangeYears > 0) {
      return format(subYears(date, defaultRangeYears), "yyyy-MM-dd");
    } else if (defaultRangeMonths > 0) {
      return format(subMonths(date, defaultRangeMonths), "yyyy-MM-dd");
    } else if (defaultRangeDays > 0) {
      return format(subDays(date, defaultRangeDays), "yyyy-MM-dd");
    }
    
    // Fallback to 12 months
    return format(subMonths(date, 12), "yyyy-MM-dd");
  }, [defaultRangeMonths, defaultRangeYears, defaultRangeDays]);

  // State for date range
  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>(today);

  // Calculate range statistics
  const rangeInDays = useMemo(() => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }, [fromDate, toDate]);

  const rangeInMonths = useMemo(() => {
    return Math.round(rangeInDays / 30.44); // Average days per month
  }, [rangeInDays]);

  const rangeInYears = useMemo(() => {
    return Math.round(rangeInDays / 365.25); // Average days per year
  }, [rangeInDays]);

  // Validate date range
  const isValidRange = useMemo(() => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    
    // Check if from date is before to date
    if (from >= to) return false;
    
    // Check if dates are in the future (only if not allowed)
    if (!allowFutureDates && (from > today || to > today)) return false;
    
    // Check maximum range
    if (rangeInMonths > maxRangeMonths) return false;
    
    // Check minimum range
    if (rangeInDays < minRangeDays) return false;
    
    return true;
  }, [fromDate, toDate, rangeInDays, rangeInMonths, maxRangeMonths, minRangeDays, allowFutureDates]);

  // Reset to default range
  const resetToDefault = () => {
    setFromDate(defaultFromDate);
    setToDate(today);
  };

  return {
    fromDate,
    toDate,
    today,
    defaultFromDate,
    setFromDate,
    setToDate,
    resetToDefault,
    isValidRange,
    rangeInDays,
    rangeInMonths,
    rangeInYears,
  };
}

/**
 * Predefined date range configurations for common use cases
 */
export const DATE_RANGE_PRESETS = {
  // Report ranges
  LAST_7_DAYS: { defaultRangeDays: 7 },
  LAST_30_DAYS: { defaultRangeDays: 30 },
  LAST_3_MONTHS: { defaultRangeMonths: 3 },
  LAST_6_MONTHS: { defaultRangeMonths: 6 },
  LAST_12_MONTHS: { defaultRangeMonths: 12 },
  LAST_2_YEARS: { defaultRangeYears: 2, maxRangeMonths: 36, allowFutureDates: true },
  
  // Business ranges
  CURRENT_MONTH: { 
    defaultRangeDays: new Date().getDate() - 1,
    maxRangeMonths: 1 
  },
  CURRENT_YEAR: { 
    defaultRangeDays: Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
    maxRangeMonths: 12 
  },
  
  // Extended ranges
  ALL_TIME: { 
    defaultRangeYears: 10,
    maxRangeMonths: 120 
  }
} as const;

/**
 * Hook for common report date ranges
 */
export function useReportDateRange(preset: keyof typeof DATE_RANGE_PRESETS = 'LAST_12_MONTHS') {
  return useDateRange(DATE_RANGE_PRESETS[preset]);
}

/**
 * Hook for business-specific date ranges
 */
export function useBusinessDateRange() {
  return useDateRange({
    defaultRangeMonths: 12,
    maxRangeMonths: 24,
    minRangeDays: 1
  });
}

/**
 * Hook for short-term analysis (last 30 days)
 */
export function useShortTermDateRange() {
  return useDateRange({
    defaultRangeDays: 30,
    maxRangeMonths: 3,
    minRangeDays: 1
  });
}

/**
 * Hook for long-term analysis (last 2 years)
 */
export function useLongTermDateRange() {
  return useDateRange({
    defaultRangeYears: 2,
    maxRangeMonths: 60,
    minRangeDays: 30
  });
}