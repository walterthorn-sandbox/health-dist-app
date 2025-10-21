/**
 * Ably Real-time Client Configuration
 *
 * Provides client and server-side Ably instances for real-time communication
 * between voice calls and mobile UI.
 *
 * Architecture:
 * - Each session gets a unique Ably channel: `session:{sessionId}`
 * - Voice service publishes field updates to channel
 * - Mobile UI subscribes to channel and updates form in real-time
 *
 * Message Types:
 * - field-update: { field: string, value: any }
 * - session-complete: { trackingId: string }
 * - session-error: { error: string }
 */

import * as Ably from "ably";

// ============================================================================
// Server-side Ably Client (uses root API key)
// ============================================================================

/**
 * Get server-side Ably client instance
 * This should only be used in API routes and server components
 * Uses the root API key which has full permissions
 */
export function getServerAblyClient(): Ably.Realtime {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    console.warn(
      "⚠️ ABLY_API_KEY not set - using placeholder. Add your Ably API key to .env.local"
    );
    // Return a mock client for development
    // In production, this would throw an error
    return {
      channels: {
        get: () => ({
          publish: async () => {
            console.log("Mock Ably publish (no API key configured)");
          },
        }),
      },
    } as unknown as Ably.Realtime;
  }

  return new Ably.Realtime({ key: apiKey });
}

/**
 * Publish a message to a session channel
 * Convenience function for server-side publishing
 */
export async function publishToSession(
  sessionId: string,
  eventName: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const client = getServerAblyClient();
    const channel = client.channels.get(`session:${sessionId}`);
    await channel.publish(eventName, data);
    console.log(`Published ${eventName} to session:${sessionId}`, data);
  } catch (error) {
    console.error("Error publishing to Ably:", error);
    throw new Error("Failed to publish message");
  }
}

// ============================================================================
// Client-side Token Authentication
// ============================================================================

/**
 * Create a token request for client-side Ably connection
 * This should be called from an API route to generate auth tokens
 * Tokens have limited permissions (only publish/subscribe to specific channels)
 */
export async function createAblyTokenRequest(
  clientId: string,
  channelName: string
): Promise<Ably.TokenRequest> {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    throw new Error("ABLY_API_KEY environment variable not set");
  }

  const client = new Ably.Rest({ key: apiKey });

  // Create token with limited capabilities (only for specific channel)
  const tokenRequest = await client.auth.createTokenRequest({
    clientId,
    capability: {
      [channelName]: ["subscribe", "presence"],
    },
    ttl: 3600000, // 1 hour
  });

  return tokenRequest as Ably.TokenRequest;
}

// ============================================================================
// Channel Naming Helpers
// ============================================================================

/**
 * Get the channel name for a session
 */
export function getSessionChannelName(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Parse session ID from channel name
 */
export function parseSessionIdFromChannel(channelName: string): string | null {
  const match = channelName.match(/^session:(.+)$/);
  return match ? match[1] : null;
}

// ============================================================================
// Message Type Definitions
// ============================================================================

export type AblyFieldUpdate = {
  field: string;
  value: string | number | boolean | Date;
  timestamp?: number;
};

export type AblySessionComplete = {
  trackingId: string;
  timestamp?: number;
};

export type AblySessionError = {
  error: string;
  timestamp?: number;
};

// ============================================================================
// Event Names (for consistency)
// ============================================================================

export const ABLY_EVENTS = {
  FIELD_UPDATE: "field-update",
  SESSION_COMPLETE: "session-complete",
  SESSION_ERROR: "session-error",
  SESSION_STATUS: "session-status",
} as const;
