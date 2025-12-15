// Local UUID validation – removes dependency on external 'validator'

type ValidationRule = {
  required?: string[];
  uuid?: string[];
  numeric?: string[];
  email?: string[];
  minLength?: { field: string; min: number }[];
  maxLength?: { field: string; max: number }[];
  // Add other validation types as needed
};

export const validateFormData = (formData: Record<string, any>, rules: ValidationRule) => {
  const errors: string[] = [];

  // Required field validation
  if (rules.required) {
    rules.required.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        errors.push(`${field.replace(/_/g, ' ')} is required.`);
      }
    });
  }

  // UUID validation
  if (rules.uuid) {
    rules.uuid.forEach(field => {
      if (formData[field] && !isValidUUID(String(formData[field]))) {
        errors.push(`${field.replace(/_/g, ' ')} must be a valid UUID.`);
      }
    });
  }

  // Numeric validation
  if (rules.numeric) {
    rules.numeric.forEach(field => {
      if (formData[field] && isNaN(Number(formData[field]))) {
        errors.push(`${field.replace(/_/g, ' ')} must be a number.`);
      }
    });
  }

  // Email validation
  if (rules.email) {
    rules.email.forEach(field => {
      if (formData[field] && !isValidEmail(String(formData[field]))) {
        errors.push(`${field.replace(/_/g, ' ')} must be a valid email address.`);
      }
    });
  }

  // Minimum length validation
  if (rules.minLength) {
    rules.minLength.forEach(({ field, min }) => {
      if (formData[field] && String(formData[field]).length < min) {
        errors.push(`${field.replace(/_/g, ' ')} must be at least ${min} characters long.`);
      }
    });
  }

  // Maximum length validation
  if (rules.maxLength) {
    rules.maxLength.forEach(({ field, max }) => {
      if (formData[field] && String(formData[field]).length > max) {
        errors.push(`${field.replace(/_/g, ' ')} must be no more than ${max} characters long.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
};

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Standalone UUID validation function
export function isValidUUID(value: string): boolean {
  // RFC4122 versions 1-5 UUID regex (case-insensitive)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Standalone UUID validation with error message
export function validateUUIDs(data: Record<string, any>, uuidFields: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const field of uuidFields) {
    if (data[field] && !isValidUUID(data[field])) {
      errors.push(`Invalid ${field.replace(/_/g, ' ')}: must be a valid UUID`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to validate numeric fields
export function validateNumericFields(data: Record<string, any>, numericFields: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const field of numericFields) {
    if (data[field] && isNaN(Number(data[field]))) {
      errors.push(`${field.replace(/_/g, ' ')} must be a valid number`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to validate required fields
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || String(data[field]).trim() === '') {
      errors.push(`${field.replace(/_/g, ' ')} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}