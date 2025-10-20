/**
 * Session Management API
 *
 * POST /api/session
 * Create a new session for voice + mobile sync
 *
 * Returns session ID and channel name for Ably connection
 */

import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/db";
import { getSessionChannelName } from "@/lib/ably";
import { z } from "zod";

const createSessionSchema = z.object({
  phoneNumber: z.string().optional(),
});

/**
 * POST /api/session
 * Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = createSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { phoneNumber } = validationResult.data;

    // Create session in database
    const session = await createSession({
      phoneNumber,
    });

    // Get Ably channel name
    const channelName = getSessionChannelName(session.id);

    return NextResponse.json(
      {
        success: true,
        session: {
          id: session.id,
          channelName,
          status: session.status,
          createdAt: session.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      {
        error: "Failed to create session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
