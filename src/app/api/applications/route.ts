/**
 * Applications API Routes
 *
 * POST /api/applications - Create a new application
 * GET /api/applications - Get all applications (with optional filters)
 */

import { NextRequest, NextResponse } from "next/server";
import { createApplication, getAllApplications } from "@/lib/db";
import { applicationSchema } from "@/lib/schema";

/**
 * POST /api/applications
 * Create a new permit application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = applicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Create the application
    const application = await createApplication({
      ...validationResult.data,
      submissionChannel: "web",
    });

    return NextResponse.json(
      {
        success: true,
        trackingId: application.trackingId,
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      {
        error: "Failed to create application",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applications
 * Get all applications with optional filtering
 *
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - establishmentName: string (filter by name)
 * - submissionChannel: string (filter by channel)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
      establishmentName: searchParams.get("establishmentName") || undefined,
      submissionChannel: searchParams.get("submissionChannel") || undefined,
    };

    const result = await getAllApplications(filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error getting applications:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve applications",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
