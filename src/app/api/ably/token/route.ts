/**
 * Ably Token Authentication Endpoint
 *
 * Generates time-limited auth tokens for client-side Ably connections.
 * This is more secure than exposing the API key on the client.
 *
 * POST /api/ably/token
 * Body: { sessionId: string }
 * Returns: { tokenRequest: Ably.TokenRequest }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAblyTokenRequest, getSessionChannelName } from "@/lib/ably";
import { z } from "zod";

const requestSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { sessionId } = validationResult.data;

    // TODO: Verify session exists in database when Vercel Postgres is available
    // const session = await getSession(sessionId);
    // if (!session) {
    //   return NextResponse.json({ error: "Session not found" }, { status: 404 });
    // }

    const channelName = getSessionChannelName(sessionId);
    const clientId = `mobile-${sessionId}`;

    // Create token request (or mock token if no API key)
    if (!process.env.ABLY_API_KEY) {
      console.warn("⚠️ ABLY_API_KEY not set - returning mock token");
      // Return a mock token for development
      return NextResponse.json({
        success: true,
        tokenRequest: {
          keyName: "mock",
          nonce: "mock-nonce",
          mac: "mock-mac",
          timestamp: Date.now(),
          capability: JSON.stringify({ [channelName]: ["subscribe", "presence"] }),
          clientId,
        },
        channelName,
      });
    }

    const tokenRequest = await createAblyTokenRequest(clientId, channelName);

    return NextResponse.json({
      success: true,
      tokenRequest,
      channelName,
    });
  } catch (error) {
    console.error("Error creating Ably token:", error);
    return NextResponse.json(
      {
        error: "Failed to create auth token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
