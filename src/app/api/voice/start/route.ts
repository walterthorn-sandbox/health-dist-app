import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/db";
import { sendSMS } from "@/lib/twilio";

/**
 * POST /api/voice/start
 *
 * Starts a new voice application session:
 * 1. Validates phone number
 * 2. Creates session in database
 * 3. Sends SMS with link and phone number to call
 * 4. Returns session ID
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    // Validate phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Extract digits only
    const digits = phoneNumber.replace(/\D/g, "");

    // Validate US phone number (10 digits)
    if (digits.length !== 10) {
      return NextResponse.json(
        { error: "Please provide a valid 10-digit US phone number" },
        { status: 400 }
      );
    }

    // Format as E.164 (required by Twilio)
    const e164Phone = `+1${digits}`;

    // Create session in database
    const session = await createSession({
      phoneNumber: e164Phone,
    });

    // Get the base URL for the session link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    req.headers.get("origin") ||
                    "http://localhost:3000";

    const sessionUrl = `${baseUrl}/session/${session.id}`;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "(509) 555-1234";

    // Send SMS with link and instructions
    const message = `Your food permit application session is ready!\n\n1. Open this link on your phone: ${sessionUrl}\n\n2. Then call ${twilioPhoneNumber} to complete your application by voice.\n\nYou'll see the form fill out in real-time as you speak!`;

    try {
      await sendSMS(e164Phone, message);
      console.log(`SMS sent to ${e164Phone} for session ${session.id}`);
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
      // Don't fail the request if SMS fails - log and continue
      // In production, you might want to handle this differently
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      channelName: session.channelName,
    });

  } catch (error) {
    console.error("Error starting voice session:", error);
    return NextResponse.json(
      { error: "Failed to start voice session" },
      { status: 500 }
    );
  }
}
