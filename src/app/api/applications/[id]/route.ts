/**
 * Individual Application API Routes
 *
 * GET /api/applications/[id] - Get a specific application by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { getApplication } from "@/lib/db";

/**
 * GET /api/applications/[id]
 * Get a specific application by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const application = await getApplication(id);

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error getting application:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve application",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
