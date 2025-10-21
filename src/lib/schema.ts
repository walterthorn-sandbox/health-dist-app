/**
 * Zod Validation Schemas
 *
 * Type-safe validation schemas for the Food Permit Application POC
 * These schemas are used for:
 * - Form validation (client-side)
 * - API request validation (server-side)
 * - Type inference throughout the app
 */

import { z } from "zod";

// ============================================================================
// Field-level validation schemas
// ============================================================================

/**
 * Phone number validation
 * Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890
 */
const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^[\d\s\-\(\)]+$/,
    "Phone number can only contain numbers, spaces, hyphens, and parentheses"
  )
  .transform((val) => val.replace(/\D/g, "")) // Remove all non-digits
  .refine((val) => val.length === 10, {
    message: "Phone number must be exactly 10 digits",
  });

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase();

/**
 * Required text field (non-empty string)
 */
const requiredText = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .max(255, `${fieldName} must be less than 255 characters`);


/**
 * Date validation (for planned opening date)
 */
const futureDateSchema = z
  .string()
  .min(1, "Planned opening date is required")
  .refine(
    (dateString) => {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    },
    { message: "Please enter a valid date" }
  )
  .transform((dateString) => new Date(dateString));

// ============================================================================
// Establishment Type Enum
// ============================================================================

export const establishmentTypes = [
  "Restaurant",
  "Food Truck",
  "Catering",
  "Bakery",
  "Cafe",
  "Bar",
  "Food Cart",
  "Other",
] as const;

export const establishmentTypeSchema = z.enum(establishmentTypes, {
  errorMap: () => ({ message: "Please select an establishment type" }),
});

// ============================================================================
// Session Status Enum (for database)
// ============================================================================

export const sessionStatuses = ["active", "completed", "abandoned"] as const;

export const sessionStatusSchema = z.enum(sessionStatuses);

// ============================================================================
// Submission Channel Enum (for tracking how application was submitted)
// ============================================================================

export const submissionChannels = ["web", "voice", "voice_mobile", "external_api"] as const;

export const submissionChannelSchema = z.enum(submissionChannels);

// ============================================================================
// Main Application Schema
// ============================================================================

/**
 * Form input schema (for React Hook Form)
 * Keeps dates and phones as strings before validation
 */
export const applicationFormSchema = z.object({
  // Establishment Information
  establishmentName: requiredText("Establishment name"),
  streetAddress: requiredText("Street address"),
  establishmentPhone: z.string().min(1, "Phone number is required"),
  establishmentEmail: emailSchema,

  // Owner Information
  ownerName: requiredText("Owner name"),
  ownerPhone: z.string().min(1, "Phone number is required"),
  ownerEmail: emailSchema,

  // Operating Information
  establishmentType: establishmentTypeSchema,
  plannedOpeningDate: z.string().min(1, "Planned opening date is required"),
});

/**
 * Complete permit application schema (with transformations)
 * This represents all the data we collect for a new permit application
 * Phone numbers are cleaned and dates are converted to Date objects
 */
export const applicationSchema = z.object({
  // Establishment Information
  establishmentName: requiredText("Establishment name"),
  streetAddress: requiredText("Street address"),
  establishmentPhone: phoneSchema,
  establishmentEmail: emailSchema,

  // Owner Information
  ownerName: requiredText("Owner name"),
  ownerPhone: phoneSchema,
  ownerEmail: emailSchema,

  // Operating Information
  establishmentType: establishmentTypeSchema,
  plannedOpeningDate: futureDateSchema,
});

/**
 * Schema for creating a new application (includes optional metadata)
 */
export const createApplicationSchema = applicationSchema.extend({
  sessionId: z.string().uuid().optional(),
  submissionChannel: submissionChannelSchema.default("web"),
});

/**
 * Schema for application stored in database
 */
export const applicationRecordSchema = createApplicationSchema.extend({
  id: z.string().uuid(),
  trackingId: z.string(),
  createdAt: z.date(),
  submittedAt: z.date().nullable(),
  rawData: z.record(z.unknown()).optional(), // Store full conversation/form data
});

// ============================================================================
// Session Schema (for voice + mobile sync)
// ============================================================================

/**
 * Schema for creating a new session
 */
export const createSessionSchema = z.object({
  phoneNumber: phoneSchema.optional(),
});

/**
 * Schema for session stored in database
 */
export const sessionRecordSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  phoneNumber: z.string().optional(),
  status: sessionStatusSchema,
  channelName: z.string(), // Ably channel name
});

/**
 * Schema for updating session data (partial application data)
 */
export const sessionUpdateSchema = z.object({
  field: z.enum([
    "establishmentName",
    "streetAddress",
    "establishmentPhone",
    "establishmentEmail",
    "ownerName",
    "ownerPhone",
    "ownerEmail",
    "establishmentType",
    "plannedOpeningDate",
  ]),
  value: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

// Infer TypeScript types from schemas
export type ApplicationFormData = z.infer<typeof applicationFormSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type CreateApplication = z.infer<typeof createApplicationSchema>;
export type ApplicationRecord = z.infer<typeof applicationRecordSchema>;

export type CreateSession = z.infer<typeof createSessionSchema>;
export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;

export type EstablishmentType = z.infer<typeof establishmentTypeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type SubmissionChannel = z.infer<typeof submissionChannelSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate and parse application data
 * Returns parsed data or throws validation error
 */
export function validateApplication(data: unknown): Application {
  return applicationSchema.parse(data);
}

/**
 * Safely validate application data
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateApplication(data: unknown) {
  return applicationSchema.safeParse(data);
}

/**
 * Get validation errors as a formatted object
 */
export function getValidationErrors(data: unknown) {
  const result = applicationSchema.safeParse(data);
  if (result.success) return null;

  return result.error.flatten().fieldErrors;
}

/**
 * Generate a unique tracking ID for applications
 * Format: APP-YYYYMMDD-XXXX (e.g., APP-20251020-A3F9)
 */
export function generateTrackingId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `APP-${year}${month}${day}-${random}`;
}

/**
 * Format phone number for display
 * Converts 1234567890 to (123) 456-7890
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;

  const areaCode = cleaned.substring(0, 3);
  const prefix = cleaned.substring(3, 6);
  const lineNumber = cleaned.substring(6, 10);

  return `(${areaCode}) ${prefix}-${lineNumber}`;
}
