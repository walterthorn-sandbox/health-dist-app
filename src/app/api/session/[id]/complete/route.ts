/**
 * Session Completion API
 *
 * POST /api/session/[id]/complete
 * Mark session as complete and create application record
 *
 * Called by voice service after all fields are collected
 */

import { NextRequest, NextResponse } from "next/server";
import { createApplication } from "@/lib/db";
import { publishToSession, ABLY_EVENTS } from "@/lib/ably";
import { applicationSchema } from "@/lib/schema";

/**
 * POST /api/session/[id]/complete
 * Complete session and create application
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();

    // Validate application data
    const validationResult = applicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid application data",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // TODO: Verify session exists when Vercel Postgres is available
    // const session = await getSession(sessionId);
    // if (!session) {
    //   return NextResponse.json({ error: "Session not found" }, { status: 404 });
    // }

    // Create application
    const application = await createApplication({
      ...validationResult.data,
      sessionId,
      submissionChannel: "voice_mobile",
    });

    // TODO: Update session status to 'completed' when database is available
    // await updateSessionStatus(sessionId, "completed");

    // Broadcast completion to mobile UI
    await publishToSession(sessionId, ABLY_EVENTS.SESSION_COMPLETE, {
      trackingId: application.trackingId,
      timestamp: Date.now(),
    });

    console.log(`Session ${sessionId} completed. Tracking ID: ${application.trackingId}`);

    return NextResponse.json({
      success: true,
      trackingId: application.trackingId,
      application,
    });
  } catch (error) {
    console.error("Error completing session:", error);

    // Broadcast error to mobile UI
    try {
      const { id: sessionId } = await params;
      await publishToSession(sessionId, ABLY_EVENTS.SESSION_ERROR, {
        error: "Failed to complete application",
        timestamp: Date.now(),
      });
    } catch (ablyError) {
      console.error("Failed to broadcast error:", ablyError);
    }

    return NextResponse.json(
      {
        error: "Failed to complete session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
