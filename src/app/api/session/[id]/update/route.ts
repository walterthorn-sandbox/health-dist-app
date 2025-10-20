/**
 * Session Update API
 *
 * POST /api/session/[id]/update
 * Update a field in a session and broadcast via Ably
 *
 * This endpoint is called by the voice service (OpenAI Realtime API)
 * to update form fields in real-time as the user speaks.
 */

import { NextRequest, NextResponse } from "next/server";
import { publishToSession, ABLY_EVENTS } from "@/lib/ably";
import { z } from "zod";

const updateSchema = z.object({
  field: z.string().min(1, "Field name is required"),
  value: z.any(),
});

/**
 * POST /api/session/[id]/update
 * Update a single field and broadcast to mobile UI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();

    // Validate request
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { field, value } = validationResult.data;

    // TODO: Verify session exists when Vercel Postgres is available
    // const session = await getSession(sessionId);
    // if (!session) {
    //   return NextResponse.json({ error: "Session not found" }, { status: 404 });
    // }

    // TODO: Update session data in database when available
    // This will store the field updates in the raw_data JSONB column

    // Broadcast update via Ably
    await publishToSession(sessionId, ABLY_EVENTS.FIELD_UPDATE, {
      field,
      value,
      timestamp: Date.now(),
    });

    console.log(`Session ${sessionId}: Updated ${field} = ${value}`);

    return NextResponse.json({
      success: true,
      field,
      value,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      {
        error: "Failed to update session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
