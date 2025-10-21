/**
 * Example usage of validation schemas
 * This file demonstrates how to use the schemas in the application
 */

import {
  applicationSchema,
  safeValidateApplication,
  getValidationErrors,
  generateTrackingId,
  formatPhoneNumber,
  type Application,
} from "../schema";

// ============================================================================
// Example 1: Valid Application Data
// ============================================================================

const validApplicationData = {
  // Establishment Information
  establishmentName: "Joe's Pizza",
  streetAddress: "123 Main Street, Wenatchee, WA 98801",
  establishmentPhone: "(509) 555-1234", // Will be cleaned to 5095551234
  establishmentEmail: "joe@joespizza.com",

  // Owner Information
  ownerName: "Joe Smith",
  ownerPhone: "509-555-5678", // Different format, still valid
  ownerEmail: "JOESMITH@GMAIL.COM", // Will be lowercased

  // Operating Information
  establishmentType: "Restaurant" as const,
  plannedOpeningDate: "2025-12-01",
};

// Parse and validate
try {
  const parsed: Application = applicationSchema.parse(validApplicationData);
  console.log("✅ Valid application:", parsed);

  // Note: phone numbers are cleaned and emails are lowercased
  console.log("Cleaned phone:", parsed.establishmentPhone); // "5095551234"
  console.log("Formatted phone:", formatPhoneNumber(parsed.establishmentPhone)); // "(509) 555-1234"
  console.log("Lowercased email:", parsed.ownerEmail); // "joesmith@gmail.com"
} catch (error) {
  console.error("Validation error:", error);
}

// ============================================================================
// Example 2: Invalid Application Data (Missing Fields)
// ============================================================================

const invalidApplicationData = {
  establishmentName: "", // Empty string - invalid
  streetAddress: "123 Main St",
  // Missing establishmentPhone - invalid
  establishmentEmail: "not-an-email", // Invalid email format

  ownerName: "John Doe",
  ownerPhone: "12345", // Too short - invalid
  ownerEmail: "john@example.com",

  establishmentType: "Restaurant" as const,
  plannedOpeningDate: "2025-12-01",
};

// Safe validation (won't throw)
const result = safeValidateApplication(invalidApplicationData);
if (!result.success) {
  console.log("❌ Validation failed:", result.error.format());
}

// Get formatted errors
const errors = getValidationErrors(invalidApplicationData);
console.log("Formatted errors:", errors);
// Example output:
// {
//   establishmentName: ["Establishment name is required"],
//   establishmentPhone: ["Phone number is required"],
//   establishmentEmail: ["Please enter a valid email address"],
//   ownerPhone: ["Phone number must be exactly 10 digits"]
// }

// ============================================================================
// Example 3: Using TypeScript Types
// ============================================================================

// TypeScript will enforce the Application type
const _typedApplication: Application = {
  establishmentName: "Taco Truck",
  streetAddress: "456 Apple Lane",
  establishmentPhone: "5095551111",
  establishmentEmail: "tacos@example.com",
  ownerName: "Maria Garcia",
  ownerPhone: "5095552222",
  ownerEmail: "maria@example.com",
  establishmentType: "Food Truck",
  plannedOpeningDate: new Date("2025-11-15"),
};

// ============================================================================
// Example 4: Generating Tracking IDs
// ============================================================================

const trackingId1 = generateTrackingId();
const trackingId2 = generateTrackingId();

console.log("Tracking ID 1:", trackingId1); // e.g., APP-20251020-A3F9
console.log("Tracking ID 2:", trackingId2); // e.g., APP-20251020-B7K2

// ============================================================================
// Example 5: Phone Number Formatting
// ============================================================================

const rawPhone = "5095551234";
const formattedPhone = formatPhoneNumber(rawPhone);
console.log("Formatted:", formattedPhone); // "(509) 555-1234"

// ============================================================================
// Example 6: Form Usage (React Hook Form + Zod)
// ============================================================================

// In a React component, you would use this with react-hook-form:
/*
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type Application } from "@/lib/schema";

function PermitForm() {
  const form = useForm<Application>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      establishmentName: "",
      streetAddress: "",
      establishmentPhone: "",
      establishmentEmail: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      establishmentType: "Restaurant",
      plannedOpeningDate: "",
    },
  });

  const onSubmit = (data: Application) => {
    console.log("Validated data:", data);
    // Submit to API...
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
*/

export {};
