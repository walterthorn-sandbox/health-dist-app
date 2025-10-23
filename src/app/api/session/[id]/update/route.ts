/**
 * API Route: Update Session Field
 *
 * Allows users to manually edit form fields during an active voice call session.
 * Validates input, updates database, and broadcasts changes via Ably.
 */

import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateDraftApplication } from "@/lib/db";
import { validateField } from "@/lib/validation";
import Ably from "ably";
import { ABLY_EVENTS } from "@/lib/ably";

const ABLY_API_KEY = process.env.ABLY_API_KEY;

if (!ABLY_API_KEY) {
  console.error("❌ ABLY_API_KEY environment variable is required");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { field, value } = body;

    // Validate required parameters
    if (!field || typeof field !== "string") {
      return NextResponse.json(
        { success: false, error: "Field name is required" },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { success: false, error: "Field value is required" },
        { status: 400 }
      );
    }

    // Validate the field value
    const validation = validateField(field, value);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const normalizedValue = validation.normalizedValue || value;

    // Update draft application in database
    try {
      const formData = { [field]: normalizedValue };
      await createOrUpdateDraftApplication(sessionId, formData);
      console.log(`✅ Updated field ${field} for session ${sessionId}`);
    } catch (dbError) {
      console.error("❌ Database update failed:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to save changes" },
        { status: 500 }
      );
    }

    // Broadcast update via Ably
    try {
      if (ABLY_API_KEY) {
        const ablyClient = new Ably.Rest({ key: ABLY_API_KEY });
        const channelName = `session:${sessionId}`;
        const channel = ablyClient.channels.get(channelName);

        await channel.publish(ABLY_EVENTS.FIELD_UPDATE, {
          field,
          value: normalizedValue,
          timestamp: Date.now(),
          source: "manual", // Indicate this was a manual edit
        });

        console.log(`📡 Broadcast manual update: ${field} = ${normalizedValue}`);
      }
    } catch (ablyError) {
      console.error("⚠️  Ably broadcast failed:", ablyError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      field,
      value: normalizedValue,
    });
  } catch (error) {
    console.error("❌ Session update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
