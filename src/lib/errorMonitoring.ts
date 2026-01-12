/**
 * Error Monitoring and Logging System
 * 
 * This module provides comprehensive error monitoring, logging, and analytics
 * for the PetroPal application.
 */

import React from 'react';
import { ErrorInfo, ErrorContext } from './errorHandler';

export interface ErrorLog {
  id: string;
  timestamp: Date;
  error: ErrorInfo;
  context: ErrorContext;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByOperation: Record<string, number>;
  recentErrors: ErrorLog[];
  errorTrends: Array<{
    date: string;
    count: number;
    severity: string;
  }>;
}

class ErrorMonitoringService {
  private errorLogs: ErrorLog[] = [];
  private maxLogs: number = 1000; // Keep last 1000 errors in memory
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        name: 'UnhandledPromiseRejection'
      }, {
        operation: 'Global Promise Rejection',
        component: 'Global',
        timestamp: new Date()
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        name: event.error?.name || 'Error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, {
        operation: 'Global JavaScript Error',
        component: 'Global',
        timestamp: new Date()
      });
    });
  }

  /**
   * Log an error with full context
   */
  logError(
    error: any,
    context: string | ErrorContext = 'Unknown Operation',
    additionalData?: Record<string, any>
  ): void {
    const errorContext: ErrorContext = typeof context === 'string' 
      ? { operation: context, timestamp: new Date() }
      : { ...context, timestamp: context.timestamp || new Date() };

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error: this.parseError(error),
      context: errorContext,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      additionalData
    };

    // Add to logs
    this.errorLogs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Logged: ${errorLog.error.title}`);
      console.error('Error:', errorLog.error);
      console.log('Context:', errorLog.context);
      console.log('Additional Data:', errorLog.additionalData);
      console.log('Timestamp:', errorLog.timestamp.toISOString());
      console.groupEnd();
    }

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorLog);
    }

    // Store in localStorage for persistence
    this.persistErrorLog(errorLog);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseError(error: any): ErrorInfo {
    // Basic error parsing - in a real implementation, this would use the errorHandler
    return {
      title: error.name || 'Error',
      description: error.message || 'An unexpected error occurred',
      severity: 'medium',
      category: 'system',
      retryable: false
    };
  }

  private sendToExternalService(errorLog: ErrorLog): void {
    // In production, send to external monitoring service
    // Examples: Sentry, LogRocket, Bugsnag, or custom endpoint
    
    // Example with fetch:
    // fetch('/api/error-logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // }).catch(() => {
    //   // Silently fail if external service is down
    // });
  }

  private persistErrorLog(errorLog: ErrorLog): void {
    try {
      const existingLogs = this.getPersistedLogs();
      existingLogs.unshift(errorLog);
      
      // Keep only last 100 errors in localStorage
      const limitedLogs = existingLogs.slice(0, 100);
      
      localStorage.setItem('petropal_error_logs', JSON.stringify(limitedLogs));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  private getPersistedLogs(): ErrorLog[] {
    try {
      const logs = localStorage.getItem('petropal_error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics(): ErrorAnalytics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errorLogs.filter(log => 
      log.timestamp >= last24Hours
    );

    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByOperation: Record<string, number> = {};

    recentErrors.forEach(log => {
      // Count by category
      errorsByCategory[log.error.category] = (errorsByCategory[log.error.category] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[log.error.severity] = (errorsBySeverity[log.error.severity] || 0) + 1;
      
      // Count by operation
      errorsByOperation[log.context.operation] = (errorsByOperation[log.context.operation] || 0) + 1;
    });

    // Generate error trends (last 7 days)
    const errorTrends = this.generateErrorTrends();

    return {
      totalErrors: recentErrors.length,
      errorsByCategory,
      errorsBySeverity,
      errorsByOperation,
      recentErrors: recentErrors.slice(0, 10), // Last 10 errors
      errorTrends
    };
  }

  private generateErrorTrends(): Array<{ date: string; count: number; severity: string }> {
    const trends: Array<{ date: string; count: number; severity: string }> = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayErrors = this.errorLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toISOString().split('T')[0] === dateStr;
      });

      const severityCounts: Record<string, number> = {};
      dayErrors.forEach(log => {
        severityCounts[log.error.severity] = (severityCounts[log.error.severity] || 0) + 1;
      });

      Object.entries(severityCounts).forEach(([severity, count]) => {
        trends.push({ date: dateStr, count, severity });
      });
    }

    return trends;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 20): ErrorLog[] {
    return this.errorLogs.slice(0, limit);
  }

  /**
   * Clear error logs
   */
  clearLogs(): void {
    this.errorLogs = [];
    localStorage.removeItem('petropal_error_logs');
  }

  /**
   * Export error logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      logs: this.errorLogs,
      analytics: this.getErrorAnalytics()
    }, null, 2);
  }

  /**
   * Check if there are critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errorLogs.some(log => log.error.severity === 'critical');
  }

  /**
   * Get error rate (errors per hour)
   */
  getErrorRate(): number {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errorLogs.filter(log => 
      log.timestamp >= lastHour
    );

    return recentErrors.length;
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

/**
 * React hook for error monitoring
 */
export function useErrorMonitoring() {
  return {
    logError: errorMonitoring.logError.bind(errorMonitoring),
    getAnalytics: errorMonitoring.getErrorAnalytics.bind(errorMonitoring),
    getRecentErrors: errorMonitoring.getRecentErrors.bind(errorMonitoring),
    clearLogs: errorMonitoring.clearLogs.bind(errorMonitoring),
    exportLogs: errorMonitoring.exportLogs.bind(errorMonitoring),
    hasCriticalErrors: errorMonitoring.hasCriticalErrors.bind(errorMonitoring),
    getErrorRate: errorMonitoring.getErrorRate.bind(errorMonitoring)
  };
}

/**
 * Error boundary component for React
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorMonitoring.logError(error, {
      operation: 'React Error Boundary',
      component: errorInfo.componentStack,
      timestamp: new Date()
    }, {
      errorInfo: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">An unexpected error occurred. Please refresh the page.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Page
      </button>
    </div>
  );
}

export default errorMonitoring;
