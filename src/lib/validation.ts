/**
 * Shared validation utilities for application form fields
 * Used by both client-side (session page) and server-side (API, voice server)
 */

export const VALID_ESTABLISHMENT_TYPES = [
  "Restaurant",
  "Food Truck",
  "Catering",
  "Bakery",
  "Cafe",
  "Other",
] as const;

export type EstablishmentType = typeof VALID_ESTABLISHMENT_TYPES[number];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: string;
}

/**
 * Validate and normalize establishment type
 */
export function validateEstablishmentType(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: false, error: "Establishment type is required" };
  }

  // Find case-insensitive match
  const matchedType = VALID_ESTABLISHMENT_TYPES.find(
    (type) => type.toLowerCase() === value.toLowerCase()
  );

  if (matchedType) {
    return { isValid: true, normalizedValue: matchedType };
  }

  return {
    isValid: false,
    error: `Invalid establishment type. Must be one of: ${VALID_ESTABLISHMENT_TYPES.join(", ")}`,
  };
}

/**
 * Validate and normalize date (should be YYYY-MM-DD format)
 */
export function validateDate(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: false, error: "Date is required" };
  }

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return {
      isValid: false,
      error: "Date must be in YYYY-MM-DD format (e.g., 2025-03-15)",
    };
  }

  // Check if it's a valid date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: "Invalid date" };
  }

  // Check if date is in the future (reasonable constraint for opening date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return { isValid: false, error: "Opening date must be today or in the future" };
  }

  return { isValid: true, normalizedValue: value };
}

/**
 * Validate phone number (must be 10 digits)
 */
export function validatePhone(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: "Phone number must be 10 digits",
    };
  }

  return { isValid: true, normalizedValue: cleaned };
}

/**
 * Validate email address
 */
export function validateEmail(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true, normalizedValue: value.trim().toLowerCase() };
}

/**
 * Validate generic text field
 */
export function validateTextField(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }

  return { isValid: true, normalizedValue: trimmed };
}

/**
 * Validate any field based on field name
 */
export function validateField(fieldName: string, value: string): ValidationResult {
  switch (fieldName) {
    case "establishmentType":
      return validateEstablishmentType(value);
    case "plannedOpeningDate":
      return validateDate(value);
    case "establishmentPhone":
    case "ownerPhone":
      return validatePhone(value);
    case "establishmentEmail":
    case "ownerEmail":
      return validateEmail(value);
    case "establishmentName":
      return validateTextField(value, "Establishment name");
    case "streetAddress":
      return validateTextField(value, "Street address");
    case "ownerName":
      return validateTextField(value, "Owner name");
    default:
      return { isValid: false, error: `Unknown field: ${fieldName}` };
  }
}
