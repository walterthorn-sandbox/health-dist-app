/**
 * Twilio SMS Integration
 *
 * Handles sending SMS messages via Twilio API
 */

/**
 * Send an SMS message via Twilio
 *
 * @param to - Phone number in E.164 format (e.g., +15095551234)
 * @param message - Message body to send
 */
export async function sendSMS(to: string, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // If Twilio credentials are not configured, log a warning and skip
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("⚠️ Twilio credentials not configured - SMS not sent");
    console.log(`Would have sent SMS to ${to}:`);
    console.log(message);
    return;
  }

  try {
    // Use Twilio REST API directly to avoid dependency
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", fromNumber);
    params.append("Body", message);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ SMS sent successfully. SID: ${result.sid}`);

  } catch (error) {
    console.error("Failed to send SMS via Twilio:", error);
    throw error;
  }
}
