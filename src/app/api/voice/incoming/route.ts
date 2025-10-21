import { NextRequest, NextResponse } from "next/server";

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
    // Get the session ID from query params (passed in the SMS link)
    // Or create a new session if this is a direct call
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    // Build the WebSocket URL for Media Streams
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "ws" : "wss";
    const streamUrl = `${protocol}://${host}/api/voice/media-stream?sessionId=${sessionId || "new"}`;

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello! Thank you for calling the Chelan-Douglas Health District.
    I'm here to help you complete your food establishment permit application by voice.
    I'll ask you a few questions about your establishment, and you'll see the form
    populate in real-time on your phone. Let's get started!
  </Say>
  <Connect>
    <Stream url="${streamUrl}" />
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
