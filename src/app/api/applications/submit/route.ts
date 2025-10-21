/**
 * External Application Submission API
 *
 * POST /api/applications/submit
 * Submit a complete application from external services
 *
 * This endpoint is designed for system-to-system integrations
 * and provides a more traditional REST API for external services.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApplication } from "@/lib/db";
import { applicationSchema } from "@/lib/schema";
import { z } from "zod";

// Extended schema for external submissions with additional metadata
const externalApplicationSchema = applicationSchema.extend({
  // Optional external system metadata
  externalId: z.string().optional().describe("External system's unique identifier for this application"),
  sourceSystem: z.string().optional().describe("Name of the external system submitting the application"),
  submissionNotes: z.string().optional().describe("Additional notes from the external system"),
  // Override submission channel for external submissions
  submissionChannel: z.literal("external_api").optional(),
});

/**
 * POST /api/applications/submit
 * Submit a complete application from external services
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = externalApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
          message: "Please check the request body and ensure all required fields are provided with valid values",
        },
        { status: 400 }
      );
    }

    const applicationData = validationResult.data;

    // Create the application with external API channel
    const application = await createApplication({
      ...applicationData,
      submissionChannel: "external_api",
    });

    // Log the external submission for audit purposes
    console.log(`External application submitted:`, {
      trackingId: application.trackingId,
      externalId: applicationData.externalId,
      sourceSystem: applicationData.sourceSystem,
      establishmentName: applicationData.establishmentName,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        trackingId: application.trackingId,
        application: {
          id: application.trackingId,
          establishmentName: application.establishmentName,
          submissionChannel: application.submissionChannel,
          createdAt: application.createdAt,
        },
        // Include external system reference if provided
        ...(applicationData.externalId && {
          externalReference: {
            externalId: applicationData.externalId,
            sourceSystem: applicationData.sourceSystem,
          },
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting external application:", error);
    
    return NextResponse.json(
      {
        error: "Failed to submit application",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applications/submit
 * Get information about the external submission API
 */
export async function GET() {
  return NextResponse.json({
    message: "External Application Submission API",
    description: "Submit complete food establishment permit applications from external systems",
    version: "1.0.0",
    endpoints: {
      submit: {
        method: "POST",
        path: "/api/applications/submit",
        description: "Submit a complete application",
      },
    },
    requiredFields: [
      "establishmentName",
      "streetAddress", 
      "establishmentPhone",
      "establishmentEmail",
      "ownerName",
      "ownerPhone",
      "ownerEmail",
      "establishmentType",
      "plannedOpeningDate",
    ],
    optionalFields: [
      "externalId",
      "sourceSystem", 
      "submissionNotes",
    ],
    example: {
      establishmentName: "Joe's Pizza",
      streetAddress: "123 Main St, Anytown, ST 12345",
      establishmentPhone: "5551234567",
      establishmentEmail: "joe@pizza.com",
      ownerName: "Joe Smith",
      ownerPhone: "5559876543",
      ownerEmail: "joe.smith@email.com",
      establishmentType: "restaurant",
      plannedOpeningDate: "2024-06-01",
      externalId: "EXT-2024-001",
      sourceSystem: "City Permits System",
      submissionNotes: "Submitted via automated integration",
    },
  });
}
