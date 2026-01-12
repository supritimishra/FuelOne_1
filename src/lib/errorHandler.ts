/**
 * Comprehensive Error Handling Utility
 * 
 * This module provides standardized error handling for the PetroPal application,
 * including database errors, API errors, validation errors, and network issues.
 */

export interface ErrorInfo {
  title: string;
  description: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'database' | 'validation' | 'authentication' | 'business' | 'system';
  retryable: boolean;
  userAction?: string;
}

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

/**
 * Maps database error codes to user-friendly messages
 */
const DATABASE_ERROR_MAP: Record<string, Partial<ErrorInfo>> = {
  // Connection errors
  'ENOTFOUND': {
    title: 'Connection Error',
    description: 'Unable to connect to the database server. Please check your internet connection and try again.',
    severity: 'high',
    category: 'network',
    retryable: true,
    userAction: 'Check your internet connection and try again'
  },
  'ECONNREFUSED': {
    title: 'Connection Refused',
    description: 'Database server is not responding. Please try again later.',
    severity: 'high',
    category: 'network',
    retryable: true,
    userAction: 'Try again in a few minutes'
  },
  'ETIMEDOUT': {
    title: 'Connection Timeout',
    description: 'Database request timed out. Please try again.',
    severity: 'medium',
    category: 'network',
    retryable: true,
    userAction: 'Try again with a smaller data set'
  },

  // Database structure errors
  '42P01': {
    title: 'Database Error',
    description: 'Required database table does not exist. Please contact support.',
    severity: 'critical',
    category: 'database',
    retryable: false,
    userAction: 'Contact system administrator'
  },
  '42703': {
    title: 'Database Error',
    description: 'Database column mismatch detected. Please contact support.',
    severity: 'critical',
    category: 'database',
    retryable: false,
    userAction: 'Contact system administrator'
  },
  '42712': {
    title: 'Database Error',
    description: 'Duplicate table alias in query. Please contact support.',
    severity: 'critical',
    category: 'database',
    retryable: false,
    userAction: 'Contact system administrator'
  },

  // Data validation errors
  '22P02': {
    title: 'Validation Error',
    description: 'Invalid data format provided. Please check your inputs.',
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userAction: 'Check your input data and try again'
  },
  '23505': {
    title: 'Duplicate Entry',
    description: 'This record already exists. Please use a different value.',
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userAction: 'Use a different value or update existing record'
  },
  '23503': {
    title: 'Reference Error',
    description: 'Referenced record does not exist. Please check your selection.',
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userAction: 'Select a valid option from the dropdown'
  },
  '23514': {
    title: 'Constraint Violation',
    description: 'Data does not meet required constraints. Please check your inputs.',
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userAction: 'Check your input data and try again'
  },

  // Authentication errors
  '401': {
    title: 'Authentication Required',
    description: 'Please log in to continue.',
    severity: 'medium',
    category: 'authentication',
    retryable: false,
    userAction: 'Please log in to your account'
  },
  '403': {
    title: 'Access Denied',
    description: 'You do not have permission to perform this action.',
    severity: 'medium',
    category: 'authentication',
    retryable: false,
    userAction: 'Contact your administrator for access'
  },

  // Business logic errors
  'INSUFFICIENT_STOCK': {
    title: 'Insufficient Stock',
    description: 'Not enough stock available for this operation.',
    severity: 'medium',
    category: 'business',
    retryable: false,
    userAction: 'Check stock levels or reduce quantity'
  },
  'INVALID_DATE_RANGE': {
    title: 'Invalid Date Range',
    description: 'Selected date range is not valid.',
    severity: 'low',
    category: 'validation',
    retryable: false,
    userAction: 'Select a valid date range'
  },
  'INVALID_UUID': {
    title: 'Invalid ID',
    description: 'The provided ID is not valid.',
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userAction: 'Please select a valid option'
  }
};

/**
 * Maps HTTP status codes to error information
 */
const HTTP_ERROR_MAP: Record<number, Partial<ErrorInfo>> = {
  400: {
    title: 'Bad Request',
    description: 'Invalid request data. Please check your inputs.',
    severity: 'medium',
    category: 'validation',
    retryable: false
  },
  401: {
    title: 'Authentication Required',
    description: 'Please log in to continue.',
    severity: 'medium',
    category: 'authentication',
    retryable: false,
    userAction: 'Please log in to your account'
  },
  403: {
    title: 'Access Denied',
    description: 'You do not have permission to perform this action.',
    severity: 'medium',
    category: 'authentication',
    retryable: false,
    userAction: 'Contact your administrator for access'
  },
  404: {
    title: 'Not Found',
    description: 'The requested resource was not found.',
    severity: 'medium',
    category: 'system',
    retryable: false,
    userAction: 'Check if the resource exists or contact support'
  },
  409: {
    title: 'Conflict',
    description: 'The operation conflicts with existing data.',
    severity: 'medium',
    category: 'business',
    retryable: false,
    userAction: 'Check for duplicate entries or conflicting data'
  },
  422: {
    title: 'Validation Error',
    description: 'The provided data is invalid.',
    severity: 'medium',
    category: 'validation',
    retryable: false,
    userAction: 'Check your input data and try again'
  },
  429: {
    title: 'Too Many Requests',
    description: 'Too many requests. Please wait before trying again.',
    severity: 'medium',
    category: 'system',
    retryable: true,
    userAction: 'Wait a moment and try again'
  },
  500: {
    title: 'Server Error',
    description: 'An internal server error occurred. Please try again later.',
    severity: 'high',
    category: 'system',
    retryable: true,
    userAction: 'Try again in a few minutes'
  },
  502: {
    title: 'Bad Gateway',
    description: 'Server is temporarily unavailable. Please try again later.',
    severity: 'high',
    category: 'network',
    retryable: true,
    userAction: 'Try again in a few minutes'
  },
  503: {
    title: 'Service Unavailable',
    description: 'Service is temporarily unavailable. Please try again later.',
    severity: 'high',
    category: 'system',
    retryable: true,
    userAction: 'Try again in a few minutes'
  }
};

/**
 * Main error handling function
 */
export function handleAPIError(
  error: any, 
  context: string | ErrorContext = "Operation"
): ErrorInfo {
  const errorContext: ErrorContext = typeof context === 'string' 
    ? { operation: context, timestamp: new Date() }
    : { ...context, timestamp: context.timestamp || new Date() };

  // Log error for debugging
  console.error(`[${errorContext.operation}] Error:`, {
    error,
    context: errorContext,
    stack: error?.stack
  });

  // Handle different error types
  if (error?.code && DATABASE_ERROR_MAP[error.code]) {
    const dbError = DATABASE_ERROR_MAP[error.code];
    return {
      title: dbError.title || 'Database Error',
      description: dbError.description || error.message || 'A database error occurred',
      code: error.code,
      severity: dbError.severity || 'medium',
      category: dbError.category || 'database',
      retryable: dbError.retryable || false,
      userAction: dbError.userAction
    };
  }

  // Handle HTTP status codes
  if (error?.status && HTTP_ERROR_MAP[error.status]) {
    const httpError = HTTP_ERROR_MAP[error.status];
    return {
      title: httpError.title || 'HTTP Error',
      description: httpError.description || error.message || 'An HTTP error occurred',
      code: error.status.toString(),
      severity: httpError.severity || 'medium',
      category: httpError.category || 'system',
      retryable: httpError.retryable || false,
      userAction: httpError.userAction
    };
  }

  // Handle API response errors
  if (error?.response?.status && HTTP_ERROR_MAP[error.response.status]) {
    const httpError = HTTP_ERROR_MAP[error.response.status];
    return {
      title: httpError.title || 'API Error',
      description: httpError.description || error.response.data?.error || error.message || 'An API error occurred',
      code: error.response.status.toString(),
      severity: httpError.severity || 'medium',
      category: httpError.category || 'system',
      retryable: httpError.retryable || false,
      userAction: httpError.userAction
    };
  }

  // Handle custom business logic errors
  if (error?.message && DATABASE_ERROR_MAP[error.message]) {
    const businessError = DATABASE_ERROR_MAP[error.message];
    return {
      title: businessError.title || 'Business Error',
      description: businessError.description || error.message,
      code: error.message,
      severity: businessError.severity || 'medium',
      category: businessError.category || 'business',
      retryable: businessError.retryable || false,
      userAction: businessError.userAction
    };
  }

  // Handle validation errors from forms
  if (error?.errors && Array.isArray(error.errors)) {
    return {
      title: 'Validation Error',
      description: error.errors.join(', '),
      severity: 'medium',
      category: 'validation',
      retryable: false,
      userAction: 'Please check your input data and try again'
    };
  }

  // Handle network errors
  if (error?.name === 'NetworkError' || error?.message?.includes('Network Error')) {
    return {
      title: 'Network Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      severity: 'high',
      category: 'network',
      retryable: true,
      userAction: 'Check your internet connection and try again'
    };
  }

  // Handle timeout errors
  if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    return {
      title: 'Request Timeout',
      description: 'The request took too long to complete. Please try again.',
      severity: 'medium',
      category: 'network',
      retryable: true,
      userAction: 'Try again with a smaller data set'
    };
  }

  // Default error handling
  const message = error?.message || error?.error || 'An unexpected error occurred';
  
  return {
    title: 'Error',
    description: message,
    severity: 'medium',
    category: 'system',
    retryable: false,
    userAction: 'Please try again or contact support if the problem persists'
  };
}

/**
 * Enhanced error handler with retry logic
 */
export function handleAPIErrorWithRetry(
  error: any,
  context: string | ErrorContext = "Operation",
  retryCount: number = 0,
  maxRetries: number = 3
): ErrorInfo & { shouldRetry: boolean; retryDelay?: number } {
  const errorInfo = handleAPIError(error, context);
  
  // Determine if we should retry
  const shouldRetry = errorInfo.retryable && retryCount < maxRetries;
  
  // Calculate retry delay (exponential backoff)
  const retryDelay = shouldRetry ? Math.min(1000 * Math.pow(2, retryCount), 10000) : undefined;
  
  return {
    ...errorInfo,
    shouldRetry,
    retryDelay
  };
}

/**
 * Error handler specifically for form validation
 */
export function handleValidationError(
  error: any,
  fieldName?: string
): ErrorInfo {
  if (error?.errors && Array.isArray(error.errors)) {
    return {
      title: 'Validation Error',
      description: error.errors.join(', '),
      severity: 'low',
      category: 'validation',
      retryable: false,
      userAction: 'Please check your input data and try again'
    };
  }

  if (fieldName) {
    return {
      title: 'Invalid Input',
      description: `Please check the ${fieldName} field and try again.`,
      severity: 'low',
      category: 'validation',
      retryable: false,
      userAction: 'Check your input data and try again'
    };
  }

  return handleAPIError(error, 'Form Validation');
}

/**
 * Error handler for database operations
 */
export function handleDatabaseError(
  error: any,
  operation: string = 'Database Operation'
): ErrorInfo {
  const context: ErrorContext = {
    operation,
    category: 'database',
    timestamp: new Date()
  };

  return handleAPIError(error, context);
}

/**
 * Error handler for API requests
 */
export function handleAPIRequestError(
  error: any,
  endpoint: string = 'API Request'
): ErrorInfo {
  const context: ErrorContext = {
    operation: endpoint,
    category: 'network',
    timestamp: new Date()
  };

  return handleAPIError(error, context);
}

/**
 * Utility to check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorInfo = handleAPIError(error);
  return errorInfo.retryable;
}

/**
 * Utility to get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const errorInfo = handleAPIError(error);
  return errorInfo.description;
}

/**
 * Utility to log errors for monitoring
 */
export function logError(
  error: any,
  context: string | ErrorContext = "Operation",
  additionalData?: Record<string, any>
): void {
  const errorContext: ErrorContext = typeof context === 'string' 
    ? { operation: context, timestamp: new Date() }
    : { ...context, timestamp: context.timestamp || new Date() };

  const errorInfo = handleAPIError(error, errorContext);

  // Log to console for development
  console.error(`[${errorContext.operation}] Error logged:`, {
    error: errorInfo,
    context: errorContext,
    additionalData,
    timestamp: new Date().toISOString()
  });

  // In production, you might want to send this to an error monitoring service
  // like Sentry, LogRocket, or a custom logging endpoint
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error monitoring service
    // errorMonitoringService.captureException(error, {
    //   tags: {
    //     operation: errorContext.operation,
    //     component: errorContext.component,
    //     severity: errorInfo.severity,
    //     category: errorInfo.category
    //   },
    //   extra: additionalData
    // });
  }
}

/**
 * Error boundary helper for React components
 */
export function createErrorBoundaryFallback(error: Error): ErrorInfo {
  return {
    title: 'Application Error',
    description: 'Something went wrong. Please refresh the page and try again.',
    severity: 'high',
    category: 'system',
    retryable: true,
    userAction: 'Refresh the page and try again'
  };
}

export default {
  handleAPIError,
  handleAPIErrorWithRetry,
  handleValidationError,
  handleDatabaseError,
  handleAPIRequestError,
  isRetryableError,
  getUserFriendlyMessage,
  logError,
  createErrorBoundaryFallback
};