import { NextRequest, NextResponse } from "next/server";
import { getSessionByPhone } from "@/lib/db";

/**
 * POST /api/voice/incoming
 *
 * Twilio webhook for incoming phone calls.
 * Returns TwiML to greet the caller and start a Media Stream.
 *
 * Configure in Twilio Console:
 * Phone Numbers > Active Numbers > [Your Number] > Voice Configuration
 * - A CALL COMES IN: Webhook, HTTP POST, https://your-domain.com/api/voice/incoming
 */
export async function POST(req: NextRequest) {
  try {
    // Get the caller's phone number from Twilio form data
    const formData = await req.formData();
    const from = formData.get("From") as string;

    console.log(`📞 Incoming call from: ${from}`);

    // Look up the session by phone number
    let sessionId = "unknown";
    if (from) {
      const session = await getSessionByPhone(from);
      if (session) {
        sessionId = session.id;
        console.log(`✅ Found session: ${sessionId} for ${from}`);
      } else {
        console.log(`⚠️ No session found for ${from}`);
      }
    }

    // Build the WebSocket URL for Media Streams
    // Use the Voice Server URL from environment variable
    const voiceServerUrl = process.env.VOICE_SERVER_WS_URL || "ws://localhost:5050";
    const streamUrl = `${voiceServerUrl}/media-stream`;

    console.log(`🔗 Media Stream URL: ${streamUrl}`);
    console.log(`🔑 Session ID: ${sessionId}`);

    // Return TwiML response with custom parameter for sessionId
    // Note: Removed <Say> greeting - OpenAI agent handles the greeting instead
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="sessionId" value="${sessionId}" />
    </Stream>
  </Connect>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error handling incoming call:", error);

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    We're sorry, but we're experiencing technical difficulties.
    Please try again later or visit our website to submit your application.
  </Say>
  <Hangup />
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 500,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}
